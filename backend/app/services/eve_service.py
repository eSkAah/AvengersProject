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

EVE_SYSTEM_PROMPT = """Tu es Eve, une assistante IA spécialisée dans l'audit financier et la comptabilité pour EY.

PERSONNALITÉ:
- Style: Corporate, formel, professionnel
- Vouvoiement: Toujours utiliser "vous"
- Emojis: Jamais
- Ton: Informatif, précis, concis
- Rôle: Consultante read-only - guide et informe

CAPACITÉS:
✅ Consulter et analyser les documents financiers
✅ Expliquer les données, KPIs et tendances
✅ Guider l'utilisateur avec des recommandations
✅ Citer les sources (document, ligne)
✅ Comparer les données (N vs N-1, entre entités)
❌ Modifier ou supprimer des données
❌ Envoyer des emails ou actions externes

RÈGLES DE RÉPONSE:
1. Toujours citer la source quand vous mentionnez un chiffre
2. Utiliser des listes à puces pour la clarté
3. Réponses concises (max 200 mots)
4. Si vous ne comprenez pas: "Je n'ai pas compris votre demande. Pourriez-vous reformuler votre question ?"
5. Si erreur technique: "Une erreur technique s'est produite. Veuillez réessayer dans quelques instants."
6. Si hors périmètre: "Cette action n'est pas disponible. Je peux uniquement consulter et analyser les données."
"""

EVE_GANTT_PROMPT = """Tu es Eve, assistante IA pour EY. L'utilisateur souhaite visualiser le planning des engagements sous forme de diagramme de Gantt.

INSTRUCTIONS:
1. Générer un graphique Gantt montrant tous les engagements actifs
2. Afficher les dates de début et d'échéance de chaque engagement
3. Colorer les barres selon le niveau de risque (rouge=high, orange=medium, vert=low)
4. Montrer le pourcentage d'avancement de chaque engagement

Je vais générer le diagramme de Gantt avec les données de tous vos engagements.
"""

