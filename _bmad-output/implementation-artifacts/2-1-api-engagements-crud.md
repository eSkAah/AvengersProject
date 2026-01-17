# Story 2.1: API Engagements - CRUD

Status: completed

## Story

As a **frontend developer**,
I want **a RESTful API to manage engagements**,
so that **I can display the engagement list on the landing page and retrieve engagement details**.

## Acceptance Criteria

1. **AC1:** GET /api/engagements returns a list of all engagements with proper schema
2. **AC2:** GET /api/engagements/{id} returns detailed engagement data by ID
3. **AC3:** Response format conforms to Pydantic schema with all required fields
4. **AC4:** Risk level is automatically calculated based on business rules
5. **AC5:** Completion percentage is automatically calculated based on document status
6. **AC6:** Unit tests cover all endpoints with success and error cases

## Tasks / Subtasks

- [x] **Task 1: Create Engagement SQLAlchemy Model** (AC: 1, 2, 3)
  - [x] Create `app/models/engagement.py` with Engagement class
  - [x] Define all columns: id, entity_name, country_code, country_name, service_type, status, risk_level, due_date, predicted_completion, completion_percent, documents_required (JSON), financial_data (JSON), ai_insights (JSON), created_at, updated_at
  - [x] Create StatusEnum (waiting, received, processing, completed)
  - [x] Create RiskLevel enum (high, medium, low)
  - [x] Add relationship to documents (for future use)
  - [x] Export model in `app/models/__init__.py`

- [x] **Task 2: Create Pydantic Schemas** (AC: 3)
  - [x] Create `app/schemas/engagement.py`
  - [x] EngagementBase: shared fields
  - [x] EngagementCreate: for creation (if needed later)
  - [x] EngagementResponse: full response with all computed fields
  - [x] EngagementListResponse: list wrapper with total count
  - [x] FinancialData nested schema
  - [x] Export schemas in `app/schemas/__init__.py`

- [x] **Task 3: Create Engagement Service** (AC: 4, 5)
  - [x] Create `app/services/engagement_service.py`
  - [x] `get_all_engagements()`: retrieve all engagements
  - [x] `get_engagement_by_id(id)`: retrieve single engagement
  - [x] `calculate_risk_level(engagement)`: implement risk calculation logic
  - [x] `calculate_completion_percent(engagement)`: implement completion logic
  - [x] Export service in `app/services/__init__.py`

- [x] **Task 4: Create Engagements Router** (AC: 1, 2)
  - [x] Create `app/routers/engagements.py`
  - [x] GET `/` endpoint: list all engagements
  - [x] GET `/{engagement_id}` endpoint: get single engagement
  - [x] Add proper error handling (404 for not found)
  - [x] Add OpenAPI documentation (summary, description, responses)
  - [x] Register router in `app/main.py` with prefix `/api/engagements`

- [x] **Task 5: Seed Demo Data** (AC: 1, 2)
  - [x] Create `app/core/seed.py` or add to existing seed logic
  - [x] Seed 5 engagements: France SPV, Germany PropCo, Netherlands BV, Belgium HoldCo, Luxembourg Fund
  - [x] Include varied statuses and risk levels
  - [x] Include realistic financial_data JSON
  - [x] Call seed function in lifespan startup

- [x] **Task 6: Write Unit Tests** (AC: 6)
  - [x] Create `tests/test_engagements.py`
  - [x] Test GET /api/engagements returns list
  - [x] Test GET /api/engagements/{id} returns engagement
  - [x] Test GET /api/engagements/{id} returns 404 for invalid ID
  - [x] Test risk_level calculation
  - [x] Test completion_percent calculation

## Dev Notes

### Architecture Patterns to Follow

**Backend Structure (from ARCHITECTURE.md Section 4.1):**
```
app/
├── models/engagement.py      # SQLAlchemy model
├── schemas/engagement.py     # Pydantic schemas
├── services/engagement_service.py  # Business logic
├── routers/engagements.py    # FastAPI endpoints
```

**Async Pattern (from database.py):**
- Use `async_session_maker` for database sessions
- All DB operations must use `await`
- Use `AsyncSession` type hints

**Router Pattern (follow health.py example):**
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter(tags=["Engagements"])

@router.get("/", response_model=list[EngagementResponse])
async def list_engagements(db: AsyncSession = Depends(get_db)):
    ...
