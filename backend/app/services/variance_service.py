"""Variance detection service for N vs N-1 financial comparisons."""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional


class VarianceType(str, Enum):
    """Type of financial variance."""

    INCREASE = "increase"
    DECREASE = "decrease"


@dataclass
class VarianceAlert:
    """Represents a significant variance detected between N and N-1."""

    metric: str
    metric_label: str
    current_value: float
    previous_value: float
    variance_percent: float
    variance_type: VarianceType
    insight_message: str

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "metric": self.metric,
            "metric_label": self.metric_label,
            "current_value": self.current_value,
            "previous_value": self.previous_value,
            "variance_percent": self.variance_percent,
            "variance_type": self.variance_type.value,
            "insight_message": self.insight_message,
        }


# Metric display labels
METRIC_LABELS = {
    "total_assets": "Total Assets",
    "total_liabilities": "Total Liabilities",
    "equity": "Equity",
    "revenue": "Revenue",
    "expenses": "Expenses",
}

# Default variance threshold (15%)
DEFAULT_VARIANCE_THRESHOLD = 0.15


def detect_significant_variances(
    current_year: Dict[str, Any],
    previous_year: Dict[str, Any],
    threshold: float = DEFAULT_VARIANCE_THRESHOLD,
) -> List[VarianceAlert]:
    """
    Detect significant variances between N and N-1 financial data.

    Args:
        current_year: Current year financial data
        previous_year: Previous year financial data
        threshold: Variance threshold (default 15%)

    Returns:
        List of VarianceAlert for variances exceeding threshold
    """
    variances: List[VarianceAlert] = []

    metrics_to_check = ["total_assets", "total_liabilities", "equity", "revenue", "expenses"]

    for metric in metrics_to_check:
        current = current_year.get(metric, 0)
        previous = previous_year.get(metric, 0)

        # Skip if no previous year data
        if previous == 0:
            continue

        # Calculate variance percentage
        variance_pct = (current - previous) / abs(previous)

        # Check if exceeds threshold
        if abs(variance_pct) > threshold:
            variance_type = VarianceType.INCREASE if variance_pct > 0 else VarianceType.DECREASE
            metric_label = METRIC_LABELS.get(metric, metric)

            # Generate insight message
            direction = "increased" if variance_pct > 0 else "decreased"
            insight_message = (
                f"⚠️ Significant variance: {metric_label} {direction} by "
                f"{abs(variance_pct) * 100:.1f}% vs prior year "
                f"({format_currency(previous)} → {format_currency(current)})"
            )

            variances.append(VarianceAlert(
                metric=metric,
                metric_label=metric_label,
                current_value=current,
                previous_value=previous,
                variance_percent=round(variance_pct * 100, 1),
                variance_type=variance_type,
                insight_message=insight_message,
            ))

    return variances


def format_currency(value: float) -> str:
    """Format a value as currency (millions)."""
    if abs(value) >= 1_000_000:
        return f"{value / 1_000_000:.1f}M€"
    elif abs(value) >= 1_000:
        return f"{value / 1_000:.1f}k€"
    else:
        return f"{value:,.0f}€"


def generate_variance_insights(
    engagement_name: str,
    current_year: Dict[str, Any],
    previous_year: Dict[str, Any],
    threshold: float = DEFAULT_VARIANCE_THRESHOLD,
) -> List[str]:
    """
    Generate human-readable variance insights for an engagement.

    Args:
        engagement_name: Name of the engagement entity
        current_year: Current year financial data
        previous_year: Previous year financial data
        threshold: Variance threshold

    Returns:
        List of insight strings to add to ai_insights
    """
    variances = detect_significant_variances(current_year, previous_year, threshold)

    insights: List[str] = []

    for variance in variances:
        insights.append(variance.insight_message)

    return insights


def get_variance_context_for_eve(
    engagement_name: str,
    variances: List[VarianceAlert],
) -> str:
    """
    Generate Eve context string for variance awareness.

    Args:
        engagement_name: Name of the engagement
        variances: List of detected variances

    Returns:
        Context string for Eve's system prompt
    """
    if not variances:
        return ""

    context_lines = [
        f"\n⚠️ VARIANCE ALERTS for {engagement_name}:",
    ]

    for v in variances:
        direction = "↑" if v.variance_type == VarianceType.INCREASE else "↓"
        context_lines.append(
            f"  - {v.metric_label}: {direction}{abs(v.variance_percent):.1f}% vs prior year"
        )

    context_lines.append(
        "\nMention these significant variances if the user asks questions "
        "about financial data or the status of this engagement."
    )

    return "\n".join(context_lines)


def check_engagement_variances(
    financial_data: Optional[Dict[str, Any]],
    threshold: float = DEFAULT_VARIANCE_THRESHOLD,
) -> List[VarianceAlert]:
    """
    Check an engagement's financial data for significant variances.

    Args:
        financial_data: Engagement financial data with current_year and previous_year
        threshold: Variance threshold

    Returns:
        List of VarianceAlert objects
    """
    if not financial_data:
        return []

    current_year = financial_data.get("current_year", financial_data)
    previous_year = financial_data.get("previous_year", {})

    if not previous_year:
        return []

    return detect_significant_variances(current_year, previous_year, threshold)
