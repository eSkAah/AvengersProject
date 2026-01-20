# PRD : Avengers Project (Digital Engagement Platform POC)

**Type de projet :** Prototype / Hackathon (10 jours)
**Date de demo cible :** 29 du mois
**Stack Technique :** Angular (Frontend) + FastAPI (Backend) + OpenAI GPT-4o
**Philosophie :** Backend fonctionnel avec UI Premium 2026 - Au-dela du simple "Happy Path"
**Version :** 2.0 - Post-Demo Iteration

---

## 1. Contexte et Objectifs

Ce projet est un prototype technique ("Proof of Concept") destine a deux audiences :

1. **Client (Externe) :** Un fonds immobilier. L'objectif est de "mettre des etoiles dans les yeux" du client lors d'un pitch commercial en montrant une interface interactive premium (au-dela du Figma).
2. **Finance Dept (Interne) :** Prouver que l'equipe interne peut livrer une solution integrant l'IA (Factory AI) plus rapidement et efficacement que les prestataires externes.

### Vision Produit
> **"Avengers Project : Une plateforme ou l'IA comprend vos documents, repond en contexte, et anticipe vos besoins - le tout dans une UI premium digne de 2026."**

### Les 3 Preuves WOW de la Demo
1. **"L'IA comprend mes documents"** - Smart Classification automatique avec validation utilisateur
2. **"L'IA repond en contexte"** - Eve Chatbot + CMD+Click "Explain" sur tous les graphiques
3. **"L'IA anticipe mes besoins"** - Risk badges + Predictions proactives + Insights agrégées

---

## 2. Perimetre (Scope) & Contraintes

### 2.1 Service Cible : Company Tax Return (CTR)

**Focus exclusif sur le service CTR** (sous-service de Tax) pour la demo.

Le CTR (Company Tax Return) est le service de declaration fiscale d'entreprise propose par EY. Pour effectuer ce service, le client doit fournir **4 documents obligatoires** :

| # | Document | Description |
|---|----------|-------------|
| 1 | **Tax Assessment N-1** | Avis d'imposition de l'annee precedente |
| 2 | **General Ledger** | Grand livre comptable |
| 3 | **Trial Balance** | Balance generale |
| 4 | **Financial Statement** | Etats financiers / Comptes annuels |

**Resultat du service CTR :**
- **PDF** : Rapport CTR genere
- **XML** : Fichier iXBRL avec donnees tagguees (format HMRC)

### 2.2 Contraintes Techniques

* **Mode "Startup Premium" :** Developpement rapide mais UI/UX de qualite production.
* **Environnement :** Localhost accepte. Base de donnees locale (SQLite).
* **Backend Fonctionnel :** Contrairement a un simple prototype script, le backend FastAPI est reellement fonctionnel.
* **Donnees :** Dummy Data realistes pre-seedees via `seed.py`.

---

## 3. Personas & Workflow

* **Client Cible :** Fonds Immobilier investissant dans plusieurs pays (France, Allemagne, Pays-Bas, Belgique, Luxembourg).
* **Service Cible :** Company Tax Return (CTR)
* **Concept d'Engagement :** Une obligation fiscale pour une entite specifique (ex: "CTR - France SPV 2026"). Un engagement a un cycle de vie (Attente → Recu → En cours → Complete).
* **Multi-Engagement :** Une entite peut avoir plusieurs engagements (annees fiscales differentes).

### 3.1 Etats des Entites pour la Demo

| Scenario | Description | Exemple |
|----------|-------------|---------|
| **Hero (Demo)** | 3/4 documents fournis, 1 manquant | France SPV |
| **Complete** | 4/4 documents + resultat CTR disponible | Netherlands BV |
| **Documents 2025** | Documents de 2025 fournis, besoin 2026 | Germany PropCo |
| **Vide** | Aucun document fourni | Belgium HoldCo |

---

## 4. Design System - Premium 2026

### 4.1 Direction Artistique

**Philosophie :** Design premium, neutre, moins colore. Touches d'accent subtiles.

| Aspect | Direction |
|--------|-----------|
| **Couleurs** | Palette neutre dominante, accents EY Yellow subtils |
| **Style** | Clean, minimal, professionnel |
| **Effet** | Premium, pas "rainbow" |

### 4.2 Palette de Couleurs

