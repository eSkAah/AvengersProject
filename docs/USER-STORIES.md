# User Stories - Avengers Project v2.0

**Version:** 2.0
**Date:** 2026-01-19
**Sprint:** Post-Demo Iteration
**Reference:** PRD v2.0

---

## Vue d'ensemble des Epics

| Epic | Titre | Priorite | Effort |
|------|-------|----------|--------|
| E1 | Navigation Refactor (Sidebar → Navbar) | Must-Have | M |
| E2 | Dashboard Home (Bento Layout) | Must-Have | L |
| E3 | Engagements Page (Cards/Table) | Must-Have | M |
| E4 | Structure Page (Ownership) | Must-Have | M |
| E5 | Document Library Updates | Must-Have | M |
| E6 | Upload & Attribution Validation | Must-Have | L |
| E7 | Results Tab (CTR) | Must-Have | L |
| E8 | Insights Page (Global KPIs) | Must-Have | L |
| E9 | Eve Integration Updates | Should-Have | M |
| E10 | Design System Polish | Should-Have | S |

**Effort Legend:** S = Small (1-2 days), M = Medium (3-4 days), L = Large (5+ days)

---

## Epic 1: Navigation Refactor (Sidebar → Navbar)

**Objectif:** Transformer la sidebar verticale en navbar horizontale dark.

**Reference PRD:** Section 5.1

---

### E1-S1: Navbar Component

**En tant qu'** utilisateur
**Je veux** une navbar horizontale en haut de l'ecran
**Afin d'** avoir une navigation moderne et plus d'espace pour le contenu

**Criteres d'acceptation:**
- [ ] Navbar horizontale full-width
- [ ] Background dark (#1F2937)
- [ ] Hauteur fixe (64px)
- [ ] Position sticky top
- [ ] Z-index eleve (au-dessus du contenu)

**Design:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] Company Name  │ Home │ Engagements │ Doclib │ Structure │ Insights │ [Bell] [Avatar] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### E1-S2: Logo & Company Name (Dynamic)

**En tant qu'** utilisateur
**Je veux** voir le logo et nom de l'entreprise cliente
**Afin d'** identifier clairement le contexte

**Criteres d'acceptation:**
- [ ] Logo a gauche de la navbar
- [ ] Nom de l'entreprise a cote du logo
- [ ] Dynamique par client (configurable)
- [ ] Fallback si pas de logo (initiales)
- [ ] Cliquable → retour Home

---

### E1-S3: Menu Principal

**En tant qu'** utilisateur
**Je veux** des liens de navigation clairs
**Afin de** naviguer entre les sections

**Criteres d'acceptation:**
- [ ] Items: Home, Engagements, Doclib, Structure, Insights
- [ ] Active state: underline ou subtle background
- [ ] Hover state: changement de couleur subtil
- [ ] Espacement egal entre items
- [ ] Font-weight medium

**Routing:**
| Item | Route |
|------|-------|
| Home | `/` |
| Engagements | `/engagements` |
| Doclib | `/documents` |
| Structure | `/structure` |
| Insights | `/insights` |

---

### E1-S4: User Menu (Avatar + Dropdown)

**En tant qu'** utilisateur
**Je veux** un menu utilisateur avec mon avatar
**Afin d'** acceder a mon profil et me deconnecter

**Criteres d'acceptation:**
- [ ] Avatar utilisateur (ou initiales) a droite
- [ ] Click → dropdown menu
- [ ] Options: Profile, Settings, Logout
- [ ] Dropdown ferme au clic exterieur
- [ ] Animation smooth d'ouverture

---

### E1-S5: Notifications Bell

**En tant qu'** utilisateur
**Je veux** une icone cloche pour les notifications
**Afin d'** etre informe des evenements importants

**Criteres d'acceptation:**
- [ ] Icone bell a gauche de l'avatar
- [ ] Badge compteur si notifications non lues
- [ ] Click → dropdown liste notifications
- [ ] Types: Risk escalation, Deadline, Document uploaded
- [ ] Mark as read / Dismiss individual notification
- [ ] **Dismiss all** button pour tout marquer comme lu
- [ ] Click notification → redirection vers element concerne

