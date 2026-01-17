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
