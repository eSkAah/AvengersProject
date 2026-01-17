# Story 5.1: API Dashboard KPIs

Status: review

## Story

As a **frontend developer**,
I want **an API endpoint to retrieve KPIs for a specific engagement dashboard**,
so that **I can display financial metrics with year-over-year comparisons**.

## Acceptance Criteria

1. **AC1:** `GET /api/engagements/{id}/stats` endpoint exists and returns engagement KPIs
2. **AC2:** Response includes: total_assets, total_liabilities, equity, revenue, expenses
3. **AC3:** Response includes `previous_year` object with same metrics for N-1 comparison
4. **AC4:** Response includes `variance_percent` calculated for each metric
5. **AC5:** Endpoint returns 404 if engagement not found
6. **AC6:** Response follows existing Pydantic schema patterns with proper typing

## Tasks / Subtasks

- [x] **Task 1: Create Dashboard Schemas** (AC: 2, 3, 4, 6)
  - [x] Create `app/schemas/dashboard.py`
  - [x] Define `FinancialMetrics` schema (total_assets, total_liabilities, equity, revenue, expenses)
  - [x] Define `EngagementStatsResponse` schema with current_year, previous_year, variance_percent
  - [x] Add proper Field descriptions and examples

- [x] **Task 2: Create Dashboard Service** (AC: 2, 3, 4)
  - [x] Create `app/services/dashboard_service.py`
  - [x] Implement `get_engagement_stats(db, engagement_id)` function
  - [x] Extract financial_data from engagement
  - [x] Parse current_year and previous_year from financial_data JSON
  - [x] Calculate variance_percent for each metric: `((current - previous) / previous) * 100`
  - [x] Handle edge cases: division by zero, missing previous_year data

- [x] **Task 3: Create Dashboard Router** (AC: 1, 5)
  - [x] Create `app/routers/dashboard.py`
  - [x] Implement `GET /api/engagements/{id}/stats` endpoint
  - [x] Use dependency injection for database session
  - [x] Return 404 HTTPException if engagement not found
  - [x] Add OpenAPI documentation (summary, description, responses)

- [x] **Task 4: Register Router in Main** (AC: 1)
  - [x] Import dashboard router in `app/main.py`
  - [x] Register with prefix `/api/engagements` and tags `["Dashboard"]`

- [x] **Task 5: Write Unit Tests** (AC: 1, 2, 3, 4, 5)
  - [x] Create `backend/tests/test_dashboard.py`
  - [x] Test successful stats retrieval for existing engagement
  - [x] Test 404 response for non-existent engagement
  - [x] Test variance calculation accuracy
  - [x] Test handling of missing previous_year data

## Dev Notes

### Architecture Patterns to Follow

The backend follows a clean layered architecture:
- **Routers** (API endpoints) → **Services** (business logic) → **Database** (SQLAlchemy async)
- Use async/await for all DB operations
- Pydantic v2 for all request/response validation

### Existing Data Structure

The `financial_data` JSON in engagements supports two formats:
1. **Nested structure** (with YoY comparison):
```python
financial_data = {
    "current_year": {
        "total_assets": 15400000,
        ...
    },
    "previous_year": {
        "total_assets": 14200000,
        ...
    }
}
```

2. **Flat structure** (current seed data):
```python
financial_data = {
    "total_assets": 15400000,
    "total_liabilities": 8200000,
    ...
}
```

The service handles both formats - flat structure is treated as current_year data.

### Variance Calculation Formula

```python
def calculate_variance(current: float, previous: float) -> float:
    if previous == 0:
        return 0.0 if current == 0 else 100.0  # Handle division by zero
    return round(((current - previous) / previous) * 100, 2)
```

### Response Schema Example

```json
{
  "engagement_id": "ENG-FR-001",
  "entity_name": "France SPV",
  "current_year": {
    "total_assets": 15400000,
    "total_liabilities": 8200000,
    "equity": 7200000,
    "revenue": 12500000,
    "expenses": 9800000
  },
  "previous_year": null,
  "variance_percent": null
}
```

### Project Structure Notes

Files created/modified:
```
backend/app/
├── schemas/
│   └── dashboard.py          # NEW - Dashboard response schemas
├── services/
│   └── dashboard_service.py  # NEW - Stats calculation logic
├── routers/
│   ├── __init__.py           # MODIFIED - Export dashboard_router
│   └── dashboard.py          # NEW - Dashboard API endpoints
├── main.py                   # MODIFIED - Register dashboard router
└── tests/
    └── test_dashboard.py     # NEW - 21 dashboard endpoint tests
```

### References

- [Source: docs/USER-STORIES.md#E5-S1] - Story requirements
- [Source: docs/PRD.md#Section14] - API Endpoints specification
- [Source: docs/ARCHITECTURE.md#Section4] - Backend structure
- [Source: backend/app/routers/engagements.py] - Router patterns
- [Source: backend/app/schemas/engagement.py] - FinancialData schema
- [Source: backend/app/services/engagement_service.py] - Service patterns
- [Source: backend/CLAUDE.md] - Git branching strategy

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 147 backend tests passing (including 21 new dashboard tests)
- No regressions detected

### Completion Notes List

- Created `FinancialMetrics` schema with all 5 financial fields (assets, liabilities, equity, revenue, expenses)
- Created `VariancePercent` schema for YoY variance percentages
- Created `EngagementStatsResponse` schema with OpenAPI examples
- Implemented `calculate_variance()` with edge case handling (division by zero)
- Implemented `extract_financial_metrics()` for parsing JSON data
- Implemented `calculate_variance_percent()` for full YoY comparison
- Implemented `get_engagement_stats()` async service function
- Added support for both nested and flat financial_data formats
- Created dashboard router with full OpenAPI documentation
- Added 21 comprehensive unit tests covering all acceptance criteria
- All tests pass (147 total, 21 new for dashboard)

### File List

**Created:**
- `backend/app/schemas/dashboard.py` - Pydantic schemas for dashboard responses
- `backend/app/services/dashboard_service.py` - Business logic for stats calculation
- `backend/app/routers/dashboard.py` - API endpoint for engagement stats
- `backend/tests/test_dashboard.py` - 21 unit tests for dashboard functionality

**Modified:**
- `backend/app/routers/__init__.py` - Added dashboard_router export
- `backend/app/main.py` - Registered dashboard router with API

## Change Log

- 2026-01-17: Story implementation completed - Added dashboard KPIs endpoint with YoY comparison support
