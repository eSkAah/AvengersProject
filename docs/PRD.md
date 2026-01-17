# PRD : Project Star-Eyes (Digital Engagement Platform POC)

**Type de projet :** Prototype / Hackathon (10 jours)
**Date de démo cible :** 29 du mois
**Stack Technique :** Angular (Frontend) + FastAPI (Backend) + Factory AI / Blackwell
**Philosophie :** Backend fonctionnel avec UI Premium 2026 - Au-delà du simple "Happy Path"

---

## 1. Contexte et Objectifs

Ce projet est un prototype technique ("Proof of Concept") destiné à deux audiences :

1. **Client (Externe) :** Un fonds immobilier. L'objectif est de "mettre des étoiles dans les yeux" du client lors d'un pitch commercial en montrant une interface interactive premium (au-delà du Figma).
2. **Finance Dept (Interne) :** Prouver que l'équipe interne peut livrer une solution intégrant l'IA (Factory AI) plus rapidement et efficacement que les prestataires externes.

### Vision Produit
> **"Star-Eyes : Une plateforme où l'IA comprend vos documents, répond en contexte, et anticipe vos besoins - le tout dans une UI premium digne de 2026."**

### Les 3 Preuves WOW de la Démo
1. **"L'IA comprend mes documents"** → Smart Classification automatique
2. **"L'IA répond en contexte"** → Eve Chatbot + Cmd+Click "Explain"
3. **"L'IA anticipe mes besoins"** → Risk badges + Prédictions proactives

---

## 2. Périmètre (Scope) & Contraintes

* **Mode "Startup Premium" :** Développement rapide mais UI/UX de qualité production.
* **Environnement :** Localhost accepté. Base de données locale (SQLite/JSON).
* **Backend Fonctionnel :** Contrairement à un simple prototype scripté, le backend FastAPI est réellement fonctionnel.
* **Données :** Dummy Data réalistes ou données fournies par le business via Excel.

---

## 3. Personas & Workflow

* **Client Cible :** Fonds Immobilier investissant dans plusieurs pays (France, Allemagne, Pays-Bas).
* **Service Cible :** *Corporate Tax* (Impôt sur les sociétés).
* **Concept d'Engagement :** Une obligation fiscale pour une entité spécifique (ex: "Corporate Tax Return - France Entity"). Un engagement a un cycle de vie (Attente → Reçu → En cours → Complété).

---

## 4. Design System - EY DNA + Premium 2026

### 4.1 Référence & Direction
**Base :** https://fmsp.ey.com/ (fonts, couleurs EY corporate)
**Direction :** Moderniser pour standards premium 2026 (Notion, Figma, Linear-level UX)

### 4.2 Palette de Couleurs

```
PRIMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━
Jaune EY Accent    #FFE600  (highlights, CTAs)
Jaune Hover        #FFD000  (interactions)

NEUTRALS
━━━━━━━━━━━━━━━━━━━━━━━━━━
Background Light   #FAFAFA  (main bg)
Surface            #FFFFFF  (cards)
Border             #E5E5E5  (séparateurs subtils)
Text Primary       #2E2E38  (titres, important)
Text Secondary     #6B7280  (descriptions)

SEMANTIC
━━━━━━━━━━━━━━━━━━━━━━━━━━
Success            #10B981  (vert moderne)
Warning            #F59E0B  (orange)
Error              #EF4444  (rouge)
Info               #3B82F6  (bleu)
```

### 4.3 Style UI 2026

| Élément | Style |
|---------|-------|
| **Cards** | bg-white, shadow-sm, rounded-xl (12-16px), border subtle |
| **Buttons** | Rounded-lg, padding généreux, hover scale 1.02 |
| **Inputs** | Border-gray-200, focus:ring-yellow, rounded-lg |
| **Tables** | Header sticky, row hover bg-gray-50, no borders lourds |
| **Modals** | Backdrop blur, slide-in animation, rounded-2xl |
| **Toasts** | Bottom-right, slide-up, auto-dismiss avec progress |
| **Navigation** | Sidebar collapsible, icons + labels, active = yellow accent |
| **Animations** | Transitions 200-300ms, micro-animations au hover |
| **Loading** | Skeleton loaders, pas de spinners basiques |

