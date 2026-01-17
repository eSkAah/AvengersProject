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


@pytest.mark.asyncio
async def test_health_endpoint_returns_200(client):
    """Test that health endpoint returns 200 OK."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_endpoint_returns_healthy_status(client):
    """Test that health endpoint returns healthy status."""
    response = await client.get("/api/v1/health")
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "Star-Eyes"
    assert "version" in data
    assert "database_status" in data


@pytest.mark.asyncio
async def test_health_endpoint_includes_timestamp(client):
    """Test that health response includes timestamp."""
    response = await client.get("/api/v1/health")
    data = response.json()
    assert "timestamp" in data
