"""Demo data seeding for Avengers Project platform."""

import logging
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.engagement import Engagement, StatusEnum, RiskLevel
from app.models.document import Document, DocumentStatus, DocumentType

logger = logging.getLogger(__name__)

# Demo engagements data as specified in the story
DEMO_ENGAGEMENTS = [
    {
        "id": "ENG-FR-001",
        "entity_name": "France SPV",
        "country_code": "FR",
        "country_name": "France",
        "service_type": "Corporate Tax",
        "status": StatusEnum.waiting,
        "risk_level": RiskLevel.high,
        "due_date": date(2026, 3, 1),
        "predicted_completion": date(2026, 2, 25),
        "completion_percent": 67,
        "documents_required": ["General Ledger", "Trial Balance"],
        "financial_data": {
            "total_assets": 15400000,
            "total_liabilities": 8200000,
            "equity": 7200000,
            "revenue": 12500000,
            "expenses": 9800000,
        },
        "ai_insights": [],
    },
    {
        "id": "ENG-DE-001",
        "entity_name": "Germany PropCo",
        "country_code": "DE",
        "country_name": "Germany",
        "service_type": "Corporate Tax",
        "status": StatusEnum.processing,
        "risk_level": RiskLevel.medium,
        "due_date": date(2026, 3, 15),
        "predicted_completion": date(2026, 3, 10),
        "completion_percent": 85,
        "documents_required": ["General Ledger", "Trial Balance", "Bank Statement"],
        "financial_data": {
            "total_assets": 28500000,
            "total_liabilities": 15200000,
            "equity": 13300000,
            "revenue": 18750000,
            "expenses": 14200000,
        },
        "ai_insights": ["Revenue increased by 12% compared to previous year"],
    },
    {
        "id": "ENG-NL-001",
        "entity_name": "Netherlands BV",
        "country_code": "NL",
        "country_name": "Netherlands",
        "service_type": "Corporate Tax",
        "status": StatusEnum.completed,
        "risk_level": RiskLevel.low,
        "due_date": date(2026, 2, 1),
        "predicted_completion": date(2026, 1, 28),
        "completion_percent": 100,
        "documents_required": ["General Ledger", "Trial Balance", "Tax Return", "Bank Statement"],
        "financial_data": {
            "total_assets": 42000000,
            "total_liabilities": 18500000,
            "equity": 23500000,
            "revenue": 31200000,
            "expenses": 24600000,
        },
        "ai_insights": [
            "All documents verified",
            "Compliance check passed",
            "Tax return filed successfully",
        ],
    },
    {
        "id": "ENG-BE-001",
        "entity_name": "Belgium HoldCo",
        "country_code": "BE",
        "country_name": "Belgium",
        "service_type": "Corporate Tax",
        "status": StatusEnum.received,
        "risk_level": RiskLevel.medium,
        "due_date": date(2026, 3, 20),
        "predicted_completion": date(2026, 3, 18),
        "completion_percent": 45,
        "documents_required": ["General Ledger", "Trial Balance"],
        "financial_data": {
            "total_assets": 8900000,
            "total_liabilities": 4200000,
            "equity": 4700000,
            "revenue": 6500000,
            "expenses": 5100000,
        },
        "ai_insights": ["Awaiting Trial Balance upload"],
    },
    {
        "id": "ENG-LU-001",
        "entity_name": "Luxembourg Fund",
        "country_code": "LU",
        "country_name": "Luxembourg",
        "service_type": "Corporate Tax",
        "status": StatusEnum.waiting,
        "risk_level": RiskLevel.high,
        "due_date": date(2026, 2, 25),
        "predicted_completion": None,
        "completion_percent": 20,
        "documents_required": ["General Ledger", "Trial Balance", "Financial Statement"],
        "financial_data": {
            "total_assets": 125000000,
            "total_liabilities": 45000000,
            "equity": 80000000,
            "revenue": 52000000,
            "expenses": 38000000,
        },
        "ai_insights": [],
    },
]


async def seed_demo_engagements(db: AsyncSession) -> int:
    """
    Seed the database with demo engagement data.

    Only seeds if the engagements table is empty to avoid duplicates.

    Args:
        db: Async database session

    Returns:
        Number of engagements seeded (0 if already populated)
    """
    # Check if engagements already exist
    result = await db.execute(select(Engagement).limit(1))
    existing = result.scalar_one_or_none()

    if existing is not None:
        logger.info("Engagements table already populated, skipping seed")
        return 0

    # Seed demo engagements
    now = datetime.now(timezone.utc)
    for eng_data in DEMO_ENGAGEMENTS:
        engagement = Engagement(
            id=eng_data["id"],
            entity_name=eng_data["entity_name"],
            country_code=eng_data["country_code"],
            country_name=eng_data["country_name"],
            service_type=eng_data["service_type"],
            status=eng_data["status"],
            risk_level=eng_data["risk_level"],
            due_date=eng_data["due_date"],
            predicted_completion=eng_data["predicted_completion"],
            completion_percent=eng_data["completion_percent"],
            documents_required=eng_data["documents_required"],
            financial_data=eng_data["financial_data"],
            ai_insights=eng_data["ai_insights"],
            created_at=now,
            updated_at=now,
        )
        db.add(engagement)

    await db.commit()
    logger.info("Seeded %d demo engagements", len(DEMO_ENGAGEMENTS))
    return len(DEMO_ENGAGEMENTS)