---

## 5. Spécifications Fonctionnelles (Par Module)

### 5.1 Landing Page (Tableau de Bord Global)

**Objectif :** Vue synthétique premium des engagements avec indicateurs intelligents.

| Feature | Description | Priorité |
|---------|-------------|----------|
| Liste des Engagements | Affichage moderne avec cards ou table premium | Must-Have |
| Risk Badges | Badges visuels rouge/orange/vert avec prédiction de risque retard | Must-Have |
| Notifications Intelligentes | Zone affichant alertes proactives ("Documents requis pour France") | Must-Have |
| Prédiction Deadline | "À ce rythme, France sera prêt le 25" | Must-Have |
| KPIs Globaux | Métriques clés animées en haut de page | Must-Have |

### 5.2 Document Library Premium

**Objectif :** Gestion documentaire moderne, style 2026 (pas SharePoint).

| Feature | Description | Priorité |
|---------|-------------|----------|
| Tree Navigation | Arborescence dossiers/engagements collapsible | Must-Have |
| Toggle Grid/List View | Switch entre vue grille et vue liste | Must-Have |
| Search & Filter | Recherche rapide avec filtres par type, date, engagement | Must-Have |
| Preview Inline | Aperçu du document sans quitter la page | Should-Have |
| Document Status Badges | "Analysé", "En attente", "Anomalie détectée" | Must-Have |
| Quick Actions on Hover | Download, Preview, Ask AI, Delete | Should-Have |
| Breadcrumb Navigation | Navigation contextuelle moderne | Must-Have |
| Tags Auto-générées | Métadonnées extraites par IA | Should-Have |

### 5.3 Smart Upload & Classification IA

**Objectif :** Upload intelligent - "Je drop, l'IA comprend, c'est rangé"

| Feature | Description | Priorité |
|---------|-------------|----------|
| Upload Single/Bulk | Zone de dépôt unique pour un ou plusieurs fichiers | Must-Have |
| Upload Async | Progress bar pour bulk, notification quand terminé | Must-Have |
| Auto-Détection Type | IA identifie le type (Grand Livre, Trial Balance, etc.) | Must-Have |
| Classification Auto | Routing automatique vers le bon engagement/dossier | Must-Have |
| Animation Classification | Feedback visuel fluide du fichier vers son dossier | Must-Have |
| Status Auto-Update | L'engagement passe de "Waiting" à "Processing" automatiquement | Must-Have |
| Alerte Anomalie | "Document incomplet (page 3 manquante?)" | Should-Have |

### 5.4 Dashboard & Charts Interactifs

**Objectif :** Vue analytique WOW avec intelligence contextuelle.

| Feature | Description | Priorité |
|---------|-------------|----------|
| KPIs Animés | Métriques clés avec animations d'entrée | Must-Have |
| Charts Interactifs | 2-3 graphiques clés (ChartJS/D3) | Must-Have |
| Hover Intelligent Contextuel | Tooltip enrichi avec données des documents liés | Must-Have |
| Lien vers Source | "Ce montant vient du Grand Livre ligne 234" | Must-Have |
| Click Drill-Down | Clic sur élément = filtrage/zoom | Must-Have |
| Comparaison N-1 | Superposition visuelle année précédente | Should-Have |
| Toggle Chart Types | Switch bar/pie/line | Should-Have |
| Export Chart | PNG/SVG direct | Nice-to-Have |

### 5.5 Assistant IA "Eve" - Chatbot Contextuel

**Objectif :** "Je demande, Eve sait de quoi je parle" - IA contextuelle par engagement.

