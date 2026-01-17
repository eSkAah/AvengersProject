# Story 4.1: API Upload Document

Status: done

## Story

As a **frontend developer**,
I want **an API endpoint to upload documents with multipart/form-data**,
so that **users can add new documents to engagements with proper validation and storage**.

## Acceptance Criteria

1. **AC1:** POST /api/documents/upload accepts multipart/form-data with file and engagement_id
2. **AC2:** Validates file formats: xlsx, xls, pdf, csv only
3. **AC3:** Enforces file size limit of 10MB maximum
4. **AC4:** Stores file in ./uploads/{engagement_id}/ directory structure
5. **AC5:** Returns created document with status "uploaded" and all metadata
6. **AC6:** Returns appropriate error responses for invalid format, size exceeded, missing engagement
7. **AC7:** Unit tests cover success and all error cases

## Tasks / Subtasks

- [x] **Task 1: Create Upload Schema** (AC: 1, 5)
  - [x] Add `DocumentUploadResponse` schema in `app/schemas/document.py`
  - [x] Include all document metadata fields plus upload-specific info
  - [x] Add `UploadError` schema for error responses

- [x] **Task 2: Create Upload Service** (AC: 2, 3, 4, 5, 6)
  - [x] Add upload functions to `app/services/document_service.py`
  - [x] `validate_file_format(filename)` - check allowed extensions
  - [x] `validate_file_size(file)` - check 10MB limit
  - [x] `save_uploaded_file(file, engagement_id)` - store file on disk
  - [x] `create_document_from_upload(...)` - create DB record
  - [x] Create uploads directory if not exists

- [x] **Task 3: Add Upload Endpoint to Router** (AC: 1, 2, 3, 4, 5, 6)
  - [x] Add POST `/upload` endpoint to `app/routers/documents.py`
  - [x] Accept `file: UploadFile` and `engagement_id: str` (form field)
  - [x] Validate engagement exists before upload
  - [x] Call service functions for validation and storage
  - [x] Return 400 for validation errors with clear messages
  - [x] Return 404 if engagement not found
  - [x] Add OpenAPI documentation

- [x] **Task 4: Configure Upload Settings** (AC: 3)
  - [x] Add `MAX_UPLOAD_SIZE` and `ALLOWED_EXTENSIONS` to `app/core/config.py`
  - [x] Ensure UPLOAD_DIR is created on startup in `app/main.py`

- [x] **Task 5: Write Unit Tests** (AC: 7)
  - [x] Create upload tests in `tests/test_documents.py`
  - [x] Test successful upload with valid file
  - [x] Test 400 for invalid file format
  - [x] Test 400 for file too large
  - [x] Test 404 for non-existent engagement
  - [x] Test file is actually stored on disk
  - [x] Test document record created in database

## Dev Notes

### Architecture Patterns to Follow

**Backend Structure (from ARCHITECTURE.md Section 4.1):**
```
app/
├── routers/documents.py    # Add POST /upload endpoint
├── services/document_service.py  # Add upload logic
├── schemas/document.py     # Add upload response schema
├── core/config.py          # Add upload settings
└── main.py                 # Ensure uploads dir created
```

**Async Pattern (CRITICAL - from previous story):**
- Use `async_session_maker` for database sessions
- All DB operations must use `await`
- Use `AsyncSession` type hints
- **CRITICAL:** Use `Optional[]`, `List[]`, `Dict[]` for Python 3.9 compatibility (NOT `type | None`)

### Previous Story Intelligence

From story 3-1-api-documents-crud:
- **Python 3.9 Compatibility:** CRITICAL - use `Optional[type]` not `type | None`, use `List[str]` not `list[str]`
- **Testing Pattern:** Use `pytest-asyncio`, `httpx.AsyncClient` with `ASGITransport`
- **Schema Pattern:** Use `model_config = ConfigDict(from_attributes=True)` for ORM conversion
- **Router Registration:** Already registered at `/api/documents`, just add new endpoint
- **Service Pattern:** Functions in `document_service.py` with proper async/await
- **Enum imports:** Import `DocumentStatus`, `DocumentType` from `app.models.document`

### Code Review Fixes Applied to Previous Story

1. **Path Traversal Protection** - Always validate paths are within UPLOAD_DIR using `.resolve()` and `startswith()`
2. **No deprecated `example` in Query** - Use description only or `examples` dict
3. **No duplicate enums** - Import from models, don't redefine in schemas
4. **Use `datetime.now(timezone.utc)`** - Not deprecated `datetime.utcnow()`
5. **Pagination support** - Include skip/limit for list endpoints

### Upload Endpoint Pattern

```python
from fastapi import UploadFile, File, Form, HTTPException, status
from pathlib import Path
import uuid
import aiofiles

ALLOWED_EXTENSIONS = {"xlsx", "xls", "pdf", "csv"}
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

@router.post(
    "/upload",
    response_model=DocumentResponse,
    summary="Upload a document",
    description="Upload a new document file to an engagement.",
    responses={
        201: {"description": "Document uploaded successfully"},
        400: {"description": "Invalid file format or size exceeded"},
        404: {"description": "Engagement not found"},
    },
)
async def upload_document(
    file: UploadFile = File(..., description="Document file to upload"),
    engagement_id: str = Form(..., description="Target engagement ID"),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    # 1. Validate engagement exists
    # 2. Validate file extension
    # 3. Validate file size
    # 4. Save file to disk
    # 5. Create document record
    # 6. Return response
```

