# User Stories - Avengers Project

**Version:** 2.0
**Date:** 2026-01-18
**Sprint:** 10 jours (J1-J10)

---

## Vue d'ensemble des Epics

| Epic | Titre | Priorité | Jours |
|------|-------|----------|-------|
| E1 | Setup & Design System | Must-Have | J1-J2 |
| E2 | Landing Page & Engagements | Must-Have | J2-J3 |
| E3 | Document Library | Must-Have | J3-J5 |
| E4 | Smart Upload & Classification | Must-Have | J3-J5 |
| E5 | Dashboard & Charts | Must-Have | J4-J6 |
| E6 | Eve Chatbot | Must-Have | J5-J7 |
| E7 | Risk & Prédictions | Must-Have | J7-J8 |
| E8 | Polish & Démo | Must-Have | J9-J10 |
| E9 | Features Bonus | Should-Have | Si temps |
| E10 | Platform v2.0 - Navigation & AI | Must-Have | Post-MVP |

---

## Epic 1: Setup & Design System (J1-J2)

### E1-S1: Setup Projet Angular
**En tant que** développeur
**Je veux** un projet Angular 19 configuré avec Tailwind
**Afin de** démarrer le développement frontend

**Critères d'acceptation:**
- [x] Angular 19 avec standalone components
- [x] Tailwind CSS installé et configuré
- [x] Structure de dossiers créée (core/, shared/, features/)
- [x] ESLint + Prettier configurés
- [x] Environment files (dev/prod)
- [x] `ng serve` fonctionne sur localhost:4200

