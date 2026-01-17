import asyncio
from pathlib import Path

import pytest

from app.core.database import engine, Base, async_session_maker
from app.core.seed import seed_demo_engagements, seed_demo_documents
# Import models to register them with Base.metadata
from app.models import Engagement, Document  # noqa: F401


# Track if database has been initialized
_db_initialized = False


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

        # Create all tables
        async with engine.begin() as conn:
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
