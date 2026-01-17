import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, async_session_maker
from app.core.seed import seed_demo_engagements, seed_demo_documents
from app.routers import health_router, engagements_router, documents_router

# Import models to register them with Base.metadata before create_all()
from app.models import Engagement, Document  # noqa: F401

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup: Ensure data directory exists
    data_dir = Path("./data")
    data_dir.mkdir(exist_ok=True)
    logger.info("Data directory ensured: %s", data_dir.absolute())

    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

    # Seed demo data
    async with async_session_maker() as session:
        seeded = await seed_demo_engagements(session)
        if seeded > 0:
            logger.info("Seeded %d demo engagements", seeded)

    # Seed demo documents
    async with async_session_maker() as session:
        seeded_docs = await seed_demo_documents(session)
        if seeded_docs > 0:
            logger.info("Seeded %d demo documents", seeded_docs)

    yield

    # Shutdown: Dispose engine
    await engine.dispose()
    logger.info("Database engine disposed")


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware for Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with API versioning
app.include_router(health_router, prefix="/api/v1")

# Engagements API (matches frontend expectations at /api/engagements)
app.include_router(engagements_router, prefix="/api/engagements")

# Documents API (matches frontend expectations at /api/documents)
app.include_router(documents_router, prefix="/api/documents")
