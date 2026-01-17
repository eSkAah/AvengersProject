# Architecture Technique - Avengers Project

**Version:** 1.0
**Date:** 2026-01-17
**Stack:** Angular 19 + FastAPI + Factory AI

---

## 1. Décisions Techniques

### 1.1 Choix Optimisés Vitesse/Qualité

| Domaine | Choix | Justification |
|---------|-------|---------------|
| **Angular Version** | 19 (standalone) | Moderne, moins de boilerplate, signals natifs |
| **State Management** | Signals + Services | Léger, built-in Angular 17+, suffisant pour POC |
| **UI Styling** | Tailwind CSS | Flexible, rapide, look premium 2026 facile |
| **Components** | Custom + Headless UI | Contrôle total sur le design EY |
| **Charts** | Chart.js + ng2-charts | Simple, performant, suffisant pour POC |
| **Icons** | Lucide Icons | Moderne, léger, cohérent |
| **Backend** | FastAPI | Rapide à dev, async natif, auto-docs |
| **Database** | SQLite + SQLAlchemy | Persistant, queries faciles, zero config |
| **AI Integration** | Factory AI / Blackwell | Via API REST, prompts structurés |

---

## 2. Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    ANGULAR 19 SPA                            │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │ │
│  │  │  Home    │ │  Docs    │ │Dashboard │ │   Eve    │        │ │
│  │  │  Page    │ │ Library  │ │  Charts  │ │  Chat    │        │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │ │
│  │                      │                                       │ │
│  │              ┌───────┴───────┐                               │ │
│  │              │   Services    │                               │ │
│  │              │  (Signals)    │                               │ │
│  │              └───────────────┘                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                             │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Engagements│ │Documents │ │   Eve    │ │Dashboard │            │
│  │  Router   │ │  Router  │ │  Router  │ │  Router  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                      │                                           │
│              ┌───────┴───────┐                                   │
│              │   Services    │                                   │
│              └───────┬───────┘                                   │
│                      │                                           │
│         ┌────────────┼────────────┐                              │
│         ▼            ▼            ▼                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │  SQLite  │ │ Factory  │ │  File    │                         │
│  │    DB    │ │    AI    │ │ Storage  │                         │
│  └──────────┘ └──────────┘ └──────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Structure Frontend (Angular)

