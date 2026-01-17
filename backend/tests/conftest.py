import asyncio
from pathlib import Path
from typing import List

import pytest

from app.core.database import engine, Base, async_session_maker
from app.core.seed import seed_demo_engagements, seed_demo_documents
# Import models to register them with Base.metadata
from app.models import Engagement, Document  # noqa: F401


# Track if database has been initialized
_db_initialized = False

# Track document IDs created during tests for cleanup
_test_document_ids: List[str] = []


@pytest.fixture(scope="session")
def anyio_backend():
    """Use asyncio backend for pytest-asyncio."""
    return "asyncio"


def _setup_database_sync():
    """Synchronous helper to set up database."""
    global _db_initialized
    if _db_initialized:
        return

    async def _init():
        # Ensure data directory exists
        data_dir = Path("./data")
        data_dir.mkdir(exist_ok=True)

        # Drop all tables and recreate for a clean slate each test session
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

        # Seed demo data
        async with async_session_maker() as session:
            await seed_demo_engagements(session)

        async with async_session_maker() as session:
            await seed_demo_documents(session)

    asyncio.get_event_loop().run_until_complete(_init())
    _db_initialized = True


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Set up the database once for all tests."""
    _setup_database_sync()
    yield


def register_test_document(doc_id: str):
    """Register a document ID for cleanup after test session."""
    _test_document_ids.append(doc_id)


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_documents():
    """Clean up any documents created during tests after all tests complete."""
    yield  # Wait for all tests to complete

    async def _cleanup():
        from sqlalchemy import delete

        if not _test_document_ids:
            return

        async with async_session_maker() as session:
            # Delete test documents from database
            await session.execute(
                delete(Document).where(Document.id.in_(_test_document_ids))
            )
            await session.commit()

        # Clean up uploaded test files
        uploads_dir = Path("./uploads")
        for engagement_dir in ["ENG-DE-001", "ENG-NL-001", "ENG-BE-001"]:
            test_dir = uploads_dir / engagement_dir
            if test_dir.exists():
                # Remove files created during tests (with UUID suffixes)
                for f in test_dir.glob("*_????????.*"):  # UUID suffix pattern
                    try:
                        f.unlink()
                    except OSError:
                        pass

    try:
        asyncio.get_event_loop().run_until_complete(_cleanup())
    except RuntimeError:
        # If no event loop, create one
        asyncio.run(_cleanup())