```
PRIMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━
Jaune EY Accent    #FFE600  (accents subtils, CTAs)
Jaune Hover        #FFD000  (interactions)

NEUTRALS
━━━━━━━━━━━━━━━━━━━━━━━━━━
Background Light   #FAFAFA  (main bg)
Surface            #FFFFFF  (cards)
Border             #E5E5E5  (separateurs subtils)
Text Primary       #2E2E38  (titres, important)
Text Secondary     #6B7280  (descriptions)
Navbar Dark        #1F2937  (navbar background)

SEMANTIC
━━━━━━━━━━━━━━━━━━━━━━━━━━
Success            #10B981  (vert moderne)
Warning            #F59E0B  (orange)
Error              #EF4444  (rouge)
Info               #3B82F6  (bleu)
```

### 4.3 Style UI 2026

| Element | Style |
|---------|-------|
| **Navbar** | Horizontal, dark theme (#1F2937), full width |
| **Cards** | bg-white, shadow-sm, rounded-xl (12-16px), border subtle |
| **Buttons** | Rounded-lg, padding genereux, hover scale 1.02 |
| **Inputs** | Border-gray-200, focus:ring-yellow, rounded-lg |
| **Tables** | Header sticky, row hover bg-gray-50, no borders lourds |
| **Filters** | Small pills/chips inline, discret, premium |
| **Modals** | Backdrop blur, slide-in animation, rounded-2xl |
| **Toasts** | Bottom-right, slide-up, auto-dismiss avec progress |
| **Animations** | Transitions 200-300ms, micro-animations au hover |
| **Loading** | Skeleton loaders, pas de spinners basiques |

---

## 5. Specifications Fonctionnelles (Par Module)

### 5.1 Navigation - Navbar Horizontale

**Changement majeur :** La sidebar disparait et devient une navbar horizontale dark.

#### 5.1.1 Structure Navbar

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo Client] Company Name  │ Home │ Engagements │ Doclib │ Structure │ Insights │     [🔔] [Avatar ▼] │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Position | Element | Comportement |
|----------|---------|--------------|
| **Gauche** | Logo + Nom entreprise | Dynamique par client |
| **Centre** | Menu principal | Home, Engagements, Doclib, Structure, Insights |
| **Droite** | Notifications + User | Bell icon + Avatar avec menu logout |

#### 5.1.2 Comportements

| Feature | Description |
|---------|-------------|
| **Active State** | Underline ou subtle background sur item actif |
| **Responsive** | Collapse en hamburger menu sur mobile |
| **Eve FAB** | Reste en floating bottom-right |

---

### 5.2 Home - Dashboard (Bento Layout)

**Objectif :** Vue d'ensemble actionnable avec focus sur les taches urgentes.

#### 5.2.1 Layout Bento

```
┌─────────────────────────────────────┬──────────────────────┐
│                                     │                      │
│   UPLOAD / MISSING DOCS             │   ENGAGEMENT         │
│   (Widget Hero - tall)              │   STATUS DONUT       │
│                                     │   (compact)          │
│   - Drag & drop zone                │                      │
│   - Missing docs list with          │   Late | In Progress │
│     tooltip (which engagements)     │   | Soon             │
│   - Individual upload buttons       │                      │
│   - "View All" → Doclib             │                      │
├─────────────────────────────────────┼──────────────────────┤
│                                     │                      │
│   DOCUMENTS TO SIGN OFF             │   ENGAGEMENT LIST    │
│   (medium)                          │   (large)            │
│                                     │                      │
│   - Entity | Doc Name | Action      │   - Filtered by      │
│   - Action → go to engagement       │     donut selection  │
│                                     │   - Shows top 5      │
│                                     │   - "View All" with  │
│                                     │     active filter    │
└─────────────────────────────────────┴──────────────────────┘
```

#### 5.2.2 Widget Details

**Widget 1: Upload / Missing Documents (Hero)**

| Element | Description |
|---------|-------------|
| **Drag & Drop Zone** | Zone pour upload multi-fichiers |
| **Missing Docs List** | Liste des documents manquants avec icone info |
| **Tooltip Info** | Au hover, montre quels engagements ont besoin de ce document |
| **Upload Button** | Bouton upload individuel par document |
| **Auto-Classification** | Documents uploades sont classes automatiquement |
| **View All** | Lien vers Document Library |

**Widget 2: Engagement Status Donut**