### 3.1 Arborescence

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                      # Singleton services, guards
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts           # HTTP client wrapper
│   │   │   │   ├── engagement.service.ts    # Engagements state
│   │   │   │   ├── document.service.ts      # Documents state
│   │   │   │   ├── eve.service.ts           # Chat state
│   │   │   │   └── dashboard.service.ts     # KPIs & charts
│   │   │   ├── interceptors/
│   │   │   │   └── error.interceptor.ts
│   │   │   └── guards/
│   │   │       └── auth.guard.ts            # (mock pour POC)
│   │   │
│   │   ├── shared/                    # Composants réutilisables
│   │   │   ├── components/
│   │   │   │   ├── sidebar/
│   │   │   │   │   └── sidebar.component.ts
│   │   │   │   ├── header/
│   │   │   │   │   └── header.component.ts
│   │   │   │   ├── risk-badge/
│   │   │   │   │   └── risk-badge.component.ts
│   │   │   │   ├── progress-bar/
│   │   │   │   │   └── progress-bar.component.ts
│   │   │   │   ├── kpi-card/
│   │   │   │   │   └── kpi-card.component.ts
│   │   │   │   ├── document-card/
│   │   │   │   │   └── document-card.component.ts
│   │   │   │   ├── toast/
│   │   │   │   │   └── toast.component.ts
│   │   │   │   └── skeleton/
│   │   │   │       └── skeleton.component.ts
│   │   │   ├── directives/
│   │   │   │   ├── cmd-click.directive.ts   # CMD+Click → Eve
│   │   │   │   └── tooltip.directive.ts
│   │   │   └── pipes/
│   │   │       ├── currency-ey.pipe.ts      # Format € EY style
│   │   │       └── relative-date.pipe.ts
│   │   │
│   │   ├── features/                  # Feature modules
│   │   │   ├── home/
│   │   │   │   ├── home.component.ts
│   │   │   │   ├── home.component.html
│   │   │   │   ├── components/
│   │   │   │   │   ├── engagement-list/
│   │   │   │   │   │   └── engagement-list.component.ts
│   │   │   │   │   ├── engagement-accordion/
│   │   │   │   │   │   └── engagement-accordion.component.ts
│   │   │   │   │   └── kpi-header/
│   │   │   │   │       └── kpi-header.component.ts
│   │   │   │   └── home.routes.ts
│   │   │   │
│   │   │   ├── documents/
│   │   │   │   ├── documents.component.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── document-tree/
│   │   │   │   │   │   └── document-tree.component.ts
│   │   │   │   │   ├── document-grid/
│   │   │   │   │   │   └── document-grid.component.ts
│   │   │   │   │   ├── document-list/
│   │   │   │   │   │   └── document-list.component.ts
│   │   │   │   │   ├── upload-zone/
│   │   │   │   │   │   └── upload-zone.component.ts
│   │   │   │   │   └── view-toggle/
│   │   │   │   │       └── view-toggle.component.ts
│   │   │   │   └── documents.routes.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── kpi-section/
│   │   │   │   │   │   └── kpi-section.component.ts
│   │   │   │   │   ├── assets-chart/
│   │   │   │   │   │   └── assets-chart.component.ts
│   │   │   │   │   ├── comparison-chart/
│   │   │   │   │   │   └── comparison-chart.component.ts
│   │   │   │   │   └── smart-tooltip/
│   │   │   │   │       └── smart-tooltip.component.ts
│   │   │   │   └── dashboard.routes.ts
│   │   │   │
│   │   │   └── eve/
│   │   │       ├── eve-panel/
│   │   │       │   └── eve-panel.component.ts
│   │   │       ├── eve-fab/
│   │   │       │   └── eve-fab.component.ts      # Floating button
│   │   │       ├── message-bubble/
│   │   │       │   └── message-bubble.component.ts
│   │   │       └── eve.service.ts
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   │
│   ├── assets/
│   │   ├── icons/
│   │   └── images/
│   │
│   ├── styles/
│   │   ├── _variables.scss            # Couleurs EY, espacements
│   │   ├── _typography.scss           # Fonts EY
│   │   ├── _components.scss           # Styles de base
│   │   └── styles.scss                # Entry point
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   └── index.html
│
├── tailwind.config.js                 # Config Tailwind + couleurs EY
├── angular.json
├── package.json
└── tsconfig.json
```

### 3.2 Services avec Signals

```typescript
// engagement.service.ts
@Injectable({ providedIn: 'root' })
export class EngagementService {
  private api = inject(ApiService);

  // State avec Signals
  engagements = signal<Engagement[]>([]);
  selectedEngagement = signal<Engagement | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Computed
  highRiskCount = computed(() =>
    this.engagements().filter(e => e.risk_level === 'high').length
  );

  completedCount = computed(() =>
    this.engagements().filter(e => e.status === 'completed').length
  );

  // Actions
  async loadEngagements(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.api.get<Engagement[]>('/engagements');
      this.engagements.set(data);
    } catch (e) {
      this.error.set('Erreur de chargement');
    } finally {
      this.loading.set(false);
    }
  }

  selectEngagement(id: string): void {
    const engagement = this.engagements().find(e => e.id === id);
    this.selectedEngagement.set(engagement ?? null);
  }
}
```

### 3.3 Directive CMD+Click

```typescript
// cmd-click.directive.ts
@Directive({
  selector: '[cmdClick]',
  standalone: true
})
export class CmdClickDirective {
  @Input() cmdClickValue: string = '';
  @Input() cmdClickContext: string = '';
  @Output() cmdClick = new EventEmitter<{ value: string; context: string }>();

  private eve = inject(EveService);

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (event.metaKey || event.altKey) {
      event.preventDefault();
      this.eve.askAboutValue(this.cmdClickValue, this.cmdClickContext);
    }
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    // Show tooltip "⌘+Click to ask Eve"
  }
}
```

### 3.4 Tailwind Config (Couleurs EY)

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ey: {
          yellow: '#FFE600',
          'yellow-hover': '#FFD000',
          black: '#2E2E38',
          gray: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#E5E5E5',
            300: '#D4D4D4',
            500: '#6B7280',
            700: '#374151',
            900: '#1A1A2E',
          }
        },
        semantic: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        }
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      }
    }
  }
}
```

---

## 4. Structure Backend (FastAPI)