---

### E1-S6: Responsive Navbar (Hamburger)

**En tant qu'** utilisateur mobile
**Je veux** un menu hamburger sur petit ecran
**Afin de** naviguer facilement sur mobile

**Criteres d'acceptation:**
- [ ] Breakpoint: < 768px
- [ ] Menu items caches, hamburger icon visible
- [ ] Click hamburger → menu slide-down ou drawer
- [ ] Animation smooth
- [ ] Fermeture au clic exterieur ou sur item

---

### E1-S7: Remove Sidebar Component

**En tant que** developpeur
**Je veux** supprimer l'ancienne sidebar
**Afin de** nettoyer le code

**Criteres d'acceptation:**
- [ ] Supprimer SidebarComponent
- [ ] Supprimer les styles associes
- [ ] Mettre a jour le layout principal
- [ ] Verifier qu'aucune reference ne reste
- [ ] Tester toutes les pages

---

## Epic 2: Dashboard Home (Bento Layout)

**Objectif:** Transformer la page Home en dashboard Bento avec 4 widgets.

**Reference PRD:** Section 5.2

---

### E2-S1: Bento Grid Layout

**En tant qu'** utilisateur
**Je veux** un layout bento moderne
**Afin d'** avoir une vue claire et organisee

**Criteres d'acceptation:**
- [ ] CSS Grid layout
- [ ] 2 colonnes principales
- [ ] Gap entre widgets (16-24px)
- [ ] Responsive: stack sur mobile
- [ ] Widgets avec rounded corners et shadows

**Layout:**
```
┌─────────────────────────────────────┬──────────────────────┐
│   UPLOAD / MISSING DOCS (tall)      │   ENGAGEMENT DONUT   │
│                                     │   (compact)          │
├─────────────────────────────────────┼──────────────────────┤
│   DOCUMENTS TO SIGN OFF (medium)    │   ENGAGEMENT LIST    │
│                                     │   (large)            │
└─────────────────────────────────────┴──────────────────────┘
```

---

### E2-S2: Widget Upload / Missing Documents

**En tant qu'** utilisateur
**Je veux** voir les documents manquants et pouvoir uploader
**Afin d'** agir rapidement sur ce qui manque

**Criteres d'acceptation:**
- [ ] Drag & drop zone en haut du widget
- [ ] Liste des missing docs en dessous
- [ ] Chaque doc: nom + icone info + bouton upload
- [ ] Tooltip sur icone info → liste des engagements concernes
- [ ] Auto-classification sur upload
- [ ] "View All" link → Document Library
- [ ] Widget le plus grand (hero position)

**API:**
- GET `/api/dashboard/missing-documents`

---

### E2-S3: Widget Engagement Status Donut

**En tant qu'** utilisateur
**Je veux** voir la repartition des statuts en donut
**Afin d'** avoir une vue rapide de la situation

**Criteres d'acceptation:**
- [ ] Donut chart avec 3 segments
- [ ] Segments: Late (rouge), In Progress (bleu), Soon (orange)
- [ ] Chiffres affiches au centre ou a cote
- [ ] Click sur segment → filtre Widget 4
- [ ] Hover → tooltip avec count exact
- [ ] Animation d'entree

**API:**
- GET `/api/dashboard/engagement-status`

---

### E2-S4: Widget Documents to Sign Off

**En tant qu'** utilisateur
**Je veux** voir les documents necessitant validation
**Afin de** les traiter rapidement

**Criteres d'acceptation:**
- [ ] Liste des documents avec statut "pending_signoff"
- [ ] Colonnes: Entity | Document Name | Action
- [ ] Action button → redirige vers engagement
- [ ] Max 5 items affiches (scroll si plus)
- [ ] Empty state si aucun document

**API:**
- GET `/api/dashboard/documents-to-signoff`

---

### E2-S5: Widget Engagement List (Filtered)

