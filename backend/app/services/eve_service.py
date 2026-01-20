"""Eve AI assistant service for contextual chat and explanations."""

import os
import re
import logging
from datetime import datetime
from typing import Optional

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.schemas.eve import (
    ChatRequest,
    ChatResponse,
    ExplainRequest,
    ExplainResponse,
    SourceReference,
    Message,
    ConversationHistory,
)
from app.services.dashboard_service import get_gantt_data
from app.services.engagement_service import get_engagement_by_id
from app.services.variance_service import check_engagement_variances, get_variance_context_for_eve

logger = logging.getLogger(__name__)

# =============================================================================
# OpenAI Client
# =============================================================================

_openai_client: Optional[AsyncOpenAI] = None


def get_openai_client() -> AsyncOpenAI:
    """Get or create OpenAI client singleton."""
    global _openai_client
    if _openai_client is None:
        if not settings.openai_api_key:
            raise ValueError(
                "OPENAI_API_KEY not configured. Please set it in your .env file."
            )
        _openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _openai_client

# =============================================================================
# Eve System Prompts
# =============================================================================

EVE_SYSTEM_PROMPT = """You are Eve, an AI assistant specialized in financial audit and accounting for EY.

PERSONALITY:
- Style: Corporate, formal, professional
- Tone: Informative, precise, concise
- Role: Read-only consultant - guides and informs
- Emojis: Never

CAPABILITIES:
✅ View and analyze financial documents
✅ Explain data, KPIs and trends
✅ Guide users with recommendations
✅ Cite sources (document, line number)
✅ Compare data (Current vs Previous year, between entities)
❌ Modify or delete data
❌ Send emails or external actions

RESPONSE RULES:
1. Always cite the source when mentioning a figure
2. Use bullet points for clarity
3. Keep responses concise (max 200 words)
4. If you don't understand: "I didn't understand your request. Could you please rephrase your question?"
5. If technical error: "A technical error occurred. Please try again in a few moments."
6. If out of scope: "This action is not available. I can only view and analyze data."
"""

EVE_GANTT_PROMPT = """You are Eve, an AI assistant for EY. The user wants to visualize the engagement schedule as a Gantt chart.

INSTRUCTIONS:
1. Generate a Gantt chart showing all active engagements
2. Display start and due dates for each engagement
3. Color bars according to risk level (red=high, orange=medium, green=low)
4. Show the completion percentage of each engagement

I will generate the Gantt chart with data from all your engagements.
"""

EVE_EXPLAIN_PROMPT = """You are Eve, an AI assistant for EY. The user clicked on a financial value and wants an explanation.

CONTEXT:
- Engagement: {entity_name} ({country_code})
- Clicked value: {label} = {value}
- Available financial data: {financial_data}

INSTRUCTIONS:
1. Explain what this value represents
2. Provide a breakdown if relevant
3. Mention the variance compared to previous year if available
4. Cite the source (document, line)
5. Be concise (max 150 words)

RESPONSE FORMAT:
- Clear explanation of the value
- Breakdown into sub-elements if applicable
- Current vs Previous year comparison with percentage
- Source: [document_name], line [number]
"""

# =============================================================================
# In-Memory Conversation Storage (for POC)
# =============================================================================

_conversations: dict[str, ConversationHistory] = {}


def get_conversation(engagement_id: str) -> ConversationHistory:
    """Get or create conversation history for an engagement."""
    if engagement_id not in _conversations:
        _conversations[engagement_id] = ConversationHistory(
            engagement_id=engagement_id,
            messages=[],
        )
    return _conversations[engagement_id]


def add_message(engagement_id: str, role: str, content: str, sources: list = None):
    """Add a message to the conversation history."""
    conversation = get_conversation(engagement_id)
    conversation.messages.append(
        Message(
            role=role,
            content=content,
            timestamp=datetime.utcnow(),
            sources=sources,
        )
    )
    conversation.updated_at = datetime.utcnow()


# =============================================================================
# Eve Chat Service
# =============================================================================