```

### Risk Level Calculation Logic (PRD Section 16.1)

```python
def calculate_risk_level(engagement) -> RiskLevel:
    days_remaining = (engagement.due_date - date.today()).days
    completion = engagement.completion_percent

    # HIGH: < 7 days AND < 80% OR docs missing at J-7
    if days_remaining < 7 and completion < 80:
        return RiskLevel.high

    # MEDIUM: 7-14 days AND < 90% OR analysis stuck > 48h
    if 7 <= days_remaining <= 14 and completion < 90:
        return RiskLevel.medium

    # LOW: > 14 days OR >= 90% OR completed
    return RiskLevel.low
```

### Response Schema (from USER-STORIES.md E2-S1)

```json
{
  "id": "ENG-FR-001",
  "entity_name": "France SPV",
  "country_code": "FR",
  "country_name": "France",
  "service_type": "Corporate Tax",
  "status": "waiting",
  "risk_level": "high",
  "completion_percent": 67,
  "due_date": "2026-02-29",
  "predicted_completion": "2026-02-25",
  "documents_required": ["General Ledger", "Trial Balance"],
  "financial_data": {
    "total_assets": 15400000,
    "total_liabilities": 8200000,
    "equity": 7200000,
    "revenue": 12500000
  },
  "ai_insights": []
}
```

### Demo Data (5 Engagements)

| Entity | Country | Status | Risk | Completion |
|--------|---------|--------|------|------------|
| France SPV | FR | waiting | high | 67% |
| Germany PropCo | DE | processing | medium | 85% |
| Netherlands BV | NL | completed | low | 100% |
| Belgium HoldCo | BE | received | medium | 45% |
| Luxembourg Fund | LU | waiting | high | 20% |

### Testing Standards

- Use `pytest` with `pytest-asyncio`
- Use `httpx.AsyncClient` for testing endpoints
- Test database should use in-memory SQLite or test fixture
- Cover happy path and error cases

### Project Structure Notes

- Router prefix: `/api/engagements` (not `/api/v1/engagements` to match frontend expectations)
- Maintain consistency with existing `health.py` router pattern
- Use async SQLAlchemy patterns from `database.py`

### References

- [Source: docs/USER-STORIES.md#E2-S1] - Story requirements and acceptance criteria
- [Source: docs/ARCHITECTURE.md#Section-4] - Backend structure and patterns
- [Source: docs/ARCHITECTURE.md#Section-4.3] - SQLAlchemy model example
- [Source: docs/PRD.md#Section-16.1] - Risk calculation logic
- [Source: backend/app/core/database.py] - Async session pattern
- [Source: backend/app/routers/health.py] - Router pattern example

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Fixed Python 3.9 compatibility by replacing `type | None` syntax with `Optional[type]`

### Completion Notes List

- All 6 tasks completed successfully
- 34 unit tests passing (31 engagement tests + 3 health tests)
- API endpoints documented with OpenAPI schemas
- Risk calculation implements PRD business rules
- Demo data seeded with 5 engagements (France, Germany, Netherlands, Belgium, Luxembourg)

### File List

**Created:**
- `backend/app/models/engagement.py` - SQLAlchemy Engagement model with StatusEnum and RiskLevel
- `backend/app/models/document.py` - Placeholder Document model for relationship
- `backend/app/models/__init__.py` - Model exports
- `backend/app/schemas/engagement.py` - Pydantic schemas (EngagementBase, EngagementCreate, EngagementResponse, EngagementListResponse, EngagementUpdate, FinancialData)
- `backend/app/schemas/__init__.py` - Schema exports
- `backend/app/services/engagement_service.py` - Business logic (get_all_engagements, get_engagement_by_id, calculate_risk_level, calculate_completion_percent, update_engagement_risk)
- `backend/app/services/__init__.py` - Service exports
- `backend/app/routers/engagements.py` - FastAPI router with GET / and GET /{id} endpoints
- `backend/app/core/seed.py` - Demo data seeder with 5 engagements
- `backend/tests/test_engagements.py` - 31 unit tests for API and business logic

**Modified:**
- `backend/app/routers/__init__.py` - Added engagements_router export
- `backend/app/main.py` - Added router registration and seed call
- `backend/app/core/config.py` - Python 3.9 compatibility fix

