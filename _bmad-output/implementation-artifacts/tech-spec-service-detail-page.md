---
title: 'Service Detail Page'
slug: 'service-detail-page'
created: '2026-01-23'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - Angular 19 (standalone components, signals, ChangeDetectionStrategy.OnPush)
  - Chart.js (pie chart exists, need LineController/Filler for stacked area)
  - SCSS with @use 'styles/variables' as *
  - Lucide Angular icons
  - BEM naming convention
files_to_modify:
  - frontend/src/app/app.routes.ts
  - frontend/src/app/core/components/navbar/navbar.component.ts
  - frontend/src/app/core/components/navbar/navbar.component.html
  - frontend/src/app/core/components/navbar/navbar.component.scss
  - frontend/src/app/features/home/components/services-widget/services-widget.component.ts
  - frontend/src/app/features/home/components/services-widget/services-widget.component.html
  - frontend/src/app/shared/components/charts/index.ts
files_to_create:
  - frontend/src/app/features/service-detail/service-detail.component.ts
  - frontend/src/app/features/service-detail/service-detail.component.html
  - frontend/src/app/features/service-detail/service-detail.component.scss
  - frontend/src/app/shared/components/charts/stacked-area-chart.component.ts
  - frontend/src/app/core/services/service-entity.service.ts
code_patterns:
  - ChangeDetectionStrategy.OnPush for all components
  - Signals for reactive state (signal(), computed())
  - Standalone components with explicit imports array
  - BEM naming in SCSS (.block__element--modifier)
  - Premium card styling with layered shadows
  - Tab pattern using signal for activeTab state
  - Dropdown pattern using signal for open state
  - Chart.js registration at component level
test_patterns: []
---

# Tech-Spec: Service Detail Page

**Created:** 2026-01-23
**Status:** Ready for Review

## Overview

### Problem Statement

Users need to see all entities subscribed to a service with their individual status, progress, and a visual overview of the service health. Currently, clicking on a service in the home page has no navigation target, and there's no way to drill down into service-level entity details.

### Solution

Create a new Service Detail feature page accessible from:
1. Home page services widget (click on any service card)
2. New "My Services" dropdown in the navbar

The page displays:
- Service title header with icon
- Pie chart showing entity distribution by status
- Stacked area burn-up chart showing status progression over time
- Tabbed interface with Entities (active), Documents (placeholder), Insights (placeholder)
- Entities table with: Entity name, Status, Progress %

### Scope

**In Scope:**
- New route `/app/services/:id`
- Service Detail page component with premium Apple/Stripe styling
- Pie chart component integration (entities by status)
- New stacked area chart component (burn-up progression over time)
- Entities tab with table
- "My Services" dropdown in navbar with all 5 services
- Navigation from home page services widget to service detail
- New mock data service for entity-level data per service

**Out of Scope:**
- Documents tab content (placeholder only)
- Insights tab content (placeholder only)
- Backend API integration
- Search/filter functionality on entities table
- Export functionality

---

## Context for Development

### Codebase Patterns

