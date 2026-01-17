# CLAUDE.md - Project Guidelines for AI Agents

## Git Branching Strategy (MANDATORY)

### Branch Structure
```
main        ← Source of truth, always deployable, NEVER commit directly
  └── develop    ← Integration branch, PRs merge here first
        └── feature/*   ← Feature branches for new work
        └── fix/*       ← Bug fix branches
        └── hotfix/*    ← Urgent fixes (can go to main via develop)
```

### Rules (STRICT ENFORCEMENT)

1. **NEVER commit directly to `main`**
   - `main` is protected and always functional
   - Only merge from `develop` after testing

2. **NEVER commit directly to `develop`**
   - All changes go through Pull Requests
   - PRs require code review before merge

3. **Always create feature branches**
   - Naming: `feature/{epic}-{story}-{description}`
   - Example: `feature/e1-s2-fastapi-setup`
   - Branch from `develop`, PR back to `develop`

4. **PR Workflow**
   ```bash
   # Start new feature
   git checkout develop
   git pull origin develop
   git checkout -b feature/e1-s2-description

   # Work on feature...
   git add -A && git commit -m "feat(E1-S2): description"

   # Create PR
   git push -u origin feature/e1-s2-description
   gh pr create --base develop --title "feat(E1-S2): Title"
   ```

5. **Commit Message Format**
   ```
   type(scope): description

   Types: feat, fix, docs, style, refactor, test, chore
   Scope: Epic-Story (e.g., E1-S2)
   ```

6. **Before Merging to `main`**
   - All tests pass on `develop`
   - Code review approved
   - No merge conflicts

### Current Branches
- `main` - Production-ready code
- `develop` - Integration/staging branch
- `feature/*` - Active feature work

---

## Project: Star-Eyes Backend

### Tech Stack
- FastAPI 0.115.6
- Python 3.11+
- SQLAlchemy 2.0 (async)
- SQLite with aiosqlite
- Pydantic v2 for validation

### Folder Structure
```
app/
├── core/           # Config and database setup
├── models/         # SQLAlchemy ORM models
├── schemas/        # Pydantic request/response schemas
├── routers/        # API endpoint definitions
└── services/       # Business logic layer
```

### Code Standards
- Use async/await for all database operations
- Use Pydantic models for all API inputs/outputs
- Follow FastAPI best practices

### Commands
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000

# API Documentation
# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

### API Endpoints
- `GET /health` - Health check endpoint
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc documentation