**En tant qu'** utilisateur
**Je veux** voir les engagements filtres par le donut
**Afin d'** acceder rapidement aux urgences

**Criteres d'acceptation:**
- [ ] Liste des engagements (top 5)
- [ ] Filtre par segment donut selectionne
- [ ] Default: tous les engagements
- [ ] Infos: Entity, Status, Progress, Risk badge
- [ ] Click row → engagement detail
- [ ] "View All" → page Engagements avec filtre actif

**API:**
- GET `/api/engagements?status={status}&limit=5`

---

### E2-S6: Remove Old Dashboard Elements

**En tant que** developpeur
**Je veux** supprimer les anciens elements du dashboard
**Afin d'** avoir un code propre

**Elements a supprimer:**
- [ ] Notifications widget (deplace vers navbar)
- [ ] Key Indicators section
- [ ] Action Center
- [ ] Activity feed (si present)

---

## Epic 3: Engagements Page (Cards/Table)

**Objectif:** Ajouter toggle Cards/Table et filtres pills.

**Reference PRD:** Section 5.3

---

### E3-S1: View Toggle (Cards / Table)

**En tant qu'** utilisateur
**Je veux** basculer entre vue cards et table
**Afin de** choisir l'affichage qui me convient

**Criteres d'acceptation:**
- [ ] Toggle button avec icones Cards/Table
- [ ] Cards = vue par defaut
- [ ] Etat persiste (localStorage)
- [ ] Transition smooth entre vues
- [ ] Position: en haut a droite

---

### E3-S2: Table View with Expandable Rows

**En tant qu'** utilisateur
**Je veux** voir les engagements en tableau
**Afin d'** avoir une vue dense des informations

**Criteres d'acceptation:**
- [ ] Colonnes: Entity | Status | Progress | Risk | Year | Documents | Actions
- [ ] Header sticky
- [ ] Row hover effect
- [ ] Click row → expand avec details
- [ ] Expanded row: memes infos que card ouverte
- [ ] Tri par colonne (click header)

**Expanded Row Content:**
- Documents requis (X/Y)
- Bouton "Details"
- Bouton Eve

---

### E3-S3: Pill Filters (Inline)

**En tant qu'** utilisateur
**Je veux** des filtres sous forme de pills
**Afin d'** avoir une interface epuree et premium

**Criteres d'acceptation:**
- [ ] Style: small pills/chips inline
- [ ] Filtres: Search, Year, Status, Risk, Service
- [ ] Pills selectionnees = background colore
- [ ] Click pill → toggle/dropdown
- [ ] Clear all button
- [ ] Discret, pas de bloc de filtres imposant

**Design:**
```
[Search...] [Year ▼] [Status ▼] [Risk ▼] [Service ▼] [Clear]
```

---

### E3-S4: Cards View Updates

**En tant qu'** utilisateur
**Je veux** des cards modernisees
**Afin d'** avoir une experience premium

**Criteres d'acceptation:**
- [ ] Card fermee: Entity, Status badge, Progress bar, Risk badge, Country flag
- [ ] Card ouverte: Documents (X/Y), Details button, Eve button
- [ ] Rename "Dashboard" button → "Details"
- [ ] Animation expand/collapse smooth
- [ ] Less colorful, more neutral design

---

## Epic 4: Structure Page (Ownership)

**Objectif:** Ameliorer l'organigramme avec ownership et cross-shareholding.

**Reference PRD:** Section 5.4

---

### E4-S1: Ownership Percentages on Lines

**En tant qu'** utilisateur
**Je veux** voir les pourcentages de propriete sur les lignes
**Afin de** comprendre la structure de propriete

**Criteres d'acceptation:**
- [ ] Pourcentage affiche sur chaque ligne de connexion
- [ ] Position: milieu de la ligne
- [ ] Background blanc/leger pour lisibilite
- [ ] Format: "100%" ou "30%"
- [ ] Font-size petit mais lisible

---

### E4-S2: Cross-Shareholding Visualization