### 4.1 Arborescence

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                        # Entry point FastAPI
│   ├── config.py                      # Settings & env vars
│   │
│   ├── api/                           # Routers
│   │   ├── __init__.py
│   │   ├── engagements.py             # /api/engagements/*
│   │   ├── documents.py               # /api/documents/*
│   │   ├── eve.py                     # /api/eve/*
│   │   └── dashboard.py               # /api/dashboard/*
│   │
│   ├── models/                        # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── engagement.py
│   │   ├── document.py
│   │   └── conversation.py
│   │
│   ├── schemas/                       # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── engagement.py
│   │   ├── document.py
│   │   ├── eve.py
│   │   └── dashboard.py
│   │
│   ├── services/                      # Business logic
│   │   ├── __init__.py
│   │   ├── engagement_service.py
│   │   ├── document_service.py
│   │   ├── classification_service.py  # IA classification
│   │   ├── eve_service.py             # Factory AI integration
│   │   ├── risk_service.py            # Risk calculation
│   │   └── dashboard_service.py
│   │
│   ├── ai/                            # Factory AI integration
│   │   ├── __init__.py
│   │   ├── client.py                  # API client Factory AI
│   │   ├── prompts.py                 # Prompt templates
│   │   └── parsers.py                 # Response parsers
│   │
│   ├── db/                            # Database
│   │   ├── __init__.py
│   │   ├── database.py                # SQLAlchemy setup
│   │   ├── seed.py                    # Demo data seeding
│   │   └── migrations/
│   │
│   └── utils/
│       ├── __init__.py
│       └── file_utils.py              # File handling
│
├── uploads/                           # Uploaded files storage
├── data/
│   └── avengers_project.db            # SQLite database
│
├── tests/
│   ├── __init__.py
│   ├── test_engagements.py
│   └── test_eve.py
│
├── requirements.txt
├── Dockerfile
└── README.md
```

### 4.2 Main Entry Point

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import engagements, documents, eve, dashboard
from app.db.database import create_tables
from app.db.seed import seed_demo_data

app = FastAPI(
    title="Avengers Project API",
    description="Digital Engagement Platform POC",
    version="1.0.0"
)

# CORS pour Angular dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(engagements.router, prefix="/api/engagements", tags=["Engagements"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(eve.router, prefix="/api/eve", tags=["Eve AI"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

@app.on_event("startup")
async def startup():
    create_tables()
    seed_demo_data()

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0"}
```

### 4.3 SQLAlchemy Models

```python
# app/models/engagement.py
from sqlalchemy import Column, String, Integer, Date, JSON, Enum, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import enum

class StatusEnum(str, enum.Enum):
    waiting = "waiting"
    received = "received"
    processing = "processing"
    completed = "completed"

class RiskLevel(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"

class Engagement(Base):
    __tablename__ = "engagements"

    id = Column(String, primary_key=True)
    entity_name = Column(String, nullable=False)
    country_code = Column(String(2), nullable=False)
    country_name = Column(String, nullable=False)
    service_type = Column(String, default="Corporate Tax")
    status = Column(Enum(StatusEnum), default=StatusEnum.waiting)
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.medium)
    due_date = Column(Date, nullable=False)
    predicted_completion = Column(Date, nullable=True)
    completion_percent = Column(Integer, default=0)
    documents_required = Column(JSON, default=list)
    financial_data = Column(JSON, default=dict)
    ai_insights = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    documents = relationship("Document", back_populates="engagement")
    conversations = relationship("Conversation", back_populates="engagement")
```

### 4.4 Eve Service (Factory AI Integration)

```python
# app/services/eve_service.py
from app.ai.client import FactoryAIClient
from app.ai.prompts import EVE_SYSTEM_PROMPT, EXPLAIN_PROMPT
from app.models.engagement import Engagement
from app.models.document import Document

class EveService:
    def __init__(self):
        self.ai_client = FactoryAIClient()

    async def chat(
        self,
        message: str,
        engagement_id: str | None = None,
        context: dict | None = None
    ) -> dict:
        """Process chat message with Eve"""

        # Build context from engagement and documents
        system_context = self._build_context(engagement_id)

        # Call Factory AI
        response = await self.ai_client.complete(
            system_prompt=EVE_SYSTEM_PROMPT,
            user_message=message,
            context=system_context
        )

        return {
            "message": response.content,
            "sources": response.sources,
            "engagement_id": engagement_id
        }

    async def explain_value(
        self,
        value: str,
        context: str,
        engagement_id: str
    ) -> dict:
        """Explain a specific value (CMD+Click feature)"""

        prompt = EXPLAIN_PROMPT.format(
            value=value,
            context=context
        )

        # Get relevant documents for source citation
        docs = self._get_engagement_documents(engagement_id)

        response = await self.ai_client.complete(
            system_prompt=EVE_SYSTEM_PROMPT,
            user_message=prompt,
            context={"documents": docs}
        )

        return {
            "explanation": response.content,
            "source_document": response.source_doc,
            "source_line": response.source_line
        }

    def _build_context(self, engagement_id: str | None) -> dict:
        """Build context from engagement data"""
        if not engagement_id:
            return {}

        engagement = self._get_engagement(engagement_id)
        documents = self._get_engagement_documents(engagement_id)

        return {
            "engagement": engagement.to_dict(),
            "documents": [d.to_dict() for d in documents],
            "financial_data": engagement.financial_data
        }
```

