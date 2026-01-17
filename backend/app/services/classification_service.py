"""Document classification service for Avengers Project platform.

This service provides automatic document classification based on:
1. Filename patterns (fast path, high confidence)
2. Content analysis for Excel files (fallback, medium confidence)
"""

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, List, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import DocumentType
from app.models.engagement import Engagement


@dataclass
class ClassificationResult:
    """Result of document classification."""

    document_type: Optional[DocumentType]
    confidence: float
    method: str  # "filename", "content", "unknown"
    matched_engagement_id: Optional[str] = None
    matched_pattern: Optional[str] = None


# Document type patterns for filename-based classification
DOCUMENT_TYPE_PATTERNS = {
    DocumentType.general_ledger: {
        "label": "Grand Livre",
        "patterns": [
            r"ledger",
            r"grand[_\s-]?livre",
            r"\bgl\b",
            r"general[_\s-]?ledger",
            r"livre[_\s-]?comptable",
        ],
        "columns": ["Date", "Account", "Debit", "Credit", "Description"],
    },
    DocumentType.trial_balance: {
        "label": "Balance Générale",
        "patterns": [
            r"trial[_\s-]?balance",
            r"balance[_\s-]?g[eé]n[eé]rale",
            r"\btb\b",
            r"balance[_\s-]?comptable",
        ],
        "columns": ["Account", "Balance", "Debit", "Credit"],
    },
    DocumentType.tax_return: {
        "label": "Déclaration Fiscale",
        "patterns": [
            r"tax[_\s-]?return",
            r"fiscal",
            r"declaration[_\s-]?fiscale",
            r"impot",
            r"tax[_\s-]?form",
        ],
        "columns": [],
    },
    DocumentType.financial_statement: {
        "label": "États Financiers",
        "patterns": [
            r"financial[_\s-]?statement",
            r"[eé]tats?[_\s-]?financiers?",
            r"bilan",
            r"compte[_\s-]?de[_\s-]?r[eé]sultat",
            r"p&l",
            r"profit[_\s-]?loss",
        ],
        "columns": ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"],
    },
}

# Country codes for engagement matching
COUNTRY_CODES = ["FR", "DE", "NL", "BE", "LU"]


def classify_by_filename(filename: str) -> ClassificationResult:
    """
    Classify document type based on filename patterns.

    Args:
        filename: Original filename of the document

    Returns:
        ClassificationResult with type, confidence, and method
    """
    if not filename:
        return ClassificationResult(
            document_type=None,
            confidence=0.0,
            method="unknown",
        )

    filename_lower = filename.lower()

    for doc_type, config in DOCUMENT_TYPE_PATTERNS.items():
        for pattern in config["patterns"]:
            if re.search(pattern, filename_lower):
                return ClassificationResult(
                    document_type=doc_type,
                    confidence=0.9,
                    method="filename",
                    matched_pattern=pattern,
                )

    return ClassificationResult(
        document_type=None,
        confidence=0.0,
        method="unknown",
    )


def classify_by_content(
    file_path: Path,
    file_content: Optional[bytes] = None,
) -> ClassificationResult:
    """
    Classify document type based on content analysis.

    Currently supports Excel files (.xlsx, .xls) by checking column headers.

    Args:
        file_path: Path to the file
        file_content: Optional file content if already read

    Returns:
        ClassificationResult with type, confidence, and method
    """
    extension = file_path.suffix.lower()

    # Only analyze Excel files for now
    if extension not in [".xlsx", ".xls"]:
        return ClassificationResult(
            document_type=None,
            confidence=0.0,
            method="unknown",
        )

    try:
        # Try to read Excel headers
        import openpyxl

        if file_content:
            from io import BytesIO
            workbook = openpyxl.load_workbook(BytesIO(file_content), read_only=True)
        else:
            workbook = openpyxl.load_workbook(file_path, read_only=True)

        sheet = workbook.active
        if sheet is None:
            return ClassificationResult(
                document_type=None,
                confidence=0.0,
                method="unknown",
            )

        # Get headers from first row
        headers = []
        for cell in sheet[1]:
            if cell.value:
                headers.append(str(cell.value).strip().lower())

        workbook.close()

        # Match headers against document type patterns
        for doc_type, config in DOCUMENT_TYPE_PATTERNS.items():
            expected_columns = [col.lower() for col in config.get("columns", [])]
            if not expected_columns:
                continue

            # Check if at least 2 expected columns are present
            matches = sum(1 for col in expected_columns if any(col in h for h in headers))
            if matches >= 2:
                confidence = min(0.8, 0.4 + (matches * 0.2))
                return ClassificationResult(
                    document_type=doc_type,
                    confidence=confidence,
                    method="content",
                    matched_pattern=f"columns: {matches} matches",
                )

    except ImportError:
        # openpyxl not installed - skip content analysis
        pass
    except Exception:
        # File parsing error - skip content analysis
        pass

    return ClassificationResult(
        document_type=None,
        confidence=0.0,
        method="unknown",
    )


