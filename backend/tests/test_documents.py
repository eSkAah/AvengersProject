"""Unit tests for Documents API endpoints."""

import io

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest_asyncio.fixture
async def client():
    """Async test client fixture."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


# =============================================================================
# API Endpoint Tests - List Documents
# =============================================================================


@pytest.mark.asyncio
async def test_list_documents_returns_200(client):
    """Test that GET /api/documents returns 200 OK."""
    response = await client.get("/api/documents/")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_documents_returns_correct_structure(client):
    """Test that documents list response has correct structure."""
    response = await client.get("/api/documents/")
    data = response.json()

    assert "total" in data
    assert "documents" in data
    assert isinstance(data["total"], int)
    assert isinstance(data["documents"], list)


@pytest.mark.asyncio
async def test_list_documents_returns_seeded_data(client):
    """Test that documents list contains seeded demo data."""
    response = await client.get("/api/documents/")
    data = response.json()

    # We seeded at least 8 demo documents (may have more from test uploads)
    assert data["total"] >= 8
    assert len(data["documents"]) >= 8


@pytest.mark.asyncio
async def test_document_has_required_fields(client):
    """Test that each document has all required fields."""
    response = await client.get("/api/documents/")
    data = response.json()

    required_fields = [
        "id",
        "engagement_ids",
        "name",
        "type",
        "format",
        "size_bytes",
        "status",
        "ai_summary",
        "file_path",
        "uploaded_at",
    ]

    for document in data["documents"]:
        for field in required_fields:
            assert field in document, f"Missing field: {field}"


# =============================================================================
# API Endpoint Tests - Filter by Engagement
# =============================================================================


@pytest.mark.asyncio
async def test_filter_documents_by_engagement_de(client):
    """Test filtering documents by Germany engagement ID."""
    response = await client.get("/api/documents/?engagement=ENG-DE-001")
    data = response.json()

    assert response.status_code == 200
    assert data["total"] == 2
    for doc in data["documents"]:
        assert "ENG-DE-001" in doc["engagement_ids"]


@pytest.mark.asyncio
async def test_filter_documents_by_engagement_nl(client):
    """Test filtering documents by Netherlands engagement ID."""
    response = await client.get("/api/documents/?engagement=ENG-NL-001")
    data = response.json()

    assert response.status_code == 200
    assert data["total"] == 4
    for doc in data["documents"]:
        assert "ENG-NL-001" in doc["engagement_ids"]


@pytest.mark.asyncio
async def test_filter_documents_by_engagement_be(client):
    """Test filtering documents by Belgium engagement ID."""
    response = await client.get("/api/documents/?engagement=ENG-BE-001")
    data = response.json()

    assert response.status_code == 200
    assert data["total"] == 2
    for doc in data["documents"]:
        assert "ENG-BE-001" in doc["engagement_ids"]


@pytest.mark.asyncio
async def test_filter_documents_by_nonexistent_engagement(client):
    """Test filtering by non-existent engagement returns empty list."""
    response = await client.get("/api/documents/?engagement=ENG-XX-999")
    data = response.json()

    assert response.status_code == 200
    assert data["total"] == 0
    assert data["documents"] == []


# =============================================================================
# API Endpoint Tests - Get Document by ID
# =============================================================================


@pytest.mark.asyncio
async def test_get_document_by_id_returns_200(client):
    """Test that GET /api/documents/{id} returns 200 for valid ID."""
    # First get a document ID from the list
    list_response = await client.get("/api/documents/")
    documents = list_response.json()["documents"]
    assert len(documents) > 0

    document_id = documents[0]["id"]
    response = await client.get(f"/api/documents/{document_id}")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_document_by_id_returns_correct_document(client):
    """Test that GET /api/documents/{id} returns correct document data."""
    # First get a document from the list
    list_response = await client.get("/api/documents/")
    documents = list_response.json()["documents"]
    first_doc = documents[0]

    response = await client.get(f"/api/documents/{first_doc['id']}")
    data = response.json()

    assert data["id"] == first_doc["id"]
    assert data["name"] == first_doc["name"]
    assert data["engagement_ids"] == first_doc["engagement_ids"]


@pytest.mark.asyncio
async def test_get_document_by_invalid_id_returns_404(client):
    """Test that GET /api/documents/{id} returns 404 for invalid ID."""
    response = await client.get("/api/documents/nonexistent-doc-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_document_by_invalid_id_returns_error_message(client):
    """Test that 404 response includes error detail."""
    response = await client.get("/api/documents/nonexistent-doc-id")
    data = response.json()

    assert "detail" in data
    assert "nonexistent-doc-id" in data["detail"]


# =============================================================================
# API Endpoint Tests - Get Document Content
# =============================================================================


@pytest.mark.asyncio
async def test_get_document_content_returns_404_for_invalid_doc(client):
    """Test that GET /api/documents/{id}/content returns 404 for invalid document."""
    response = await client.get("/api/documents/nonexistent-doc-id/content")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_document_content_returns_404_when_file_missing(client):
    """Test that GET /api/documents/{id}/content returns 404 when file doesn't exist."""
    # Get list of documents and find one from seeded data (doesn't have real file)
    list_response = await client.get("/api/documents/")
    documents = list_response.json()["documents"]

    # Find a seeded document (starts with "doc-") that won't have a real file
    seeded_doc = None
    for doc in documents:
        if doc["id"].startswith("doc-"):
            seeded_doc = doc
            break

    # Skip test if no seeded documents found (all are uploaded test docs)
    if seeded_doc is None:
        return

    # Try to get content - should return 404 since seeded docs don't have real files
    response = await client.get(f"/api/documents/{seeded_doc['id']}/content")
    assert response.status_code == 404
    assert "File not found" in response.json()["detail"]