| Feature | Description | Priorité |
|---------|-------------|----------|
| Chat Panel Sliding | Panneau latéral élégant, accessible partout | Must-Have |
| Contexte Engagement Auto | Eve connaît l'engagement actif et ses documents | Must-Have |
| Réponses avec Sources | Citations des documents avec liens directs | Must-Have |
| **Cmd+Click "Ask Eve"** | CMD (Mac) / ALT (Win) + Click sur chiffre = auto-prompt Eve | Must-Have |
| Tooltip "Hold CMD" | Indication au hover sur éléments cliquables | Must-Have |
| Explain Data | Explication détaillée de tout chiffre/KPI | Must-Have |
| Q&A sur Document | "Ask about this document" - questions sur doc spécifique | Must-Have |
| Résumé Auto Document | Génération de summary par IA | Should-Have |
| Comparaison Docs | "Compare ce Trial Balance avec N-1" | Should-Have |
| Génération Gantt | Timeline visuelle des obligations | Should-Have |
| Analyse KPI | "Pourquoi ce KPI est rouge?" | Must-Have |
| Historique Conversations | Par engagement, conservé | Should-Have |
| Export PDF | Télécharger l'échange | Nice-to-Have |
| Voice Input | Speech-to-text | Nice-to-Have |

### 5.6 Prédictions & Proactivité

**Objectif :** "L'app me dit ce qui va mal AVANT que je demande"

| Feature | Description | Priorité |
|---------|-------------|----------|
| Risk Scoring | Badges rouge/orange/vert sur chaque engagement | Must-Have |
| Prédiction Deadline | Estimation dynamique de completion | Must-Have |
| Alertes Proactives | Eve notifie spontanément les problèmes | Should-Have |
| Suggestion Cross-Engagement | "Allemagne aura besoin du même doc dans 2 semaines" | Should-Have |
| Cross-Sell EY Services | Suggestions basées sur documents uploadés | Should-Have |
| Comparaison Auto N-1 | Détection d'écarts anormaux | Should-Have |

---

## 6. Architecture Technique & Données

### 6.1 Stack

* **Frontend :** Angular 17+ avec standalone components
* **Backend :** FastAPI (Python) - API RESTful fonctionnelle
* **Base de Données :** SQLite ou JSON local pour la démo
* **AI Engine :** Factory AI / Blackwell (via API/Proxy)

### 6.2 Structure de Données (Modèle étendu)

```json
{
  "client": "Real Estate Fund Global",
  "engagements": [
    {
      "id": "ENG-FR-001",
      "entity": "France SPV",
      "service": "Corporate Tax",
      "status": "waiting_documents",
      "risk_level": "high",
      "due_date": "2026-02-29",
      "predicted_completion": "2026-02-25",
      "data": {
        "assets": 3378000,
        "liability": 1200000,
        "previous_year": { "assets": 2900000, "liability": 1100000 }
      },
      "documents_required": ["General Ledger", "Trial Balance"],
      "documents_uploaded": [],
      "ai_insights": [],
      "conversation_history": []
    }
  ],
  "documents": [
    {
      "id": "DOC-001",
      "name": "Grand_Livre_France_2026.xlsx",
      "type": "general_ledger",
      "engagement_id": "ENG-FR-001",
      "uploaded_at": "2026-01-15T10:30:00Z",
      "status": "analyzed",
      "ai_summary": "...",
      "extracted_data": {}
    }
  ]
}
```

---

## 7. Scénario de Démo (Script Amélioré)

Ce flux doit fonctionner parfaitement et créer des moments WOW.

### Flow Démo (8-10 minutes)

| Étape | Action | Moment WOW |
|-------|--------|------------|
| 1. **Arrivée** | Landing Page s'affiche | UI Premium, Risk badges visibles, notification "Docs manquants France" |
| 2. **Ask Eve** | "Quels documents manquent pour la France?" | Eve répond avec contexte: "Il manque le Grand Livre et le Trial Balance" |
| 3. **Document Library** | Navigation vers la bibliothèque | Tree view, toggle grid/list, design moderne |
| 4. **Upload** | Drag & drop de 3 fichiers | Animation fluide → Classification auto → "Grand Livre détecté → France" |
| 5. **Vérification** | Retour Landing Page | Badge France passé de rouge à orange, status "Processing" |
| 6. **Dashboard** | Clic sur engagement France | KPIs animés, charts interactifs |
| 7. **Cmd+Click** | CMD+Click sur "Total Assets: 3,378,000€" | Eve s'ouvre avec explication + source doc ligne 234 |
| 8. **Hover Chart** | Survol d'un point du graphique | Tooltip intelligent avec données contextuelles |
| 9. **Prédiction** | Vue du Risk Badge | "À ce rythme, deadline respectée avec 4 jours d'avance" |
| 10. **Gantt** (bonus) | "Eve, génère le planning" | Gantt visuel des obligations |