async def process_chat(
    db: AsyncSession, request: ChatRequest
) -> ChatResponse:
    """
    Process a chat message and generate Eve's response using OpenAI.

    Uses the OpenAI API with conversation history and engagement context
    to generate contextual, intelligent responses.
    """
    message_lower = request.message.lower().strip()
    engagement = None
    sources = None

    # Get engagement context if provided
    if request.engagement_id:
        engagement = await get_engagement_by_id(db, request.engagement_id)

    # Get conversation history
    conversation_key = request.engagement_id or "global"
    conversation = get_conversation(conversation_key)

    # Check for Gantt chart intent (special handling for visualization)
    if is_gantt_intent(message_lower):
        gantt_data = await get_gantt_data(db)
        response_text = (
            "Here is your engagement schedule as a Gantt chart. "
            f"You currently have {gantt_data.total_engagements} active engagement(s). "
            "Bars are colored according to risk level: red (high), orange (medium), green (low)."
        )

        # Add to conversation history
        add_message(conversation_key, "user", request.message)
        add_message(conversation_key, "assistant", response_text, sources)

        return ChatResponse(
            message=response_text,
            sources=sources,
            engagement_id=request.engagement_id,
            response_type="gantt",
            data=gantt_data.model_dump(),
        )

    # Add user message to history before generating response
    add_message(conversation_key, "user", request.message)

    # Generate response using OpenAI
    response_text = await generate_chat_response(
        request.message,
        engagement,
        conversation.messages[:-1]  # Exclude the message we just added
    )

    # Add Eve's response to history
    add_message(conversation_key, "assistant", response_text, sources)

    return ChatResponse(
        message=response_text,
        sources=sources,
        engagement_id=request.engagement_id,
        response_type="text",
    )


def is_gantt_intent(message: str) -> bool:
    """
    Detect if the message is requesting a Gantt chart visualization.

    Args:
        message: Lowercased user message

    Returns:
        True if the message is a gantt chart request
    """
    # Gantt-specific keywords
    gantt_keywords = ["gantt", "gantt chart", "gantt diagram"]

    # Planning/timeline keywords that should trigger gantt
    planning_keywords = [
        "planning",
        "timeline",
        "schedule",
        "calendar",
    ]

    # Obligation/engagement timeline keywords
    obligation_keywords = [
        "obligations",
        "obligation schedule",
        "engagement schedule",
        "show the schedule",
        "display the schedule",
        "generate the schedule",
        "show the planning",
    ]

    # Check for gantt-specific keywords
    if any(kw in message for kw in gantt_keywords):
        return True

    # Check for planning + visualization intent
    visualization_words = ["generate", "show", "display", "visualize", "view", "see"]
    if any(viz in message for viz in visualization_words):
        if any(planning in message for planning in planning_keywords):
            return True

    # Check for specific obligation planning phrases
    if any(phrase in message for phrase in obligation_keywords):
        return True

    return False


def get_variance_proactive_message(engagement) -> str:
    """
    Generate proactive message about significant variances if any exist.

    Args:
        engagement: Engagement object with financial_data

    Returns:
        Message about variances, or empty string if none
    """
    if not engagement or not engagement.financial_data:
        return ""

    variances = check_engagement_variances(engagement.financial_data)
    if not variances:
        return ""

    messages = []
    for v in variances:
        direction = "increase" if v.variance_type.value == "increase" else "decrease"
        messages.append(
            f"- {v.metric_label}: {direction} of {abs(v.variance_percent):.1f}% vs previous year"
        )

    return (
        f"\n\nI notice significant variances for this engagement:\n"
        + "\n".join(messages)
        + "\n\nWould you like me to explain these variations in detail?"
    )


def build_engagement_context(engagement) -> str:
    """Build context string from engagement data for the system prompt."""
    parts = [
        f"- Entity: {engagement.entity_name}",
        f"- Country: {engagement.country_code}",
        f"- Service: {engagement.service_type}",
        f"- Status: {engagement.status}",
        f"- Progress: {engagement.completion_percent}%",
        f"- Risk level: {engagement.risk_level}",
    ]

    if engagement.due_date:
        parts.append(f"- Due date: {engagement.due_date.strftime('%Y-%m-%d')}")

    # Add documents info
    if engagement.documents_required:
        parts.append(f"- Required documents: {', '.join(engagement.documents_required)}")
    if engagement.documents_uploaded:
        parts.append(f"- Uploaded documents: {', '.join(engagement.documents_uploaded)}")

    # Add financial data if available
    if engagement.financial_data:
        fd = engagement.financial_data
        current = fd.get("current_year", fd)
        previous = fd.get("previous_year", {})

        parts.append("\nFinancial data (current year):")
        if "total_assets" in current:
            parts.append(f"- Total Assets: {current['total_assets']:,.0f} €")
        if "total_liabilities" in current:
            parts.append(f"- Total Liabilities: {current['total_liabilities']:,.0f} €")
        if "equity" in current:
            parts.append(f"- Equity: {current['equity']:,.0f} €")
        if "revenue" in current:
            parts.append(f"- Revenue: {current['revenue']:,.0f} €")

        if previous:
            parts.append("\nPrevious year data:")
            if "total_assets" in previous:
                parts.append(f"- Total Assets (prev): {previous['total_assets']:,.0f} €")
            if "total_liabilities" in previous:
                parts.append(f"- Total Liabilities (prev): {previous['total_liabilities']:,.0f} €")
            if "revenue" in previous:
                parts.append(f"- Revenue (prev): {previous['revenue']:,.0f} €")

        # Add variance info
        variances = check_engagement_variances(engagement.financial_data)
        if variances:
            parts.append("\nSignificant variances detected:")
            for v in variances:
                direction = "increase" if v.variance_type.value == "increase" else "decrease"
                parts.append(
                    f"- {v.metric_label}: {direction} of {abs(v.variance_percent):.1f}% "
                    f"(Current: {v.current_value:,.0f} € → Prev: {v.previous_value:,.0f} €)"
                )

    return "\n".join(parts)