# =============================================================================
# Document Type and Status Tests
# =============================================================================


@pytest.mark.asyncio
async def test_documents_have_valid_status_values(client):
    """Test that all documents have valid status values."""
    response = await client.get("/api/documents/")
    data = response.json()

    valid_statuses = ["uploaded", "analyzing", "analyzed", "error"]
    for document in data["documents"]:
        assert document["status"] in valid_statuses


@pytest.mark.asyncio
async def test_documents_have_valid_type_values(client):
    """Test that documents with type have valid type values."""
    response = await client.get("/api/documents/")
    data = response.json()

    valid_types = ["general_ledger", "trial_balance", "tax_return", "financial_statement", None]
    for document in data["documents"]:
        assert document["type"] in valid_types


@pytest.mark.asyncio
async def test_documents_have_valid_formats(client):
    """Test that all documents have valid format values."""
    response = await client.get("/api/documents/")
    data = response.json()

    valid_formats = ["xlsx", "xls", "pdf", "csv"]
    for document in data["documents"]:
        assert document["format"] in valid_formats


# =============================================================================
# Document Metadata Tests
# =============================================================================


@pytest.mark.asyncio
async def test_analyzed_documents_have_ai_summary(client):
    """Test that analyzed documents have AI summary."""
    response = await client.get("/api/documents/")
    data = response.json()

    for document in data["documents"]:
        if document["status"] == "analyzed":
            assert document["ai_summary"] is not None
            assert len(document["ai_summary"]) > 0


@pytest.mark.asyncio
async def test_uploaded_documents_have_no_ai_summary(client):
    """Test that uploaded documents don't have AI summary yet."""
    response = await client.get("/api/documents/")
    data = response.json()

    for document in data["documents"]:
        if document["status"] == "uploaded":
            assert document["ai_summary"] is None


@pytest.mark.asyncio
async def test_documents_have_positive_size(client):
    """Test that all documents have positive size_bytes."""
    response = await client.get("/api/documents/")
    data = response.json()

    for document in data["documents"]:
        assert document["size_bytes"] > 0


# =============================================================================
# Integration Tests - Cross-Entity Checks
# =============================================================================


@pytest.mark.asyncio
async def test_all_document_engagements_exist(client):
    """Test that all documents belong to valid engagements."""
    # Get all documents
    docs_response = await client.get("/api/documents/")
    documents = docs_response.json()["documents"]

    # Get all engagements
    eng_response = await client.get("/api/engagements/")
    engagements = eng_response.json()["engagements"]
    engagement_ids = {e["id"] for e in engagements}

    # Verify all document engagement_ids exist
    for doc in documents:
        for eng_id in doc["engagement_ids"]:
            assert eng_id in engagement_ids