| Element | Description |
|---------|-------------|
| **Segments** | Late (rouge), In Progress (bleu), Soon (orange) |
| **Chiffres** | Nombres affiches a l'interieur du donut |
| **Interaction** | Clic sur segment → filtre la liste des engagements |

**Widget 3: Documents to Sign Off**

| Element | Description |
|---------|-------------|
| **Colonnes** | Entity, Document Name, Action |
| **Action Button** | Redirige vers l'engagement pour validation |
| **Liste** | Documents necessitant verification/approbation |

**Widget 4: Engagement List**

| Element | Description |
|---------|-------------|
| **Filtrage** | Filtre par segment du donut selectionne |
| **Affichage** | Top 5 engagements du statut selectionne |
| **View All** | Redirige vers Engagements avec filtre actif preserve |

#### 5.2.3 Elements Retires du Dashboard

- ~~Notifications widget~~ → Deplace vers bell icon navbar
- ~~Key Indicators~~
- ~~Action Center~~

---

### 5.3 Page Engagements

**Objectif :** Trouver et acceder rapidement a n'importe quel engagement.

#### 5.3.1 Toggle Vue Cards / Table

| Mode | Description | Default |
|------|-------------|---------|
| **Cards** | Affichage en cartes expandables | ✅ Par defaut |
| **Table** | Affichage tabulaire avec rows expandables | Option |

#### 5.3.2 Filtres (Pills/Chips Inline)

**Style :** Small pills/chips, inline, discret, premium - pas de bloc de filtres.

| Filtre | Type |
|--------|------|
| **Search** | Recherche par entite |
| **Year** | Dropdown annee |
| **Status** | Late, In Progress, Soon, Completed |
| **Risk** | High, Medium, Low |
| **Service** | CTR (et autres si besoin) |

#### 5.3.3 Vue Cards (Expandable)

**Card fermee :**
- Entity name
- Status badge
- Progress bar
- Risk badge
- Country flag

**Card ouverte (expand) :**
- Documents requis (X/Y manquants)
- Bouton "Details" (→ engagement detail)
- Bouton Eve (questions contextuelles)

#### 5.3.4 Vue Table

**Colonnes :**

| Entity | Status | Progress | Risk | Year | Documents | Actions |
|--------|--------|----------|------|------|-----------|---------|

**Row Expandable :** Memes informations que la card ouverte.

---

### 5.4 Page Structure Organisationnelle

**Objectif :** Visualiser la hierarchie des entites avec relations de propriete.

#### 5.4.1 Fonctionnalites

| Feature | Description |
|---------|-------------|
| **Ownership Percentages** | Affiches sur les lignes de connexion |
| **Cross-Shareholding** | Deux fleches separees avec leurs pourcentages |
| **Country Flags** | Drapeau du pays sur chaque entite |
| **Auto-Layout** | Arrangement automatique base sur la hierarchie de propriete |
| **Click → Drawer** | Clic sur entite ouvre un drawer lateral |
| **Drawer Content** | Liste des engagements de l'entite |
| **Navigation** | Clic sur engagement → redirection vers cet engagement |

#### 5.4.2 Exemple Structure

```
            ┌─────────────────────┐
            │  Luxembourg Fund    │
            │  (Top HoldCo)       │
            └──────────┬──────────┘
                       │ 100%
            ┌──────────┴──────────┐
            │                     │
       ┌────▼────┐          ┌─────▼─────┐
       │ Belgium │───20%───►│ Netherlands│
       │ HoldCo  │◄───15%───│ BV         │
       │ 🇧🇪     │          │ 🇳🇱        │
       └────┬────┘          └─────┬─────┘
            │ 100%                │ 100%
       ┌────▼────┐          ┌─────▼─────┐
       │ France  │          │ Germany   │
       │ SPV 🇫🇷 │          │ PropCo 🇩🇪│
       └─────────┘          └───────────┘
```

---

### 5.5 Document Library (Doclib)

**Objectif :** Gestion documentaire avec focus sur les documents manquants.

#### 5.5.1 Filtres

| Filtre | Action |
|--------|--------|
| **Entity** | Toggle on/off - si off, montre tous les documents |
| **Document Status** | Filter par statut (Missing, Uploaded, Analyzed, etc.) |
| ~~Search by Name~~ | **RETIRE** |