### File Storage Pattern

```python
import aiofiles
from pathlib import Path

async def save_uploaded_file(
    file: UploadFile,
    engagement_id: str,
    upload_dir: Path = Path("./uploads"),
) -> str:
    """Save uploaded file and return relative path."""
    # Create engagement directory
    engagement_dir = upload_dir / engagement_id
    engagement_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename to avoid collisions
    file_path = engagement_dir / file.filename

    # Write file asynchronously
    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    # Return relative path for database storage
    return f"{engagement_id}/{file.filename}"
```

### Validation Pattern

```python
def validate_file_format(filename: str) -> bool:
    """Check if file extension is allowed."""
    if not filename or "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[-1].lower()
    return extension in ALLOWED_EXTENSIONS

async def validate_file_size(file: UploadFile, max_size: int = MAX_UPLOAD_SIZE) -> bool:
    """Check if file size is within limit."""
    # Read file to get size (UploadFile doesn't have size until read)
    content = await file.read()
    await file.seek(0)  # Reset for later reading
    return len(content) <= max_size
```

### Testing Pattern for File Upload

```python
import io
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_upload_document_success(client):
    """Test successful document upload."""
    # Create a mock file
    file_content = b"test content for xlsx file"
    files = {"file": ("test_ledger.xlsx", io.BytesIO(file_content), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    data = {"engagement_id": "ENG-DE-001"}

    response = await client.post("/api/documents/upload", files=files, data=data)
    assert response.status_code == 201

    data = response.json()
    assert data["name"] == "test_ledger.xlsx"
    assert data["status"] == "uploaded"
    assert data["engagement_id"] == "ENG-DE-001"

@pytest.mark.asyncio
async def test_upload_invalid_format(client):
    """Test upload with invalid file format."""
    files = {"file": ("test.exe", io.BytesIO(b"bad content"), "application/octet-stream")}
    data = {"engagement_id": "ENG-DE-001"}

    response = await client.post("/api/documents/upload", files=files, data=data)
    assert response.status_code == 400
    assert "format" in response.json()["detail"].lower()
```

### Dependencies to Add

Add to `requirements.txt`:
```
aiofiles>=23.0.0  # For async file operations
python-multipart>=0.0.6  # Already present, required for file uploads
```

### Project Structure Notes

- Upload endpoint goes in existing `app/routers/documents.py` (same router)
- Upload service functions go in existing `app/services/document_service.py`
- Config settings go in `app/core/config.py`
- Uploads directory: `./uploads/{engagement_id}/{filename}`
- Use existing Document model - no changes needed

### References

- [Source: docs/USER-STORIES.md#E4-S1] - Story requirements and acceptance criteria
- [Source: docs/ARCHITECTURE.md#Section-4] - Backend structure and patterns
- [Source: backend/app/routers/documents.py] - Existing router to extend
- [Source: backend/app/services/document_service.py] - Existing service to extend
- [Source: _bmad-output/implementation-artifacts/3-1-api-documents-crud.md] - Previous story patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 75 tests passing (41 document tests + 31 engagement tests + 3 health tests)
- 13 upload tests added covering all AC7 scenarios (including xls format)

### Completion Notes List

- All 5 tasks completed successfully
- POST /api/documents/upload endpoint implemented with multipart/form-data support
- File validation: xlsx, xls, pdf, csv only (configurable in settings)
- Size validation: 10MB max (configurable in settings)
- Path traversal protection implemented for both engagement_id and filename
- Unique filenames generated with UUID suffix to prevent overwrites
- Async file operations using aiofiles
- Upload directory auto-created on app startup
- Test cleanup fixtures added to prevent test pollution

### Code Review Fixes (2026-01-17)

**Reviewer:** Claude Opus 4.5 (adversarial code review)

**Issues Fixed (5 MEDIUM, 2 LOW):**
1. ✅ **MEDIUM - Duplicate Schema** - Removed redundant DocumentUploadResponse, now uses DocumentResponse
2. ✅ **MEDIUM - Missing xls test** - Added test_upload_document_xls_format for AC2 complete coverage
3. ✅ **MEDIUM - Memory issue** - Fixed double file read: validate_file_size now returns content, save_uploaded_file reuses it
4. ✅ **MEDIUM - Unused import** - Removed `shutil` from conftest.py
5. ✅ **LOW - Import organization** - Moved `import io` to top of test_documents.py

**Tests Added:** 1 new test (test_upload_document_xls_format)

### File List

**Created:**
- None (all changes in existing files)

**Modified:**
- `backend/app/schemas/document.py` - Added UploadErrorDetail, UploadValidationError schemas (removed duplicate DocumentUploadResponse)
- `backend/app/services/document_service.py` - validate_file_size returns content to avoid double-read, save_uploaded_file accepts content
- `backend/app/routers/documents.py` - Added POST /upload endpoint, uses DocumentResponse
- `backend/app/core/config.py` - Added upload_dir, max_upload_size, allowed_extensions settings
- `backend/app/main.py` - Added upload directory creation on startup
- `backend/requirements.txt` - Added aiofiles, python-multipart dependencies
- `backend/tests/test_documents.py` - Added 13 upload tests (incl. xls format), import io at top
- `backend/tests/conftest.py` - Added test document cleanup fixture, removed unused shutil import
