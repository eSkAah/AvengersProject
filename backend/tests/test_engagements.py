"""Unit tests for Engagements API endpoints and business logic."""

from datetime import date, timedelta

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.engagement import RiskLevel, StatusEnum
from app.services.engagement_service import (
    calculate_completion_percent,
    calculate_risk_level,
)


@pytest_asyncio.fixture
async def client():
    """Async test client fixture."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


# =============================================================================
# API Endpoint Tests
# =============================================================================


@pytest.mark.asyncio
async def test_list_engagements_returns_200(client):
    """Test that GET /api/engagements returns 200 OK."""
    response = await client.get("/api/engagements/")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_engagements_returns_correct_structure(client):
    """Test that engagements list response has correct structure."""
    response = await client.get("/api/engagements/")
    data = response.json()

    assert "total" in data
    assert "engagements" in data
    assert isinstance(data["total"], int)
    assert isinstance(data["engagements"], list)


@pytest.mark.asyncio
async def test_list_engagements_returns_seeded_data(client):
    """Test that engagements list contains seeded demo data."""
    response = await client.get("/api/engagements/")
    data = response.json()

    # We seeded 5 demo engagements
    assert data["total"] == 5
    assert len(data["engagements"]) == 5


@pytest.mark.asyncio
async def test_list_engagements_contains_france_spv(client):
    """Test that France SPV (hero engagement) is in the list."""
    response = await client.get("/api/engagements/")
    data = response.json()

    entity_names = [e["entity_name"] for e in data["engagements"]]
    assert "France SPV" in entity_names


@pytest.mark.asyncio
async def test_engagement_has_required_fields(client):
    """Test that each engagement has all required fields."""
    response = await client.get("/api/engagements/")
    data = response.json()

    required_fields = [
        "id",
        "entity_name",
        "country_code",
        "country_name",
        "service_type",
        "status",
        "risk_level",
        "completion_percent",
        "due_date",
        "documents_required",
        "financial_data",
        "ai_insights",
        "created_at",
        "updated_at",
    ]

    for engagement in data["engagements"]:
        for field in required_fields:
            assert field in engagement, f"Missing field: {field}"


@pytest.mark.asyncio
async def test_get_engagement_by_id_returns_200(client):
    """Test that GET /api/engagements/{id} returns 200 for valid ID."""
    response = await client.get("/api/engagements/ENG-FR-001")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_engagement_by_id_returns_correct_engagement(client):
    """Test that GET /api/engagements/{id} returns correct engagement."""
    response = await client.get("/api/engagements/ENG-FR-001")
    data = response.json()

    assert data["id"] == "ENG-FR-001"
    assert data["entity_name"] == "France SPV"
    assert data["country_code"] == "FR"
    assert data["country_name"] == "France"


@pytest.mark.asyncio
async def test_get_engagement_returns_financial_data(client):
    """Test that engagement response includes financial data."""
    response = await client.get("/api/engagements/ENG-FR-001")
    data = response.json()

    financial_data = data["financial_data"]
    assert "total_assets" in financial_data
    assert "total_liabilities" in financial_data
    assert "equity" in financial_data
    assert "revenue" in financial_data
    assert "expenses" in financial_data


@pytest.mark.asyncio
async def test_get_engagement_by_invalid_id_returns_404(client):
    """Test that GET /api/engagements/{id} returns 404 for invalid ID."""
    response = await client.get("/api/engagements/ENG-XX-999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_engagement_by_invalid_id_returns_error_message(client):
    """Test that 404 response includes error detail."""
    response = await client.get("/api/engagements/ENG-XX-999")
    data = response.json()

    assert "detail" in data
    assert "ENG-XX-999" in data["detail"]


# =============================================================================
# Risk Level Calculation Tests
# =============================================================================


class TestCalculateRiskLevel:
    """Tests for calculate_risk_level business logic."""

    def test_completed_engagement_is_low_risk(self):
        """Completed engagements should always be low risk."""
        due_date = date.today() + timedelta(days=3)  # Soon deadline
        result = calculate_risk_level(due_date, 50, StatusEnum.completed)
        assert result == RiskLevel.low

    def test_completed_string_status_is_low_risk(self):
        """Completed status as string should also be low risk."""
        due_date = date.today() + timedelta(days=3)
        result = calculate_risk_level(due_date, 50, "completed")
        assert result == RiskLevel.low

    def test_less_than_7_days_and_under_80_percent_is_high_risk(self):
        """< 7 days AND < 80% complete = HIGH risk."""
        due_date = date.today() + timedelta(days=5)  # 5 days left
        result = calculate_risk_level(due_date, 70, StatusEnum.processing)
        assert result == RiskLevel.high

    def test_less_than_7_days_and_over_80_percent_is_not_high_risk(self):
        """< 7 days but >= 80% complete should not be high risk."""
        due_date = date.today() + timedelta(days=5)
        result = calculate_risk_level(due_date, 85, StatusEnum.processing)
        assert result != RiskLevel.high

    def test_7_to_14_days_and_under_90_percent_is_medium_risk(self):
        """7-14 days AND < 90% complete = MEDIUM risk."""
        due_date = date.today() + timedelta(days=10)  # 10 days left
        result = calculate_risk_level(due_date, 80, StatusEnum.processing)
        assert result == RiskLevel.medium

    def test_7_to_14_days_and_over_90_percent_is_low_risk(self):
        """7-14 days but >= 90% complete = LOW risk."""
        due_date = date.today() + timedelta(days=10)
        result = calculate_risk_level(due_date, 95, StatusEnum.processing)
        assert result == RiskLevel.low

    def test_more_than_14_days_is_low_risk(self):
        """> 14 days remaining = LOW risk regardless of completion."""
        due_date = date.today() + timedelta(days=20)
        result = calculate_risk_level(due_date, 30, StatusEnum.waiting)
        assert result == RiskLevel.low

    def test_high_completion_is_low_risk(self):
        """>= 90% complete = LOW risk regardless of time."""
        due_date = date.today() + timedelta(days=5)  # Soon deadline
        result = calculate_risk_level(due_date, 92, StatusEnum.processing)
        assert result == RiskLevel.low

    def test_overdue_and_incomplete_is_high_risk(self):
        """Overdue engagement with low completion = HIGH risk."""
        due_date = date.today() - timedelta(days=2)  # 2 days overdue
        result = calculate_risk_level(due_date, 50, StatusEnum.processing)
        assert result == RiskLevel.high


# =============================================================================
# Completion Percent Calculation Tests
# =============================================================================


class TestCalculateCompletionPercent:
    """Tests for calculate_completion_percent business logic."""

    def test_completed_status_returns_100(self):
        """Completed engagement should return 100%."""
        result = calculate_completion_percent(1, 4, StatusEnum.completed)
        assert result == 100

    def test_completed_string_status_returns_100(self):
        """Completed status as string should return 100%."""
        result = calculate_completion_percent(1, 4, "completed")
        assert result == 100

    def test_no_documents_required_uses_status_progress(self):
        """When no documents required, use status-based progress."""
        assert calculate_completion_percent(0, 0, StatusEnum.waiting) == 0
        assert calculate_completion_percent(0, 0, StatusEnum.received) == 25
        assert calculate_completion_percent(0, 0, StatusEnum.processing) == 75
        assert calculate_completion_percent(0, 0, StatusEnum.completed) == 100

    def test_document_based_calculation(self):
        """Test document upload progress calculation."""
        # 2 of 4 documents = 50% base
        result = calculate_completion_percent(2, 4, StatusEnum.waiting)
        assert result == 50

    def test_received_status_adds_5_percent_bonus(self):
        """Received status should add 5% bonus."""
        # 2 of 4 = 50% base + 5% bonus = 55%
        result = calculate_completion_percent(2, 4, StatusEnum.received)
        assert result == 55

    def test_processing_status_adds_10_percent_bonus(self):
        """Processing status should add 10% bonus."""
        # 2 of 4 = 50% base + 10% bonus = 60%
        result = calculate_completion_percent(2, 4, StatusEnum.processing)
        assert result == 60

    def test_completion_capped_at_100(self):
        """Completion percentage should not exceed 100%."""
        # All documents uploaded with processing bonus should cap at 100
        result = calculate_completion_percent(4, 4, StatusEnum.processing)
        assert result == 100

    def test_all_documents_uploaded_is_100(self):
        """All documents uploaded = 100% (capped)."""
        result = calculate_completion_percent(5, 4, StatusEnum.waiting)
        assert result == 100


# =============================================================================
# Integration Tests
# =============================================================================


@pytest.mark.asyncio
async def test_all_demo_engagements_have_valid_status(client):
    """Test that all seeded engagements have valid status values."""
    response = await client.get("/api/engagements/")
    data = response.json()

    valid_statuses = ["waiting", "received", "processing", "completed"]
    for engagement in data["engagements"]:
        assert engagement["status"] in valid_statuses


@pytest.mark.asyncio
async def test_all_demo_engagements_have_valid_risk_level(client):
    """Test that all seeded engagements have valid risk level values."""
    response = await client.get("/api/engagements/")
    data = response.json()

    valid_risk_levels = ["low", "medium", "high"]
    for engagement in data["engagements"]:
        assert engagement["risk_level"] in valid_risk_levels


@pytest.mark.asyncio
async def test_completed_engagement_is_low_risk_in_api(client):
    """Test that completed engagement (Netherlands BV) has low risk."""
    response = await client.get("/api/engagements/ENG-NL-001")
    data = response.json()

    assert data["status"] == "completed"
    assert data["risk_level"] == "low"
    assert data["completion_percent"] == 100


@pytest.mark.asyncio
async def test_all_five_demo_countries_present(client):
    """Test that all 5 demo countries are present."""
    response = await client.get("/api/engagements/")
    data = response.json()

    country_codes = {e["country_code"] for e in data["engagements"]}
    expected_countries = {"FR", "DE", "NL", "BE", "LU"}
    assert country_codes == expected_countries


# =============================================================================
# Upload Response with Engagement Update Tests
# =============================================================================


@pytest.mark.asyncio
async def test_upload_returns_engagement_update(client):
    """Test that document upload returns engagement status update."""
    # Upload to France SPV (waiting status)
    content = b"test,content\n1,2"
    response = await client.post(
        "/api/documents/upload",
        files={"file": ("Grand_Livre_FR_2025.csv", content, "text/csv")},
        data={"engagement_id": "ENG-FR-001"},
    )
    assert response.status_code == 201
    data = response.json()

    # Check engagement update is present
    assert "engagement_update" in data
    assert data["engagement_update"] is not None
    assert "status" in data["engagement_update"]
    assert "completion_percent" in data["engagement_update"]
    assert "risk_level" in data["engagement_update"]


@pytest.mark.asyncio
async def test_upload_updates_engagement_status_after_classification(client):
    """Test that successful classification updates engagement status."""
    # Upload a document that will be classified
    content = b"test,content\n1,2"
    response = await client.post(
        "/api/documents/upload",
        files={"file": ("Trial_Balance_2025.csv", content, "text/csv")},
        data={"engagement_id": "ENG-FR-001"},
    )
    assert response.status_code == 201
    data = response.json()

    # Engagement should have valid status after classification
    # (could be processing if not enough docs, or completed if threshold reached)
    eng_update = data["engagement_update"]
    assert eng_update["status"] in ["received", "processing", "completed"]
    assert eng_update["risk_level"] in ["low", "medium", "high"]
    assert 0 <= eng_update["completion_percent"] <= 100


@pytest.mark.asyncio
async def test_engagement_status_updates_after_upload(client):
    """Test that engagement status is actually updated in the database."""
    # Get initial status of France SPV
    initial_response = await client.get("/api/engagements/ENG-FR-001")
    initial_data = initial_response.json()
    initial_status = initial_data["status"]

    # Upload a document with classification
    content = b"test,content\n1,2"
    await client.post(
        "/api/documents/upload",
        files={"file": ("financial_statement_FR.csv", content, "text/csv")},
        data={"engagement_id": "ENG-FR-001"},
    )

    # Get updated engagement
    updated_response = await client.get("/api/engagements/ENG-FR-001")
    updated_data = updated_response.json()

    # Status should have changed if initial was waiting
    if initial_status == "waiting":
        assert updated_data["status"] in ["received", "processing"]


# =============================================================================
# Risk Details Endpoint Tests
# =============================================================================


@pytest.mark.asyncio
async def test_get_risk_details_returns_200(client):
    """Test that GET /api/engagements/{id}/risk returns 200 OK."""
    response = await client.get("/api/engagements/ENG-FR-001/risk")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_risk_details_returns_correct_structure(client):
    """Test that risk details response has correct structure."""
    response = await client.get("/api/engagements/ENG-FR-001/risk")
    data = response.json()

    assert "engagement_id" in data
    assert "level" in data
    assert "reasons" in data
    assert "suggested_actions" in data
    assert "days_remaining" in data
    assert "completion_percent" in data
    assert "missing_documents" in data

    assert data["engagement_id"] == "ENG-FR-001"
    assert data["level"] in ["high", "medium", "low"]
    assert isinstance(data["reasons"], list)
    assert isinstance(data["suggested_actions"], list)
    assert isinstance(data["days_remaining"], int)
    assert isinstance(data["completion_percent"], int)
    assert isinstance(data["missing_documents"], list)


@pytest.mark.asyncio
async def test_get_risk_details_not_found(client):
    """Test that non-existent engagement returns 404."""
    response = await client.get("/api/engagements/NONEXISTENT/risk")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_risk_details_has_reasons_for_high_risk(client):
    """Test that high risk engagements have reasons."""
    response = await client.get("/api/engagements/ENG-FR-001/risk")
    data = response.json()

    # France SPV is typically high risk in demo data
    if data["level"] == "high":
        assert len(data["reasons"]) > 0
        assert len(data["suggested_actions"]) > 0


# =============================================================================
# Prediction Endpoint Tests
# =============================================================================


@pytest.mark.asyncio
async def test_get_prediction_returns_200(client):
    """Test that GET /api/engagements/{id}/prediction returns 200 OK."""
    response = await client.get("/api/engagements/ENG-FR-001/prediction")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_prediction_returns_correct_structure(client):
    """Test that prediction response has correct structure."""
    response = await client.get("/api/engagements/ENG-FR-001/prediction")
    data = response.json()

    assert "engagement_id" in data
    assert "predicted_date" in data
    assert "days_difference" in data
    assert "velocity" in data
    assert "is_on_track" in data
    assert "confidence" in data
    assert "due_date" in data
    assert "formatted_prediction" in data

    assert data["engagement_id"] == "ENG-FR-001"
    assert isinstance(data["days_difference"], int)
    assert isinstance(data["velocity"], (int, float))
    assert isinstance(data["is_on_track"], bool)
    assert data["confidence"] in ["high", "medium", "low"]
    assert isinstance(data["formatted_prediction"], str)


@pytest.mark.asyncio
async def test_get_prediction_not_found(client):
    """Test that non-existent engagement returns 404."""
    response = await client.get("/api/engagements/NONEXISTENT/prediction")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_prediction_has_formatted_string(client):
    """Test that prediction includes human-readable format."""
    response = await client.get("/api/engagements/ENG-FR-001/prediction")
    data = response.json()

    formatted = data["formatted_prediction"]
    # Should contain "Prévu le" or similar French text
    assert "Prévu" in formatted or "Prédiction" in formatted


# =============================================================================
# Risk and Prediction Service Unit Tests
# =============================================================================


class TestCalculateRiskWithDetails:
    """Tests for calculate_risk_with_details function."""

    def test_completed_engagement_is_low_risk(self):
        """Test completed engagements return low risk with appropriate reason."""
        from app.services.engagement_service import calculate_risk_with_details

        details = calculate_risk_with_details(
            due_date=date.today() + timedelta(days=5),
            completion_percent=100,
            status=StatusEnum.completed,
            documents_required=["Doc1", "Doc2"],
            documents_uploaded=2,
        )

        assert details.level == RiskLevel.low
        assert "terminé" in details.reasons[0].lower()
        assert len(details.suggested_actions) == 0

    def test_high_risk_has_actions(self):
        """Test high risk engagements have suggested actions."""
        from app.services.engagement_service import calculate_risk_with_details

        details = calculate_risk_with_details(
            due_date=date.today() + timedelta(days=3),
            completion_percent=50,
            status=StatusEnum.waiting,
            documents_required=["Doc1", "Doc2", "Doc3"],
            documents_uploaded=1,
        )

        assert details.level == RiskLevel.high
        assert len(details.reasons) > 0
        assert len(details.suggested_actions) > 0


class TestCalculatePredictedCompletion:
    """Tests for calculate_predicted_completion function."""

    def test_completed_engagement_predicts_today(self):
        """Test completed engagements predict today."""
        from app.services.engagement_service import calculate_predicted_completion

        prediction = calculate_predicted_completion(
            created_at=date.today() - timedelta(days=10),
            due_date=date.today() + timedelta(days=5),
            completion_percent=100,
            status=StatusEnum.completed,
        )

        assert prediction.predicted_date == date.today()
        assert prediction.is_on_track is True

    def test_zero_progress_uses_default_velocity(self):
        """Test new engagement with no progress uses default velocity."""
        from app.services.engagement_service import calculate_predicted_completion

        prediction = calculate_predicted_completion(
            created_at=date.today(),
            due_date=date.today() + timedelta(days=30),
            completion_percent=0,
            status=StatusEnum.waiting,
        )

        assert prediction.predicted_date is not None
        assert prediction.confidence == "low"

    def test_prediction_indicates_late_or_early(self):
        """Test prediction correctly indicates if on track."""
        from app.services.engagement_service import calculate_predicted_completion

        # Fast progress - should be early
        prediction_fast = calculate_predicted_completion(
            created_at=date.today() - timedelta(days=5),
            due_date=date.today() + timedelta(days=30),
            completion_percent=80,
            status=StatusEnum.processing,
        )

        assert prediction_fast.is_on_track is True

        # Slow progress - should be late
        prediction_slow = calculate_predicted_completion(
            created_at=date.today() - timedelta(days=20),
            due_date=date.today() + timedelta(days=5),
            completion_percent=20,
            status=StatusEnum.received,
        )

        assert prediction_slow.is_on_track is False