#### 5.5.2 Documents Manquants

| Feature | Description |
|---------|-------------|
| **Missing Status** | Documents demandes mais non uploades apparaissent avec statut "Missing" |
| **Upload Direct** | Possibilite d'uploader directement depuis cette vue |
| **Visibilite** | Voir ce qui manque facilement |

#### 5.5.3 Bulk Download

| Feature | Description |
|---------|-------------|
| **Progress Bar** | Affichee sous le bouton download pendant le telechargement |
| **Notification** | Notification une fois tous les downloads completes |

#### 5.5.4 Tree Navigation

| Feature | Description |
|---------|-------------|
| **Filtre Entity** | Peut seulement toggle entity filter on/off |
| **Pas de selection all** | Ne peut pas selectionner tous les documents dans l'arbre |
| **Remove filter** | Si filtre entity retire → montre tous les documents de toutes les entites |

---

### 5.6 Smart Upload & Classification IA avec Validation

**Objectif :** Upload intelligent avec validation utilisateur avant placement.

#### 5.6.1 Flow Upload

```
Upload (single/bulk)
       ↓
IA classifie chaque document
       ↓
Popup/Notification → redirige vers Attribution Screen
       ↓
┌─────────────────────────────────────────────────────────────┐
│  ATTRIBUTION REVIEW                                         │
│                                                             │
│  Document          Entity        Year    Type        Action │
│  ─────────────────────────────────────────────────────────  │
│  file1.pdf    →    France SPV    2026    GL          [✓]   │
│  file2.xlsx   →    Germany Co    2025    TB          [✎]   │
│  file3.pdf    →    ???           ???     ???         [✎]   │
│                                                             │
│                    [Validate & Place]                       │
└─────────────────────────────────────────────────────────────┘
       ↓
User corrige si necessaire → Validate
       ↓
Animation: documents places dans doclib
```

#### 5.6.2 Attribution Screen

| Colonne | Description |
|---------|-------------|
| **Document** | Nom du fichier uploade |
| **Entity** | Entite attribuee par l'IA |
| **Year** | Annee attribuee par l'IA |
| **Type** | Type de document (GL, TB, Tax Assessment, Financial Statement) |
| **Action** | Valider (✓) ou Editer (✎) |

| Feature | Description |
|---------|-------------|
| **AI Attribution** | L'IA propose entity, year, document type |
| **Manual Correction** | L'utilisateur peut corriger chaque attribution |
| **Validate Button** | Confirme toutes les attributions |
| **Animation** | Documents "volent" vers leur emplacement dans doclib |

---

### 5.7 Engagement Detail - Onglet Results (NOUVEAU)

**Objectif :** Afficher les resultats du CTR une fois le service complete.

#### 5.7.1 Activation

L'onglet Results devient actif quand :
- Les 4 documents sont valides
- Le service CTR a ete effectue
- Un resultat est disponible

#### 5.7.2 Contenu

