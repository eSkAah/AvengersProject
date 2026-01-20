# Full User Stories - Avengers Project

**Version:** 3.0
**Date:** 2026-01-19
**Service:** Company Tax Return (CTR)

---

## Contexte

**Documents CTR requis:** Tax Assessment N-1, General Ledger, Trial Balance, Financial Statement

**Entites Demo:**
- Luxembourg Fund (🇱🇺) - 2/4 docs
- Belgium HoldCo (🇧🇪) - 0/4 docs
- Netherlands BV (🇳🇱) - CTR Complete
- France SPV (🇫🇷) - HERO 3/4 docs
- Germany PropCo (🇩🇪) - 4/4 processing

---

## Epic 1: Navigation (Sidebar → Navbar)

### E1-S1: Navbar Component

**En tant qu'** utilisateur
**Je veux** une navbar horizontale en haut de l'ecran
**Afin d'** avoir une navigation moderne et plus d'espace pour le contenu

**Acceptance Criteria:**
- [ ] Navbar horizontale full-width
- [ ] Background dark (#1F2937)
- [ ] Hauteur fixe 64px
- [ ] Position sticky top
- [ ] Z-index au-dessus du contenu

---

### E1-S2: Logo & Company Name

**En tant qu'** utilisateur
**Je veux** voir le logo et nom de l'entreprise cliente
**Afin d'** identifier clairement le contexte

**Acceptance Criteria:**
- [ ] Logo a gauche de la navbar (32x32px)
- [ ] Nom de l'entreprise a cote du logo
- [ ] Dynamique par client (configurable)
- [ ] Fallback initiales si pas de logo (cercle jaune)
- [ ] Cliquable → retour Home

---

### E1-S3: Menu Principal

**En tant qu'** utilisateur
**Je veux** des liens de navigation clairs
**Afin de** naviguer entre les sections

**Acceptance Criteria:**
- [ ] Items: Home, Engagements, Doclib, Structure, Insights
- [ ] Active state: underline jaune ou subtle background
- [ ] Hover state: changement de couleur subtil
- [ ] Espacement egal entre items
- [ ] Routes: /, /engagements, /documents, /structure, /insights

---

### E1-S4: User Menu (Avatar)

**En tant qu'** utilisateur
**Je veux** un menu utilisateur avec mon avatar
**Afin d'** acceder a mon profil et me deconnecter

**Acceptance Criteria:**
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

**Acceptance Criteria:**
- [ ] Icone bell a gauche de l'avatar
- [ ] Badge compteur si notifications non lues
- [ ] Click → dropdown liste notifications
- [ ] Types: Risk escalation, Deadline, Document uploaded
- [ ] Mark as read / Dismiss individual
- [ ] Dismiss all button
- [ ] Click notification → redirection vers element concerne

---

### E1-S6: Responsive Navbar

**En tant qu'** utilisateur mobile
**Je veux** un menu hamburger sur petit ecran
**Afin de** naviguer facilement sur mobile

**Acceptance Criteria:**
- [ ] Breakpoint: < 768px
- [ ] Menu items caches, hamburger icon visible
- [ ] Click hamburger → menu slide-down ou drawer
- [ ] Animation smooth
- [ ] Fermeture au clic exterieur ou sur item

---

### E1-S7: Supprimer Sidebar

**En tant que** developpeur
**Je veux** supprimer l'ancienne sidebar
**Afin de** nettoyer le code

**Acceptance Criteria:**
- [ ] Supprimer SidebarComponent
- [ ] Supprimer les styles associes
- [ ] Mettre a jour le layout principal
- [ ] Verifier qu'aucune reference ne reste

---

## Epic 2: Dashboard Home (Bento Layout)

### E2-S1: Bento Grid Layout

**En tant qu'** utilisateur
**Je veux** un layout bento moderne
**Afin d'** avoir une vue claire et organisee

**Acceptance Criteria:**
- [ ] CSS Grid 2 colonnes
- [ ] Gap entre widgets (24px)
- [ ] Background page gris clair
- [ ] Widgets avec rounded corners et shadows
- [ ] Responsive: stack sur mobile

---

### E2-S2: Widget Upload / Missing Documents

**En tant qu'** utilisateur
**Je veux** voir les documents manquants et pouvoir uploader
**Afin d'** agir rapidement sur ce qui manque

**Acceptance Criteria:**
- [ ] Drag & drop zone en haut du widget
- [ ] Liste des missing docs en dessous
- [ ] Chaque doc: nom + icone info + bouton upload
- [ ] Tooltip sur icone info → liste des engagements concernes
- [ ] Auto-classification sur upload
- [ ] "View All" link → Document Library

---

### E2-S3: Widget Engagement Status Donut

**En tant qu'** utilisateur
**Je veux** voir la repartition des statuts en donut
**Afin d'** avoir une vue rapide de la situation

**Acceptance Criteria:**
- [ ] Donut chart avec 3 segments
- [ ] Segments: Late (rouge), In Progress (bleu), Soon (orange)
- [ ] Chiffres affiches au centre ou a cote
- [ ] Click sur segment → filtre Widget 4
- [ ] Hover → tooltip avec count exact
- [ ] Animation d'entree

---

### E2-S4: Widget Documents to Sign Off

**En tant qu'** utilisateur
**Je veux** voir les documents necessitant validation
**Afin de** les traiter rapidement

**Acceptance Criteria:**
- [ ] Colonnes: Entity, Document Name, Action
- [ ] Action button → redirige vers engagement
- [ ] Max 5 items affiches
- [ ] Empty state si aucun document

---

### E2-S5: Widget Engagement List

**En tant qu'** utilisateur
**Je veux** voir les engagements filtres par le donut
**Afin d'** acceder rapidement aux urgences

**Acceptance Criteria:**
- [ ] Liste des engagements (top 5)
- [ ] Filtre par segment donut selectionne
- [ ] Infos: Entity, Status, Progress, Risk badge
- [ ] Click row → engagement detail
- [ ] "View All" → page Engagements avec filtre actif

---

### E2-S6: Supprimer Anciens Elements

**En tant que** developpeur
**Je veux** supprimer les anciens elements du dashboard
**Afin d'** avoir un code propre

**Acceptance Criteria:**
- [ ] Supprimer Notifications widget (deplace vers navbar)
- [ ] Supprimer Key Indicators section
- [ ] Supprimer Action Center
- [ ] Supprimer Activity feed

---

## Epic 3: Engagements Page

### E3-S1: View Toggle (Cards / Table)

**En tant qu'** utilisateur
**Je veux** basculer entre vue cards et table
**Afin de** choisir l'affichage qui me convient

**Acceptance Criteria:**
- [ ] Toggle button avec icones Cards/Table
- [ ] Cards = vue par defaut
- [ ] Etat persiste (localStorage)
- [ ] Transition smooth entre vues

---

### E3-S2: Table View avec Rows Expandables

**En tant qu'** utilisateur
**Je veux** voir les engagements en tableau
**Afin d'** avoir une vue dense des informations

**Acceptance Criteria:**
- [ ] Colonnes: Entity, Status, Progress, Risk, Year, Documents, Actions
- [ ] Header sticky
- [ ] Row hover effect
- [ ] Click row → expand avec details
- [ ] Expanded: Documents requis, bouton Details, bouton Eve

---

### E3-S3: Pill Filters

**En tant qu'** utilisateur
**Je veux** des filtres sous forme de pills
**Afin d'** avoir une interface epuree et premium

**Acceptance Criteria:**
- [ ] Style: small pills/chips inline
- [ ] Filtres: Search, Year, Status, Risk, Service
- [ ] Pills selectionnees = background colore
- [ ] Click pill → toggle/dropdown
- [ ] Clear all button

---

### E3-S4: Cards View Updates

**En tant qu'** utilisateur
**Je veux** des cards modernisees
**Afin d'** avoir une experience premium

**Acceptance Criteria:**
- [ ] Card fermee: Entity, Status badge, Progress bar, Risk badge, Country flag
- [ ] Card ouverte: Documents (X/Y), Details button, Eve button
- [ ] Animation expand/collapse smooth
- [ ] Design neutre et premium

---

## Epic 4: Structure Page (Ownership)

### E4-S1: Ownership Percentages

**En tant qu'** utilisateur
**Je veux** voir les pourcentages de propriete sur les lignes
**Afin de** comprendre la structure de propriete

**Acceptance Criteria:**
- [ ] Pourcentage affiche sur chaque ligne de connexion
- [ ] Position: milieu de la ligne
- [ ] Background blanc pour lisibilite
- [ ] Format: "100%" ou "30%"

---

### E4-S2: Cross-Shareholding

**En tant qu'** utilisateur
**Je veux** voir les participations croisees
**Afin de** comprendre les relations complexes

**Acceptance Criteria:**
- [ ] Deux fleches separees si cross-shareholding
- [ ] Chaque fleche avec son pourcentage
- [ ] Direction claire (fleche pointee)
- [ ] Couleur differente ou style pour distinguer

---

### E4-S3: Country Flags

**En tant qu'** utilisateur
**Je veux** voir les drapeaux des pays sur chaque entite
**Afin d'** identifier rapidement la localisation

**Acceptance Criteria:**
- [ ] Flag emoji ou icone sur chaque noeud
- [ ] Position coherente (coin ou a cote du nom)
- [ ] Flags: FR, DE, NL, BE, LU

---

### E4-S4: Auto-Layout Hierarchique

**En tant qu'** utilisateur
**Je veux** un layout automatique base sur la hierarchie
**Afin d'** avoir une visualisation claire

**Acceptance Criteria:**
- [ ] Top-down layout (parent en haut)
- [ ] Arrangement automatique des noeuds
- [ ] Espacement egal entre niveaux
- [ ] Centrage des enfants sous le parent

---

### E4-S5: API Structure

**En tant que** frontend
**Je veux** une API avec les donnees de propriete
**Afin d'** afficher la structure correctement

**Acceptance Criteria:**
- [ ] Endpoint: GET /api/entities/structure
- [ ] Inclut: ownership_percent par relation
- [ ] Inclut: cross_ownership array
- [ ] Format hierarchique

---

### E4-S6: Entity Drawer

**En tant qu'** utilisateur
**Je veux** cliquer sur une entite pour voir ses engagements
**Afin d'** acceder rapidement aux details

**Acceptance Criteria:**
- [ ] Click entite → ouvre drawer lateral (right)
- [ ] Drawer affiche: nom entite, pays, ownership info
- [ ] Liste des engagements de cette entite
- [ ] Click engagement → redirection vers detail
- [ ] Close button et clic exterieur ferme drawer
- [ ] Animation slide-in smooth

---

## Epic 5: Document Library

### E5-S1: Document Status Filter

**En tant qu'** utilisateur
**Je veux** filtrer par statut de document
**Afin de** voir facilement les documents manquants

**Acceptance Criteria:**
- [ ] Filtre dropdown: All, Missing, Uploaded, Analyzed, Validated
- [ ] "Missing" montre les docs demandes mais non uploades
- [ ] Filtre combinable avec entity filter
- [ ] Count affiche par statut

---

### E5-S2: Missing Documents Display

**En tant qu'** utilisateur
**Je veux** voir les documents manquants dans la library
**Afin de** savoir ce qu'il faut uploader

**Acceptance Criteria:**
- [ ] Documents avec statut "missing" apparaissent
- [ ] Style visuel different (grayed out)
- [ ] Bouton upload direct sur chaque doc missing
- [ ] Info: pour quel engagement ce doc est requis

---

### E5-S3: Bulk Download Progress

**En tant qu'** utilisateur
**Je veux** voir la progression du telechargement bulk
**Afin de** savoir quand c'est termine

**Acceptance Criteria:**
- [ ] Progress bar sous le bouton download
- [ ] Pourcentage affiche
- [ ] Notification toast quand termine
- [ ] Cancel button pendant le download

---

### E5-S4: Remove Search by Name

**En tant que** developpeur
**Je veux** retirer le filtre search by name
**Afin de** simplifier l'interface

**Acceptance Criteria:**
- [ ] Supprimer le champ de recherche par nom
- [ ] Verifier que les autres filtres fonctionnent

---

### E5-S5: Entity Filter Simplification

**En tant qu'** utilisateur
**Je veux** un filtre entity simplifie
**Afin d'** avoir une navigation claire

**Acceptance Criteria:**
- [ ] Toggle entity filter on/off seulement
- [ ] Pas de selection "all documents" dans le tree
- [ ] Si filtre off → tous les documents de toutes entites

---

## Epic 6: Upload & Attribution Validation

### E6-S1: Attribution Review Screen

**En tant qu'** utilisateur
**Je veux** valider les attributions de l'IA
**Afin de** corriger les erreurs avant placement

**Acceptance Criteria:**
- [ ] Modal ou page dediee apres upload
- [ ] Liste des documents uploades
- [ ] Colonnes: Document, Entity, Year, Type, Action
- [ ] Action: Validate (check) ou Edit (pencil)
- [ ] Bouton global "Validate & Place"

---

### E6-S2: Edit Attribution Modal

**En tant qu'** utilisateur
**Je veux** corriger une attribution incorrecte
**Afin de** placer le document au bon endroit

**Acceptance Criteria:**
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

**Acceptance Criteria:**
- [ ] Apres validation → animation
- [ ] Documents "volent" vers leur emplacement
- [ ] Redirection vers doclib avec highlight
- [ ] Toast de confirmation

---

### E6-S4: API Validate Attribution

**En tant que** frontend
**Je veux** une API pour valider les attributions
**Afin de** finaliser le placement

**Acceptance Criteria:**
- [ ] Endpoint: POST /api/documents/validate-attribution
- [ ] Body: array of { document_id, entity_id, year, type }
- [ ] Response: success + documents places

---

### E6-S5: Confidence Indicator

**En tant qu'** utilisateur
**Je veux** voir le niveau de confiance de l'IA
**Afin de** savoir quoi verifier en priorite

**Acceptance Criteria:**
- [ ] Indicateur: High/Medium/Low confidence
- [ ] Couleur: vert/orange/rouge
- [ ] Low confidence = highlight pour attention

---

## Epic 7: Results Tab (CTR)

### E7-S1: Results Tab Component

**En tant qu'** utilisateur
**Je veux** un onglet Results dans l'engagement
**Afin de** voir les resultats du CTR

**Acceptance Criteria:**
- [ ] Nouvel onglet "Results" dans engagement detail
- [ ] Actif seulement si CTR complete
- [ ] Desactive/cache si pas de resultat
- [ ] Badge "New" si resultat recent

---

### E7-S2: Results Tab Activation

**En tant que** systeme
**Je veux** activer l'onglet quand CTR est complete
**Afin de** montrer les resultats au bon moment

**Acceptance Criteria:**
- [ ] Conditions: 4 docs valides + service effectue
- [ ] Check engagement.ctr_result != null
- [ ] Message si pas encore complete

---

### E7-S3: CTR Documents Display

**En tant qu'** utilisateur
**Je veux** voir les documents resultat
**Afin de** les telecharger

**Acceptance Criteria:**
- [ ] Liste: CTR Report (PDF), CTR Data (XML)
- [ ] Icones par type de fichier
- [ ] Boutons: Download, Preview
- [ ] Date de generation

---

### E7-S4: CTR Charts Section

**En tant qu'** utilisateur
**Je veux** voir des graphiques CTR
**Afin de** visualiser les donnees fiscales

**Acceptance Criteria:**
- [ ] ETR Reconciliation (Waterfall chart)
- [ ] Current vs Deferred Tax (Donut)
- [ ] Tax by Category (Bar chart)
- [ ] KPI Cards: Tax Liability, ETR %, Pre-tax Income
- [ ] Tous CMD+Clickable pour Eve

---

### E7-S5: Waterfall Chart

**En tant qu'** utilisateur
**Je veux** un waterfall chart pour ETR reconciliation
**Afin de** comprendre le passage statutory → effective

**Acceptance Criteria:**
- [ ] Barre initiale: Statutory Rate
- [ ] Barres intermediaires: ajustements (+/-)
- [ ] Barre finale: Effective Rate
- [ ] Couleurs: vert reduction, rouge augmentation
- [ ] Hover → detail
- [ ] CMD+Click → Eve

---

### E7-S6: API CTR Results

**En tant que** frontend
**Je veux** une API pour les resultats CTR
**Afin d'** alimenter l'onglet Results

**Acceptance Criteria:**
- [ ] Endpoint: GET /api/engagements/{id}/results
- [ ] Response: documents, tax_data, charts_data
- [ ] 404 si pas de resultat

---

## Epic 8: Insights Page

### E8-S1: Insights Page Routing

**En tant qu'** utilisateur
**Je veux** acceder a la page Insights
**Afin de** voir les KPIs globaux

**Acceptance Criteria:**
- [ ] Route: /insights
- [ ] Lien dans navbar
- [ ] Page component cree
- [ ] Layout responsive

---

### E8-S2: Global KPI Cards

**En tant qu'** utilisateur
**Je veux** voir les KPIs agreges
**Afin d'** avoir une vue portfolio

**Acceptance Criteria:**
- [ ] Card: Total Tax Liability (somme)
- [ ] Card: Avg Effective Tax Rate (moyenne ponderee)
- [ ] Card: CTRs Completed (X/Y)
- [ ] Card: Entities at Risk (count)
- [ ] Animation count-up

---

### E8-S3: Tax by Entity Chart

**En tant qu'** utilisateur
**Je veux** comparer les taxes par entite
**Afin de** identifier les plus grosses contributions

**Acceptance Criteria:**
- [ ] Horizontal bar chart
- [ ] Une barre par entite
- [ ] Trie par montant decroissant
- [ ] CMD+Click → Eve

---

### E8-S4: ETR by Entity Chart

**En tant qu'** utilisateur
**Je veux** comparer les taux effectifs
**Afin d'** identifier les anomalies

**Acceptance Criteria:**
- [ ] Bar chart vertical
- [ ] Ligne de reference: statutory rate
- [ ] Couleur differente si au-dessus/en-dessous
- [ ] CMD+Click → Eve

---

### E8-S5: YoY Comparison Chart

**En tant qu'** utilisateur
**Je veux** voir l'evolution N vs N-1
**Afin de** comprendre les tendances

**Acceptance Criteria:**
- [ ] Grouped bar chart
- [ ] Barres: 2025 vs 2026
- [ ] Variation % affichee
- [ ] CMD+Click → Eve

---

### E8-S6: Tax by Jurisdiction Chart

**En tant qu'** utilisateur
**Je veux** voir la repartition geographique
**Afin de** comprendre l'exposition fiscale

**Acceptance Criteria:**
- [ ] Donut chart
- [ ] Segments par pays
- [ ] Pourcentage par segment
- [ ] CMD+Click → Eve

---

### E8-S7: Insights Filters

**En tant qu'** utilisateur
**Je veux** filtrer les donnees Insights
**Afin de** me concentrer sur un sous-ensemble

**Acceptance Criteria:**
- [ ] Filtre Year: dropdown
- [ ] Filtre Entity: multi-select
- [ ] Filtres appliques a tous les charts
- [ ] Reset button

---

### E8-S8: API Insights

**En tant que** frontend
**Je veux** une API pour les donnees Insights
**Afin d'** alimenter la page

**Acceptance Criteria:**
- [ ] GET /api/insights/kpis → KPI cards data
- [ ] GET /api/insights/charts → all charts data
- [ ] Query params: year, entity_ids

---

## Epic 9: Eve AI Assistant

### E9-S1: Eve Context Insights

**En tant qu'** utilisateur
**Je veux** qu'Eve connaisse le contexte Insights
**Afin de** poser des questions sur les KPIs globaux

**Acceptance Criteria:**
- [ ] Eve detecte qu'on est sur /insights
- [ ] Context inclut: KPIs agreges, filtres actifs
- [ ] Reponses appropriees au contexte global

---

### E9-S2: CMD+Click All Charts

**En tant qu'** utilisateur
**Je veux** CMD+Click sur tous les nouveaux charts
**Afin de** demander des explications a Eve

**Acceptance Criteria:**
- [ ] Directive cmdClick sur charts Insights
- [ ] Directive cmdClick sur charts Results tab
- [ ] Tooltip "CMD+Click for Eve" au hover
- [ ] Pre-fill question avec contexte du data point

---

### E9-S3: Eve CTR Responses

**En tant qu'** utilisateur
**Je veux** qu'Eve explique les donnees CTR
**Afin de** comprendre les resultats fiscaux

**Acceptance Criteria:**
- [ ] Eve peut expliquer: ETR, tax liability, deferred tax
- [ ] Prompts specifiques pour donnees fiscales
- [ ] Sources: CTR Report, documents sources
- [ ] Ton: professionnel, educatif

---

### E9-S4: Eve Sliding Panel

**En tant qu'** utilisateur
**Je veux** un panneau Eve accessible partout
**Afin de** poser des questions a tout moment

**Acceptance Criteria:**
- [ ] FAB button en bas a droite (floating)
- [ ] Click FAB → panneau slide depuis la droite
- [ ] Width: 400px
- [ ] Animation 300ms ease-out
- [ ] Close button + clic exterieur ferme

---

### E9-S5: Eve Quick Prompts

**En tant qu'** utilisateur
**Je veux** des boutons de questions rapides
**Afin de** commencer facilement une conversation

**Acceptance Criteria:**
- [ ] 4 boutons pre-definis
- [ ] Boutons contextuels selon la page
- [ ] Click → envoie la question
- [ ] Exemples: "Explain this", "Compare to last year"

---

### E9-S6: Eve Contextual Responses

**En tant qu'** utilisateur
**Je veux** qu'Eve reponde en contexte
**Afin de** ne pas avoir a re-expliquer ce que je regarde

**Acceptance Criteria:**
- [ ] Eve connait l'engagement actif
- [ ] Eve connait la page actuelle
- [ ] Reponses avec citations des documents
- [ ] Auto-switch si on mentionne un autre engagement

---

## Epic 10: Design System Polish

### E10-S1: Color Palette Update

**En tant que** developpeur
**Je veux** mettre a jour la palette de couleurs
**Afin d'** avoir un design plus premium

**Acceptance Criteria:**
- [ ] Reduire l'utilisation des couleurs vives
- [ ] Plus de neutrals (grays)
- [ ] Accents jaune EY subtils
- [ ] Navbar dark (#1F2937)

---

### E10-S2: Pill Filters Styling

**En tant que** developpeur
**Je veux** styliser les filtres en pills
**Afin d'** avoir une interface epuree

**Acceptance Criteria:**
- [ ] Pills small, rounded-full
- [ ] Border subtle
- [ ] Background neutre, selected = accent
- [ ] Hover state subtil
- [ ] Inline layout

---

### E10-S3: Cards Neutralization

**En tant que** developpeur
**Je veux** rendre les cards plus neutres
**Afin d'** avoir un look premium

**Acceptance Criteria:**
- [ ] Reduire les couleurs dans les cards
- [ ] Borders plus subtils
- [ ] Shadows plus legeres
- [ ] Focus sur le contenu

---

### E10-S4: Remove Excess Colors

**En tant que** developpeur
**Je veux** retirer les couleurs excessives
**Afin d'** avoir un design coherent

**Acceptance Criteria:**
- [ ] Audit de toutes les pages
- [ ] Identifier les elements trop colores
- [ ] Remplacer par neutrals ou accents subtils

---

## Resume

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
| E9 - Eve | 6 | Must-Have |
| E10 - Design | 4 | Should-Have |
| **Total** | **57** | |

---

## Definition of Done

- [ ] Code implemente et fonctionnel
- [ ] Tests unitaires ecrits (si applicable)
- [ ] Responsive verifie (desktop + mobile)
- [ ] Design conforme au PRD
- [ ] Code review effectuee
- [ ] Merge dans develop
