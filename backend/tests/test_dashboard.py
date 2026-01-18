"""Unit tests for Dashboard API endpoints and KPI calculations."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.dashboard_service import (
    calculate_variance,
    extract_financial_metrics,
    calculate_variance_percent,
)
from app.schemas.dashboard import FinancialMetrics


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
async def test_get_engagement_stats_returns_200(client):
    """Test that GET /api/engagements/{id}/stats returns 200 for valid engagement."""
    response = await client.get("/api/engagements/ENG-FR-001/stats")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_engagement_stats_returns_correct_structure(client):
    """Test that stats response has correct structure."""
    response = await client.get("/api/engagements/ENG-FR-001/stats")
    data = response.json()

    assert "engagement_id" in data
    assert "entity_name" in data
    assert "current_year" in data
    assert data["engagement_id"] == "ENG-FR-001"
    assert data["entity_name"] == "France SPV"


@pytest.mark.asyncio
async def test_get_engagement_stats_returns_financial_metrics(client):
    """Test that stats response includes all financial metrics."""
    response = await client.get("/api/engagements/ENG-FR-001/stats")
    data = response.json()

    current_year = data["current_year"]
    assert "total_assets" in current_year
    assert "total_liabilities" in current_year
    assert "equity" in current_year
    assert "revenue" in current_year
    assert "expenses" in current_year


@pytest.mark.asyncio
async def test_get_engagement_stats_returns_previous_year(client):
    """Test that stats response includes previous year data."""
    response = await client.get("/api/engagements/ENG-FR-001/stats")
    data = response.json()

    # France SPV has previous_year data seeded
    assert "previous_year" in data
    if data["previous_year"] is not None:
        assert "total_assets" in data["previous_year"]
        assert "total_liabilities" in data["previous_year"]


@pytest.mark.asyncio
async def test_get_engagement_stats_returns_variance_percent(client):
    """Test that stats response includes variance percentages."""
    response = await client.get("/api/engagements/ENG-FR-001/stats")
    data = response.json()

    # Variance should be present if previous_year exists
    if data["previous_year"] is not None:
        assert "variance_percent" in data
        assert data["variance_percent"] is not None
        assert "total_assets" in data["variance_percent"]
        assert "total_liabilities" in data["variance_percent"]


@pytest.mark.asyncio
async def test_get_engagement_stats_returns_404_for_invalid_id(client):
    """Test that GET /api/engagements/{id}/stats returns 404 for invalid ID."""
    response = await client.get("/api/engagements/ENG-XX-999/stats")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_engagement_stats_404_contains_error_detail(client):
    """Test that 404 response includes error detail message."""
    response = await client.get("/api/engagements/ENG-XX-999/stats")
    data = response.json()

    assert "detail" in data
    assert "ENG-XX-999" in data["detail"]


@pytest.mark.asyncio
async def test_stats_endpoint_works_for_all_demo_engagements(client):
    """Test that stats endpoint works for all 5 demo engagements."""
    engagement_ids = ["ENG-FR-001", "ENG-DE-001", "ENG-NL-001", "ENG-BE-001", "ENG-LU-001"]

    for eng_id in engagement_ids:
        response = await client.get(f"/api/engagements/{eng_id}/stats")
        assert response.status_code == 200, f"Failed for {eng_id}"
        data = response.json()
        assert data["engagement_id"] == eng_id


# =============================================================================
# Variance Calculation Tests
# =============================================================================


class TestCalculateVariance:
    """Tests for calculate_variance helper function."""

    def test_positive_growth_variance(self):
        """Test variance calculation for positive growth."""
        # 15400000 from 14200000 = (15400000 - 14200000) / 14200000 * 100 = 8.45%
        result = calculate_variance(15400000, 14200000)
        assert result == 8.45

    def test_negative_growth_variance(self):
        """Test variance calculation for negative growth."""
        # 9000000 from 10000000 = -10%
        result = calculate_variance(9000000, 10000000)
        assert result == -10.0

    def test_zero_previous_value_with_nonzero_current(self):
        """Test variance when previous is zero but current is not."""
        result = calculate_variance(1000, 0)
        assert result == 100.0

    def test_zero_both_values(self):
        """Test variance when both values are zero."""
        result = calculate_variance(0, 0)
        assert result == 0.0

    def test_no_change_variance(self):
        """Test variance when values are equal."""
        result = calculate_variance(1000, 1000)
        assert result == 0.0

    def test_variance_rounds_to_two_decimals(self):
        """Test that variance is rounded to 2 decimal places."""
        # 1234 from 1111 = 11.0711... should round to 11.07
        result = calculate_variance(1234, 1111)
        assert result == 11.07


# =============================================================================
# Financial Metrics Extraction Tests
# =============================================================================


class TestExtractFinancialMetrics:
    """Tests for extract_financial_metrics helper function."""

    def test_extract_all_fields(self):
        """Test extraction of all financial fields."""
        data = {
            "total_assets": 15400000,
            "total_liabilities": 8200000,
            "equity": 7200000,
            "revenue": 12500000,
            "expenses": 9800000,
        }
        result = extract_financial_metrics(data)

        assert result.total_assets == 15400000
        assert result.total_liabilities == 8200000
        assert result.equity == 7200000
        assert result.revenue == 12500000
        assert result.expenses == 9800000

    def test_extract_with_missing_fields(self):
        """Test extraction with missing fields defaults to 0."""
        data = {"total_assets": 1000}
        result = extract_financial_metrics(data)

        assert result.total_assets == 1000
        assert result.total_liabilities == 0.0
        assert result.equity == 0.0
        assert result.revenue == 0.0
        assert result.expenses == 0.0

    def test_extract_empty_dict(self):
        """Test extraction from empty dictionary."""
        result = extract_financial_metrics({})

        assert result.total_assets == 0.0
        assert result.total_liabilities == 0.0
        assert result.equity == 0.0


# =============================================================================
# Variance Percent Calculation Tests
# =============================================================================


class TestCalculateVariancePercent:
    """Tests for calculate_variance_percent helper function."""

    def test_variance_percent_calculation(self):
        """Test variance percent calculation between years."""
        current = FinancialMetrics(
            total_assets=15400000,
            total_liabilities=8200000,
            equity=7200000,
            revenue=12500000,
            expenses=9800000,
        )
        previous = FinancialMetrics(
            total_assets=14200000,
            total_liabilities=7800000,
            equity=6400000,
            revenue=11200000,
            expenses=8900000,
        )

        result = calculate_variance_percent(current, previous)

        assert result.total_assets == 8.45
        assert result.total_liabilities == 5.13
        assert result.equity == 12.5
        assert result.revenue == 11.61
        assert result.expenses == 10.11

    def test_variance_percent_with_zero_previous(self):
        """Test variance percent when previous values are zero."""
        current = FinancialMetrics(
            total_assets=1000,
            total_liabilities=0,
            equity=1000,
            revenue=0,
            expenses=0,
        )
        previous = FinancialMetrics(
            total_assets=0,
            total_liabilities=0,
            equity=0,
            revenue=0,
            expenses=0,
        )

        result = calculate_variance_percent(current, previous)

        assert result.total_assets == 100.0  # Growth from 0 to 1000
        assert result.total_liabilities == 0.0  # Both 0
        assert result.equity == 100.0


# =============================================================================
# Integration Tests
# =============================================================================


@pytest.mark.asyncio
async def test_france_spv_has_current_year_data(client):
    """Test that France SPV (hero engagement) has current year financial data."""
    response = await client.get("/api/engagements/ENG-FR-001/stats")
    data = response.json()

    # France SPV should have current year data from seed
    # (seed uses flat structure which is treated as current_year)
    assert data["current_year"]["total_assets"] > 0
    assert data["current_year"]["total_assets"] == 15400000
    assert data["current_year"]["total_liabilities"] == 8200000
    assert data["current_year"]["equity"] == 7200000


@pytest.mark.asyncio
async def test_stats_values_are_numeric(client):
    """Test that all stats values are numeric."""
    response = await client.get("/api/engagements/ENG-FR-001/stats")
    data = response.json()

    current = data["current_year"]
    assert isinstance(current["total_assets"], (int, float))
    assert isinstance(current["total_liabilities"], (int, float))
    assert isinstance(current["equity"], (int, float))
    assert isinstance(current["revenue"], (int, float))
    assert isinstance(current["expenses"], (int, float))


# =============================================================================
# Charts API Endpoint Tests
# =============================================================================


@pytest.mark.asyncio
async def test_get_assets_chart_returns_200(client):
    """Test that GET /api/engagements/{id}/charts/assets returns 200."""
    response = await client.get("/api/engagements/ENG-FR-001/charts/assets")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_assets_chart_has_correct_structure(client):
    """Test that assets chart response has correct structure."""
    response = await client.get("/api/engagements/ENG-FR-001/charts/assets")
    data = response.json()

    assert "engagement_id" in data
    assert "chart_type" in data
    assert "data" in data
    assert data["chart_type"] == "bar"
    assert "labels" in data["data"]
    assert "datasets" in data["data"]


@pytest.mark.asyncio
async def test_get_assets_chart_has_labels_and_values(client):
    """Test that assets chart has expected labels."""
    response = await client.get("/api/engagements/ENG-FR-001/charts/assets")
    data = response.json()

    labels = data["data"]["labels"]
    assert "Immobilisations" in labels
    assert "Actifs circulants" in labels
    assert "Trésorerie" in labels
    assert len(data["data"]["datasets"]) > 0
    assert len(data["data"]["datasets"][0]["data"]) == 3


@pytest.mark.asyncio
async def test_get_assets_chart_returns_404_for_invalid_id(client):
    """Test that assets chart returns 404 for invalid engagement."""
    response = await client.get("/api/engagements/ENG-XX-999/charts/assets")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_comparison_chart_returns_200(client):
    """Test that GET /api/engagements/{id}/charts/comparison returns 200."""
    response = await client.get("/api/engagements/ENG-FR-001/charts/comparison")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_comparison_chart_has_correct_structure(client):
    """Test that comparison chart response has correct structure."""
    response = await client.get("/api/engagements/ENG-FR-001/charts/comparison")
    data = response.json()

    assert "engagement_id" in data
    assert "chart_type" in data
    assert "labels" in data
    assert "current_year" in data
    assert data["chart_type"] == "bar"


@pytest.mark.asyncio
async def test_get_comparison_chart_has_current_year_data(client):
    """Test that comparison chart has current year dataset."""
    response = await client.get("/api/engagements/ENG-FR-001/charts/comparison")
    data = response.json()

    current = data["current_year"]
    assert "label" in current
    assert "data" in current
    assert "backgroundColor" in current
    assert len(current["data"]) == 4  # Assets, Liabilities, Revenue, Expenses


@pytest.mark.asyncio
async def test_get_comparison_chart_has_variance_percent(client):
    """Test that comparison chart includes variance percentages."""
    response = await client.get("/api/engagements/ENG-FR-001/charts/comparison")
    data = response.json()

    assert "variance_percent" in data
    # Variance should be calculated if previous year exists
    if data["previous_year"]:
        assert len(data["variance_percent"]) == 4


@pytest.mark.asyncio
async def test_get_comparison_chart_returns_404_for_invalid_id(client):
    """Test that comparison chart returns 404 for invalid engagement."""
    response = await client.get("/api/engagements/ENG-XX-999/charts/comparison")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_breakdown_chart_returns_200(client):
    """Test that GET /api/engagements/{id}/charts/breakdown returns 200."""
    response = await client.get("/api/engagements/ENG-FR-001/charts/breakdown")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_breakdown_chart_has_correct_structure(client):
    """Test that breakdown chart response has correct structure."""
    response = await client.get("/api/engagements/ENG-FR-001/charts/breakdown")
    data = response.json()

    assert "engagement_id" in data
    assert "chart_type" in data
    assert "title" in data
    assert "total" in data
    assert "items" in data
    assert data["chart_type"] == "pie"


@pytest.mark.asyncio
async def test_get_breakdown_chart_items_have_required_fields(client):
    """Test that breakdown items have all required fields."""
    response = await client.get("/api/engagements/ENG-FR-001/charts/breakdown")
    data = response.json()

    assert len(data["items"]) > 0
    for item in data["items"]:
        assert "label" in item
        assert "value" in item
        assert "percentage" in item
        assert "color" in item


@pytest.mark.asyncio
async def test_get_breakdown_chart_percentages_sum_to_100(client):
    """Test that breakdown percentages sum to approximately 100."""
    response = await client.get("/api/engagements/ENG-FR-001/charts/breakdown")
    data = response.json()

    total_pct = sum(item["percentage"] for item in data["items"])
    assert 99.9 <= total_pct <= 100.1  # Allow small rounding error


@pytest.mark.asyncio
async def test_get_breakdown_chart_returns_404_for_invalid_id(client):
    """Test that breakdown chart returns 404 for invalid engagement."""
    response = await client.get("/api/engagements/ENG-XX-999/charts/breakdown")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_chart_endpoints_work_for_all_engagements(client):
    """Test that all chart endpoints work for all demo engagements."""
    engagement_ids = ["ENG-FR-001", "ENG-DE-001", "ENG-NL-001", "ENG-BE-001", "ENG-LU-001"]

    for eng_id in engagement_ids:
        # Test assets chart
        response = await client.get(f"/api/engagements/{eng_id}/charts/assets")
        assert response.status_code == 200, f"Assets chart failed for {eng_id}"

        # Test comparison chart
        response = await client.get(f"/api/engagements/{eng_id}/charts/comparison")
        assert response.status_code == 200, f"Comparison chart failed for {eng_id}"

        # Test breakdown chart
        response = await client.get(f"/api/engagements/{eng_id}/charts/breakdown")
        assert response.status_code == 200, f"Breakdown chart failed for {eng_id}"


# =============================================================================
# Gantt Chart API Endpoint Tests
# =============================================================================


@pytest.mark.asyncio
async def test_get_gantt_chart_returns_200(client):
    """Test that GET /api/dashboard/gantt returns 200."""
    response = await client.get("/api/dashboard/gantt")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_gantt_chart_has_correct_structure(client):
    """Test that Gantt chart response has correct structure."""
    response = await client.get("/api/dashboard/gantt")
    data = response.json()

    assert "items" in data
    assert "min_date" in data
    assert "max_date" in data
    assert "total_engagements" in data


@pytest.mark.asyncio
async def test_get_gantt_chart_has_all_engagements(client):
    """Test that Gantt chart includes all 5 demo engagements."""
    response = await client.get("/api/dashboard/gantt")
    data = response.json()

    assert data["total_engagements"] == 5
    assert len(data["items"]) == 5

    # Check all engagement IDs are present
    engagement_ids = [item["engagement_id"] for item in data["items"]]
    assert "ENG-FR-001" in engagement_ids
    assert "ENG-DE-001" in engagement_ids
    assert "ENG-NL-001" in engagement_ids
    assert "ENG-BE-001" in engagement_ids
    assert "ENG-LU-001" in engagement_ids


@pytest.mark.asyncio
async def test_get_gantt_chart_items_have_required_fields(client):
    """Test that Gantt chart items have all required fields."""
    response = await client.get("/api/dashboard/gantt")
    data = response.json()

    for item in data["items"]:
        assert "engagement_id" in item
        assert "entity_name" in item
        assert "start_date" in item
        assert "due_date" in item
        assert "completion_percent" in item
        assert "risk_level" in item
        assert "status" in item
        assert "color" in item


@pytest.mark.asyncio
async def test_get_gantt_chart_dates_are_valid_format(client):
    """Test that Gantt chart dates are in YYYY-MM-DD format."""
    response = await client.get("/api/dashboard/gantt")
    data = response.json()

    import re
    date_pattern = r"^\d{4}-\d{2}-\d{2}$"

    assert re.match(date_pattern, data["min_date"])
    assert re.match(date_pattern, data["max_date"])

    for item in data["items"]:
        assert re.match(date_pattern, item["start_date"])
        assert re.match(date_pattern, item["due_date"])


@pytest.mark.asyncio
async def test_get_gantt_chart_risk_colors_are_correct(client):
    """Test that Gantt chart uses correct colors for risk levels."""
    response = await client.get("/api/dashboard/gantt")
    data = response.json()

    risk_colors = {
        "high": "#EF4444",
        "medium": "#F59E0B",
        "low": "#10B981",
    }

    for item in data["items"]:
        expected_color = risk_colors.get(item["risk_level"])
        if expected_color:
            assert item["color"] == expected_color, f"Wrong color for {item['risk_level']}"


@pytest.mark.asyncio
async def test_get_gantt_chart_completion_percent_is_valid(client):
    """Test that completion percentages are between 0 and 100."""
    response = await client.get("/api/dashboard/gantt")
    data = response.json()

    for item in data["items"]:
        assert 0 <= item["completion_percent"] <= 100


@pytest.mark.asyncio
async def test_get_gantt_chart_items_sorted_by_start_date(client):
    """Test that Gantt chart items are sorted by start date."""
    response = await client.get("/api/dashboard/gantt")
    data = response.json()

    if len(data["items"]) > 1:
        for i in range(len(data["items"]) - 1):
            assert data["items"][i]["start_date"] <= data["items"][i + 1]["start_date"]