**En tant qu'** utilisateur
**Je veux** voir les participations croisees
**Afin de** comprendre les relations complexes

**Criteres d'acceptation:**
- [ ] Deux fleches separees si cross-shareholding
- [ ] Chaque fleche avec son pourcentage
- [ ] Direction claire (fleche pointee)
- [ ] Couleur differente ou style pour distinguer
- [ ] Legende si necessaire

**Exemple:**
```
Belgium HoldCo ───20%───► Netherlands BV
Belgium HoldCo ◄───15%─── Netherlands BV
```

---

### E4-S3: Country Flags on Entities

**En tant qu'** utilisateur
**Je veux** voir les drapeaux des pays sur chaque entite
**Afin d'** identifier rapidement la localisation

**Criteres d'acceptation:**
- [ ] Flag emoji ou icone sur chaque noeud
- [ ] Position coherente (coin ou a cote du nom)
- [ ] Flags: FR, DE, NL, BE, LU
- [ ] Fallback si pas de flag

---

### E4-S4: Auto-Layout Based on Hierarchy

**En tant qu'** utilisateur
**Je veux** un layout automatique base sur la hierarchie
**Afin d'** avoir une visualisation claire

**Criteres d'acceptation:**
- [ ] Top-down layout (parent en haut)
- [ ] Arrangement automatique des noeuds
- [ ] Espacement egal entre niveaux
- [ ] Centrage des enfants sous le parent
- [ ] Gestion des cross-shareholding sans chevauchement

---

### E4-S5: Entity Structure API Update

**En tant que** frontend
**Je veux** une API avec les donnees de propriete
**Afin d'** afficher la structure correctement

**Criteres d'acceptation:**
- [ ] GET `/api/entities/structure`
- [ ] Inclut: ownership_percent par relation
- [ ] Inclut: cross_ownership array
- [ ] Format hierarchique

**Response Schema:**
```json
{
  "entities": [...],
  "relationships": [
    { "parent_id": "ENT-001", "child_id": "ENT-002", "ownership_percent": 100 }
  ],
  "cross_ownership": [
    { "owner_id": "ENT-002", "owned_id": "ENT-003", "percent": 20 }
  ]
}
```

---

### E4-S6: Entity Drawer Component

**En tant qu'** utilisateur
**Je veux** cliquer sur une entite pour voir ses engagements
**Afin d'** acceder rapidement aux details depuis la structure

**Criteres d'acceptation:**
- [ ] Click sur entite → ouvre drawer lateral (right side)
- [ ] Drawer affiche: nom entite, pays (flag), ownership info
- [ ] Liste des engagements de cette entite avec status badges
- [ ] Click sur engagement → redirection vers engagement detail
- [ ] Close button (X) ferme le drawer
- [ ] Clic exterieur ferme le drawer
- [ ] Animation slide-in smooth (300ms)
- [ ] Overlay semi-transparent sur le reste de la page

**Design:**
```
┌──────────────────────────────────────┬─────────────────────────┐
│                                      │  ENTITY DRAWER          │
│      STRUCTURE DIAGRAM               │  ───────────────────    │
│                                      │  France SPV 🇫🇷         │
│         [Click on entity]  ───────►  │  Owned by: Belgium 100% │
│                                      │                         │
│                                      │  ENGAGEMENTS            │
│                                      │  ├─ CTR 2026 [Late]     │
│                                      │  └─ CTR 2025 [Done]     │
│                                      │                    [X]  │
└──────────────────────────────────────┴─────────────────────────┘
```

**API:**
- GET `/api/entities/{id}/engagements`

---

## Epic 5: Document Library Updates

**Objectif:** Ajouter filtre status, bulk download progress, retirer search by name.

**Reference PRD:** Section 5.5

---

### E5-S1: Document Status Filter

**En tant qu'** utilisateur
**Je veux** filtrer par statut de document
**Afin de** voir facilement les documents manquants

