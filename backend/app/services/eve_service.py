"""Eve AI assistant service for contextual chat and explanations."""

import os
import re
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.eve import (
    ChatRequest,
    ChatResponse,
    ExplainRequest,
    ExplainResponse,
    SourceReference,
    Message,
    ConversationHistory,
)
from app.services.engagement_service import get_engagement_by_id

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
    Process a chat message and generate Eve's response.

    For POC, uses pattern matching. In production, would integrate with
    Factory AI / Blackwell / OpenAI.
    """
    message = request.message.lower().strip()
    engagement = None
    sources = None

    # Get engagement context if provided
    if request.engagement_id:
        engagement = await get_engagement_by_id(db, request.engagement_id)

    # Generate response based on message patterns
    response_text = await generate_chat_response(message, engagement)

    # Add to conversation history
    if request.engagement_id:
        add_message(request.engagement_id, "user", request.message)
        add_message(request.engagement_id, "assistant", response_text, sources)

    return ChatResponse(
        message=response_text,
        sources=sources,
        engagement_id=request.engagement_id,
    )


async def generate_chat_response(message: str, engagement=None) -> str:
    """
    Generate Eve's response based on message content.

    This is a simplified pattern-matching implementation for POC.
    In production, would use Factory AI or similar.
    """
    # Greeting patterns
    if any(word in message for word in ["bonjour", "salut", "hello", "hi"]):
        if engagement:
            return (
                f"Bonjour, je suis Eve, votre assistante IA spécialisée dans l'audit financier. "
                f"Je suis actuellement connectée à l'engagement {engagement.entity_name}. "
                f"Comment puis-je vous aider ?"
            )
        return (
            "Bonjour, je suis Eve, votre assistante IA spécialisée dans l'audit financier. "
            "Comment puis-je vous aider aujourd'hui ?"
        )

    # Documents manquants
    if any(word in message for word in ["document", "manque", "manquant", "requis"]):
        if engagement:
            # Get required vs uploaded docs
            required = engagement.documents_required or ["General Ledger", "Trial Balance"]
            # For POC, assume some docs are missing
            missing = ["Trial Balance"] if "france" in engagement.entity_name.lower() else []

            if missing:
                return (
                    f"Pour l'engagement {engagement.entity_name} ({engagement.service_type}), "
                    f"les documents suivants sont encore requis :\n"
                    f"- {chr(10).join('- ' + doc for doc in missing)}\n\n"
                    f"Une fois ces documents uploadés, l'analyse pourra être finalisée."
                )
            return (
                f"Tous les documents requis pour l'engagement {engagement.entity_name} "
                f"ont été reçus. L'analyse est en cours."
            )
        return (
            "Pour vérifier les documents manquants, veuillez d'abord sélectionner "
            "un engagement spécifique."
        )

    # Status / progression
    if any(word in message for word in ["status", "statut", "progression", "avancement"]):
        if engagement:
            return (
                f"L'engagement {engagement.entity_name} est actuellement en statut "
                f"'{engagement.status}' avec une progression de {engagement.completion_percent}%.\n\n"
                f"- Date d'échéance : {engagement.due_date.strftime('%d %B %Y') if engagement.due_date else 'Non définie'}\n"
                f"- Niveau de risque : {engagement.risk_level.upper()}"
            )
        return (
            "Pour consulter le statut, veuillez sélectionner un engagement spécifique "
            "ou naviguer vers le tableau de bord."
        )

    # Financial data / KPIs
    if any(word in message for word in ["actif", "passif", "assets", "liabilities", "kpi", "financ"]):
        if engagement and engagement.financial_data:
            fd = engagement.financial_data
            current = fd.get("current_year", fd)
            previous = fd.get("previous_year", {})

            assets = current.get("total_assets", 0)
            liabilities = current.get("total_liabilities", 0)
            equity = current.get("equity", assets - liabilities)

            response = (
                f"Voici les principaux indicateurs financiers pour {engagement.entity_name} :\n\n"
                f"- Total Actifs : {assets:,.0f} €\n"
                f"- Total Passifs : {liabilities:,.0f} €\n"
                f"- Capitaux Propres : {equity:,.0f} €\n"
            )

            if previous:
                prev_assets = previous.get("total_assets", 0)
                if prev_assets > 0:
                    var = ((assets - prev_assets) / prev_assets) * 100
                    response += f"\nVariation des actifs vs N-1 : {var:+.1f}%"

            response += f"\n\nSource : Données financières de l'engagement"
            return response
        return (
            "Pour consulter les données financières, veuillez sélectionner un engagement "
            "disposant de données comptables."
        )

    # Risk / deadline
    if any(word in message for word in ["risque", "risk", "deadline", "échéance", "retard"]):
        if engagement:
            risk_explanations = {
                "high": "élevé - action urgente requise",
                "medium": "modéré - surveillance recommandée",
                "low": "faible - dans les délais prévus",
            }
            explanation = risk_explanations.get(engagement.risk_level, "non évalué")

            return (
                f"Le niveau de risque pour {engagement.entity_name} est {explanation}.\n\n"
                f"- Date d'échéance : {engagement.due_date.strftime('%d %B %Y') if engagement.due_date else 'Non définie'}\n"
                f"- Progression : {engagement.completion_percent}%\n"
                f"- Statut : {engagement.status}"
            )
        return (
            "Pour évaluer le risque, veuillez sélectionner un engagement spécifique."
        )

    # Help / capabilities
    if any(word in message for word in ["aide", "help", "capacité", "peux-tu", "peux tu", "faire"]):
        return (
            "Je peux vous aider avec les tâches suivantes :\n\n"
            "- Consulter les documents financiers de vos engagements\n"
            "- Expliquer les données, KPIs et tendances\n"
            "- Vous guider avec des recommandations personnalisées\n"
            "- Comparer les données entre exercices (N vs N-1)\n"
            "- Identifier les documents manquants\n"
            "- Analyser le niveau de risque\n\n"
            "Posez-moi simplement votre question !"
        )

    # Default response
    if engagement:
        return (
            f"Je suis connectée à l'engagement {engagement.entity_name}. "
            f"Pourriez-vous préciser votre question ? Je peux vous aider avec "
            f"les documents, les données financières, le statut ou les risques."
        )

    return (
        "Je n'ai pas compris votre demande. Pourriez-vous reformuler votre question ? "
        "Je peux vous aider à consulter vos documents, analyser vos données financières, "
        "ou répondre à des questions sur vos engagements."
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