async def generate_chat_response(
    message: str,
    engagement=None,
    conversation_history: list = None
) -> str:
    """
    Generate Eve's response using OpenAI API.

    Args:
        message: User's message
        engagement: Optional engagement context
        conversation_history: Previous messages in conversation

    Returns:
        Eve's response text
    """
    try:
        client = get_openai_client()
    except ValueError as e:
        logger.error(f"OpenAI client not configured: {e}")
        return (
            "I am not yet configured to respond. "
            "Please verify that the OpenAI API key is correctly configured."
        )

    # Build messages array for OpenAI
    messages = []

    # 1. System prompt with Eve's personality
    system_content = EVE_SYSTEM_PROMPT

    # 2. Add engagement context if available
    if engagement:
        context = build_engagement_context(engagement)
        system_content += f"\n\nCURRENT ENGAGEMENT CONTEXT:\n{context}"

    messages.append({"role": "system", "content": system_content})

    # 3. Add conversation history (last 10 messages to avoid token overflow)
    if conversation_history:
        for msg in conversation_history[-10:]:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

    # 4. Add current user message
    messages.append({"role": "user", "content": message})

    # 5. Call OpenAI API
    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            max_tokens=settings.openai_max_tokens,
            temperature=settings.openai_temperature,
        )
        return response.choices[0].message.content or "I could not generate a response."
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return (
            "A technical error occurred while generating "
            "my response. Please try again in a few moments."
        )


# =============================================================================
# Eve Explain Service (CMD+Click)
# =============================================================================


async def process_explain(
    db: AsyncSession, request: ExplainRequest
) -> ExplainResponse:
    """
    Process an explain request (CMD+Click on a value).

    Generates a contextual explanation of the clicked value.
    """
    engagement = await get_engagement_by_id(db, request.engagement_id)

    if not engagement:
        return ExplainResponse(
            explanation="Unable to find data for this engagement.",
            source_document=None,
        )

    # Parse the value
    value_str = request.value
    label = request.label

    # Try to extract numeric value
    numeric_value = extract_numeric_value(value_str)

    # Generate explanation based on label
    explanation, breakdown, comparison = generate_explanation(
        label, numeric_value, engagement
    )

    # Determine source document
    source_doc = f"Grand_Livre_{engagement.country_code}_2025.xlsx"
    source_line = 45  # Simulated line number

    # Add to conversation history
    user_msg = f"[CMD+Click] Expliquer: {label} = {value_str}"
    add_message(request.engagement_id, "user", user_msg)
    add_message(request.engagement_id, "assistant", explanation)

    return ExplainResponse(
        explanation=explanation,
        source_document=source_doc,
        source_line=source_line,
        breakdown=breakdown,
        comparison=comparison,
    )


def extract_numeric_value(value_str: str) -> float:
    """Extract numeric value from a formatted string."""
    # Remove currency symbols, spaces, and handle European format
    cleaned = re.sub(r"[€$\s]", "", value_str)
    cleaned = cleaned.replace(",", ".").replace(" ", "")

    # Handle millions/thousands abbreviations
    multiplier = 1
    if cleaned.endswith("M"):
        multiplier = 1_000_000
        cleaned = cleaned[:-1]
    elif cleaned.endswith("k"):
        multiplier = 1_000
        cleaned = cleaned[:-1]

    try:
        return float(cleaned) * multiplier
    except ValueError:
        return 0.0