# Demo documents data - now with engagement_ids list for many-to-many
DEMO_DOCUMENTS = [
    # Germany PropCo documents (ENG-DE-001) - processing
    {
        "id": str(uuid.uuid4()),
        "engagement_ids": ["ENG-DE-001"],
        "name": "Grand_Livre_DE_2025.xlsx",
        "type": DocumentType.general_ledger,
        "format": "xlsx",
        "size_bytes": 245760,
        "status": DocumentStatus.analyzed,
        "ai_summary": "General ledger containing 1,234 transactions for fiscal year 2025. Total debits: €28.5M, Total credits: €28.5M.",
        "file_path": "documents/Grand_Livre_DE_2025.xlsx",
    },
    {
        "id": str(uuid.uuid4()),
        "engagement_ids": ["ENG-DE-001"],
        "name": "Balance_Generale_DE.xlsx",
        "type": DocumentType.trial_balance,
        "format": "xlsx",
        "size_bytes": 98304,
        "status": DocumentStatus.analyzing,
        "ai_summary": None,
        "file_path": "documents/Balance_Generale_DE.xlsx",
    },
    # Netherlands BV documents (ENG-NL-001) - completed
    {
        "id": str(uuid.uuid4()),
        "engagement_ids": ["ENG-NL-001"],
        "name": "Grand_Livre_NL_2025.xlsx",
        "type": DocumentType.general_ledger,
        "format": "xlsx",
        "size_bytes": 312500,
        "status": DocumentStatus.analyzed,
        "ai_summary": "General ledger with 2,156 transactions. All accounts balanced. Revenue recognition compliant with IFRS 15.",
        "file_path": "documents/Grand_Livre_NL_2025.xlsx",
    },
    {
        "id": str(uuid.uuid4()),
        "engagement_ids": ["ENG-NL-001"],
        "name": "Balance_Generale_NL.xlsx",
        "type": DocumentType.trial_balance,
        "format": "xlsx",
        "size_bytes": 87040,
        "status": DocumentStatus.analyzed,
        "ai_summary": "Trial balance verified. Total assets: €42M, Total liabilities: €18.5M, Equity: €23.5M.",
        "file_path": "documents/Balance_Generale_NL.xlsx",
    },
    {
        "id": str(uuid.uuid4()),
        "engagement_ids": ["ENG-NL-001"],
        "name": "Declaration_Fiscale_NL.pdf",
        "type": DocumentType.tax_return,
        "format": "pdf",
        "size_bytes": 524288,
        "status": DocumentStatus.analyzed,
        "ai_summary": "Corporate tax return for fiscal year 2025. Taxable income: €6.6M. Tax due: €1.65M at 25% rate.",
        "file_path": "documents/Declaration_Fiscale_NL.pdf",
    },
    {
        "id": str(uuid.uuid4()),
        "engagement_ids": ["ENG-NL-001"],
        "name": "Bank_Statement_NL.pdf",
        "type": DocumentType.financial_statement,
        "format": "pdf",
        "size_bytes": 156672,
        "status": DocumentStatus.analyzed,
        "ai_summary": "Bank statements for Q4 2025. Closing balance: €8.2M. Cash flow positive with €1.1M net inflow.",
        "file_path": "documents/Bank_Statement_NL.pdf",
    },
    # Belgium HoldCo documents (ENG-BE-001) - received
    {
        "id": str(uuid.uuid4()),
        "engagement_ids": ["ENG-BE-001"],
        "name": "Grand_Livre_BE_2025.xlsx",
        "type": DocumentType.general_ledger,
        "format": "xlsx",
        "size_bytes": 178432,
        "status": DocumentStatus.uploaded,
        "ai_summary": None,
        "file_path": "documents/Grand_Livre_BE_2025.xlsx",
    },
    {
        "id": str(uuid.uuid4()),
        "engagement_ids": ["ENG-BE-001"],
        "name": "Balance_Generale_BE.xlsx",
        "type": DocumentType.trial_balance,
        "format": "xlsx",
        "size_bytes": 65536,
        "status": DocumentStatus.uploaded,
        "ai_summary": None,
        "file_path": "documents/Balance_Generale_BE.xlsx",
    },
]


async def seed_demo_documents(db: AsyncSession) -> int:
    """
    Seed the database with demo document data.

    Only seeds if the documents table is empty to avoid duplicates.

    Args:
        db: Async database session

    Returns:
        Number of documents seeded (0 if already populated)
    """
    # Check if documents already exist
    result = await db.execute(select(Document).limit(1))
    existing = result.scalar_one_or_none()

    if existing is not None:
        logger.info("Documents table already populated, skipping seed")
        return 0

    # Fetch engagements for linking
    eng_result = await db.execute(select(Engagement))
    engagements = {eng.id: eng for eng in eng_result.scalars().all()}

    # Seed demo documents
    now = datetime.now(timezone.utc)
    for doc_data in DEMO_DOCUMENTS:
        document = Document(
            id=doc_data["id"],
            name=doc_data["name"],
            type=doc_data["type"],
            format=doc_data["format"],
            size_bytes=doc_data["size_bytes"],
            status=doc_data["status"],
            ai_summary=doc_data["ai_summary"],
            file_path=doc_data["file_path"],
            uploaded_at=now,
        )

        # Link to engagements
        for eng_id in doc_data.get("engagement_ids", []):
            if eng_id in engagements:
                document.engagements.append(engagements[eng_id])

        db.add(document)

    await db.commit()
    logger.info("Seeded %d demo documents", len(DEMO_DOCUMENTS))
    return len(DEMO_DOCUMENTS)
