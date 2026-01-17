"""Unit tests for Documents API endpoints."""

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

    # We seeded 8 demo documents
    assert data["total"] == 8
    assert len(data["documents"]) == 8


@pytest.mark.asyncio
async def test_document_has_required_fields(client):
    """Test that each document has all required fields."""
    response = await client.get("/api/documents/")
    data = response.json()

    required_fields = [
        "id",
        "engagement_id",
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
        assert doc["engagement_id"] == "ENG-DE-001"


@pytest.mark.asyncio
async def test_filter_documents_by_engagement_nl(client):
    """Test filtering documents by Netherlands engagement ID."""
    response = await client.get("/api/documents/?engagement=ENG-NL-001")
    data = response.json()

    assert response.status_code == 200
    assert data["total"] == 4
    for doc in data["documents"]:
        assert doc["engagement_id"] == "ENG-NL-001"


@pytest.mark.asyncio
async def test_filter_documents_by_engagement_be(client):
    """Test filtering documents by Belgium engagement ID."""
    response = await client.get("/api/documents/?engagement=ENG-BE-001")
    data = response.json()

    assert response.status_code == 200
    assert data["total"] == 2
    for doc in data["documents"]:
        assert doc["engagement_id"] == "ENG-BE-001"


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
    assert data["engagement_id"] == first_doc["engagement_id"]


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
    # Get a valid document ID
    list_response = await client.get("/api/documents/")
    documents = list_response.json()["documents"]
    document_id = documents[0]["id"]

    # Try to get content - should return 404 since file doesn't actually exist
    response = await client.get(f"/api/documents/{document_id}/content")
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
        assert doc["engagement_id"] in engagement_ids


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
