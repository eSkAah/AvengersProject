"""Unit tests for the document classification service."""

import pytest
from pathlib import Path

from app.models.document import DocumentType
from app.services.classification_service import (
    classify_by_filename,
    classify_by_content,
    classify_document,
    extract_country_code,
    get_document_type_label,
)


class TestClassifyByFilename:
    """Tests for filename-based classification."""

    @pytest.mark.parametrize(
        "filename,expected_type",
        [
            # General Ledger patterns
            ("Grand_Livre_2025.xlsx", DocumentType.general_ledger),
            ("ledger_FR_2025.xlsx", DocumentType.general_ledger),
            ("general_ledger_report.pdf", DocumentType.general_ledger),
            ("livre_comptable.csv", DocumentType.general_ledger),
            ("grand-livre-2025.xlsx", DocumentType.general_ledger),
            # Trial Balance patterns
            ("Trial_Balance_2025.xlsx", DocumentType.trial_balance),
            ("balance_generale.xlsx", DocumentType.trial_balance),
            ("trial-balance-Q4.xlsx", DocumentType.trial_balance),
            ("balance_comptable_Q4.pdf", DocumentType.trial_balance),
            # Tax Return patterns
            ("tax_return_2025.pdf", DocumentType.tax_return),
            ("declaration_fiscale.xlsx", DocumentType.tax_return),
            ("fiscal_report.csv", DocumentType.tax_return),
            # Financial Statement patterns
            ("financial_statement_2025.xlsx", DocumentType.financial_statement),
            ("etats_financiers.pdf", DocumentType.financial_statement),
            ("bilan_2025.xlsx", DocumentType.financial_statement),
            ("compte_de_resultat.pdf", DocumentType.financial_statement),
            ("P&L_Report.xlsx", DocumentType.financial_statement),
        ],
    )
    def test_classify_known_patterns(self, filename, expected_type):
        """Test classification with known filename patterns."""
        result = classify_by_filename(filename)
        assert result.document_type == expected_type
        assert result.confidence == 0.9
        assert result.method == "filename"

    @pytest.mark.parametrize(
        "filename",
        [
            "random_document.xlsx",
            "report_2025.pdf",
            "data.csv",
            "summary.xlsx",
            "",
            None,
        ],
    )
    def test_classify_unknown_patterns(self, filename):
        """Test classification with unknown filename patterns."""
        result = classify_by_filename(filename or "")
        assert result.document_type is None
        assert result.confidence == 0.0
        assert result.method == "unknown"

    def test_case_insensitivity(self):
        """Test that classification is case-insensitive."""
        result_upper = classify_by_filename("GRAND_LIVRE_2025.XLSX")
        result_lower = classify_by_filename("grand_livre_2025.xlsx")
        result_mixed = classify_by_filename("Grand_Livre_2025.Xlsx")

        assert result_upper.document_type == DocumentType.general_ledger
        assert result_lower.document_type == DocumentType.general_ledger
        assert result_mixed.document_type == DocumentType.general_ledger


class TestExtractCountryCode:
    """Tests for country code extraction from filenames."""

    @pytest.mark.parametrize(
        "filename,expected_code",
        [
            # Explicit country codes at start
            ("FR_ledger_2025.xlsx", "FR"),
            ("DE_trial_balance.pdf", "DE"),
            ("NL-balance.xlsx", "NL"),
            # Country codes in middle
            ("ledger_FR_2025.xlsx", "FR"),
            ("report-DE-Q4.pdf", "DE"),
            # Country codes before extension
            ("balance_BE.xlsx", "BE"),
            ("report_LU.pdf", "LU"),
            # Country names
            ("ledger_france_2025.xlsx", "FR"),
            ("germany_financial.pdf", "DE"),
            ("netherlands_tb.xlsx", "NL"),
            ("belgique_report.pdf", "BE"),
            ("luxembourg_bilan.xlsx", "LU"),
        ],
    )
    def test_extract_country_code_success(self, filename, expected_code):
        """Test successful country code extraction."""
        result = extract_country_code(filename)
        assert result == expected_code

    @pytest.mark.parametrize(
        "filename",
        [
            "ledger_2025.xlsx",
            "trial_balance.pdf",
            "random_document.csv",
            "",
            None,
        ],
    )
    def test_extract_country_code_not_found(self, filename):
        """Test when no country code is found."""
        result = extract_country_code(filename or "")
        assert result is None


class TestClassifyDocument:
    """Tests for the main classification function."""

    def test_classify_with_known_filename(self):
        """Test classification with known filename pattern."""
        result = classify_document("Grand_Livre_FR_2025.xlsx")
        assert result.document_type == DocumentType.general_ledger
        assert result.confidence == 0.9
        assert result.method == "filename"

    def test_classify_with_unknown_filename(self):
        """Test classification with unknown filename pattern."""
        result = classify_document("random_document.xlsx")
        assert result.document_type is None
        assert result.confidence == 0.0
        assert result.method == "unknown"


class TestGetDocumentTypeLabel:
    """Tests for document type label retrieval."""

    @pytest.mark.parametrize(
        "doc_type,expected_label",
        [
            (DocumentType.general_ledger, "General Ledger"),
            (DocumentType.trial_balance, "Trial Balance"),
            (DocumentType.tax_return, "Tax Return"),
            (DocumentType.financial_statement, "Financial Statements"),
            (None, "Unclassified Document"),
        ],
    )
    def test_get_document_type_label(self, doc_type, expected_label):
        """Test getting human-readable labels for document types."""
        label = get_document_type_label(doc_type)
        assert label == expected_label