### 4.5 Classification Service

```python
# app/services/classification_service.py
import re
from app.ai.client import FactoryAIClient

class ClassificationService:
    DOCUMENT_TYPES = {
        "general_ledger": ["ledger", "grand_livre", "gl_"],
        "trial_balance": ["trial", "balance", "tb_"],
        "tax_return": ["tax", "fiscal", "declaration"],
        "financial_statement": ["financial", "statement", "fs_"]
    }

    async def classify_document(self, filename: str, content_preview: str = "") -> str:
        """Classify document type based on filename and content"""

        # Step 1: Try filename matching (fast)
        doc_type = self._classify_by_filename(filename)
        if doc_type:
            return doc_type

        # Step 2: Try content analysis (if available)
        if content_preview:
            doc_type = self._classify_by_content(content_preview)
            if doc_type:
                return doc_type

        # Step 3: Fallback to AI classification
        return await self._ai_classify(filename, content_preview)

    def _classify_by_filename(self, filename: str) -> str | None:
        filename_lower = filename.lower()
        for doc_type, keywords in self.DOCUMENT_TYPES.items():
            if any(kw in filename_lower for kw in keywords):
                return doc_type
        return None

    def _classify_by_content(self, content: str) -> str | None:
        content_lower = content.lower()

        # Check for column patterns
        if all(col in content_lower for col in ["date", "account", "debit", "credit"]):
            return "general_ledger"
        if all(col in content_lower for col in ["account", "balance"]):
            return "trial_balance"

        return None

    async def _ai_classify(self, filename: str, content: str) -> str:
        """Use Factory AI for classification"""
        client = FactoryAIClient()
        result = await client.classify_document(filename, content)
        return result.document_type
```

### 4.6 Prompts Templates

```python
# app/ai/prompts.py

EVE_SYSTEM_PROMPT = """Vous êtes Eve, l'assistante IA de la plateforme Avengers Project pour EY.

PERSONNALITÉ:
- Style corporate et professionnel
- Toujours vouvoyer l'utilisateur
- Réponses concises et précises
- Pas d'emojis

CAPACITÉS:
- Consulter et analyser les documents uploadés
- Expliquer les données financières
- Citer les sources (document, ligne)
- Comparer les données N vs N-1
- Guider l'utilisateur dans ses tâches

LIMITATIONS:
- Lecture seule (pas de modification de données)
- Pas de suppression de documents
- Pas d'envoi d'emails

FORMAT DE RÉPONSE:
- Structuré avec des tirets si plusieurs points
- Toujours citer la source si applicable
- Être factuel et précis
"""

EXPLAIN_PROMPT = """Expliquez le montant suivant de manière détaillée:

Valeur: {value}
Contexte: {context}

Fournissez:
1. La décomposition du montant
2. La source exacte (document, ligne)
3. La comparaison avec l'année précédente si disponible
"""

CLASSIFICATION_PROMPT = """Analysez le document suivant et déterminez son type.

Nom du fichier: {filename}
Contenu (aperçu): {content_preview}

Types possibles:
- general_ledger (Grand Livre)
- trial_balance (Balance Générale)
- tax_return (Déclaration Fiscale)
- financial_statement (États Financiers)

Répondez uniquement avec le type identifié.
"""
```

---

## 5. Communication Frontend ↔ Backend

### 5.1 API Service Angular

```typescript
// core/services/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl; // http://localhost:8000/api

  private http = inject(HttpClient);

  get<T>(endpoint: string, params?: any): Promise<T> {
    return firstValueFrom(
      this.http.get<T>(`${this.baseUrl}${endpoint}`, { params })
    );
  }

  post<T>(endpoint: string, body: any): Promise<T> {
    return firstValueFrom(
      this.http.post<T>(`${this.baseUrl}${endpoint}`, body)
    );
  }

  upload<T>(endpoint: string, file: File, metadata?: any): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    return firstValueFrom(
      this.http.post<T>(`${this.baseUrl}${endpoint}`, formData)
    );
  }
}
```

