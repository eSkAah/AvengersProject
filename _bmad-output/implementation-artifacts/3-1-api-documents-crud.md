# Story 3.1: API Documents - CRUD

Status: done

## Story

As a **frontend developer**,
I want **a RESTful API to manage documents**,
so that **I can display the document library and retrieve document details for each engagement**.

## Acceptance Criteria

1. **AC1:** GET /api/documents returns a list of all documents with proper schema
2. **AC2:** GET /api/documents?engagement={id} filters documents by engagement ID
3. **AC3:** GET /api/documents/{id} returns detailed document data by ID
4. **AC4:** GET /api/documents/{id}/content returns document file for preview/download
5. **AC5:** Response format includes metadata (type, size, status, ai_summary)
6. **AC6:** Unit tests cover all endpoints with success and error cases

## Tasks / Subtasks

- [x] **Task 1: Expand Document SQLAlchemy Model** (AC: 1, 2, 3, 5)
  - [x] Review existing `app/models/document.py` placeholder
  - [x] Add missing fields if needed (file_path for storage)
  - [x] Verify relationship with Engagement model
  - [x] Ensure model exports in `app/models/__init__.py`

- [x] **Task 2: Create Document Pydantic Schemas** (AC: 5)
  - [x] Create `app/schemas/document.py`
  - [x] DocumentBase: shared fields
  - [x] DocumentCreate: for creation (if needed later)
  - [x] DocumentResponse: full response with all metadata
  - [x] DocumentListResponse: list wrapper with total count
  - [x] Export schemas in `app/schemas/__init__.py`

- [x] **Task 3: Create Document Service** (AC: 1, 2, 3, 4)
  - [x] Create `app/services/document_service.py`
  - [x] `get_all_documents()`: retrieve all documents
  - [x] `get_documents_by_engagement(engagement_id)`: filter by engagement
  - [x] `get_document_by_id(id)`: retrieve single document
  - [x] `get_document_content(id)`: return file for download/preview
  - [x] Export service in `app/services/__init__.py`

- [x] **Task 4: Create Documents Router** (AC: 1, 2, 3, 4)
  - [x] Create `app/routers/documents.py`
  - [x] GET `/` endpoint: list all documents (with optional `engagement` query param)
  - [x] GET `/{document_id}` endpoint: get single document metadata
  - [x] GET `/{document_id}/content` endpoint: download/preview file
  - [x] Add proper error handling (404 for not found)
  - [x] Add OpenAPI documentation (summary, description, responses)
  - [x] Register router in `app/main.py` with prefix `/api/documents`

- [x] **Task 5: Seed Demo Documents** (AC: 1, 2)
  - [x] Update `app/core/seed.py` to include demo documents
  - [x] Seed documents for DE, NL, BE engagements (as per PRD)
  - [x] Include varied types: general_ledger, trial_balance, tax_return, financial_statement
  - [x] Include varied statuses: uploaded, analyzing, analyzed

- [x] **Task 6: Write Unit Tests** (AC: 6)
  - [x] Create `tests/test_documents.py`
  - [x] Test GET /api/documents returns list
  - [x] Test GET /api/documents?engagement={id} returns filtered list
  - [x] Test GET /api/documents/{id} returns document
  - [x] Test GET /api/documents/{id} returns 404 for invalid ID
  - [x] Test GET /api/documents/{id}/content returns file or 404

## Dev Notes

### Architecture Patterns to Follow

**Backend Structure (from ARCHITECTURE.md Section 4.1):**
```
app/
├── models/document.py      # SQLAlchemy model (exists, expand)
├── schemas/document.py     # Pydantic schemas (create)
├── services/document_service.py  # Business logic (create)
├── routers/documents.py    # FastAPI endpoints (create)
```

**Async Pattern (from previous story):**
- Use `async_session_maker` for database sessions
- All DB operations must use `await`
- Use `AsyncSession` type hints
- Use `Optional[]`, `List[]`, `Dict[]` for Python 3.9 compatibility

**Router Pattern (follow engagements.py example):**
```python
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter(tags=["Documents"])

@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    engagement: Optional[str] = Query(None, description="Filter by engagement ID"),
    db: AsyncSession = Depends(get_db)
):
    ...
```

### Previous Story Intelligence

From story 2-1-api-engagements-crud:
- **Python 3.9 Compatibility:** CRITICAL - use `Optional[type]` not `type | None`, use `List[str]` not `list[str]`
- **Testing Pattern:** Use `pytest-asyncio`, `httpx.AsyncClient` with `ASGITransport`
- **Schema Pattern:** Use `model_config = ConfigDict(from_attributes=True)` for ORM conversion
- **Router Registration:** Add to `app/routers/__init__.py` and `app/main.py`

### Existing Document Model

The Document model already exists at `app/models/document.py`:
```python
class DocumentStatus(str, PyEnum):
    uploaded = "uploaded"
    analyzing = "analyzing"
    analyzed = "analyzed"
    error = "error"

class DocumentType(str, PyEnum):
    general_ledger = "general_ledger"
    trial_balance = "trial_balance"
    tax_return = "tax_return"
    financial_statement = "financial_statement"

class Document(Base):
    __tablename__ = "documents"
    id = Column(String(36), primary_key=True)
    engagement_id = Column(String(20), ForeignKey("engagements.id"))
    name = Column(String(255), nullable=False)
    type = Column(Enum(DocumentType))
    format = Column(String(10))  # xlsx, pdf, csv
    size_bytes = Column(Integer, default=0)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.uploaded)
    ai_summary = Column(String(1000), nullable=True)
    uploaded_at = Column(DateTime)
    engagement = relationship("Engagement", back_populates="documents")
```