**Criteres d'acceptation:**
- [ ] Filtre dropdown: All, Missing, Uploaded, Analyzed, Validated
- [ ] "Missing" montre les docs demandes mais non uploades
- [ ] Filtre combinable avec entity filter
- [ ] Count affiche par statut

---

### E5-S2: Missing Documents Display

**En tant qu'** utilisateur
**Je veux** voir les documents manquants dans la library
**Afin de** savoir ce qu'il faut uploader

**Criteres d'acceptation:**
- [ ] Documents avec statut "missing" apparaissent
- [ ] Style visuel different (grayed out, icon different)
- [ ] Bouton upload direct sur chaque doc missing
- [ ] Info: pour quel engagement ce doc est requis

---

### E5-S3: Bulk Download Progress

**En tant qu'** utilisateur
**Je veux** voir la progression du telechargement bulk
**Afin de** savoir quand c'est termine

**Criteres d'acceptation:**
- [ ] Progress bar sous le bouton download
- [ ] Pourcentage affiche
- [ ] Notification toast quand termine
- [ ] Gestion erreur si un fichier echoue
- [ ] Cancel button pendant le download

---

### E5-S4: Remove Search by Name Filter

**En tant que** developpeur
**Je veux** retirer le filtre search by name
**Afin de** simplifier l'interface

**Criteres d'acceptation:**
- [ ] Supprimer le champ de recherche par nom
- [ ] Verifier que les autres filtres fonctionnent
- [ ] Mettre a jour les tests si necessaire

---

### E5-S5: Entity Filter Simplification

**En tant qu'** utilisateur
**Je veux** un filtre entity simplifie
**Afin d'** avoir une navigation claire

**Criteres d'acceptation:**
- [ ] Toggle entity filter on/off seulement
- [ ] Pas de selection "all documents" dans le tree
- [ ] Si filtre off → tous les documents de toutes entites
- [ ] Tree reste navigable mais pas selectionnable en masse

---

## Epic 6: Upload & Attribution Validation

**Objectif:** Ajouter ecran de validation des attributions IA.

**Reference PRD:** Section 5.6

---

### E6-S1: Attribution Review Screen

**En tant qu'** utilisateur
**Je veux** valider les attributions de l'IA
**Afin de** corriger les erreurs avant placement