### 5.2 Contrats API (Types partagés)

```typescript
// shared/types/api.types.ts

export interface Engagement {
  id: string;
  entity_name: string;
  country_code: string;
  country_name: string;
  service_type: string;
  status: 'waiting' | 'received' | 'processing' | 'completed';
  risk_level: 'high' | 'medium' | 'low';
  due_date: string;
  predicted_completion: string | null;
  completion_percent: number;
  documents_required: string[];
  financial_data: FinancialData;
  ai_insights: string[];
}

export interface Document {
  id: string;
  engagement_id: string;
  name: string;
  type: 'general_ledger' | 'trial_balance' | 'tax_return' | 'financial_statement';
  format: string;
  size_bytes: number;
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'error';
  ai_summary: string;
  uploaded_at: string;
}

export interface EveMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: DocumentSource[];
}

export interface EveExplainRequest {
  value: string;
  context: string;
  engagement_id: string;
}

export interface EveExplainResponse {
  explanation: string;
  source_document: string;
  source_line: number;
}

export interface DashboardKPIs {
  total_engagements: number;
  in_progress: number;
  at_risk: number;
  completed: number;
}
```

---

## 6. Flux de Données Clés

### 6.1 Upload & Classification Flow

```
┌─────────┐     ┌─────────┐     ┌─────────────┐     ┌──────────┐
│  User   │────▶│ Angular │────▶│   FastAPI   │────▶│ Factory  │
│  drops  │     │ Upload  │POST │  /upload    │     │    AI    │
│  file   │     │  Zone   │     │             │     │          │
└─────────┘     └─────────┘     └─────────────┘     └──────────┘
                                       │                  │
                                       │    classify      │
                                       │◀─────────────────│
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  Save document  │
                              │  Update status  │
                              │  Return result  │
                              └─────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  WebSocket or   │
                              │  Polling update │
                              │  → Engagement   │
                              └─────────────────┘
```

### 6.2 CMD+Click → Eve Explain Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│  User   │────▶│  Directive  │────▶│   FastAPI   │────▶│ Factory  │
│CMD+Click│     │  cmdClick   │POST │ /eve/explain│     │    AI    │
│ on 3.3M │     │             │     │             │     │          │
└─────────┘     └─────────────┘     └─────────────┘     └──────────┘
                                           │                  │
                                           │   explanation    │
                                           │◀─────────────────│
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │  Open Eve Panel │
                                  │  Show response  │
                                  │  with sources   │
                                  └─────────────────┘
```

---

## 7. Configuration & Environnement

### 7.1 Variables d'environnement Backend

```bash
# .env
DATABASE_URL=sqlite:///./data/avengers_project.db
FACTORY_AI_URL=https://factory-ai.ey.com/api
FACTORY_AI_KEY=your-api-key
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760  # 10MB
CORS_ORIGINS=http://localhost:4200
```

### 7.2 Configuration Angular

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  evePollingInterval: 1000,  // ms
};
```

---

## 8. Scripts de Développement

### 8.1 Package.json Frontend

```json
{
  "scripts": {
    "start": "ng serve --open",
    "build": "ng build --configuration=production",
    "test": "ng test",
    "lint": "ng lint"
  }
}
```

### 8.2 Requirements Backend

```txt
# requirements.txt
fastapi==0.109.0
uvicorn==0.27.0
sqlalchemy==2.0.25
pydantic==2.5.3
python-multipart==0.0.6
httpx==0.26.0
python-dotenv==1.0.0
```

### 8.3 Commandes de lancement

```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate sur Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
ng serve --open
```

---

## 9. Checklist Technique

### Avant de coder:
- [ ] Setup projet Angular avec Tailwind
- [ ] Setup projet FastAPI avec SQLite
- [ ] Configurer CORS
- [ ] Créer les modèles DB
- [ ] Seed les données de démo
- [ ] Tester connexion Factory AI

### Pendant le dev:
- [ ] Design System components first
- [ ] API endpoints + Swagger docs
- [ ] Feature par feature (Home → Docs → Dashboard → Eve)
- [ ] Intégration progressive IA

### Avant la démo:
- [ ] Script de démo testé 10x
- [ ] Données de démo prêtes
- [ ] Fallbacks si IA lente
- [ ] Polish animations