def generate_explanation(
    label: str, value: float, engagement
) -> tuple[str, list, dict]:
    """Generate explanation, breakdown, and comparison for a value."""
    financial_data = engagement.financial_data or {}
    current = financial_data.get("current_year", financial_data)
    previous = financial_data.get("previous_year", {})

    label_lower = label.lower()
    breakdown = None
    comparison = None

    # Total Assets explanation
    if "actif" in label_lower or "asset" in label_lower:
        total = current.get("total_assets", value)

        # Simulated breakdown (in real scenario, would come from detailed data)
        immo = round(total * 0.52, 2)
        circulants = round(total * 0.32, 2)
        tresorerie = round(total * 0.16, 2)

        breakdown = [
            {"label": "Fixed Assets", "value": immo, "percentage": 52},
            {"label": "Current Assets", "value": circulants, "percentage": 32},
            {"label": "Cash", "value": tresorerie, "percentage": 16},
        ]

        prev_total = previous.get("total_assets", 0)
        if prev_total > 0:
            var_pct = ((total - prev_total) / prev_total) * 100
            comparison = {
                "previous_value": prev_total,
                "current_value": total,
                "variance_percent": round(var_pct, 1),
                "trend": "up" if var_pct > 0 else "down",
            }

        explanation = (
            f"The Total Assets amount of {total:,.0f} € for {engagement.entity_name} "
            f"breaks down as follows:\n\n"
            f"- Fixed Assets: {immo:,.0f} € (52%)\n"
            f"- Current Assets: {circulants:,.0f} € (32%)\n"
            f"- Cash: {tresorerie:,.0f} € (16%)\n\n"
            f"Source: General_Ledger_{engagement.country_code}_2025.xlsx, lines 45-78"
        )

        if comparison:
            trend_text = "increase" if comparison["variance_percent"] > 0 else "decrease"
            explanation += (
                f"\n\nThis amount represents a {trend_text} of "
                f"{abs(comparison['variance_percent']):+.1f}% compared to the previous "
                f"fiscal year ({prev_total:,.0f} €)."
            )

        return explanation, breakdown, comparison

    # Total Liabilities explanation
    if "passif" in label_lower or "liabilit" in label_lower:
        total = current.get("total_liabilities", value)

        breakdown = [
            {"label": "Financial Debts", "value": round(total * 0.60, 2), "percentage": 60},
            {"label": "Trade Payables", "value": round(total * 0.25, 2), "percentage": 25},
            {"label": "Other Liabilities", "value": round(total * 0.15, 2), "percentage": 15},
        ]

        prev_total = previous.get("total_liabilities", 0)
        if prev_total > 0:
            var_pct = ((total - prev_total) / prev_total) * 100
            comparison = {
                "previous_value": prev_total,
                "current_value": total,
                "variance_percent": round(var_pct, 1),
                "trend": "up" if var_pct > 0 else "down",
            }

        explanation = (
            f"The Total Liabilities amount of {total:,.0f} € for {engagement.entity_name} "
            f"represents all financial obligations of the entity.\n\n"
            f"Source: General_Ledger_{engagement.country_code}_2025.xlsx, lines 120-145"
        )

        return explanation, breakdown, comparison

    # Equity explanation
    if "capitaux" in label_lower or "equity" in label_lower:
        equity = current.get("equity", value)

        explanation = (
            f"The Equity of {equity:,.0f} € represents the difference between "
            f"assets and liabilities of {engagement.entity_name}.\n\n"
            f"This value reflects the net book value of the entity.\n\n"
            f"Source: Balance Sheet"
        )

        return explanation, None, None

    # Revenue explanation
    if "chiffre" in label_lower or "revenue" in label_lower or "affaires" in label_lower:
        revenue = current.get("revenue", value)

        prev_revenue = previous.get("revenue", 0)
        if prev_revenue > 0:
            var_pct = ((revenue - prev_revenue) / prev_revenue) * 100
            comparison = {
                "previous_value": prev_revenue,
                "current_value": revenue,
                "variance_percent": round(var_pct, 1),
                "trend": "up" if var_pct > 0 else "down",
            }

        explanation = (
            f"The Revenue of {revenue:,.0f} € represents the total sales "
            f"and services of {engagement.entity_name} for the fiscal year.\n\n"
            f"Source: Income Statement"
        )

        return explanation, None, comparison

    # Default explanation
    explanation = (
        f"The value {label} of {value:,.0f} € is part of the financial data "
        f"for the engagement {engagement.entity_name}.\n\n"
        f"For more details, please consult the dashboard or source documents."
    )

    return explanation, None, None


# =============================================================================
# Conversation History Service
# =============================================================================


async def get_conversation_history(
    db: AsyncSession, engagement_id: str
) -> Optional[ConversationHistory]:
    """Get conversation history for an engagement."""
    # Verify engagement exists
    engagement = await get_engagement_by_id(db, engagement_id)
    if not engagement:
        return None

    return get_conversation(engagement_id)


def clear_conversation(engagement_id: str) -> bool:
    """Clear conversation history for an engagement."""
    if engagement_id in _conversations:
        _conversations[engagement_id] = ConversationHistory(
            engagement_id=engagement_id,
            messages=[],
        )
        return True
    return False