---

## 8. Priorisation des Features

### 8.1 Must-Have (9 features critiques)

| # | Feature | Jour(s) |
|---|---------|---------|
| M1 | Design System Premium (palette, composants, animations) | J1-2 |
| M2 | Landing Page + Liste Engagements + Risk Badges | J2-3 |
| M3 | Document Library (Tree + Grid/List + Search) | J3-5 |
| M4 | Smart Upload + Classification IA | J3-5 |
| M5 | Dashboard + Charts Interactifs + Hover Intelligent | J4-6 |
| M6 | Eve Chatbot Contextuel par Engagement | J5-7 |
| M7 | Cmd+Click "Ask Eve" (feature signature) | J6-7 |
| M8 | Risk Badges + Prédiction Deadline | J7-8 |
| M9 | Demo Flow Parfait (script testé) | J9-10 |

### 8.2 Should-Have (5 features fort impact)

| # | Feature |
|---|---------|
| S1 | Gantt auto-updating |
| S2 | Comparaison N-1 sur charts |
| S3 | Notifications proactives Eve |
| S4 | Cross-sell suggestions EY |
| S5 | Document preview inline |

### 8.3 Nice-to-Have (6 bonus)

| # | Feature |
|---|---------|
| N1 | Dark mode |
| N2 | Voice input Eve |
| N3 | Command palette (Cmd+K) |
| N4 | Confetti on completion |
| N5 | Keyboard shortcuts complets |
| N6 | Export conversation PDF |

---

## 9. Roadmap 10 Jours

```
J1  ████████░░  Design System + Setup projet Angular/FastAPI
J2  ████████░░  Layout Shell + Navigation + Landing Page
J3  ██████████  Document Library (structure + tree)
J4  ██████████  Upload + Classification IA (backend Factory AI)
J5  ██████████  Document Library (UI complète) + Dashboard start
J6  ██████████  Dashboard + Charts + Hover intelligent
J7  ██████████  Eve Chatbot + Cmd+Click integration
J8  ████████░░  Risk badges + Prédictions + Polish
J9  ██████░░░░  Demo script + Tests du flow complet
J10 ██████░░░░  Polish final + Répétition démo
```

---

## 10. Critères de Succès

### Pour la Démo
- [ ] UI perçue comme "produit fini", pas un POC bancal
- [ ] Chaque feature IA fonctionne sans erreur sur le flow démo
- [ ] Temps de réponse Eve < 3 secondes
- [ ] Zero bug visible pendant la présentation
- [ ] Client dit "WOW" au moins 3 fois

### Pour l'Équipe Interne
- [ ] Preuve que Factory AI est intégrable rapidement
- [ ] Code réutilisable pour futurs projets
- [ ] Documentation technique suffisante

---

## 11. Spécifications Détaillées - Eve (Assistant IA)

### 11.1 Personnalité & Ton

| Attribut | Valeur |
|----------|--------|
| **Style** | Corporate, formel, professionnel EY |
| **Vouvoiement** | Oui, toujours |
| **Emojis** | Non |
| **Ton** | Informatif, précis, concis |
| **Rôle** | Consultante read-only - guide et informe |

### 11.2 Capacités

| Capacité | Statut | Description |
|----------|--------|-------------|
| Consulter documents | ✅ | Accès lecture à tous les documents uploadés |
| Expliquer données | ✅ | Analyse et explique chiffres, KPIs, tendances |
| Guider utilisateur | ✅ | Recommandations, next steps, alertes |
| Citer sources | ✅ | "Ce montant provient du Grand Livre, ligne 234" |
| Comparer données | ✅ | N vs N-1, entre entités |
| Générer visualisations | ✅ | Gantt, charts sur demande |
| Modifier données | ❌ | Lecture seule |
| Supprimer documents | ❌ | Pas de suppression |
| Envoyer emails | ❌ | Pas d'actions externes |