```
┌─────────────────────────────────────────────────────────────────┐
│  RESULTS                                                        │
│                                                                 │
│  [Documents]                    [Charts]                        │
│  ├── CTR_Report.pdf             ┌─────────────────────────────┐ │
│  └── CTR_Data.xml               │  ETR Reconciliation         │ │
│                                 │  (Waterfall chart)          │ │
│                                 │  CMD+Click on bars          │ │
│                                 └─────────────────────────────┘ │
│                                 ┌─────────────────────────────┐ │
│                                 │  Current vs Deferred Tax    │ │
│                                 │  (Donut chart)              │ │
│                                 └─────────────────────────────┘ │
│                                 ┌─────────────────────────────┐ │
│                                 │  Tax by Category            │ │
│                                 │  (Bar chart)                │ │
│                                 └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.7.3 Documents Resultat

| Document | Format | Description |
|----------|--------|-------------|
| **CTR Report** | PDF | Rapport de declaration fiscale |
| **CTR Data** | XML | Fichier iXBRL avec donnees tagguees |

#### 5.7.4 Charts CTR

| Chart | Type | Description |
|-------|------|-------------|
| **ETR Reconciliation** | Waterfall | Statutory rate → Effective rate avec adjustments |
| **Current vs Deferred** | Donut | Repartition impot courant vs differe |
| **Tax by Category** | Bar | Breakdown par categorie |
| **KPI Cards** | Cards | Tax Liability, Effective Rate %, Pre-tax Income |

**Eve Integration :** CMD+Click sur n'importe quelle barre/segment → question a Eve.

---

### 5.8 Page Insights (NOUVELLE)

**Objectif :** Vue portfolio agrégée de tous les KPIs CTR.

#### 5.8.1 KPI Cards

| KPI | Description |
|-----|-------------|
| **Total Tax Liability** | Somme des impots de toutes les entites |
| **Avg Effective Tax Rate** | Taux effectif moyen pondere |
| **CTRs Completed** | X/Y engagements avec resultats delivres |
| **Entities at Risk** | Entites en retard, docs manquants, anomalies |

#### 5.8.2 Charts (Tous CMD+Clickable)

| Chart | Type | Description | Eve Example |
|-------|------|-------------|-------------|
| **Tax by Entity** | Horizontal Bar | Compare montants absolus par entite | "Why is France SPV's tax €800K?" |
| **ETR by Entity** | Bar + ref line | Compare taux effectifs (ligne ref = statutory) | "Why is Germany's rate higher than statutory?" |
| **YoY Comparison** | Grouped Bar | Tendance N vs N-1 agregee | "What caused the increase from 2025 to 2026?" |
| **Tax by Jurisdiction** | Donut | Distribution geographique | "What's the statutory rate in Netherlands?" |

#### 5.8.3 Filtres

| Filtre | Type |
|--------|------|
| **Year** | Selector (2026, 2025, etc.) |
| **Entity** | Multi-select (pour focus sur subset) |

---

### 5.9 Assistant IA "Eve" - Chatbot Contextuel

**Objectif :** "Je demande, Eve sait de quoi je parle" - IA contextuelle.

**Moteur IA :** OpenAI GPT-4o-mini

#### 5.9.1 Logique de Contexte

| Contexte | Donnees Accessibles |
|----------|---------------------|
| **Dans un Engagement** | Details engagement, documents, donnees financieres, resultats CTR |
| **Page Insights** | KPIs agreges, comparaisons cross-entites |
| **Vue Globale** | Liste des engagements, aide generale |

#### 5.9.2 CMD+Click Integration

| Location | Comportement |
|----------|--------------|
| **Dashboard** | CMD+Click sur valeur → Eve explique |
| **Results Tab Charts** | CMD+Click sur barre → Eve explique ce data point |
| **Insights Charts** | CMD+Click sur segment → Eve explique avec contexte global |

#### 5.9.3 Features

| Feature | Description |
|---------|-------------|
| **Chat Panel Sliding** | Panneau lateral elegant, accessible partout |
| **Contexte Auto** | Eve connait l'engagement actif et ses documents |
| **Auto-Switch Contexte** | Bascule automatique vers engagement mentionne |
| **Reponses avec Sources** | Citations des documents avec liens directs |
| **Quick Prompts** | 4 boutons pre-definis pour questions frequentes |

#### 5.9.4 Personnalite & Ton

| Attribut | Valeur |
|----------|--------|
| **Style** | Corporate, formel, professionnel EY |
| **Vouvoiement** | Oui, toujours |
| **Emojis** | Non |
| **Ton** | Informatif, precis, concis |
| **Role** | Consultante read-only - guide et informe |

---

### 5.10 Notifications

**Objectif :** Alerter proactivement sur les evenements importants.

| Feature | Description |
|---------|-------------|
| **Location** | Bell icon dans navbar (droite) |
| **Badge** | Compteur unread |
| **Types** | Risk escalation, Deadline approaching, Document uploaded |
| **Actions** | Dismiss individual, Dismiss all |
| **Click** | Redirige vers l'element concerne |

---

## 6. Architecture Technique & Donnees

### 6.1 Stack

* **Frontend :** Angular 19+ avec standalone components, Signals
* **Backend :** FastAPI (Python 3.11+) - API RESTful fonctionnelle
* **Base de Donnees :** SQLite async (aiosqlite)
* **AI Engine :** OpenAI GPT-4o-mini (via API REST avec cle dans .env)
* **Charts :** Chart.js + ng2-charts
* **Icons :** Lucide Icons
* **CSS :** Tailwind CSS v3

### 6.2 Structure de Donnees

```
ENGAGEMENT
══════════════════════════════════════════════════════════
id                  string      "ENG-FR-001"
entity_name         string      "France SPV"
country_code        string      "FR"
country_name        string      "France"
service_type        string      "CTR" (Company Tax Return)
status              enum        waiting|received|processing|completed
risk_level          enum        high|medium|low
due_date            date        "2026-02-29"
completion_percent  int         0-100
documents_required  array       ["Tax Assessment N-1", "General Ledger", "Trial Balance", "Financial Statement"]
ctr_result          object      { pdf_path, xml_path, generated_at } (null si pas complete)
created_at          datetime
updated_at          datetime