EVE_EXPLAIN_PROMPT = """Tu es Eve, assistante IA pour EY. L'utilisateur a cliqué sur une valeur financière et souhaite une explication.

CONTEXTE:
- Engagement: {entity_name} ({country_code})
- Valeur cliquée: {label} = {value}
- Données financières disponibles: {financial_data}

INSTRUCTIONS:
1. Expliquer ce que représente cette valeur
2. Donner une décomposition si pertinent
3. Mentionner la variation par rapport à l'année précédente si disponible
4. Citer la source (document, ligne)
5. Être concis (max 150 mots)

FORMAT DE RÉPONSE:
- Explication claire de la valeur
- Décomposition en sous-éléments si applicable
- Comparaison N vs N-1 avec pourcentage
- Source: [nom_document], ligne [numéro]
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
            "Voici le planning de vos engagements sous forme de diagramme de Gantt. "
            f"Vous avez actuellement {gantt_data.total_engagements} engagement(s) en cours. "
            "Les barres sont colorées selon le niveau de risque : rouge (élevé), orange (modéré), vert (faible)."
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
    gantt_keywords = ["gantt", "diagramme de gantt", "gantt chart"]

    # Planning/timeline keywords that should trigger gantt
    planning_keywords = [
        "planning",
        "timeline",
        "calendrier",
        "échéancier",
    ]

    # Obligation/engagement timeline keywords
    obligation_keywords = [
        "obligations",
        "planning des obligations",
        "planning des engagements",
        "visualiser le planning",
        "afficher le planning",
        "génère le planning",
        "genere le planning",
        "montre le planning",
    ]

    # Check for gantt-specific keywords
    if any(kw in message for kw in gantt_keywords):
        return True

    # Check for planning + visualization intent
    visualization_words = ["génère", "genere", "montre", "affiche", "visualise", "voir"]
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
        direction = "augmentation" if v.variance_type.value == "increase" else "diminution"
        messages.append(
            f"- {v.metric_label}: {direction} de {abs(v.variance_percent):.1f}% vs N-1"
        )

    return (
        f"\n\nJe note des variances significatives pour cet engagement :\n"
        + "\n".join(messages)
        + "\n\nSouhaitez-vous que je vous explique ces variations en détail ?"
    )


def build_engagement_context(engagement) -> str:
    """Build context string from engagement data for the system prompt."""
    parts = [
        f"- Entité: {engagement.entity_name}",
        f"- Pays: {engagement.country_code}",
        f"- Service: {engagement.service_type}",
        f"- Statut: {engagement.status}",
        f"- Progression: {engagement.completion_percent}%",
        f"- Niveau de risque: {engagement.risk_level}",
    ]

    if engagement.due_date:
        parts.append(f"- Date d'échéance: {engagement.due_date.strftime('%d/%m/%Y')}")

    # Add documents info
    if engagement.documents_required:
        parts.append(f"- Documents requis: {', '.join(engagement.documents_required)}")
    if engagement.documents_uploaded:
        parts.append(f"- Documents uploadés: {', '.join(engagement.documents_uploaded)}")

    # Add financial data if available
    if engagement.financial_data:
        fd = engagement.financial_data
        current = fd.get("current_year", fd)
        previous = fd.get("previous_year", {})

        parts.append("\nDonnées financières (année en cours):")
        if "total_assets" in current:
            parts.append(f"- Total Actifs: {current['total_assets']:,.0f} €")
        if "total_liabilities" in current:
            parts.append(f"- Total Passifs: {current['total_liabilities']:,.0f} €")
        if "equity" in current:
            parts.append(f"- Capitaux Propres: {current['equity']:,.0f} €")
        if "revenue" in current:
            parts.append(f"- Chiffre d'affaires: {current['revenue']:,.0f} €")

        if previous:
            parts.append("\nDonnées N-1:")
            if "total_assets" in previous:
                parts.append(f"- Total Actifs N-1: {previous['total_assets']:,.0f} €")
            if "total_liabilities" in previous:
                parts.append(f"- Total Passifs N-1: {previous['total_liabilities']:,.0f} €")
            if "revenue" in previous:
                parts.append(f"- Chiffre d'affaires N-1: {previous['revenue']:,.0f} €")

        # Add variance info
        variances = check_engagement_variances(engagement.financial_data)
        if variances:
            parts.append("\nVariances significatives détectées:")
            for v in variances:
                direction = "augmentation" if v.variance_type.value == "increase" else "diminution"
                parts.append(
                    f"- {v.metric_label}: {direction} de {abs(v.variance_percent):.1f}% "
                    f"(N: {v.current_value:,.0f} € → N-1: {v.previous_value:,.0f} €)"
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
            "Je ne suis pas encore configurée pour répondre. "
            "Veuillez vérifier que la clé API OpenAI est correctement configurée."
        )

    # Build messages array for OpenAI
    messages = []

    # 1. System prompt with Eve's personality
    system_content = EVE_SYSTEM_PROMPT

    # 2. Add engagement context if available
    if engagement:
        context = build_engagement_context(engagement)
        system_content += f"\n\nCONTEXTE DE L'ENGAGEMENT ACTUEL:\n{context}"

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
        return response.choices[0].message.content or "Je n'ai pas pu générer de réponse."
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return (
            "Une erreur technique s'est produite lors de la génération "
            "de ma réponse. Veuillez réessayer dans quelques instants."
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
            explanation="Impossible de trouver les données pour cet engagement.",
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
            {"label": "Immobilisations", "value": immo, "percentage": 52},
            {"label": "Actifs circulants", "value": circulants, "percentage": 32},
            {"label": "Trésorerie", "value": tresorerie, "percentage": 16},
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
            f"Le montant Total Actifs de {total:,.0f} € pour {engagement.entity_name} "
            f"se décompose comme suit :\n\n"
            f"- Immobilisations : {immo:,.0f} € (52%)\n"
            f"- Actifs circulants : {circulants:,.0f} € (32%)\n"
            f"- Trésorerie : {tresorerie:,.0f} € (16%)\n\n"
            f"Source : Grand_Livre_{engagement.country_code}_2025.xlsx, lignes 45-78"
        )

        if comparison:
            trend_text = "hausse" if comparison["variance_percent"] > 0 else "baisse"
            explanation += (
                f"\n\nCe montant représente une {trend_text} de "
                f"{abs(comparison['variance_percent']):+.1f}% par rapport à l'exercice "
                f"précédent ({prev_total:,.0f} €)."
            )

        return explanation, breakdown, comparison

    # Total Liabilities explanation
    if "passif" in label_lower or "liabilit" in label_lower:
        total = current.get("total_liabilities", value)

        breakdown = [
            {"label": "Dettes financières", "value": round(total * 0.60, 2), "percentage": 60},
            {"label": "Dettes fournisseurs", "value": round(total * 0.25, 2), "percentage": 25},
            {"label": "Autres dettes", "value": round(total * 0.15, 2), "percentage": 15},
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
            f"Le montant Total Passifs de {total:,.0f} € pour {engagement.entity_name} "
            f"représente l'ensemble des obligations financières de l'entité.\n\n"
            f"Source : Grand_Livre_{engagement.country_code}_2025.xlsx, lignes 120-145"
        )

        return explanation, breakdown, comparison

    # Equity explanation
    if "capitaux" in label_lower or "equity" in label_lower:
        equity = current.get("equity", value)

        explanation = (
            f"Les Capitaux Propres de {equity:,.0f} € représentent la différence entre "
            f"les actifs et les passifs de {engagement.entity_name}.\n\n"
            f"Cette valeur reflète la valeur nette comptable de l'entité.\n\n"
            f"Source : Bilan comptable"
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
            f"Le Chiffre d'Affaires de {revenue:,.0f} € représente le total des ventes "
            f"et prestations de {engagement.entity_name} sur l'exercice.\n\n"
            f"Source : Compte de résultat"
        )

        return explanation, None, comparison

    # Default explanation
    explanation = (
        f"La valeur {label} de {value:,.0f} € fait partie des données financières "
        f"de l'engagement {engagement.entity_name}.\n\n"
        f"Pour plus de détails, consultez le tableau de bord ou les documents sources."
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