### 11.3 Exemples de Réponses

**Question:** "Quels documents manquent pour la France?"
```
Pour l'engagement France SPV (Corporate Tax), les documents suivants
sont encore requis :
- General Ledger (Grand Livre)
- Trial Balance

Une fois ces documents uploadés, l'analyse pourra être finalisée.
```

**Question:** "Explique ce montant de 3,378,000€"
```
Le montant Total Assets de 3 378 000 € pour France SPV se décompose
comme suit :

- Immobilisations : 2 100 000 € (62%)
- Actifs circulants : 978 000 € (29%)
- Trésorerie : 300 000 € (9%)

Source : Grand_Livre_France_2026.xlsx, lignes 45-78

Ce montant représente une hausse de +16,5% par rapport à l'exercice
précédent (2 900 000 €).
```

### 11.4 Fallbacks

| Situation | Message |
|-----------|---------|
| Ne comprend pas | "Je n'ai pas compris votre demande. Pourriez-vous reformuler votre question ?" |
| Timeout/Erreur | "Une erreur technique s'est produite. Veuillez réessayer dans quelques instants." |
| Hors périmètre | "Cette action n'est pas disponible. Je peux uniquement consulter et analyser les données." |

---

## 12. Spécifications Détaillées - Documents

### 12.1 Types de Documents Supportés

| Type | Code | Description | Obligatoire |
|------|------|-------------|-------------|
| General Ledger | `general_ledger` | Grand Livre comptable | ✅ Oui |
| Trial Balance | `trial_balance` | Balance générale | ✅ Oui |
| Tax Return | `tax_return` | Déclaration fiscale | Non |
| Financial Statements | `financial_statement` | États financiers | Non |

### 12.2 Formats Supportés

| Format | Extension | Support |
|--------|-----------|---------|
| Excel | .xlsx, .xls | ✅ Principal |
| PDF | .pdf | ✅ Supporté |
| CSV | .csv | ✅ Supporté |

### 12.3 Logique de Classification IA

Pour le POC, classification simplifiée (scriptable) :

```python
def classify_document(file):
    # Par nom de fichier
    if "ledger" in filename.lower() or "grand_livre" in filename.lower():
        return "general_ledger"
    if "trial" in filename.lower() or "balance" in filename.lower():
        return "trial_balance"
    if "tax" in filename.lower() or "fiscal" in filename.lower():
        return "tax_return"

    # Par structure (si Excel)
    if has_columns(["Date", "Account", "Debit", "Credit"]):
        return "general_ledger"
    if has_columns(["Account", "Balance"]):
        return "trial_balance"

    # Fallback: demander à Factory AI
    return ai_classify(file_content)
```

---

## 13. Spécifications Détaillées - Data Model

### 13.1 Schéma Complet