@pytest.mark.asyncio
async def test_netherlands_engagement_has_all_documents(client):
    """Test that Netherlands (completed) engagement has all 4 required documents."""
    response = await client.get("/api/documents/?engagement=ENG-NL-001")
    data = response.json()

    assert data["total"] == 4
    doc_types = {d["type"] for d in data["documents"]}
    assert "general_ledger" in doc_types
    assert "trial_balance" in doc_types
    assert "tax_return" in doc_types
    assert "financial_statement" in doc_types


@pytest.mark.asyncio
async def test_germany_documents_match_processing_status(client):
    """Test that Germany documents match the engagement's processing status."""
    response = await client.get("/api/documents/?engagement=ENG-DE-001")
    data = response.json()

    # One analyzed, one analyzing - matches "processing" engagement status
    statuses = [d["status"] for d in data["documents"]]
    assert "analyzed" in statuses
    assert "analyzing" in statuses


@pytest.mark.asyncio
async def test_belgium_documents_match_received_status(client):
    """Test that Belgium documents match the engagement's received status."""
    response = await client.get("/api/documents/?engagement=ENG-BE-001")
    data = response.json()

    # All uploaded - matches "received" engagement status
    for doc in data["documents"]:
        assert doc["status"] == "uploaded"


# =============================================================================
# Pagination Tests
# =============================================================================


@pytest.mark.asyncio
async def test_list_documents_includes_pagination_fields(client):
    """Test that list response includes pagination metadata."""
    response = await client.get("/api/documents/")
    data = response.json()

    assert "skip" in data
    assert "limit" in data
    assert data["skip"] == 0
    assert data["limit"] == 100


@pytest.mark.asyncio
async def test_list_documents_with_limit(client):
    """Test pagination with limit parameter."""
    response = await client.get("/api/documents/?limit=3")
    data = response.json()

    assert response.status_code == 200
    assert data["limit"] == 3
    assert len(data["documents"]) == 3
    assert data["total"] >= 8  # Total reflects seeded + any test uploads


@pytest.mark.asyncio
async def test_list_documents_with_skip(client):
    """Test pagination with skip parameter."""
    # Get first page
    response1 = await client.get("/api/documents/?limit=4")
    data1 = response1.json()

    # Get second page
    response2 = await client.get("/api/documents/?skip=4&limit=4")
    data2 = response2.json()

    assert response2.status_code == 200
    assert data2["skip"] == 4
    assert len(data2["documents"]) == 4  # 8 total - 4 skipped = 4 remaining

    # Ensure no overlap between pages
    ids_page1 = {d["id"] for d in data1["documents"]}
    ids_page2 = {d["id"] for d in data2["documents"]}
    assert ids_page1.isdisjoint(ids_page2)


@pytest.mark.asyncio
async def test_list_documents_with_engagement_and_pagination(client):
    """Test filtering by engagement with pagination."""
    response = await client.get("/api/documents/?engagement=ENG-NL-001&limit=2")
    data = response.json()

    assert response.status_code == 200
    assert data["total"] == 4  # NL has 4 documents
    assert len(data["documents"]) == 2  # But only 2 returned due to limit
    for doc in data["documents"]:
        assert "ENG-NL-001" in doc["engagement_ids"]


# =============================================================================
# Upload Endpoint Tests (Story 4-1)
# =============================================================================

# Import cleanup helper
from tests.conftest import register_test_document


