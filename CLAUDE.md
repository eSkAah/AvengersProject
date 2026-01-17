# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Star-Eyes** is a Digital Engagement Platform POC (10-day hackathon) for a real estate fund client. The goal is to demonstrate premium AI capabilities through a polished Angular frontend + FastAPI backend.

**Key Demo Features:**
- Smart document classification via AI (Blackwell / Azure foundry model AI / OpenAI Api for POC)
- Eve: Contextual AI assistant chatbot
- CMD+Click "Ask Eve" on any data point
- Risk prediction badges and deadline forecasting
- Premium 2026-level UI with EY branding

## Tech Stack

- **Frontend:** Angular 19+ (standalone components, Signals, Tailwind CSS)
- **Backend:** FastAPI (Python 3.11+, async, SQLAlchemy 2.0, SQLite)
- **AI Integration:** Factory AI / Blackwell via REST API
- **Charts:** Chart.js + ng2-charts
- **Icons:** Lucide Icons

## Commands

### Frontend (Angular)
```bash
cd frontend
npm install
ng serve --open              # Dev server on localhost:4200
ng build --configuration=production
ng test
ng lint
```

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs (Swagger UI)

## Architecture

### Frontend Structure
```
frontend/src/app/
├── core/           # Singleton services (api, engagement, document, eve, dashboard)
├── shared/         # Reusable components (sidebar, header, risk-badge, kpi-card, skeleton, toast)
│   ├── directives/ # cmd-click.directive.ts (CMD+Click → Eve), tooltip.directive.ts
│   └── pipes/      # currency-ey.pipe.ts, relative-date.pipe.ts
├── features/       # Feature modules (lazy-loaded)
│   ├── home/       # Landing page with engagement list + KPIs
│   ├── documents/  # Document library (tree, grid, list, upload zone)
│   ├── dashboard/  # Charts, KPIs, smart tooltips
│   └── eve/        # Chat panel, FAB button, message bubbles
```

### Backend Structure
```
backend/app/
├── api/            # FastAPI routers (engagements, documents, eve, dashboard)
├── models/         # SQLAlchemy models (Engagement, Document, Conversation)
├── schemas/        # Pydantic schemas for request/response validation
├── services/       # Business logic (classification, risk calculation, Eve AI)
├── ai/             # Factory AI client, prompts, response parsers
└── db/             # SQLAlchemy setup, migrations, seed data
```

### Key Data Flow

1. **Upload & Classification:** User drops file → Angular Upload Zone → POST /api/documents/upload → ClassificationService detects type → Routes to engagement → Updates status
2. **CMD+Click → Eve:** User CMD+clicks value → cmdClick directive → POST /api/eve/explain → Factory AI → Response with sources → Eve panel opens

## Design System (EY Branding)

Colors are defined in `tailwind.config.js`:
- Primary: `#FFE600` (EY Yellow), `#FFD000` (hover)
- Neutrals: `#FAFAFA` (bg), `#2E2E38` (text)
- Semantic: success `#10B981`, warning `#F59E0B`, error `#EF4444`, info `#3B82F6`

UI Standards:
- Cards: `bg-white shadow-sm rounded-xl border-subtle`
- Buttons: `rounded-lg` with hover scale 1.02
- Transitions: 200-300ms ease-out
- Loading states: Skeleton loaders (not spinners)

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /api/engagements | List all engagements with risk levels |
| GET /api/engagements/{id} | Engagement detail with financial data |
| POST /api/documents/upload | Upload + auto-classification |
| GET /api/documents?engagement={id} | Documents for engagement |
| POST /api/eve/chat | Chat with Eve (contextual) |
| POST /api/eve/explain | Explain a value (CMD+Click) |
| GET /api/dashboard/kpis | Global KPIs |

## Risk Level Logic

- **HIGH (red):** < 7 days remaining AND < 80% complete OR docs missing at J-7
- **MEDIUM (orange):** 7-14 days AND < 90% OR analysis stuck > 48h
- **LOW (green):** > 14 days OR >= 90% OR completed

## Eve AI Assistant

Eve uses formal French (vouvoiement), no emojis, corporate tone. She is read-only (no data modification).

System prompt is in `backend/app/ai/prompts.py`. Key capabilities:
- Contextual answers based on active engagement
- Source citations (document name + line number)
- Financial data explanations
- N vs N-1 comparisons

## Demo Data

5 pre-seeded engagements: France SPV (hero for demo), Germany PropCo, Netherlands BV, Belgium HoldCo, Luxembourg Fund. See `backend/app/db/seed.py`.

## BMAD Methodology

This project uses BMAD (BMM) workflows for planning. Key artifacts in `docs/`:
- `PRD.md` - Full product requirements
- `ARCHITECTURE.md` - Technical architecture decisions
- `USER-STORIES.md` - Epic and story breakdown

Planning artifacts in `_bmad-output/planning-artifacts/`.

## Specialized Agents

Use the Task tool with these specialized agents:
- `angular-26-expert` - For Angular components, services, performance, security
- `python-fastapi-architect` - For FastAPI endpoints, async patterns, database integration