```
ENGAGEMENT
══════════════════════════════════════════════════════════
id                  string      "ENG-FR-001"
entity_name         string      "France SPV"
country_code        string      "FR"
country_name        string      "France"
service_type        string      "Corporate Tax"
status              enum        waiting|received|processing|completed
risk_level          enum        high|medium|low
due_date            date        "2026-02-29"
predicted_completion date       "2026-02-25"
completion_percent  int         0-100
documents_required  array       ["General Ledger", "Trial Balance"]
financial_data      object      { embedded - voir ci-dessous }
ai_insights         array       ["Alerte: écart N-1 > 15%", ...]
created_at          datetime
updated_at          datetime

DOCUMENT
══════════════════════════════════════════════════════════
id                  string      "DOC-001"
engagement_id       string      "ENG-FR-001"
name                string      "Grand_Livre_France_2026.xlsx"
type                enum        general_ledger|trial_balance|tax_return|financial_statement
format              string      "xlsx"
size_bytes          int         245000
status              enum        uploaded|analyzing|analyzed|error
ai_summary          string      "Grand Livre 2026, 3,378 lignes..."
extracted_data      object      { données clés extraites }
source_lines        object      { mapping chiffres → lignes }
uploaded_at         datetime

CONVERSATION
══════════════════════════════════════════════════════════
id                  string      "CONV-001"
engagement_id       string      "ENG-FR-001"
messages            array       [{ role, content, timestamp }, ...]
created_at          datetime
updated_at          datetime

FINANCIAL_DATA (embedded)
══════════════════════════════════════════════════════════
{
  "current_year": {
    "total_assets": 3378000,
    "total_liabilities": 1200000,
    "net_equity": 2178000,
    "revenue": 850000,
    "expenses": 620000
  },
  "previous_year": {
    "total_assets": 2900000,
    "total_liabilities": 1100000,
    "net_equity": 1800000,
    "revenue": 780000,
    "expenses": 590000
  },
  "variance_percent": {
    "total_assets": 16.5,
    "total_liabilities": 9.1,
    "net_equity": 21.0,
    "revenue": 9.0,
    "expenses": 5.1
  }
}
```

---

## 14. Spécifications Détaillées - API Endpoints

### 14.1 Engagements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/engagements` | Liste tous les engagements |
| GET | `/api/engagements/{id}` | Détail d'un engagement |
| GET | `/api/engagements/{id}/stats` | KPIs calculés pour dashboard |

### 14.2 Documents

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/documents` | Liste tous les documents |
| GET | `/api/documents?engagement={id}` | Documents d'un engagement |
| POST | `/api/documents/upload` | Upload + classification IA |
| GET | `/api/documents/{id}` | Détail document |
| GET | `/api/documents/{id}/content` | Contenu/preview |

### 14.3 Eve (IA)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/eve/chat` | Envoyer message, recevoir réponse |
| POST | `/api/eve/explain` | Expliquer un chiffre (Cmd+Click) |
| GET | `/api/eve/conversations/{engagement_id}` | Historique conversations |

### 14.4 Dashboard

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/dashboard/kpis` | KPIs globaux |
| GET | `/api/dashboard/charts/{type}` | Données pour chart spécifique |

---

## 15. Spécifications Détaillées - Layout & Wireframes

### 15.1 Structure Globale

```
┌──────────────────────────────────────────────────────────────┐
│                         HEADER                                │
│  [Logo EY] Star-Eyes              [🔔 Notifs] [👤 Profile]   │
├────────┬─────────────────────────────────────────────────────┤
│        │                                                      │
│  S     │                    MAIN CONTENT                      │
│  I     │                                                      │
│  D     │                                                      │
│  E     │                                                      │
│  B     │                                                      │
│  A     │                                                      │
│  R     │                                                      │
│        │                                          ┌────────┐  │
│        │                                          │💬 Eve  │  │
│        │                                          └────────┘  │
└────────┴─────────────────────────────────────────────────────┘
```

### 15.2 Sidebar Navigation

```
┌────────────┐
│  ⬡ EY     │  ← Logo
├────────────┤
│            │
│  🏠 Home   │  ← Active = jaune
│            │
│  📁 Docs   │
│            │
│  📊 Dash   │
│            │
│  ⚙️ Config │
│            │
├────────────┤
│  ◀ Reduce │  ← Collapse toggle
└────────────┘
```

### 15.3 Landing Page - Liste Engagements (Accordéon)

```
┌─ ENGAGEMENTS ────────────────────────────────────────────────┐
│                                                              │
│  🔴 France SPV                                         ⌄     │
│     Corporate Tax · Waiting · Due 29 Feb                     │
│     ████████░░░░ 67% · 2 docs manquants                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Documents: General Ledger ✅  Trial Balance ❌        │   │
│  │ Prédiction: Complet le 25 Feb (+4j marge)            │   │
│  │ [Voir Dashboard]  [Upload Docs]  [💬 Ask Eve]        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  🟠 Germany PropCo                                     ⌄     │
│     Corporate Tax · Processing · Due 15 Mar                  │
│     ████████████░ 85% · En analyse                          │
│                                                              │
│  🟢 Netherlands BV                                     ⌄     │
│     Corporate Tax · Completed · Due 01 Feb                   │
│     ████████████ 100% · Terminé                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 15.4 KPIs Header

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  📊 12   │ │  ⏳ 4    │ │  🔴 2    │ │  ✅ 6    │
│  Total   │ │ En cours │ │ À risque │ │ Complétés│
│ Engmts   │ │          │ │          │ │          │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
     ↓            ↓            ↓            ↓
  (cliquable = filtre la liste)