@pytest.mark.asyncio
async def test_upload_document_success(client):
    """Test successful document upload with valid file and auto-classification."""
    file_content = b"test content for xlsx file"
    files = {
        "file": (
            "test_ledger.xlsx",
            io.BytesIO(file_content),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    }
    data = {"engagement_id": "ENG-DE-001"}

    response = await client.post("/api/documents/upload", files=files, data=data)
    assert response.status_code == 201

    result = response.json()
    register_test_document(result["id"])  # Register for cleanup

    assert result["name"] == "test_ledger.xlsx"
    # Document is auto-classified because "ledger" matches general_ledger pattern
    assert result["status"] == "analyzed"
    assert result["type"] == "general_ledger"
    assert "ENG-DE-001" in result["engagement_ids"]
    assert result["format"] == "xlsx"
    assert result["size_bytes"] == len(file_content)
    assert "ENG-DE-001" in result["file_path"]
    # AI summary contains classification info
    assert result["ai_summary"] is not None
    assert "Grand Livre" in result["ai_summary"]


@pytest.mark.asyncio
async def test_upload_document_pdf_format(client):
    """Test successful upload with PDF file format."""
    file_content = b"%PDF-1.4 test pdf content"
    files = {"file": ("annual_report.pdf", io.BytesIO(file_content), "application/pdf")}
    data = {"engagement_id": "ENG-NL-001"}

    response = await client.post("/api/documents/upload", files=files, data=data)
    assert response.status_code == 201

    result = response.json()
    register_test_document(result["id"])  # Register for cleanup

    assert result["name"] == "annual_report.pdf"
    assert result["format"] == "pdf"


@pytest.mark.asyncio
async def test_upload_document_csv_format(client):
    """Test successful upload with CSV file format."""
    file_content = b"col1,col2,col3\nval1,val2,val3"
    files = {"file": ("transactions.csv", io.BytesIO(file_content), "text/csv")}
    data = {"engagement_id": "ENG-BE-001"}

    response = await client.post("/api/documents/upload", files=files, data=data)
    assert response.status_code == 201

    result = response.json()
    register_test_document(result["id"])  # Register for cleanup

    assert result["name"] == "transactions.csv"
    assert result["format"] == "csv"


@pytest.mark.asyncio
async def test_upload_document_xls_format(client):
    """Test successful upload with legacy XLS file format (AC2 coverage) and auto-classification."""
    # XLS files start with a specific magic number (compound document header)
    # Using minimal valid-looking content for test purposes
    file_content = b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1" + b"\x00" * 100
    files = {"file": ("legacy_ledger.xls", io.BytesIO(file_content), "application/vnd.ms-excel")}
    data = {"engagement_id": "ENG-DE-001"}

    response = await client.post("/api/documents/upload", files=files, data=data)
    assert response.status_code == 201

    result = response.json()
    register_test_document(result["id"])  # Register for cleanup

    assert result["name"] == "legacy_ledger.xls"
    assert result["format"] == "xls"
    # Document is auto-classified because "ledger" matches general_ledger pattern
    assert result["status"] == "analyzed"
    assert result["type"] == "general_ledger"
    assert "ENG-DE-001" in result["engagement_ids"]


@pytest.mark.asyncio
async def test_upload_document_invalid_format(client):
    """Test upload rejection with invalid file format."""
    files = {"file": ("malware.exe", io.BytesIO(b"bad content"), "application/octet-stream")}
    data = {"engagement_id": "ENG-DE-001"}

    response = await client.post("/api/documents/upload", files=files, data=data)
    assert response.status_code == 400

    result = response.json()
    assert "error_type" in result["detail"]
    assert result["detail"]["error_type"] == "invalid_format"
    assert "exe" in result["detail"]["message"]
    assert "allowed_formats" in result["detail"]


@pytest.mark.asyncio
async def test_upload_document_invalid_format_txt(client):
    """Test upload rejection with .txt file format."""
    files = {"file": ("readme.txt", io.BytesIO(b"some text"), "text/plain")}
    data = {"engagement_id": "ENG-DE-001"}

    response = await client.post("/api/documents/upload", files=files, data=data)
    assert response.status_code == 400

    result = response.json()
    assert result["detail"]["error_type"] == "invalid_format"


@pytest.mark.asyncio
async def test_upload_document_size_exceeded(client):
    """Test upload rejection when file size exceeds 10MB limit."""
    # Create content larger than 10MB
    large_content = b"x" * (11 * 1024 * 1024)  # 11MB
    files = {"file": ("huge_file.xlsx", io.BytesIO(large_content), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    data = {"engagement_id": "ENG-DE-001"}

    response = await client.post("/api/documents/upload", files=files, data=data)
    assert response.status_code == 400

    result = response.json()
    assert result["detail"]["error_type"] == "size_exceeded"
    assert "max_size_bytes" in result["detail"]


@pytest.mark.asyncio
async def test_upload_document_engagement_not_found(client):
    """Test upload rejection when engagement doesn't exist."""
    files = {"file": ("test.xlsx", io.BytesIO(b"content"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    data = {"engagement_id": "ENG-XX-999"}

    response = await client.post("/api/documents/upload", files=files, data=data)
    assert response.status_code == 404

    result = response.json()
    assert "ENG-XX-999" in result["detail"]


@pytest.mark.asyncio
async def test_upload_document_missing_file(client):
    """Test upload rejection when no file is provided."""
    data = {"engagement_id": "ENG-DE-001"}

    response = await client.post("/api/documents/upload", data=data)
    assert response.status_code == 422  # FastAPI validation error


@pytest.mark.asyncio
async def test_upload_document_missing_engagement_id(client):
    """Test upload rejection when engagement_id is missing."""
    files = {"file": ("test.xlsx", io.BytesIO(b"content"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}

    response = await client.post("/api/documents/upload", files=files)
    assert response.status_code == 422  # FastAPI validation error


@pytest.mark.asyncio
async def test_upload_document_appears_in_list(client):
    """Test that uploaded document appears in document list."""
    # Upload a document with classifiable name to test full flow
    unique_name = "trial_balance_test.xlsx"
    files = {"file": (unique_name, io.BytesIO(b"test content"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    data = {"engagement_id": "ENG-DE-001"}

    upload_response = await client.post("/api/documents/upload", files=files, data=data)
    assert upload_response.status_code == 201
    uploaded_doc = upload_response.json()
    register_test_document(uploaded_doc["id"])  # Register for cleanup

    # Retrieve document by ID
    doc_response = await client.get(f"/api/documents/{uploaded_doc['id']}")
    assert doc_response.status_code == 200

    doc = doc_response.json()
    assert doc["id"] == uploaded_doc["id"]
    assert doc["name"] == unique_name
    # Document is auto-classified because "trial_balance" matches pattern
    assert doc["status"] == "analyzed"
    assert doc["type"] == "trial_balance"


@pytest.mark.asyncio
async def test_upload_document_file_stored_on_disk(client):
    """Test that uploaded file is actually stored on disk."""
    from pathlib import Path

    file_content = b"unique content for disk storage test"
    files = {"file": ("disk_test.xlsx", io.BytesIO(file_content), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    data = {"engagement_id": "ENG-DE-001"}

    response = await client.post("/api/documents/upload", files=files, data=data)
    assert response.status_code == 201

    result = response.json()
    register_test_document(result["id"])  # Register for cleanup

    file_path = Path("./uploads") / result["file_path"]

    # Verify file exists on disk
    assert file_path.exists(), f"File should exist at {file_path}"

    # Verify content matches
    with open(file_path, "rb") as f:
        stored_content = f.read()
    assert stored_content == file_content


@pytest.mark.asyncio
async def test_upload_document_unique_filenames(client):
    """Test that multiple uploads of same filename create unique files."""
    filename = "duplicate_name.xlsx"
    files1 = {"file": (filename, io.BytesIO(b"content 1"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    files2 = {"file": (filename, io.BytesIO(b"content 2"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    data = {"engagement_id": "ENG-DE-001"}

    response1 = await client.post("/api/documents/upload", files=files1, data=data)
    response2 = await client.post("/api/documents/upload", files=files2, data=data)

    assert response1.status_code == 201
    assert response2.status_code == 201

    result1 = response1.json()
    result2 = response2.json()
    register_test_document(result1["id"])  # Register for cleanup
    register_test_document(result2["id"])  # Register for cleanup

    # Both should have original filename as name
    assert result1["name"] == filename
    assert result2["name"] == filename

    # But file_path should be different (unique)
    assert result1["file_path"] != result2["file_path"]
    assert result1["id"] != result2["id"]