**Component Pattern:**
```typescript
@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ...],
  templateUrl: './component-name.component.html',
  styleUrl: './component-name.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

**Tab Pattern (from engagement-detail):**
```typescript
readonly activeTab = signal<TabType>('entities');
setActiveTab(tab: TabType): void {
  this.activeTab.set(tab);
}
```

**Dropdown Pattern (from navbar):**
```typescript
servicesMenuOpen = signal<boolean>(false);
toggleServicesMenu() {
  this.servicesMenuOpen.update(v => !v);
  // Close other menus
  this.userMenuOpen.set(false);
  this.notificationsOpen.set(false);
}
```

**Chart.js Registration:**
```typescript
import { Chart, LineController, LineElement, PointElement, Filler, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(LineController, LineElement, PointElement, Filler, CategoryScale, LinearScale, Tooltip, Legend);
```

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `features/engagement-detail/engagement-detail.component.ts` | Tab pattern, page structure, signals |
| `features/engagement-detail/engagement-detail.component.scss` | `.engagement-tabs` styling, `.detail-card` styling |
| `shared/components/charts/pie-chart.component.ts` | Chart.js integration, PieChartData interface |
| `shared/components/charts/bar-chart.component.ts` | Chart.js registration pattern |
| `core/components/navbar/navbar.component.ts` | Dropdown signal pattern, `@HostListener` for outside click |
| `core/components/navbar/navbar.component.scss` | `.dropdown`, `.dropdown-item` styles |
| `features/home/components/services-widget/services-widget.component.ts` | `ClientService` interface, services data |

### Technical Decisions

1. **Route structure:** `/app/services/:id` where id = cit, vat, assessment, transfer-pricing
2. **Service data:** New `ServiceEntityService` injectable with mock data
3. **Stacked Area Chart:** Chart.js with `fill: 'origin'` for stacking effect
4. **Navbar position:** "My Services" added after "Home" in navItems
5. **Status colors:** Green (#10B981), Yellow (#F59E0B), Blue (#3B82F6), Gray (#6B7280)

---

## Implementation Plan

### Tasks

- [ ] **Task 1: Create ServiceEntityService (Mock Data)**
  - File: `frontend/src/app/core/services/service-entity.service.ts`
  - Action: Create injectable service with:
    - `Service` interface: id, name, description, icon, iconBgColor
    - `ServiceEntity` interface: id, name, countryFlag, status ('not-started' | 'in-progress' | 'reviewing' | 'completed'), progress (0-100), lastUpdated
    - `ProgressionDataPoint` interface: date, notStarted, inProgress, reviewing, completed
    - `getServices(): Service[]` - returns all 5 services
    - `getServiceById(id: string): Service | undefined`
    - `getEntitiesByService(serviceId: string): ServiceEntity[]` - 5-8 entities per service
    - `getProgressionHistory(serviceId: string): ProgressionDataPoint[]` - 12 weeks of data
  - Notes: Use realistic entity names (France SCI, Germany GmbH, Netherlands BV, etc.)

- [ ] **Task 2: Export ServiceEntityService**
  - File: `frontend/src/app/core/services/index.ts`
  - Action: Add `export * from './service-entity.service';`

- [ ] **Task 3: Create StackedAreaChartComponent**
  - File: `frontend/src/app/shared/components/charts/stacked-area-chart.component.ts`
  - Action: Create standalone component with:
    - Register: LineController, LineElement, PointElement, Filler, CategoryScale, LinearScale, Tooltip, Legend
    - Input: `data: ProgressionDataPoint[]`, `loading: boolean`
    - 4 stacked datasets with fill: 'origin' (Completed bottom, Not Started top)
    - Colors: Completed #10B981, Reviewing #F59E0B, In Progress #3B82F6, Not Started #E5E7EB
    - Premium styling: smooth curves (tension: 0.4), no points, custom tooltip
    - Responsive with aspect ratio 2:1
  - Notes: Follow pie-chart.component.ts pattern for structure

- [ ] **Task 4: Export StackedAreaChartComponent**
  - File: `frontend/src/app/shared/components/charts/index.ts`
  - Action: Add `export * from './stacked-area-chart.component';`

- [ ] **Task 5: Create ServiceDetailComponent (TypeScript)**
  - File: `frontend/src/app/features/service-detail/service-detail.component.ts`
  - Action: Create standalone component with:
    - Inject: ActivatedRoute, Router, ServiceEntityService
    - Signals: `serviceId`, `activeTab` ('entities' | 'documents' | 'insights')
    - Computed: `service()`, `entities()`, `progressionData()`, `pieChartData()`
    - Methods: `setActiveTab()`, `goBack()`, `getStatusLabel()`, `getStatusClass()`
    - OnInit: Subscribe to route params, extract service ID
  - Notes: Use takeUntilDestroyed for subscription cleanup

- [ ] **Task 6: Create ServiceDetailComponent (HTML)**
  - File: `frontend/src/app/features/service-detail/service-detail.component.html`
  - Action: Create template with:
    - Breadcrumb: Home > Services > {Service Name}
    - Header card: Icon + Service name + description
    - Charts row: 2-column grid with Pie chart (left) + Stacked area (right)
    - Tab bar: Entities | Documents | Insights (using engagement-tabs pattern)
    - Entities tab: Table with columns (Entity, Status, Progress)
    - Documents/Insights tabs: "Coming soon" placeholder
    - Back button

- [ ] **Task 7: Create ServiceDetailComponent (SCSS)**
  - File: `frontend/src/app/features/service-detail/service-detail.component.scss`
  - Action: Create styles with:
    - `.service-detail` container (max-width: 1200px, centered)
    - `.service-header` card with icon and title
    - `.charts-row` 2-column grid (1fr 1.5fr)
    - `.service-tabs` matching engagement-tabs pattern
    - `.entities-table` with premium styling (hover, zebra, progress bar)
    - `.placeholder-content` for coming soon tabs
  - Notes: Use @use 'styles/variables' as *

- [ ] **Task 8: Add Service Detail Route**
  - File: `frontend/src/app/app.routes.ts`
  - Action: Add route after engagements routes:
    ```typescript
    {
      path: 'app/services/:id',
      loadComponent: () =>
        import('./features/service-detail/service-detail.component').then(
          m => m.ServiceDetailComponent
        ),
    },
    ```

- [ ] **Task 9: Add Navbar Services Dropdown (TypeScript)**
  - File: `frontend/src/app/core/components/navbar/navbar.component.ts`
  - Action:
    - Add import: `import { ServiceEntityService } from '../../services/service-entity.service';`
    - Add signal: `servicesMenuOpen = signal<boolean>(false);`
    - Add computed: `services = computed(() => this.serviceEntity.getServices());`
    - Add method: `toggleServicesMenu()` (close other menus)
    - Update `@HostListener('document:click')` to close services menu
    - Update `onEscapeKey()` to close services menu

- [ ] **Task 10: Add Navbar Services Dropdown (HTML)**
  - File: `frontend/src/app/core/components/navbar/navbar.component.html`
  - Action: Add after Home nav-item, before other items:
    ```html
    <div class="services-menu-container">
      <button class="navbar-item navbar-item--dropdown"
              (click)="toggleServicesMenu()"
              [class.active]="servicesMenuOpen()">
        My Services
        <lucide-icon [img]="icons.chevronDown" [size]="14"></lucide-icon>
      </button>
      @if (servicesMenuOpen()) {
        <div class="dropdown services-dropdown">
          @for (service of services(); track service.id) {
            <a class="dropdown-item"
               [routerLink]="['/app/services', service.id]"
               (click)="servicesMenuOpen.set(false)">
              {{ service.name }}
            </a>
          }
        </div>
      }
    </div>
    ```

- [ ] **Task 11: Add Navbar Services Dropdown (SCSS)**
  - File: `frontend/src/app/core/components/navbar/navbar.component.scss`
  - Action: Add styles:
    ```scss
    .services-menu-container {
      position: relative;
    }

    .navbar-item--dropdown {
      display: flex;
      align-items: center;
      gap: 4px;

      lucide-icon {
        transition: transform 200ms ease-out;
      }

      &.active lucide-icon {
        transform: rotate(180deg);
      }
    }

    .services-dropdown {
      width: 220px;
      padding: 8px 0;
    }
    ```

- [ ] **Task 12: Add Navigation from Services Widget**
  - File: `frontend/src/app/features/home/components/services-widget/services-widget.component.ts`
  - Action:
    - Add import: `import { Router } from '@angular/router';`
    - Inject Router: `private router = inject(Router);`
    - Add method:
      ```typescript
      navigateToService(serviceId: string): void {
        this.router.navigate(['/app/services', serviceId]);
      }
      ```

- [ ] **Task 13: Update Services Widget Template**
  - File: `frontend/src/app/features/home/components/services-widget/services-widget.component.html`
  - Action: Add click handler to service card:
    ```html
    <div class="service-card" (click)="navigateToService(service.id)">
    ```

---

## Acceptance Criteria

- [ ] **AC1:** Given I am on the home page, when I click on "Corporate Tax Return" service card, then I am navigated to `/app/services/cit` and I see the service detail page with title "Corporate Tax Return"

- [ ] **AC2:** Given I am on the service detail page, when the page loads, then I see a pie chart on the left showing entity counts by status (Completed green, Reviewing yellow, In Progress blue, Not Started gray)

- [ ] **AC3:** Given I am on the service detail page, when the page loads, then I see a stacked area chart on the right showing 12 weeks of progression history with 4 stacked areas

- [ ] **AC4:** Given I am on the service detail page, when the Entities tab is active (default), then I see a table with columns: Entity (with flag), Status (badge), Progress (percentage with visual bar)

- [ ] **AC5:** Given I am on the service detail page, when I click the "Documents" tab, then I see a "Coming soon" placeholder message

- [ ] **AC6:** Given I am on the service detail page, when I click the "Insights" tab, then I see a "Coming soon" placeholder message

- [ ] **AC7:** Given I am logged in and viewing any page, when I click "My Services" in the navbar, then I see a dropdown with 4 services: Corporate Tax Return, VAT Return, Tax Assessment, Transfer Pricing

- [ ] **AC8:** Given the "My Services" dropdown is open, when I click on "VAT Return", then the dropdown closes and I am navigated to `/app/services/vat`

- [ ] **AC9:** Given I am on a service detail page, when I click the back button, then I am navigated to the home page

- [ ] **AC10:** Given the service detail page is loaded on mobile (< 768px), when I view the charts section, then the charts stack vertically (single column)

---

## Additional Context

### Dependencies

| Dependency | Status | Notes |
| ---------- | ------ | ----- |
| Chart.js | Installed | Need LineController, Filler imports |
| Lucide Angular | Installed | Need Briefcase icon import in service-detail |
| Angular Router | Configured | ActivatedRoute for params |

### Testing Strategy

**Manual Testing:**
1. Navigate from home page service card to detail page
2. Navigate from navbar dropdown to each service
3. Verify charts render correctly with mock data
4. Test tab switching (Entities, Documents, Insights)
5. Test back navigation
6. Test responsive layout on mobile viewport

**Visual Verification:**
- Pie chart colors match status colors
- Stacked area chart shows proper stacking order
- Table rows have hover effects
- Dropdown animation matches existing menus

### Notes

**Implementation Order Rationale:**
1. Mock data service first (no dependencies)
2. Stacked area chart (standalone, can test independently)
3. Service detail page (uses both chart and service)
4. Route (enables navigation)
5. Navbar dropdown (alternative navigation)
6. Home page navigation (primary entry point)

**Risk Items:**
- Chart.js stacking requires correct dataset order (bottom to top: Completed, Reviewing, In Progress, Not Started)
- Navbar dropdown z-index must be above page content

**Future Considerations (Out of Scope):**
- Documents tab: Show documents filtered by service
- Insights tab: AI-generated insights per service
- Entity click: Navigate to entity detail
- Real-time data updates via WebSocket
