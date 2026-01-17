# Story 4.3: Classification IA Service

Status: done

## Story

As a **system**,
I want **to automatically classify uploaded documents**,
so that **they are routed to the correct engagement**.

## Acceptance Criteria

1. **AC1:** Detect document type by filename patterns (fast path)
2. **AC2:** Detect document type by content analysis (fallback)
3. **AC3:** Support types: general_ledger, trial_balance, tax_return, financial_statement
4. **AC4:** Match document to engagement by country/entity
5. **AC5:** Return confidence score with classification result
6. **AC6:** Integration with upload endpoint to auto-classify on upload

## Tasks / Subtasks

- [x] **Task 1: Create Classification Service** (AC: 1, 3, 5)
  - [x] Create `classification_service.py` in `app/services/`
  - [x] Implement `classify_by_filename(filename)` for fast path
  - [x] Define document type patterns (ledger, balance, tax, etc.)
  - [x] Return type and confidence score via ClassificationResult dataclass

- [x] **Task 2: Add Content-Based Classification** (AC: 2, 3, 5)
  - [x] Implement `classify_by_content(file_path)` for Excel files
  - [x] Check for column patterns using openpyxl
  - [x] Return type and confidence score

- [x] **Task 3: Create Engagement Matching** (AC: 4)
  - [x] Implement `match_engagement(document_type, metadata)` function
  - [x] Match by country code in filename (FR, DE, NL, BE, LU)
  - [x] Match by country name patterns (france, germany, etc.)
  - [x] Return best matching engagement ID

- [x] **Task 4: Integrate with Upload Endpoint** (AC: 6)
  - [x] Update POST /api/documents/upload to call classification
  - [x] Auto-set document type based on classification
  - [x] Update document status to "analyzed" or "analyzing"
  - [x] Set ai_summary with classification details

- [x] **Task 5: Add Unit Tests** (AC: 1-5)
  - [x] Test filename classification patterns (48 test cases)
  - [x] Test content-based classification
  - [x] Test engagement matching
  - [x] Update upload tests to expect auto-classification

## Dev Notes

### Classification Logic (from PRD Section 12.3)

```python
def classify_document(file):
    # Fast path: By filename
    if "ledger" in filename.lower() or "grand_livre" in filename.lower():
        return "general_ledger", 0.9
    if "trial" in filename.lower() or "balance" in filename.lower():
        return "trial_balance", 0.9
    if "tax" in filename.lower() or "fiscal" in filename.lower():
        return "tax_return", 0.9

    # Content analysis: Excel columns
    if has_columns(["Date", "Account", "Debit", "Credit"]):
        return "general_ledger", 0.8
    if has_columns(["Account", "Balance"]):
        return "trial_balance", 0.8

    # Default fallback
    return "unknown", 0.3
```

### Document Types

```python
DOCUMENT_TYPES = {
    "general_ledger": {
        "label": "Grand Livre",
        "patterns": ["ledger", "grand_livre", "grand livre", "gl"],
        "columns": ["Date", "Account", "Debit", "Credit"],
    },
    "trial_balance": {
        "label": "Balance Générale",
        "patterns": ["trial", "balance", "tb"],
        "columns": ["Account", "Balance"],
    },
    "tax_return": {
        "label": "Déclaration Fiscale",
        "patterns": ["tax", "fiscal", "return", "declaration"],
    },
    "financial_statement": {
        "label": "États Financiers",
        "patterns": ["financial", "statement", "bilan", "compte"],
    },
}
```

### Engagement Matching

```python
def match_engagement(doc_type, filename):
    # Extract country code from filename (e.g., "FR_ledger.xlsx" -> "FR")
    country_codes = ["FR", "DE", "NL", "BE", "LU"]
    for code in country_codes:
        if code.lower() in filename.lower():
            return get_engagement_by_country(code)
    return None
```

### References

- [Source: docs/PRD.md#Section-12.3] - Classification logic
- [Source: docs/USER-STORIES.md#E4-S3] - Story requirements
- [Source: backend/app/services/document_service.py] - Existing document service

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 123 backend tests passing
- 48 new classification tests added

### Completion Notes List

- All 5 tasks completed successfully
- Classification service with filename pattern matching
- Support for content-based classification (Excel column analysis)
- Country code extraction for engagement matching
- Confidence score returned with each classification
- Auto-classification integrated into upload endpoint
- Documents classified as "analyzed" with ai_summary

### File List

**Created:**
- `backend/app/services/classification_service.py` - Document classification service with filename/content analysis
- `backend/tests/test_classification.py` - 48 unit tests for classification

**Modified:**
- `backend/app/routers/documents.py` - Added classification integration to upload endpoint
- `backend/tests/test_documents.py` - Updated upload tests to expect auto-classification