**Criteres d'acceptation:**
- [ ] Modal ou page dediee apres upload
- [ ] Liste des documents uploades
- [ ] Colonnes: Document | Entity | Year | Type | Action
- [ ] Action: Validate (check) ou Edit (pencil)
- [ ] Bouton global "Validate & Place"

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────┐
│  ATTRIBUTION REVIEW                                         │
│                                                             │
│  Document          Entity        Year    Type        Action │
│  ─────────────────────────────────────────────────────────  │
│  file1.pdf    →    France SPV    2026    GL          [✓]   │
│  file2.xlsx   →    Germany Co    2025    TB          [✎]   │
│  file3.pdf    →    ???           ???     ???         [✎]   │
│                                                             │
│                         [Validate & Place]                  │
└─────────────────────────────────────────────────────────────┘
```

---

### E6-S2: Edit Attribution Modal

**En tant qu'** utilisateur
**Je veux** corriger une attribution incorrecte
**Afin de** placer le document au bon endroit

**Criteres d'acceptation:**
- [ ] Click Edit → modal de correction
- [ ] Dropdowns: Entity, Year, Document Type
- [ ] Pre-rempli avec suggestion IA
- [ ] Save → met a jour la ligne
- [ ] Cancel → ferme sans sauver

---

### E6-S3: Placement Animation

**En tant qu'** utilisateur
**Je veux** voir une animation de placement
**Afin d'** avoir un feedback visuel satisfaisant

**Criteres d'acceptation:**
- [ ] Apres validation → animation
- [ ] Documents "volent" vers leur emplacement
- [ ] Redirection vers doclib avec highlight
- [ ] Toast de confirmation

---

### E6-S4: API Validate Attribution

**En tant que** frontend
**Je veux** une API pour valider les attributions
**Afin de** finaliser le placement

**Criteres d'acceptation:**
- [ ] POST `/api/documents/validate-attribution`
- [ ] Body: array of { document_id, entity_id, year, type }
- [ ] Response: success + documents places
- [ ] Gestion erreur si attribution invalide

---

### E6-S5: Classification Confidence Indicator

**En tant qu'** utilisateur
**Je veux** voir le niveau de confiance de l'IA
**Afin de** savoir quoi verifier en priorite

**Criteres d'acceptation:**
- [ ] Indicateur: High/Medium/Low confidence
- [ ] Couleur: vert/orange/rouge
- [ ] Low confidence = highlight pour attention
- [ ] Tooltip avec explication

---

## Epic 7: Results Tab (CTR)

**Objectif:** Ajouter onglet Results dans le detail engagement avec resultats CTR.

**Reference PRD:** Section 5.7

---

### E7-S1: Results Tab Component

**En tant qu'** utilisateur
**Je veux** un onglet Results dans l'engagement
**Afin de** voir les resultats du CTR

**Criteres d'acceptation:**
- [ ] Nouvel onglet "Results" dans engagement detail
- [ ] Actif seulement si CTR complete
- [ ] Desactive/cache si pas de resultat
- [ ] Badge "New" si resultat recent

---

### E7-S2: Results Tab Activation Logic

**En tant que** systeme
**Je veux** activer l'onglet quand CTR est complete
**Afin de** montrer les resultats au bon moment

**Criteres d'acceptation:**
- [ ] Conditions: 4 docs valides + service effectue
- [ ] Check engagement.ctr_result != null
- [ ] Afficher message si pas encore complete
- [ ] Auto-refresh quand resultat disponible

---

### E7-S3: CTR Documents Display

**En tant qu'** utilisateur
**Je veux** voir les documents resultat
**Afin de** les telecharger

**Criteres d'acceptation:**
- [ ] Liste: CTR Report (PDF), CTR Data (XML)
- [ ] Icones par type de fichier
- [ ] Boutons: Download, Preview
- [ ] Date de generation
- [ ] Taille du fichier

---

### E7-S4: CTR Charts Section

**En tant qu'** utilisateur
**Je veux** voir des graphiques CTR
**Afin de** visualiser les donnees fiscales

**Criteres d'acceptation:**
- [ ] ETR Reconciliation (Waterfall chart)
- [ ] Current vs Deferred Tax (Donut)
- [ ] Tax by Category (Bar chart)
- [ ] KPI Cards: Tax Liability, ETR %, Pre-tax Income
- [ ] Tous CMD+Clickable pour Eve

---

### E7-S5: Waterfall Chart Component

**En tant qu'** utilisateur
**Je veux** un waterfall chart pour ETR reconciliation
**Afin de** comprendre le passage statutory → effective

**Criteres d'acceptation:**
- [ ] Barre initiale: Statutory Rate (21% ou autre)
- [ ] Barres intermediaires: ajustements (+/-)
- [ ] Barre finale: Effective Rate
- [ ] Couleurs: vert pour reduction, rouge pour augmentation
- [ ] Hover → detail de l'ajustement
- [ ] CMD+Click → Eve

---

### E7-S6: API CTR Results

**En tant que** frontend
**Je veux** une API pour les resultats CTR
**Afin d'** alimenter l'onglet Results

**Criteres d'acceptation:**
- [ ] GET `/api/engagements/{id}/results`
- [ ] Response: documents, tax_data, charts_data
- [ ] 404 si pas de resultat
- [ ] Include: tax_liability, etr, statutory_rate, current_tax, deferred_tax

---

## Epic 8: Insights Page (Global KPIs)

**Objectif:** Creer nouvelle page Insights avec KPIs agreges.

**Reference PRD:** Section 5.8

---

### E8-S1: Insights Page Routing

**En tant qu'** utilisateur
**Je veux** acceder a la page Insights
**Afin de** voir les KPIs globaux

**Criteres d'acceptation:**
- [ ] Route: `/insights`
- [ ] Lien dans navbar
- [ ] Page component cree
- [ ] Layout responsive

---

### E8-S2: Global KPI Cards

**En tant qu'** utilisateur
**Je veux** voir les KPIs agreges
**Afin d'** avoir une vue portfolio

**Criteres d'acceptation:**
- [ ] Card: Total Tax Liability (somme)
- [ ] Card: Avg Effective Tax Rate (moyenne ponderee)
- [ ] Card: CTRs Completed (X/Y)
- [ ] Card: Entities at Risk (count)
- [ ] Animation count-up
- [ ] Click → filtre les charts

---

### E8-S3: Tax by Entity Chart

**En tant qu'** utilisateur
**Je veux** comparer les taxes par entite
**Afin de** identifier les plus grosses contributions

**Criteres d'acceptation:**
- [ ] Horizontal bar chart
- [ ] Une barre par entite
- [ ] Trie par montant decroissant
- [ ] Hover → valeur exacte
- [ ] CMD+Click → Eve

---

### E8-S4: ETR by Entity Chart

**En tant qu'** utilisateur
**Je veux** comparer les taux effectifs
**Afin d'** identifier les anomalies

**Criteres d'acceptation:**
- [ ] Bar chart vertical
- [ ] Ligne de reference: statutory rate
- [ ] Couleur differente si au-dessus/en-dessous
- [ ] Hover → detail
- [ ] CMD+Click → Eve

---

### E8-S5: YoY Comparison Chart

**En tant qu'** utilisateur
**Je veux** voir l'evolution N vs N-1
**Afin de** comprendre les tendances

**Criteres d'acceptation:**
- [ ] Grouped bar chart
- [ ] Barres: 2025 vs 2026
- [ ] Metrics: Total Tax, Avg ETR
- [ ] Variation % affichee
- [ ] CMD+Click → Eve

---

### E8-S6: Tax by Jurisdiction Chart

**En tant qu'** utilisateur
**Je veux** voir la repartition geographique
**Afin de** comprendre l'exposition fiscale

**Criteres d'acceptation:**
- [ ] Donut chart
- [ ] Segments: France, Germany, Netherlands, Belgium, Luxembourg
- [ ] Pourcentage par segment
- [ ] Hover → montant exact
- [ ] CMD+Click → Eve

---

### E8-S7: Insights Page Filters

**En tant qu'** utilisateur
**Je veux** filtrer les donnees Insights
**Afin de** me concentrer sur un sous-ensemble

**Criteres d'acceptation:**
- [ ] Filtre Year: dropdown (2026, 2025, etc.)
- [ ] Filtre Entity: multi-select
- [ ] Filtres appliques a tous les charts
- [ ] Reset button
- [ ] Persistence session

---

### E8-S8: API Insights

**En tant que** frontend
**Je veux** une API pour les donnees Insights
**Afin d'** alimenter la page

**Criteres d'acceptation:**
- [ ] GET `/api/insights/kpis` → KPI cards data
- [ ] GET `/api/insights/charts` → all charts data
- [ ] Query params: year, entity_ids
- [ ] Response: aggregated data

---

## Epic 9: Eve Integration Updates

**Objectif:** Mettre a jour Eve pour les nouvelles pages et charts.

**Reference PRD:** Section 5.9

---

### E9-S1: Eve Context for Insights Page

**En tant qu'** utilisateur
**Je veux** qu'Eve connaisse le contexte Insights
**Afin de** poser des questions sur les KPIs globaux

**Criteres d'acceptation:**
- [ ] Eve detecte qu'on est sur /insights
- [ ] Context inclut: KPIs agreges, filtres actifs
- [ ] Reponses appropriees au contexte global
- [ ] Peut repondre sur comparaisons entre entites

---

### E9-S2: CMD+Click on All New Charts

**En tant qu'** utilisateur
**Je veux** CMD+Click sur tous les nouveaux charts
**Afin de** demander des explications a Eve

**Criteres d'acceptation:**
- [ ] Directive cmdClick sur charts Insights
- [ ] Directive cmdClick sur charts Results tab
- [ ] Tooltip "CMD+Click for Eve" au hover
- [ ] Pre-fill question avec contexte du data point

---

### E9-S3: Eve Responses for CTR Data

**En tant qu'** utilisateur
**Je veux** qu'Eve explique les donnees CTR
**Afin de** comprendre les resultats fiscaux

**Criteres d'acceptation:**
- [ ] Eve peut expliquer: ETR, tax liability, deferred tax
- [ ] Prompts specifiques pour donnees fiscales
- [ ] Sources: CTR Report, documents sources
- [ ] Ton: professionnel, educatif

---

## Epic 10: Design System Polish

**Objectif:** Appliquer le nouveau design premium et neutre.

**Reference PRD:** Section 4

---

### E10-S1: Color Palette Update

**En tant que** developpeur
**Je veux** mettre a jour la palette de couleurs
**Afin d'** avoir un design plus premium

**Criteres d'acceptation:**
- [ ] Reduire l'utilisation des couleurs vives
- [ ] Plus de neutrals (grays)
- [ ] Accents jaune EY subtils (pas dominants)
- [ ] Navbar dark color (#1F2937)
- [ ] Mettre a jour tailwind.config.js

---

### E10-S2: Filter Pills Styling

**En tant que** developpeur
**Je veux** styliser les filtres en pills
**Afin d'** avoir une interface epuree

**Criteres d'acceptation:**
- [ ] Pills small, rounded-full
- [ ] Border subtle
- [ ] Background neutre, selected = accent
- [ ] Hover state subtil
- [ ] Inline layout, pas de bloc

---

### E10-S3: Cards Neutralization

**En tant que** developpeur
**Je veux** rendre les cards plus neutres
**Afin d'** avoir un look premium

**Criteres d'acceptation:**
- [ ] Reduire les couleurs dans les cards
- [ ] Borders plus subtils
- [ ] Shadows plus legeres
- [ ] Focus sur le contenu, pas les decorations

---

### E10-S4: Remove Excess Colors

**En tant que** developpeur
**Je veux** retirer les couleurs excessives
**Afin d'** avoir un design coherent

**Criteres d'acceptation:**
- [ ] Audit de toutes les pages
- [ ] Identifier les elements trop colores
- [ ] Remplacer par neutrals ou accents subtils
- [ ] Verifier la coherence globale

---

## Resume des Stories

| Epic | Stories | Priorite |
|------|---------|----------|
| E1 - Navigation | 7 | Must-Have |
| E2 - Dashboard | 6 | Must-Have |
| E3 - Engagements | 4 | Must-Have |
| E4 - Structure | 6 | Must-Have |
| E5 - Doclib | 5 | Must-Have |
| E6 - Upload | 5 | Must-Have |
| E7 - Results | 6 | Must-Have |
| E8 - Insights | 8 | Must-Have |
| E9 - Eve | 3 | Should-Have |
| E10 - Design | 4 | Should-Have |
| **Total** | **54** | |

---

## Definition of Done (DoD)

Chaque story est consideree terminee quand:

- [ ] Code implemente et fonctionnel
- [ ] Tests unitaires ecrits (si applicable)
- [ ] Responsive verifie (desktop + mobile)
- [ ] Design conforme au PRD
- [ ] Code review effectuee
- [ ] Merge dans develop
- [ ] Demo au PM/stakeholder

---

## Sprint Planning Suggestion

**Sprint 1 (Week 1):**
- E1: Navigation Refactor (complet)
- E10: Design System Polish (complet)

**Sprint 2 (Week 2):**
- E2: Dashboard Home (complet)
- E3: Engagements Page (complet)

**Sprint 3 (Week 3):**
- E4: Structure Page (complet)
- E5: Document Library (complet)

**Sprint 4 (Week 4):**
- E6: Upload & Attribution (complet)
- E7: Results Tab (complet)

**Sprint 5 (Week 5):**
- E8: Insights Page (complet)
- E9: Eve Integration (complet)
- Bug fixes & polish