DOCUMENT
══════════════════════════════════════════════════════════
id                  string      "DOC-001"
name                string      "General_Ledger_France_2026.xlsx"
type                enum        tax_assessment|general_ledger|trial_balance|financial_statement|ctr_report|ctr_xml
year                int         2026
format              string      "xlsx"
status              enum        missing|uploaded|analyzing|analyzed|validated|error
engagement_id       string      FK → engagements.id
entity_id           string      FK → entities.id
file_path           string      "./uploads/..."
uploaded_at         datetime

ENTITY
══════════════════════════════════════════════════════════
id                  string      "ENT-001"
name                string      "France SPV"
country_code        string      "FR"
country_name        string      "France"
parent_entity_id    string      FK → entities.id (nullable)
ownership_percent   float       100.0 (% owned by parent)

ENTITY_CROSS_OWNERSHIP (for cross-shareholding)
══════════════════════════════════════════════════════════
owner_entity_id     string      FK → entities.id
owned_entity_id     string      FK → entities.id
ownership_percent   float       20.0

CTR_RESULT
══════════════════════════════════════════════════════════
id                  string      "CTR-001"
engagement_id       string      FK → engagements.id
pdf_path            string      "./results/CTR_Report_France_2026.pdf"
xml_path            string      "./results/CTR_Data_France_2026.xml"
tax_liability       float       800000.00
effective_tax_rate  float       18.5
statutory_rate      float       25.0
current_tax         float       600000.00
deferred_tax        float       200000.00
generated_at        datetime

NOTIFICATION
══════════════════════════════════════════════════════════
id                  string      "NOTIF-001"
type                enum        RISK_ESCALATION|DEADLINE_APPROACHING|DOCUMENT_UPLOADED
engagement_id       string      "ENG-FR-001"
title               string      "Risque eleve detecte"
message             string      "France SPV est passe en risque HIGH"
priority            enum        HIGH|MEDIUM|LOW
dismissed           boolean     false
created_at          datetime
```

---

## 7. API Endpoints

### 7.1 Engagements

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/engagements` | Liste tous les engagements |
| GET | `/api/engagements/{id}` | Detail d'un engagement |
| GET | `/api/engagements/{id}/results` | Resultats CTR (si complete) |

### 7.2 Documents

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/documents` | Liste tous les documents |
| GET | `/api/documents?status=missing` | Documents manquants |
| POST | `/api/documents/upload` | Upload + classification IA |
| POST | `/api/documents/validate-attribution` | Valider attributions apres review |
| GET | `/api/documents/{id}/download` | Download fichier |

### 7.3 Entities & Structure

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/entities` | Liste toutes les entites |
| GET | `/api/entities/structure` | Structure hierarchique avec ownership |
| GET | `/api/entities/{id}/engagements` | Engagements d'une entite |

### 7.4 Eve (IA)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/eve/chat` | Envoyer message, recevoir reponse |
| POST | `/api/eve/explain` | Expliquer un chiffre (CMD+Click) |
| GET | `/api/eve/conversations/{engagement_id}` | Historique conversations |

### 7.5 Dashboard & Insights

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/dashboard/widgets` | Donnees pour widgets Home |
| GET | `/api/dashboard/documents-to-signoff` | Docs necessitant validation |
| GET | `/api/dashboard/missing-documents` | Docs manquants agreges |
| GET | `/api/insights/kpis` | KPIs globaux Insights page |
| GET | `/api/insights/charts` | Donnees charts Insights |

### 7.6 Notifications

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/notifications` | Liste toutes les notifications |
| GET | `/api/notifications/count` | Compteur unread |
| POST | `/api/notifications/{id}/dismiss` | Marquer comme lu |
| POST | `/api/notifications/dismiss-all` | Tout marquer comme lu |

---

## 8. Scenario de Demo (Script)