```

---

## 16. Spécifications Détaillées - Risk Logic

### 16.1 Calcul Risk Level

```python
def calculate_risk_level(engagement):
    days_remaining = (due_date - today).days
    completion = completion_percent
    docs_missing = len(documents_required) - len(documents_uploaded)

    # HIGH (Rouge)
    if days_remaining < 7 and completion < 80:
        return "high"
    if days_remaining < 7 and docs_missing > 0:
        return "high"

    # MEDIUM (Orange)
    if days_remaining < 14 and completion < 90:
        return "medium"
    if status == "analyzing" and analyzing_since > 48_hours:
        return "medium"

    # LOW (Vert)
    if status == "completed":
        return "low"
    if completion >= 90:
        return "low"
    if days_remaining >= 14:
        return "low"

    return "medium"  # Default
```

### 16.2 Calcul Prédiction Deadline

```python
def predict_completion(engagement):
    days_elapsed = (today - created_at).days
    if days_elapsed == 0:
        return None  # Pas assez de données

    velocity = completion_percent / days_elapsed  # % par jour
    remaining = 100 - completion_percent

    if velocity == 0:
        return None  # Stagnant

    days_to_complete = remaining / velocity
    predicted_date = today + timedelta(days=days_to_complete)

    return predicted_date
```

### 16.3 Seuils Résumés

| Risk | Condition |
|------|-----------|
| 🔴 HIGH | < 7j ET < 80% OU docs manquants à J-7 |
| 🟠 MEDIUM | 7-14j ET < 90% OU analyse > 48h |
| 🟢 LOW | > 14j OU >= 90% OU completed |

---

## 17. Dataset Démo

### 17.1 Engagements

| Entity | Country | Status | Risk | Completion | Due Date | Scénario |
|--------|---------|--------|------|------------|----------|----------|
| France SPV | 🇫🇷 FR | waiting | 🔴 HIGH | 67% | 29 Feb | **HERO** - Upload démo |
| Germany PropCo | 🇩🇪 DE | processing | 🟠 MED | 85% | 15 Mar | En analyse |
| Netherlands BV | 🇳🇱 NL | completed | 🟢 LOW | 100% | 01 Feb | Terminé |
| Belgium HoldCo | 🇧🇪 BE | received | 🟠 MED | 45% | 20 Mar | Docs récents |
| Luxembourg Fund | 🇱🇺 LU | waiting | 🔴 HIGH | 20% | 25 Feb | Critique |

### 17.2 Données Financières

| Entity | Assets | Liabilities | Revenue | YoY |
|--------|--------|-------------|---------|-----|
| France SPV | 3,378,000 € | 1,200,000 € | 850,000 € | +16.5% |
| Germany PropCo | 5,200,000 € | 4,100,000 € | 1,200,000 € | +8.2% |
| Netherlands BV | 2,100,000 € | 890,000 € | 620,000 € | +12.1% |
| Belgium HoldCo | 4,500,000 € | 2,800,000 € | 980,000 € | -3.4% 🔴 |
| Luxembourg Fund | 8,900,000 € | 6,200,000 € | 2,100,000 € | +22.7% |

### 17.3 Documents Pré-chargés

| Entity | Documents | Status |
|--------|-----------|--------|
| France SPV | 0 | Pour upload live démo |
| Germany PropCo | General Ledger, Trial Balance | analyzing |
| Netherlands BV | Tous (4 docs) | analyzed |
| Belgium HoldCo | General Ledger | analyzed |
| Luxembourg Fund | 0 | Critique - démo alerte |
