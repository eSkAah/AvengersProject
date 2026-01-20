"""Tests for variance detection service."""

import pytest
from app.services.variance_service import (
    detect_significant_variances,
    check_engagement_variances,
    generate_variance_insights,
    get_variance_context_for_eve,
    format_currency,
    VarianceType,
    DEFAULT_VARIANCE_THRESHOLD,
)


class TestDetectSignificantVariances:
    """Tests for detect_significant_variances function."""

    def test_no_variances_when_stable(self):
        """Test no variances detected when data is stable."""
        current = {"total_assets": 1000000, "total_liabilities": 500000}
        previous = {"total_assets": 1000000, "total_liabilities": 500000}

        variances = detect_significant_variances(current, previous)

        assert len(variances) == 0

    def test_detects_increase_above_threshold(self):
        """Test variance detected when increase exceeds 15% threshold."""
        current = {"total_assets": 1200000}  # 20% increase
        previous = {"total_assets": 1000000}

        variances = detect_significant_variances(current, previous)

        assert len(variances) == 1
        assert variances[0].metric == "total_assets"
        assert variances[0].variance_type == VarianceType.INCREASE
        assert abs(variances[0].variance_percent - 20.0) < 0.1

    def test_detects_decrease_above_threshold(self):
        """Test variance detected when decrease exceeds 15% threshold."""
        current = {"revenue": 800000}  # 20% decrease
        previous = {"revenue": 1000000}

        variances = detect_significant_variances(current, previous)

        assert len(variances) == 1
        assert variances[0].metric == "revenue"
        assert variances[0].variance_type == VarianceType.DECREASE
        assert abs(variances[0].variance_percent - (-20.0)) < 0.1

    def test_no_variance_below_threshold(self):
        """Test no variance when change is below 15% threshold."""
        current = {"total_assets": 1100000}  # 10% increase
        previous = {"total_assets": 1000000}

        variances = detect_significant_variances(current, previous)

        assert len(variances) == 0

    def test_custom_threshold(self):
        """Test custom threshold works correctly."""
        current = {"total_assets": 1100000}  # 10% increase
        previous = {"total_assets": 1000000}

        # With 5% threshold, should detect
        variances = detect_significant_variances(current, previous, threshold=0.05)

        assert len(variances) == 1

    def test_skips_zero_previous_value(self):
        """Test that zero previous values are skipped."""
        current = {"total_assets": 1000000}
        previous = {"total_assets": 0}

        variances = detect_significant_variances(current, previous)

        assert len(variances) == 0

    def test_multiple_variances(self):
        """Test detection of multiple variances."""
        current = {
            "total_assets": 1500000,  # 50% increase
            "total_liabilities": 400000,  # 20% decrease
            "revenue": 1000000,  # stable
        }
        previous = {
            "total_assets": 1000000,
            "total_liabilities": 500000,
            "revenue": 1000000,
        }

        variances = detect_significant_variances(current, previous)

        assert len(variances) == 2
        metrics = [v.metric for v in variances]
        assert "total_assets" in metrics
        assert "total_liabilities" in metrics

    def test_insight_message_format(self):
        """Test insight message is properly formatted."""
        current = {"total_assets": 1230000}  # 23% increase
        previous = {"total_assets": 1000000}

        variances = detect_significant_variances(current, previous)

        assert len(variances) == 1
        assert "Total Assets" in variances[0].insight_message
        assert "increased" in variances[0].insight_message
        assert "23" in variances[0].insight_message


class TestCheckEngagementVariances:
    """Tests for check_engagement_variances function."""

    def test_handles_none_financial_data(self):
        """Test returns empty list for None financial_data."""
        variances = check_engagement_variances(None)
        assert variances == []

    def test_handles_empty_financial_data(self):
        """Test returns empty list for empty financial_data."""
        variances = check_engagement_variances({})
        assert variances == []

    def test_handles_no_previous_year(self):
        """Test returns empty list when no previous_year data."""
        financial_data = {
            "current_year": {"total_assets": 1000000}
        }
        variances = check_engagement_variances(financial_data)
        assert variances == []

    def test_handles_nested_structure(self):
        """Test handles current_year/previous_year nested structure."""
        financial_data = {
            "current_year": {"total_assets": 1500000},
            "previous_year": {"total_assets": 1000000},
        }
        variances = check_engagement_variances(financial_data)
        assert len(variances) == 1

    def test_handles_flat_structure(self):
        """Test handles flat structure (current data at root)."""
        financial_data = {
            "total_assets": 1500000,
            "previous_year": {"total_assets": 1000000},
        }
        # When no current_year key, uses root as current
        variances = check_engagement_variances(financial_data)
        assert len(variances) == 1


class TestGenerateVarianceInsights:
    """Tests for generate_variance_insights function."""

    def test_generates_insights(self):
        """Test generates insight messages."""
        current = {"total_assets": 1500000}
        previous = {"total_assets": 1000000}

        insights = generate_variance_insights(
            "Test Entity", current, previous
        )

        assert len(insights) == 1
        assert "Total Actifs" in insights[0]

    def test_empty_insights_for_stable_data(self):
        """Test returns empty list for stable data."""
        current = {"total_assets": 1000000}
        previous = {"total_assets": 1000000}

        insights = generate_variance_insights(
            "Test Entity", current, previous
        )

        assert len(insights) == 0


class TestGetVarianceContextForEve:
    """Tests for get_variance_context_for_eve function."""

    def test_returns_empty_for_no_variances(self):
        """Test returns empty string when no variances."""
        context = get_variance_context_for_eve("Test Entity", [])
        assert context == ""

    def test_includes_entity_name(self):
        """Test context includes entity name."""
        from app.services.variance_service import VarianceAlert

        variances = [
            VarianceAlert(
                metric="total_assets",
                metric_label="Total Actifs",
                current_value=1500000,
                previous_value=1000000,
                variance_percent=50.0,
                variance_type=VarianceType.INCREASE,
                insight_message="Test insight",
            )
        ]

        context = get_variance_context_for_eve("France SPV", variances)

        assert "France SPV" in context
        assert "Total Actifs" in context
        assert "↑" in context


class TestFormatCurrency:
    """Tests for format_currency helper function."""

    def test_formats_millions(self):
        """Test formats millions correctly."""
        result = format_currency(1500000)
        assert "1.5M€" in result

    def test_formats_thousands(self):
        """Test formats thousands correctly."""
        result = format_currency(1500)
        assert "1.5k€" in result

    def test_formats_small_values(self):
        """Test formats small values correctly."""
        result = format_currency(500)
        assert "500€" in result