### Flow Demo (10-12 minutes)

| Etape | Action | Moment WOW |
|-------|--------|------------|
| 1 | **Arrivee** | Home Dashboard Bento - widgets clairs, donut interactif |
| 2 | **Missing Docs Widget** | Voir documents manquants, tooltip montre quels engagements |
| 3 | **Upload** | Drag & drop fichiers → Attribution Screen → Validation |
| 4 | **Structure** | Organigramme avec ownership %, cross-shareholding visible |
| 5 | **Click Entity** | Drawer avec engagements → clic → detail engagement |
| 6 | **Engagement Detail** | Voir progression, documents, status |
| 7 | **Results Tab** | CTR complete - PDF, XML, charts interactifs |
| 8 | **CMD+Click Chart** | Eve explique le data point avec contexte |
| 9 | **Insights Page** | Vue portfolio - KPIs agreges, comparaisons |
| 10 | **CMD+Click Insights** | Eve repond avec contexte global |
| 11 | **Engagements Page** | Toggle Cards/Table, filtres pills |
| 12 | **Doclib** | Filtre Missing, voir ce qui manque |

---

## 9. Dataset Demo

### 9.1 Entites

| Entity | Country | Parent | Ownership | Role |
|--------|---------|--------|-----------|------|
| Luxembourg Fund | 🇱🇺 LU | - | - | Top HoldCo |
| Belgium HoldCo | 🇧🇪 BE | Luxembourg Fund | 100% | Intermediate |
| Netherlands BV | 🇳🇱 NL | Luxembourg Fund | 100% | Intermediate |
| France SPV | 🇫🇷 FR | Belgium HoldCo | 100% | Operating |
| Germany PropCo | 🇩🇪 DE | Netherlands BV | 100% | Operating |

**Cross-Shareholding :** Belgium HoldCo owns 20% of Netherlands BV, Netherlands BV owns 15% of Belgium HoldCo.

### 9.2 Engagements CTR

| Entity | Year | Status | Docs | Scenario |
|--------|------|--------|------|----------|
| France SPV | 2026 | waiting | 3/4 | **HERO** - Missing 1 doc |
| Germany PropCo | 2026 | processing | 4/4 | En analyse |
| Netherlands BV | 2026 | completed | 4/4 + Result | CTR complete avec resultats |
| Belgium HoldCo | 2026 | waiting | 0/4 | Aucun document |
| Luxembourg Fund | 2026 | waiting | 2/4 | Documents 2025 fournis, besoin 2026 |

### 9.3 Donnees CTR (Netherlands - Complete)

| Metric | Value |
|--------|-------|
| Tax Liability | €450,000 |
| Effective Tax Rate | 18.2% |
| Statutory Rate | 25.0% |
| Current Tax | €320,000 |
| Deferred Tax | €130,000 |
| Pre-tax Income | €2,473,000 |

---

## 10. Criteres de Succes

### Pour la Demo
- [ ] UI percue comme "produit fini", pas un POC bancal
- [ ] Chaque feature IA fonctionne sans erreur sur le flow demo
- [ ] Temps de reponse Eve < 3 secondes
- [ ] Zero bug visible pendant la presentation
- [ ] Client dit "WOW" au moins 3 fois

### Pour l'Equipe Interne
- [ ] Preuve que OpenAI est integrable rapidement
- [ ] Code reutilisable pour futurs projets
- [ ] Documentation technique suffisante

---

## 11. Resume des Changements v2.0

| Domaine | Avant | Apres |
|---------|-------|-------|
| **Navigation** | Sidebar verticale | Navbar horizontale dark |
| **Dashboard** | KPIs + Action Center + Notifications | Bento 4 widgets (Upload, SignOff, Donut, List) |
| **Engagements** | Cards uniquement | Cards + Table toggle, filtres pills |
| **Structure** | Organigramme simple | Ownership %, cross-shareholding, flags |
| **Doclib** | Search by name | Status filter (Missing), bulk download progress |
| **Upload** | Auto-classification | Attribution validation screen |
| **Results** | N/A | Nouvel onglet avec PDF, XML, charts CTR |
| **Insights** | N/A | Nouvelle page KPIs globaux |
| **Service Focus** | Multiple services | CTR uniquement (4 docs) |
| **Design** | Colore | Neutre, premium, accents subtils |
