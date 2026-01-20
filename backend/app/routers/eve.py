"""Eve AI assistant router for chat and explain endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.eve import (
    ChatRequest,
    ChatResponse,
    ExplainRequest,
    ExplainResponse,
    ConversationHistory,
)
from app.services.eve_service import (
    process_chat,
    process_explain,
    get_conversation_history,
    clear_conversation,
)

router = APIRouter(prefix="/eve", tags=["Eve AI Assistant"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with Eve",
    description="""
    Send a message to Eve and receive a contextual response.

    Eve is an AI assistant specialized in financial audit. She can:
    - Answer questions about engagements and documents
    - Explain financial data and KPIs
    - Provide guidance and recommendations
    - Cite sources for her answers

    Optionally provide an `engagement_id` for contextual responses.
    """,
)
async def chat_with_eve(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """
    Process a chat message and return Eve's response.

    - **message**: The user's message (required)
    - **engagement_id**: Optional engagement ID for context
    - **context**: Optional additional context (current page, selected data)
    """
    try:
        response = await process_chat(db, request)
        return response
    except Exception as e:
        # Return fallback message on error
        return ChatResponse(
            message="A technical error occurred. Please try again in a few moments.",
            sources=None,
            engagement_id=request.engagement_id,
        )


@router.post(
    "/explain",
    response_model=ExplainResponse,
    summary="Explain a value (CMD+Click)",
    description="""
    Get Eve's explanation of a specific value.

    This endpoint is triggered by CMD+Click (Mac) or ALT+Click (Windows)
    on a data element in the UI.

    Eve will provide:
    - A clear explanation of what the value represents
    - A breakdown into sub-components if applicable
    - Year-over-year comparison if available
    - Source document and line reference
    """,
)
async def explain_value(
    request: ExplainRequest,
    db: AsyncSession = Depends(get_db),
) -> ExplainResponse:
    """
    Explain a value that was CMD+Clicked.

    - **value**: The value to explain (e.g., "3,378,000 €")
    - **label**: Label of the value (e.g., "Total Assets")
    - **engagement_id**: Engagement ID for context (required)
    - **context**: Optional additional context
    """
    try:
        response = await process_explain(db, request)
        return response
    except Exception as e:
        return ExplainResponse(
            explanation="A technical error occurred while analyzing this value.",
            source_document=None,
        )


@router.get(
    "/conversations/{engagement_id}",
    response_model=ConversationHistory,
    summary="Get conversation history",
    description="""
    Retrieve the conversation history for a specific engagement.

    Returns all messages exchanged with Eve in the current session
    for the given engagement.
    """,
)
async def get_conversation(
    engagement_id: str,
    db: AsyncSession = Depends(get_db),
) -> ConversationHistory:
    """
    Get conversation history for an engagement.

    - **engagement_id**: The engagement ID
    """
    conversation = await get_conversation_history(db, engagement_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement '{engagement_id}' not found",
        )
    return conversation


@router.delete(
    "/conversations/{engagement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear conversation history",
    description="Clear the conversation history for a specific engagement.",
)
async def delete_conversation(
    engagement_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Clear conversation history for an engagement.

    - **engagement_id**: The engagement ID
    """
    clear_conversation(engagement_id)