**Enhancement needed:** Add `file_path` column for storing the actual file location.

### Response Schema (from USER-STORIES.md E3-S1)

```json
{
  "id": "DOC-001",
  "engagement_id": "ENG-DE-001",
  "name": "Grand_Livre_2025.xlsx",
  "type": "general_ledger",
  "format": "xlsx",
  "size_bytes": 245760,
  "status": "analyzed",
  "ai_summary": "General ledger containing 1,234 transactions for fiscal year 2025",
  "uploaded_at": "2026-01-15T10:30:00"
}
```

### Demo Documents to Seed

| Document | Engagement | Type | Status |
|----------|------------|------|--------|
| Grand_Livre_DE_2025.xlsx | ENG-DE-001 | general_ledger | analyzed |
| Balance_Generale_DE.xlsx | ENG-DE-001 | trial_balance | analyzing |
| Grand_Livre_NL_2025.xlsx | ENG-NL-001 | general_ledger | analyzed |
| Balance_Generale_NL.xlsx | ENG-NL-001 | trial_balance | analyzed |
| Declaration_Fiscale_NL.pdf | ENG-NL-001 | tax_return | analyzed |
| Bank_Statement_NL.pdf | ENG-NL-001 | financial_statement | analyzed |
| Grand_Livre_BE_2025.xlsx | ENG-BE-001 | general_ledger | uploaded |
| Balance_Generale_BE.xlsx | ENG-BE-001 | trial_balance | uploaded |

### File Content Endpoint

For `GET /api/documents/{id}/content`:
- Return `FileResponse` for actual file download
- For POC: files stored in `./uploads/{engagement_id}/{filename}`
- If file doesn't exist, return mock response or 404
- Set appropriate `media_type` based on format (xlsx, pdf, csv)

### Testing Standards

- Use `pytest` with `pytest-asyncio`
- Use `httpx.AsyncClient` for testing endpoints
- Follow pattern from `tests/test_engagements.py`
- Cover happy path and error cases

### Project Structure Notes

- Router prefix: `/api/documents` (to match frontend expectations)
- Query param for filtering: `?engagement=ENG-FR-001`
- Maintain consistency with existing patterns from engagements story
- Use async SQLAlchemy patterns from `database.py`

### References

- [Source: docs/USER-STORIES.md#E3-S1] - Story requirements and acceptance criteria
- [Source: docs/ARCHITECTURE.md#Section-4] - Backend structure and patterns
- [Source: docs/ARCHITECTURE.md#Section-4.3] - SQLAlchemy model example
- [Source: backend/app/models/document.py] - Existing Document model placeholder
- [Source: backend/app/routers/engagements.py] - Router pattern example
- [Source: backend/tests/test_engagements.py] - Testing pattern example
- [Source: _bmad-output/implementation-artifacts/2-1-api-engagements-crud.md] - Previous story learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Fixed test database setup: Added conftest.py fixture to initialize database before tests
- Ensured models are imported before Base.metadata.create_all() in main.py

### Completion Notes List

- All 6 tasks completed successfully
- 62 unit tests passing (28 document tests + 31 engagement tests + 3 health tests)
- API endpoints documented with OpenAPI schemas
- 8 demo documents seeded (2 for DE, 4 for NL, 2 for BE)
- Document content endpoint returns FileResponse or 404 if file doesn't exist

### Code Review Fixes (2026-01-17)

**Reviewer:** Claude Opus 4.5 (adversarial code review)

**Issues Fixed (6 HIGH/MEDIUM):**
1. ✅ **HIGH - Path Traversal Vulnerability** - Added path validation in `get_document_file_path()` to prevent `../` attacks
2. ✅ **MEDIUM - Deprecated Query.example** - Removed deprecated `example` param from Query
3. ✅ **MEDIUM - Duplicate Enum Definitions** - Schemas now import enums from models (DRY)
4. ✅ **MEDIUM - Unused Import** - Removed `import os` from document_service.py
5. ✅ **MEDIUM - Deprecated datetime.utcnow()** - Changed to `datetime.now(timezone.utc)`
6. ✅ **MEDIUM - Missing Pagination** - Added skip/limit params to list endpoint

**Tests Added:** 4 pagination tests (test_list_documents_includes_pagination_fields, test_list_documents_with_limit, test_list_documents_with_skip, test_list_documents_with_engagement_and_pagination)

### File List

**Created:**
- `backend/app/schemas/document.py` - Pydantic schemas (DocumentBase, DocumentCreate, DocumentResponse, DocumentListResponse, DocumentUpdate, DocumentStatus, DocumentType)
- `backend/app/services/document_service.py` - Business logic (get_all_documents, get_documents_by_engagement, get_document_by_id, get_document_content, create_document, update_document_status)
- `backend/app/routers/documents.py` - FastAPI router with GET /, GET /{id}, GET /{id}/content endpoints
- `backend/tests/test_documents.py` - 24 unit tests for documents API

**Modified:**
- `backend/app/models/document.py` - Added file_path column, updated docstring
- `backend/app/models/__init__.py` - Already exported Document (no change needed)
- `backend/app/schemas/__init__.py` - Added document schema exports
- `backend/app/services/__init__.py` - Added document service exports
- `backend/app/routers/__init__.py` - Added documents_router export
- `backend/app/main.py` - Added documents_router registration, model imports, seed_demo_documents call
- `backend/app/core/seed.py` - Added DEMO_DOCUMENTS list and seed_demo_documents function
- `backend/tests/conftest.py` - Added database setup fixture for tests