**Tâches techniques:**
```bash
ng new avengers-project-frontend --standalone --style=scss --routing
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

---

### E1-S2: Setup Projet FastAPI
**En tant que** développeur
**Je veux** un projet FastAPI configuré avec SQLite
**Afin de** démarrer le développement backend

**Critères d'acceptation:**
- [x] FastAPI avec structure routers/services/models
- [x] SQLAlchemy + SQLite configuré
- [x] CORS activé pour localhost:4200
- [x] Swagger UI accessible sur /docs
- [x] Health check endpoint /api/v1/health
- [x] `uvicorn` fonctionne sur localhost:8000

**Tâches techniques:**
```bash
mkdir backend && cd backend
python -m venv venv
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv
```

---

### E1-S3: Design System - Palette & Variables
**En tant que** designer/développeur
**Je veux** les couleurs et variables EY définies
**Afin d'** avoir une base de design cohérente

**Critères d'acceptation:**
- [x] Palette EY dans tailwind.config.js
- [x] Variables SCSS (_variables.scss)
- [x] Couleurs: jaune EY, neutrals, semantic
- [x] Typographie définie
- [x] Espacements standardisés (4, 8, 12, 16, 24, 32px)
- [x] Border-radius: 8px (sm), 12px (md), 16px (lg)

**Référence:** PRD Section 4.2 - Palette de Couleurs

---

### E1-S4: Design System - Composants de Base
**En tant que** développeur
**Je veux** les composants UI de base créés
**Afin de** les réutiliser dans toute l'application

**Critères d'acceptation:**
- [x] Button component (primary, secondary, ghost)
- [x] Card component (avec shadow, hover effect)
- [x] Badge component (success, warning, error, info)
- [x] Input component (text, avec focus ring jaune)
- [x] Skeleton loader component
- [x] Toast notification component

**Specs visuelles:**
- Buttons: rounded-lg, padding 12px 24px, hover scale 1.02
- Cards: bg-white, shadow-sm, rounded-xl, border subtle
- Transitions: 200-300ms ease-out

---

### E1-S5: Layout Shell - Sidebar & Header
**En tant qu'** utilisateur
**Je veux** une navigation claire et moderne
**Afin de** me repérer facilement dans l'application

**Critères d'acceptation:**
- [x] Sidebar à gauche avec icônes + labels
- [x] Sidebar collapsible (icônes only)
- [x] Header avec logo, titre, notifications, profil
- [x] Navigation: Home, Documents, Dashboard
- [x] Active state = accent jaune EY
- [x] Responsive (sidebar collapse sur mobile)

**Wireframe:** PRD Section 15.2

---

### E1-S6: Seed Data - Données de Démo
**En tant que** développeur
**Je veux** les données de démo pré-chargées
**Afin de** tester l'application avec des données réalistes

**Critères d'acceptation:**
- [x] 5 engagements créés (FR, DE, NL, BE, LU)
- [x] Données financières pour chaque engagement
- [x] Statuts variés (waiting, processing, completed)
- [x] Risk levels variés (high, medium, low)
- [x] Documents pré-uploadés pour DE, NL, BE
- [x] Script de seed exécutable (MockDataService injectable)

**Référence:** PRD Section 17 - Dataset Démo

---

## Epic 2: Landing Page & Engagements (J2-J3)

### E2-S1: API Engagements - CRUD
**En tant que** frontend
**Je veux** une API pour récupérer les engagements
**Afin d'** afficher la liste sur la landing page

**Critères d'acceptation:**
- [ ] GET /api/engagements → liste tous les engagements
- [ ] GET /api/engagements/{id} → détail d'un engagement
- [ ] Response format conforme au schema Pydantic
- [ ] Calcul automatique du risk_level
- [ ] Calcul automatique du completion_percent
- [ ] Tests unitaires pour les endpoints

**Schema Response:**
```json
{
  "id": "ENG-FR-001",
  "entity_name": "France SPV",
  "country_code": "FR",
  "status": "waiting",
  "risk_level": "high",
  "completion_percent": 67,
  "due_date": "2026-02-29",
  "predicted_completion": "2026-02-25"
}
```

---

### E2-S2: KPIs Header
**En tant qu'** utilisateur
**Je veux** voir les KPIs globaux en haut de page
**Afin d'** avoir une vue d'ensemble instantanée

**Critères d'acceptation:**
- [x] 4 cards KPI: Total, En cours, À risque, Complétés
- [x] Chiffres animés à l'arrivée (count up)
- [x] Cliquables = filtrent la liste
- [x] Icônes distinctives par KPI
- [x] Couleurs semantic (rouge pour risque, vert pour complété)

**Composants:**
- KpiCard component
- KpiHeader component (container des 4 cards)

---

### E2-S3: Liste Engagements - Vue Accordéon
**En tant qu'** utilisateur
**Je veux** voir mes engagements en liste accordéon
**Afin de** voir le résumé et les détails à la demande

**Critères d'acceptation:**
- [x] Liste des engagements avec Risk Badge coloré
- [x] Infos visibles fermé: Entity, Service, Status, Due Date, Progress bar
- [x] Expand au clic → détails (documents, prédiction, actions)
- [x] Actions dans le tiroir: Voir Dashboard, Upload Docs, Ask Eve
- [x] Animation smooth d'ouverture/fermeture
- [x] Un seul accordéon ouvert à la fois (ou plusieurs?)

**Wireframe:** PRD Section 15.3

---

### E2-S4: Risk Badge Component
**En tant qu'** utilisateur
**Je veux** voir clairement le niveau de risque
**Afin de** prioriser mes actions

**Critères d'acceptation:**
- [x] 3 états: high (rouge), medium (orange), low (vert)
- [x] Icône + couleur
- [x] Tooltip au hover expliquant le risque
- [x] Animation pulse si high risk

**Design:**
```
🔴 HIGH    → bg-red-100, text-red-700, border-red-200
🟠 MEDIUM  → bg-orange-100, text-orange-700, border-orange-200
🟢 LOW     → bg-green-100, text-green-700, border-green-200
```

---

### E2-S5: Progress Bar Component
**En tant qu'** utilisateur
**Je veux** voir la progression de chaque engagement
**Afin de** comprendre l'avancement

**Critères d'acceptation:**
- [x] Barre de progression 0-100%
- [x] Couleur selon le risk_level
- [x] Pourcentage affiché
- [x] Animation de remplissage à l'arrivée
- [x] Label optionnel ("67% · 2 docs manquants")

---

### E2-S6: Notifications Zone
**En tant qu'** utilisateur
**Je veux** voir une zone de notifications intelligentes
**Afin d'** être alerté proactivement des actions requises

**Critères d'acceptation:**
- [x] Zone notifications visible en haut de la landing page
- [x] Affiche alertes proactives ("Documents requis pour France")
- [x] Badges count pour nombre de notifications
- [x] Click sur notification → navigation vers l'engagement concerné
- [x] Types: warning (orange), info (bleu), urgent (rouge)
- [x] Animation slide-in pour nouvelles notifications
- [x] Dismiss possible (X) avec persistance session

**Référence:** PRD Section 5.1 - Notifications Intelligentes (FR3)

---

## Epic 3: Document Library (J3-J5)

### E3-S1: API Documents - CRUD
**En tant que** frontend
**Je veux** une API pour gérer les documents
**Afin d'** afficher et manipuler les documents

**Critères d'acceptation:**
- [ ] GET /api/documents → liste tous les documents
- [ ] GET /api/documents?engagement={id} → filtrer par engagement
- [ ] GET /api/documents/{id} → détail d'un document
- [ ] GET /api/documents/{id}/content → preview/téléchargement
- [ ] Response avec metadata (type, size, status, ai_summary)

---

### E3-S2: Document Tree Navigation
**En tant qu'** utilisateur
**Je veux** naviguer dans les documents via une arborescence
**Afin de** trouver rapidement mes fichiers

**Critères d'acceptation:**
- [x] Tree view à gauche de l'écran
- [x] Niveaux: Client > Engagements > Documents
- [x] Expand/collapse des nœuds
- [x] Icônes différentes par type de document
- [x] Counter de documents par nœud
- [x] Clic sur nœud = filtre la vue principale

**Structure:**
```
📁 Real Estate Fund Global
├── 📁 France SPV (2)
│   ├── 📄 General Ledger
│   └── 📄 Trial Balance
├── 📁 Germany PropCo (2)
└── 📁 Netherlands BV (4)
```

---

### E3-S3: Document Grid View
**En tant qu'** utilisateur
**Je veux** voir mes documents en grille
**Afin d'** avoir une vue visuelle des fichiers

**Critères d'acceptation:**
- [x] Cards pour chaque document
- [x] Thumbnail/icône selon le type
- [x] Nom du fichier (tronqué si long)
- [x] Status badge (Analyzed, Pending, Error)
- [x] Date d'upload
- [x] Hover → actions rapides

---

### E3-S4: Document List View
**En tant qu'** utilisateur
**Je veux** voir mes documents en liste
**Afin d'** avoir plus de détails visibles

**Critères d'acceptation:**
- [x] Tableau avec colonnes: Nom, Type, Engagement, Status, Date, Actions
- [x] Header sticky
- [x] Row hover effect
- [x] Tri par colonne (clic sur header)
- [x] Actions inline: Download, Preview, Ask Eve

---

### E3-S5: View Toggle (Grid/List)
**En tant qu'** utilisateur
**Je veux** basculer entre vue grille et liste
**Afin de** choisir ma préférence d'affichage

**Critères d'acceptation:**
- [x] Toggle button avec icônes Grid/List
- [x] État persisté (localStorage)
- [x] Transition smooth entre les vues
- [x] Position: en haut à droite de la zone principale

---

### E3-S6: Search & Filter Documents
**En tant qu'** utilisateur
**Je veux** rechercher et filtrer les documents
**Afin de** trouver rapidement un fichier spécifique

**Critères d'acceptation:**
- [x] Barre de recherche (nom de fichier)
- [x] Filtre par type de document (dropdown)
- [x] Filtre par status (dropdown)
- [x] Filtre par engagement (dropdown)
- [x] Clear filters button
- [x] Résultats mis à jour en temps réel

---

### E3-S7: Breadcrumb Navigation
**En tant qu'** utilisateur
**Je veux** voir un fil d'Ariane (breadcrumb) contextuel
**Afin de** comprendre où je suis et naviguer facilement

**Critères d'acceptation:**
- [x] Breadcrumb visible en haut de la zone principale
- [x] Format: Client > Engagement > Documents
- [x] Chaque niveau est cliquable pour navigation
- [x] Dernier élément non cliquable (page courante)
- [x] Icône "home" pour retour racine
- [x] Style moderne: séparateurs "/" ou chevrons
- [x] Truncate si path trop long (tooltip au hover)

**Référence:** PRD Section 5.2 - Breadcrumb Navigation (FR12)

---

## Epic 4: Smart Upload & Classification (J3-J5)

### E4-S1: API Upload Document
**En tant que** frontend
**Je veux** une API pour uploader des fichiers
**Afin de** permettre l'ajout de documents

**Critères d'acceptation:**
- [ ] POST /api/documents/upload (multipart/form-data)
- [ ] Accepte: xlsx, xls, pdf, csv
- [ ] Limite: 10MB par fichier
- [ ] Retourne: document créé avec status "uploaded"
- [ ] Stockage dans ./uploads/{engagement_id}/
- [ ] Gestion des erreurs (format, taille)

---

### E4-S2: Upload Zone Component
**En tant qu'** utilisateur
**Je veux** une zone de dépôt intuitive
**Afin de** uploader facilement mes fichiers

**Critères d'acceptation:**
- [ ] Zone de drag & drop visible
- [ ] États: default, dragover (highlight), uploading, success, error
- [ ] Support click pour sélection fichier
- [ ] Support multi-fichiers (bulk upload)
- [ ] Preview des fichiers avant upload
- [ ] Bouton "Upload" pour confirmer

**Design:**
- Border dashed, rounded-xl
- Dragover: border-ey-yellow, bg-yellow-50
- Icône upload + texte "Déposez vos fichiers ici"

---

### E4-S3: Classification IA Service
**En tant que** système
**Je veux** classifier automatiquement les documents
**Afin de** les router vers le bon engagement

**Critères d'acceptation:**
- [ ] Détection du type par nom de fichier (rapide)
- [ ] Détection du type par contenu (fallback)
- [ ] Appel Factory AI si incertain
- [ ] Types: general_ledger, trial_balance, tax_return, financial_statement
- [ ] Matching avec engagement par pays/entité
- [ ] Confidence score retourné

**Logique:** PRD Section 12.3

---

### E4-S4: Upload Progress & Feedback
**En tant qu'** utilisateur
**Je veux** voir la progression de l'upload
**Afin de** savoir quand c'est terminé

**Critères d'acceptation:**
- [ ] Progress bar pendant upload
- [ ] Spinner pendant classification
- [ ] Animation de "classification" (fichier → dossier)
- [ ] Toast success: "Document classé dans France SPV"
- [ ] Toast error si échec
- [ ] Mise à jour automatique de la liste

---

### E4-S5: Auto-Update Engagement Status
**En tant que** système
**Je veux** mettre à jour le status de l'engagement
**Afin de** refléter l'avancement automatiquement

**Critères d'acceptation:**
- [ ] Upload document → engagement.status = "received"
- [ ] Classification terminée → engagement.status = "processing"
- [ ] Tous docs requis uploadés → recalcul completion_percent
- [ ] Notification WebSocket ou polling pour update UI
- [ ] Risk level recalculé

---

## Epic 5: Dashboard & Charts (J4-J6)

### E5-S1: API Dashboard KPIs
**En tant que** frontend
**Je veux** une API pour les KPIs du dashboard
**Afin d'** afficher les métriques de l'engagement

**Critères d'acceptation:**
- [ ] GET /api/engagements/{id}/stats
- [ ] Retourne: assets, liabilities, equity, revenue, expenses
- [ ] Inclut: previous_year pour comparaison
- [ ] Inclut: variance_percent calculé
- [ ] Données agrégées si demandé

---

### E5-S2: API Dashboard Charts
**En tant que** frontend
**Je veux** une API pour les données de charts
**Afin d'** alimenter les graphiques

**Critères d'acceptation:**
- [ ] GET /api/dashboard/charts/assets → données assets chart
- [ ] GET /api/dashboard/charts/comparison → N vs N-1
- [ ] GET /api/dashboard/charts/breakdown → répartition
- [ ] Format adapté à Chart.js (labels, datasets)

---

### E5-S3: KPI Section Dashboard
**En tant qu'** utilisateur
**Je veux** voir les KPIs financiers de l'engagement
**Afin de** comprendre la situation en un coup d'œil

**Critères d'acceptation:**
- [ ] Cards pour: Total Assets, Liabilities, Net Equity, Revenue
- [ ] Valeur principale + variation YoY (%)
- [ ] Icône up/down selon variation
- [ ] Couleur: vert si positif, rouge si négatif
- [ ] Animation count-up à l'arrivée
- [ ] CMD+Click enabled pour chaque KPI

---

### E5-S4: Assets Bar Chart
**En tant qu'** utilisateur
**Je veux** voir un graphique des actifs
**Afin de** visualiser la répartition

**Critères d'acceptation:**
- [ ] Bar chart horizontal ou vertical
- [ ] Catégories: Immobilisations, Actifs circulants, Trésorerie
- [ ] Couleurs cohérentes avec le design system
- [ ] Hover → tooltip avec valeur exacte
- [ ] Animation d'entrée

---

### E5-S5: Comparison Chart N vs N-1
**En tant qu'** utilisateur
**Je veux** comparer avec l'année précédente
**Afin de** voir l'évolution

**Critères d'acceptation:**
- [ ] Grouped bar chart (N vs N-1)
- [ ] Métriques: Assets, Liabilities, Revenue, Expenses
- [ ] Légende claire
- [ ] Hover → détails comparatifs
- [ ] Variation % affichée

---

### E5-S6: Smart Tooltip avec Source
**En tant qu'** utilisateur
**Je veux** des tooltips enrichis sur les charts
**Afin de** comprendre d'où viennent les données

**Critères d'acceptation:**
- [ ] Hover sur point/barre → tooltip custom
- [ ] Contenu: valeur, label, source document
- [ ] Lien: "Source: Grand_Livre.xlsx, ligne 234"
- [ ] Indication: "⌘+Click pour demander à Eve"
- [ ] Style: card avec shadow, fond blanc

---

### E5-S7: CMD+Click Integration
**En tant qu'** utilisateur
**Je veux** CMD+Click sur n'importe quel chiffre
**Afin de** demander des explications à Eve

**Critères d'acceptation:**
- [ ] Directive cmdClick sur tous les éléments de données
- [ ] Tooltip "⌘+Click pour demander à Eve" au hover
- [ ] CMD+Click (Mac) / ALT+Click (Win)
- [ ] Ouvre le panel Eve
- [ ] Pré-remplit avec la question contextuelle
- [ ] Eve répond avec explication + source

**Référence:** PRD Section 5.5 - Cmd+Click "Ask Eve"

---

### E5-S8: Chart Drill-Down on Click
**En tant qu'** utilisateur
**Je veux** cliquer sur un élément de graphique pour zoomer/filtrer
**Afin d'** explorer les données en profondeur

**Critères d'acceptation:**
- [ ] Clic sur barre/segment → filtre les données affichées
- [ ] Visuel: élément cliqué devient "actif" (bordure, glow)
- [ ] Breadcrumb de drill-down ("Total > Immobilisations")
- [ ] Bouton "Reset" pour revenir à la vue initiale
- [ ] Animation de transition entre niveaux
- [ ] Fonctionne sur: bar chart, pie chart, line chart
- [ ] Cursor pointer au hover sur éléments cliquables

**Référence:** PRD Section 5.4 - Click Drill-Down (FR25)

---

## Epic 6: Eve Chatbot (J5-J7)

### E6-S1: API Eve Chat
**En tant que** frontend
**Je veux** une API pour le chat avec Eve
**Afin d'** envoyer des messages et recevoir des réponses

**Critères d'acceptation:**
- [ ] POST /api/eve/chat
- [ ] Body: { message, engagement_id?, context? }
- [ ] Response: { message, sources?, engagement_id }
- [ ] Intégration Factory AI
- [ ] Timeout handling (max 30s)
- [ ] Fallback message si erreur

---

### E6-S2: API Eve Explain
**En tant que** frontend
**Je veux** une API pour expliquer des valeurs
**Afin de** supporter le CMD+Click

**Critères d'acceptation:**
- [ ] POST /api/eve/explain
- [ ] Body: { value, context, engagement_id }
- [ ] Response: { explanation, source_document, source_line }
- [ ] Prompt optimisé pour explications courtes
- [ ] Citation de source obligatoire

---

### E6-S3: Eve Floating Button (FAB)
**En tant qu'** utilisateur
**Je veux** un bouton Eve toujours accessible
**Afin d'** ouvrir le chat à tout moment

**Critères d'acceptation:**
- [ ] Floating Action Button en bas à droite
- [ ] Icône chat/assistant
- [ ] Animation pulse si notification
- [ ] Click → ouvre le panel Eve
- [ ] Badge counter si messages non lus
- [ ] Position fixe, z-index élevé

---

### E6-S4: Eve Chat Panel
**En tant qu'** utilisateur
**Je veux** un panneau de chat élégant
**Afin de** converser avec Eve

**Critères d'acceptation:**
- [ ] Panel sliding depuis la droite
- [ ] Header: "Eve - Assistant IA" + bouton fermer
- [ ] Zone de messages scrollable
- [ ] Input en bas avec bouton envoyer
- [ ] Indicateur "Eve réfléchit..." pendant le loading
- [ ] Animation d'apparition smooth
- [ ] Largeur: 400px (desktop), full (mobile)

---

### E6-S5: Message Bubbles
**En tant qu'** utilisateur
**Je veux** des bulles de message stylées
**Afin de** distinguer mes messages de ceux d'Eve

**Critères d'acceptation:**
- [ ] User messages: alignés à droite, bg-ey-yellow
- [ ] Eve messages: alignés à gauche, bg-gray-100
- [ ] Timestamp discret
- [ ] Support markdown basique (gras, listes)
- [ ] Sources cliquables si présentes
- [ ] Animation d'apparition

---

### E6-S6: Eve Context Awareness
**En tant qu'** utilisateur
**Je veux** qu'Eve connaisse mon contexte
**Afin de** ne pas répéter les informations

**Critères d'acceptation:**
- [ ] Eve sait sur quel engagement je suis
- [ ] Eve a accès aux documents de l'engagement
- [ ] Contexte passé automatiquement dans l'API
- [ ] Historique de conversation conservé (session)
- [ ] Possibilité de changer de contexte

---

### E6-S7: Eve Prompts Prédéfinis
**En tant que** développeur
**Je veux** des prompts système bien définis
**Afin qu'** Eve réponde de manière cohérente

**Critères d'acceptation:**
- [ ] System prompt avec personnalité Eve (corporate, vouvoiement)
- [ ] Prompt pour explain value (avec format de réponse)
- [ ] Prompt pour chat général
- [ ] Prompt pour analyse KPI
- [ ] Instructions de formatting (listes, sources)

**Référence:** PRD Section 11 - Spécifications Eve

---

## Epic 7: Risk & Prédictions (J7-J8)

### E7-S1: Risk Calculation Service
**En tant que** système
**Je veux** calculer automatiquement le niveau de risque
**Afin de** prioriser les engagements

**Critères d'acceptation:**
- [ ] Calcul basé sur: jours restants, completion %, docs manquants
- [ ] HIGH: < 7j ET < 80% OU docs manquants à J-7
- [ ] MEDIUM: 7-14j ET < 90% OU analyse > 48h
- [ ] LOW: > 14j OU >= 90% OU completed
- [ ] Recalcul à chaque modification
- [ ] Stockage en DB

**Logique:** PRD Section 16.1

---

### E7-S2: Prediction Calculation Service
**En tant que** système
**Je veux** prédire la date de completion
**Afin d'** informer les utilisateurs

**Critères d'acceptation:**
- [ ] Calcul velocity: completion% / jours écoulés
- [ ] Prédiction: today + (restant% / velocity)
- [ ] Gestion des cas edge (velocity = 0, nouveau)
- [ ] Mise à jour quotidienne
- [ ] Affichage: "Prévu le 25 Feb (+4j)"

**Logique:** PRD Section 16.2

---

### E7-S3: Risk Badge avec Tooltip
**En tant qu'** utilisateur
**Je veux** comprendre pourquoi un engagement est à risque
**Afin de** prendre les bonnes actions

**Critères d'acceptation:**
- [ ] Hover sur badge → tooltip explicatif
- [ ] Contenu: raison du risque + action suggérée
- [ ] Ex: "À risque: 2 documents manquants, deadline dans 5 jours"
- [ ] Suggestion: "Uploadez le General Ledger"

---

### E7-S4: Prédiction Display
**En tant qu'** utilisateur
**Je veux** voir la prédiction de completion
**Afin de** planifier mes actions

**Critères d'acceptation:**
- [ ] Affiché dans l'accordéon engagement
- [ ] Format: "Prévu le [date] ([+/-Xj] vs deadline)"
- [ ] Couleur: vert si en avance, rouge si en retard
- [ ] Icône calendrier
- [ ] Update en temps réel après upload

---

## Epic 8: Polish & Démo (J9-J10)

### E8-S1: Animations & Transitions
**En tant qu'** utilisateur
**Je veux** une expérience fluide et premium
**Afin de** percevoir la qualité du produit

**Critères d'acceptation:**
- [ ] Page transitions (fade/slide)
- [ ] Accordion open/close smooth
- [ ] Chart animations on load
- [ ] Skeleton loaders partout
- [ ] Hover states sur tous les interactifs
- [ ] Toast notifications animées

---

### E8-S2: Error States & Fallbacks
**En tant qu'** utilisateur
**Je veux** des messages d'erreur clairs
**Afin de** comprendre les problèmes

**Critères d'acceptation:**
- [ ] API error → toast avec message
- [ ] Eve timeout → message standard
- [ ] Upload error → explication (format, taille)
- [ ] Empty states avec illustrations
- [ ] Retry buttons où applicable

---

### E8-S3: Demo Script Testing
**En tant que** équipe
**Je veux** un script de démo testé
**Afin de** garantir une présentation parfaite

**Critères d'acceptation:**
- [ ] Script écrit étape par étape
- [ ] Chaque étape testée 10x minimum
- [ ] Timing mesuré (8-10 min total)
- [ ] Fallback plan si problème
- [ ] Données de démo vérifiées
- [ ] Fichiers de test préparés pour upload

**Référence:** PRD Section 7 - Scénario de Démo

---

### E8-S4: Performance Optimization
**En tant que** développeur
**Je veux** une app performante
**Afin de** garantir une démo fluide

**Critères d'acceptation:**
- [ ] Lazy loading des routes
- [ ] Images optimisées
- [ ] Bundle size < 500KB initial
- [ ] Time to Interactive < 3s
- [ ] API responses < 500ms
- [ ] Eve response < 3s

---

## Epic 9: Features Bonus (Should-Have)

### E9-S1: Gantt Chart Generation
**En tant qu'** utilisateur
**Je veux** demander à Eve de générer un Gantt
**Afin de** visualiser le planning

**Critères d'acceptation:**
- [ ] Prompt: "Génère le planning des obligations"
- [ ] Gantt chart avec tous les engagements
- [ ] Dates de début estimées, due dates
- [ ] Affichage dans le panel Eve
- [ ] Export possible (PNG)

---

### E9-S2: Comparison N-1 Auto
**En tant qu'** utilisateur
**Je veux** voir les écarts N-1 automatiquement
**Afin d'** identifier les anomalies

**Critères d'acceptation:**
- [ ] Alerte si variance > 15%
- [ ] Affichage dans ai_insights
- [ ] Eve mentionne proactivement
- [ ] Explication du contexte

---

### E9-S3: Document Preview Inline
**En tant qu'** utilisateur
**Je veux** prévisualiser un document sans le télécharger
**Afin de** gagner du temps

**Critères d'acceptation:**
- [ ] Modal de preview
- [ ] Support PDF (embed viewer)
- [ ] Support Excel (tableau HTML)
- [ ] Navigation pages pour PDF
- [ ] Bouton download

---

### E9-S4: Eve Proactive Notifications
**En tant qu'** utilisateur
**Je veux** qu'Eve m'alerte proactivement
**Afin de** ne rien manquer

**Critères d'acceptation:**
- [ ] Notification si engagement devient HIGH risk
- [ ] Notification si deadline approche (J-7)
- [ ] Badge sur FAB Eve
- [ ] Toast notification
- [ ] Liste dans panel Eve

---

## Epic 10: Platform v2.0 - Navigation & AI Enhancement (Post-MVP)

**Goal:** Transform the platform with a command center navigation, dedicated engagements page, action-driven UX, and enhanced AI with OpenAI integration.

### E10-S1: Command Center (Home Redesign)
**En tant qu'** utilisateur
**Je veux** que la page d'accueil soit un Command Center montrant ce qui requiert mon attention
**Afin de** identifier et agir rapidement sur les éléments urgents

**Critères d'acceptation:**
- [ ] **AC1 - KPIs Summary:** 4 cartes KPI (Total, Actifs, À Risque, Complétés) cliquables
- [ ] **AC2 - Action Center:** Liste des to-dos actifs qui disparaissent une fois complétés
- [ ] **AC3 - Engagements À Risque:** Affiche seulement HIGH et MEDIUM risk
- [ ] **AC4 - Activité Récente:** Feed chronologique des événements récents

**FRs:** FR-V2-01, FR-V2-03

---

### E10-S2: Engagements Page with Filters
**En tant qu'** utilisateur
**Je veux** une page Engagements dédiée avec filtres puissants
**Afin de** trouver n'importe quel engagement parmi 100+ entités

**Critères d'acceptation:**
- [ ] **AC1 - Route dédiée:** `/engagements` avec liste complète
- [ ] **AC2 - Filtres multi-critères:** Entité (searchable), Statut, Année, Service
- [ ] **AC3 - Affichage liste:** Entity, service, status, due date, progress bar, risk badge
- [ ] **AC4 - Persistence filtres:** Conservés dans la session
- [ ] **AC5 - Performance:** Rendu < 2s pour 100+ entités

**FRs:** FR-V2-02, NFR-V2-03

---

### E10-S3: Notifications System
**En tant qu'** utilisateur
**Je veux** une icône cloche affichant les alertes passives
**Afin de** rester informé des événements système

**Critères d'acceptation:**
- [ ] **AC1 - Bell Icon:** Icône 🔔 dans le header avec badge compteur
- [ ] **AC2 - Dropdown:** Liste des notifications récentes au clic
- [ ] **AC3 - Mark as Read:** Possibilité de marquer comme lu
- [ ] **AC4 - Types:** INFO, WARNING, SUCCESS avec icônes appropriées

**FRs:** FR-V2-04

---

### E10-S4: Document Library Hybrid Mode
**En tant qu'** utilisateur
**Je veux** que la Document Library ait deux modes (Vue Engagement et Bibliothèque Globale)
**Afin de** travailler focalisé ou rechercher globalement

**Critères d'acceptation:**
- [ ] **AC1 - Vue Engagement:** Docs filtrés pour l'engagement actif (requis, uploadés, manquants)
- [ ] **AC2 - Vue Globale:** Tous les documents avec filtres (Entité, Année, Type, Statut)
- [ ] **AC3 - Toggle Mode:** Basculer entre les deux modes
- [ ] **AC4 - Recherche Globale:** Recherche par nom, entité, mots-clés

**FRs:** FR-V2-05

---

### E10-S5: Eve OpenAI Integration & RAG
**En tant qu'** utilisateur
**Je veux** qu'Eve utilise OpenAI GPT-4o avec conscience du contexte et lecture des documents
**Afin d'** obtenir des réponses intelligentes basées sur mon contexte et les documents uploadés

**Critères d'acceptation:**
- [ ] **AC1 - OpenAI Integration:** Réponses via GPT-4o, temps < 3s
- [ ] **AC2 - Mode Engagement:** Réponses spécifiques à l'engagement actif
- [ ] **AC3 - Mode Global:** Réponses générales sur Command Center/Engagements page
- [ ] **AC4 - Auto-Switch:** Bascule automatique si entité mentionnée dans la question
- [ ] **AC5 - RAG Documents:** Lecture du contenu des documents avec citations (ligne, cellule)
- [ ] **AC6 - Error Handling:** Message d'erreur gracieux si API indisponible

**FRs:** FR-V2-06, FR-V2-07, FR-V2-08, NFR-V2-01, NFR-V2-02

---

### E10-S6: Sidebar Navigation Update
**En tant qu'** utilisateur
**Je veux** l'avatar déplacé dans la sidebar et la navigation mise à jour
**Afin d'** avoir un layout plus propre et intuitif

**Critères d'acceptation:**
- [ ] **AC1 - Avatar Sidebar:** Profil utilisateur en bas de la sidebar (pas dans header)
- [ ] **AC2 - Navigation Items:** Home, Engagements, Documents, Dashboard avec icônes
- [ ] **AC3 - Header Simplifié:** Logo, titre page, notifications bell seulement
- [ ] **AC4 - Collapse Behavior:** Avatar en icône quand sidebar réduite

**FRs:** FR-V2-09

---

## Résumé Story Points

| Epic | Stories | Estimation |
|------|---------|------------|
| E1 - Setup | 6 | J1-J2 |
| E2 - Landing | 6 | J2-J3 |
| E3 - Documents | 7 | J3-J5 |
| E4 - Upload | 5 | J3-J5 |
| E5 - Dashboard | 8 | J4-J6 |
| E6 - Eve | 7 | J5-J7 |
| E7 - Risk | 4 | J7-J8 |
| E8 - Polish | 4 | J9-J10 |
| **Total Must-Have** | **47** | **10 jours** |
| E9 - Bonus | 4 | Si temps |
| **E10 - Platform v2.0** | **6** | **Post-MVP** |