def classify_document(
    filename: str,
    file_path: Optional[Path] = None,
    file_content: Optional[bytes] = None,
) -> ClassificationResult:
    """
    Classify a document using all available methods.

    Priority:
    1. Filename patterns (fast, high confidence)
    2. Content analysis (slower, medium confidence)
    3. Unknown (no classification)

    Args:
        filename: Original filename
        file_path: Path to the file for content analysis
        file_content: Optional file content if already read

    Returns:
        Best ClassificationResult from available methods
    """
    # Try filename first (fast path)
    result = classify_by_filename(filename)
    if result.document_type is not None:
        return result

    # Try content analysis (fallback)
    if file_path is not None or file_content is not None:
        result = classify_by_content(
            file_path or Path(filename),
            file_content,
        )
        if result.document_type is not None:
            return result

    # No classification possible
    return ClassificationResult(
        document_type=None,
        confidence=0.0,
        method="unknown",
    )


def extract_country_code(filename: str) -> Optional[str]:
    """
    Extract country code from filename.

    Examples:
        "FR_ledger_2024.xlsx" -> "FR"
        "ledger_france.xlsx" -> "FR"
        "DE_trial_balance.xlsx" -> "DE"

    Args:
        filename: Original filename

    Returns:
        Country code if found, None otherwise
    """
    if not filename:
        return None

    filename_upper = filename.upper()

    # Check for explicit country codes (e.g., "FR_", "_FR_", "-FR-")
    for code in COUNTRY_CODES:
        patterns = [
            rf"^{code}[_\-]",  # At start
            rf"[_\-]{code}[_\-]",  # In middle
            rf"[_\-]{code}\.",  # Before extension
        ]
        for pattern in patterns:
            if re.search(pattern, filename_upper):
                return code

    # Check for country names
    country_names = {
        "FRANCE": "FR",
        "GERMANY": "DE",
        "DEUTSCHLAND": "DE",
        "NETHERLANDS": "NL",
        "BELGIUM": "BE",
        "BELGIQUE": "BE",
        "LUXEMBOURG": "LU",
    }
    for name, code in country_names.items():
        if name in filename_upper:
            return code

    return None


async def match_engagement(
    db: AsyncSession,
    document_type: Optional[DocumentType],
    filename: str,
) -> Optional[str]:
    """
    Find the best matching engagement for a document.

    Matching logic:
    1. Extract country code from filename
    2. Match engagement by country
    3. Return engagement ID if found

    Args:
        db: Async database session
        document_type: Classified document type
        filename: Original filename

    Returns:
        Engagement ID if match found, None otherwise
    """
    country_code = extract_country_code(filename)

    if country_code:
        # Find engagement by country
        result = await db.execute(
            select(Engagement.id)
            .where(Engagement.country == country_code)
            .limit(1)
        )
        engagement_id = result.scalar_one_or_none()
        if engagement_id:
            return engagement_id

    return None


async def classify_and_match(
    db: AsyncSession,
    filename: str,
    file_path: Optional[Path] = None,
    file_content: Optional[bytes] = None,
) -> ClassificationResult:
    """
    Classify document and match to engagement.

    This is the main entry point for the classification service.

    Args:
        db: Async database session
        filename: Original filename
        file_path: Path to the file for content analysis
        file_content: Optional file content if already read

    Returns:
        ClassificationResult with type, confidence, and matched engagement
    """
    # Classify the document
    result = classify_document(filename, file_path, file_content)

    # Try to match engagement
    engagement_id = await match_engagement(db, result.document_type, filename)
    result.matched_engagement_id = engagement_id

    return result


def get_document_type_label(doc_type: Optional[DocumentType]) -> str:
    """
    Get human-readable label for a document type.

    Args:
        doc_type: Document type enum value

    Returns:
        French label for the document type
    """
    if doc_type is None:
        return "Document non classé"

    config = DOCUMENT_TYPE_PATTERNS.get(doc_type)
    if config:
        return config["label"]

    return doc_type.value.replace("_", " ").title()
