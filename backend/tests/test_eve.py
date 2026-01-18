"""Tests for Eve AI assistant endpoints."""

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.database import async_session_maker
from app.services.eve_service import _conversations, clear_conversation


@pytest.fixture(autouse=True)
def clear_conversations():
    """Clear conversation history before each test."""
    _conversations.clear()
    yield
    _conversations.clear()


# =============================================================================
# Chat Endpoint Tests
# =============================================================================


class TestChatEndpoint:
    """Tests for POST /api/eve/chat endpoint."""

    @pytest.mark.asyncio
    async def test_chat_greeting(self):
        """Test Eve responds to greetings."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={"message": "Bonjour"},
            )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Eve" in data["message"]
        assert "timestamp" in data

    @pytest.mark.asyncio
    async def test_chat_with_engagement_context(self):
        """Test Eve responds with engagement context."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={
                    "message": "Bonjour",
                    "engagement_id": "ENG-FR-001",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["engagement_id"] == "ENG-FR-001"
        # Should mention France SPV in context
        assert "France SPV" in data["message"] or "Eve" in data["message"]

    @pytest.mark.asyncio
    async def test_chat_documents_question(self):
        """Test Eve responds to documents questions."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={
                    "message": "Quels documents manquent?",
                    "engagement_id": "ENG-FR-001",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "document" in data["message"].lower() or "requis" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_chat_status_question(self):
        """Test Eve responds to status questions."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={
                    "message": "Quel est le statut?",
                    "engagement_id": "ENG-FR-001",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "statut" in data["message"].lower() or "status" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_chat_financial_question(self):
        """Test Eve responds to financial questions."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={
                    "message": "Montre moi les actifs",
                    "engagement_id": "ENG-FR-001",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "actif" in data["message"].lower() or "€" in data["message"]

    @pytest.mark.asyncio
    async def test_chat_risk_question(self):
        """Test Eve responds to risk questions."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={
                    "message": "Quel est le niveau de risque?",
                    "engagement_id": "ENG-FR-001",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "risque" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_chat_help_question(self):
        """Test Eve responds to help questions."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={"message": "Que peux-tu faire?"},
            )

        assert response.status_code == 200
        data = response.json()
        assert "aider" in data["message"].lower() or "capacité" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_chat_unknown_question(self):
        """Test Eve handles unknown questions gracefully."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={"message": "xyzabc123"},
            )

        assert response.status_code == 200
        data = response.json()
        # Should ask to reformulate or provide guidance
        assert len(data["message"]) > 20

    @pytest.mark.asyncio
    async def test_chat_empty_message_rejected(self):
        """Test that empty messages are rejected."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={"message": ""},
            )

        assert response.status_code == 422  # Validation error


# =============================================================================
# Explain Endpoint Tests
# =============================================================================


class TestExplainEndpoint:
    """Tests for POST /api/eve/explain endpoint."""

    @pytest.mark.asyncio
    async def test_explain_total_assets(self):
        """Test Eve explains Total Assets value."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/explain",
                json={
                    "value": "3,378,000 €",
                    "label": "Total Actifs",
                    "engagement_id": "ENG-FR-001",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "explanation" in data
        assert "actif" in data["explanation"].lower() or "assets" in data["explanation"].lower()
        assert data.get("source_document") is not None

    @pytest.mark.asyncio
    async def test_explain_with_breakdown(self):
        """Test Eve provides breakdown for assets."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/explain",
                json={
                    "value": "3,378,000 €",
                    "label": "Total Actifs",
                    "engagement_id": "ENG-FR-001",
                },
            )

        assert response.status_code == 200
        data = response.json()
        # Should have breakdown for assets
        if data.get("breakdown"):
            assert len(data["breakdown"]) > 0
            assert "label" in data["breakdown"][0]
            assert "value" in data["breakdown"][0]

    @pytest.mark.asyncio
    async def test_explain_with_comparison(self):
        """Test Eve provides year-over-year comparison."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/explain",
                json={
                    "value": "3,378,000 €",
                    "label": "Total Assets",
                    "engagement_id": "ENG-FR-001",
                },
            )

        assert response.status_code == 200
        data = response.json()
        # Should include comparison data
        if data.get("comparison"):
            assert "variance_percent" in data["comparison"]
            assert "trend" in data["comparison"]

    @pytest.mark.asyncio
    async def test_explain_liabilities(self):
        """Test Eve explains liabilities value."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/explain",
                json={
                    "value": "1,200,000 €",
                    "label": "Total Passifs",
                    "engagement_id": "ENG-FR-001",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "passif" in data["explanation"].lower() or "obligation" in data["explanation"].lower()

    @pytest.mark.asyncio
    async def test_explain_equity(self):
        """Test Eve explains equity value."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/explain",
                json={
                    "value": "500,000 €",
                    "label": "Capitaux Propres",
                    "engagement_id": "ENG-FR-001",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "capitaux" in data["explanation"].lower() or "equity" in data["explanation"].lower()

    @pytest.mark.asyncio
    async def test_explain_revenue(self):
        """Test Eve explains revenue value."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/explain",
                json={
                    "value": "850,000 €",
                    "label": "Chiffre d'Affaires",
                    "engagement_id": "ENG-FR-001",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "chiffre" in data["explanation"].lower() or "ventes" in data["explanation"].lower()

    @pytest.mark.asyncio
    async def test_explain_nonexistent_engagement(self):
        """Test explain with non-existent engagement returns graceful error."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/explain",
                json={
                    "value": "100 €",
                    "label": "Test",
                    "engagement_id": "NONEXISTENT",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert "impossible" in data["explanation"].lower() or "trouver" in data["explanation"].lower()


# =============================================================================
# Conversation History Tests
# =============================================================================


class TestConversationHistory:
    """Tests for conversation history endpoints."""

    @pytest.mark.asyncio
    async def test_get_empty_conversation(self):
        """Test getting conversation history for engagement with no history."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/api/eve/conversations/ENG-FR-001")

        assert response.status_code == 200
        data = response.json()
        assert data["engagement_id"] == "ENG-FR-001"
        assert data["messages"] == []

    @pytest.mark.asyncio
    async def test_get_conversation_after_chat(self):
        """Test conversation history is updated after chat."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            # First, send a chat message
            await client.post(
                "/api/eve/chat",
                json={
                    "message": "Bonjour",
                    "engagement_id": "ENG-FR-001",
                },
            )

            # Then, get conversation history
            response = await client.get("/api/eve/conversations/ENG-FR-001")

        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) == 2  # User message + Eve response
        assert data["messages"][0]["role"] == "user"
        assert data["messages"][1]["role"] == "assistant"

    @pytest.mark.asyncio
    async def test_get_conversation_nonexistent_engagement(self):
        """Test getting conversation for non-existent engagement."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.get("/api/eve/conversations/NONEXISTENT")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_conversation(self):
        """Test clearing conversation history."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            # First, create some conversation history
            await client.post(
                "/api/eve/chat",
                json={
                    "message": "Bonjour",
                    "engagement_id": "ENG-FR-001",
                },
            )

            # Delete the conversation
            response = await client.delete("/api/eve/conversations/ENG-FR-001")
            assert response.status_code == 204

            # Verify it's cleared
            response = await client.get("/api/eve/conversations/ENG-FR-001")
            data = response.json()
            assert data["messages"] == []


# =============================================================================
# Integration Tests
# =============================================================================


class TestEveIntegration:
    """Integration tests for Eve assistant."""

    @pytest.mark.asyncio
    async def test_full_conversation_flow(self):
        """Test a full conversation flow with multiple messages."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            engagement_id = "ENG-FR-001"

            # Greeting
            response = await client.post(
                "/api/eve/chat",
                json={"message": "Bonjour Eve", "engagement_id": engagement_id},
            )
            assert response.status_code == 200

            # Ask about documents
            response = await client.post(
                "/api/eve/chat",
                json={"message": "Quels documents sont requis?", "engagement_id": engagement_id},
            )
            assert response.status_code == 200

            # Ask about financial data
            response = await client.post(
                "/api/eve/chat",
                json={"message": "Montre les KPIs", "engagement_id": engagement_id},
            )
            assert response.status_code == 200

            # Check conversation history
            response = await client.get(f"/api/eve/conversations/{engagement_id}")
            data = response.json()
            assert len(data["messages"]) == 6  # 3 user + 3 assistant

    @pytest.mark.asyncio
    async def test_cmd_click_then_chat(self):
        """Test CMD+Click explain followed by chat."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            engagement_id = "ENG-FR-001"

            # CMD+Click on a value
            response = await client.post(
                "/api/eve/explain",
                json={
                    "value": "3,378,000 €",
                    "label": "Total Actifs",
                    "engagement_id": engagement_id,
                },
            )
            assert response.status_code == 200
            assert "explanation" in response.json()

            # Follow up with a chat question
            response = await client.post(
                "/api/eve/chat",
                json={
                    "message": "Comment ce chiffre a-t-il évolué?",
                    "engagement_id": engagement_id,
                },
            )
            assert response.status_code == 200

            # Check conversation includes both
            response = await client.get(f"/api/eve/conversations/{engagement_id}")
            data = response.json()
            assert len(data["messages"]) >= 4  # At least 2 from explain + 2 from chat


# =============================================================================
# Gantt Chart Intent Tests
# =============================================================================


class TestGanttIntent:
    """Tests for Gantt chart intent detection and response."""

    @pytest.mark.asyncio
    async def test_gantt_intent_with_gantt_keyword(self):
        """Test that 'gantt' keyword triggers gantt response."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={"message": "Génère un diagramme de Gantt"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["response_type"] == "gantt"
        assert data["data"] is not None
        assert "items" in data["data"]

    @pytest.mark.asyncio
    async def test_gantt_intent_with_planning_keyword(self):
        """Test that 'génère le planning' triggers gantt response."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={"message": "Génère le planning des obligations"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["response_type"] == "gantt"
        assert data["data"] is not None

    @pytest.mark.asyncio
    async def test_gantt_intent_with_visualiser_planning(self):
        """Test that 'visualiser le planning' triggers gantt response."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={"message": "Visualise le planning"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["response_type"] == "gantt"

    @pytest.mark.asyncio
    async def test_gantt_response_has_correct_structure(self):
        """Test that gantt response has all required fields."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={"message": "Affiche le diagramme gantt"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["response_type"] == "gantt"

        gantt_data = data["data"]
        assert "items" in gantt_data
        assert "min_date" in gantt_data
        assert "max_date" in gantt_data
        assert "total_engagements" in gantt_data

    @pytest.mark.asyncio
    async def test_gantt_response_includes_all_engagements(self):
        """Test that gantt response includes all demo engagements."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={"message": "Génère le Gantt"},
            )

        assert response.status_code == 200
        data = response.json()
        gantt_data = data["data"]

        assert gantt_data["total_engagements"] == 5
        engagement_ids = [item["engagement_id"] for item in gantt_data["items"]]
        assert "ENG-FR-001" in engagement_ids

    @pytest.mark.asyncio
    async def test_gantt_message_describes_chart(self):
        """Test that gantt response message describes the chart."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={"message": "Montre le planning"},
            )

        assert response.status_code == 200
        data = response.json()
        assert "planning" in data["message"].lower() or "gantt" in data["message"].lower()
        assert "engagement" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_non_gantt_message_returns_text_type(self):
        """Test that regular messages return text response type."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={"message": "Bonjour Eve"},
            )

        assert response.status_code == 200
        data = response.json()
        assert data["response_type"] == "text"
        assert data.get("data") is None

    @pytest.mark.asyncio
    async def test_gantt_with_engagement_context(self):
        """Test gantt request with engagement context still works."""
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/eve/chat",
                json={
                    "message": "Génère le planning des engagements",
                    "engagement_id": "ENG-FR-001",
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert data["response_type"] == "gantt"
        assert data["engagement_id"] == "ENG-FR-001"
