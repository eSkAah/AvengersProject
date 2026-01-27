---
title: 'Multicountry Table Expansion & CIT Document Approval Modal'
slug: 'multicountry-cit-approval-modal'
created: '2026-01-27'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - Angular 19 (standalone components, Signals)
  - Tailwind CSS + SCSS with design tokens
  - Lucide Icons (lucide-angular)
  - Angular CDK (Overlay, Portal)
  - Chart.js
files_to_modify:
  - frontend/src/app/features/service-detail/components/service-insights/service-insights.component.ts
  - frontend/src/app/features/service-detail/components/service-insights/service-insights.component.html
  - frontend/src/app/features/service-detail/components/service-insights/service-insights.component.scss
  - frontend/src/app/shared/components/cit-approval-modal/cit-approval-modal.component.ts (NEW)
  - frontend/src/app/shared/components/index.ts
  - frontend/src/app/features/home/components/signoff-widget/signoff-widget.component.ts
code_patterns:
  - Standalone Angular components with ChangeDetectionStrategy.OnPush
  - Signals for reactive state (signal(), computed())
  - CDK Overlay for modal rendering outside parent containers
  - TemplatePortal for modal content injection
  - SCSS design tokens ($ey-yellow, $ey-dark, $surface-*, $text-*, etc.)
  - EY Design System (yellow #FFE600 primary, dark #2E2E38 headers)
  - Animation keyframes (fadeIn, slideUp)
test_patterns:
  - Manual testing for POC phase
---

# Tech-Spec: Multicountry Table Expansion & CIT Document Approval Modal

**Created:** 2026-01-27

## Overview

### Problem Statement

The current Multicountry section in the Service Insights page uses a master-detail split view that requires scrolling to see all data columns. Users need to:
1. View all tax data columns at once in a full-screen table format
2. Preview the source CIT (Corporate Income Tax) document for each entity
3. Approve or reject CIT documents with comments
4. Access the same approval workflow from the Dashboard for entities with pending approval actions

### Solution

Create a reusable **CIT Approval Modal** component that provides:
1. **Full-screen expandable table** showing all Multicountry columns without horizontal scroll
2. **Document preview panel** displaying a mock CIT document with two selectable views (EY Report / Official Form)
3. **Approval workflow** with Approve/Reject buttons and comment field
4. **Integration points** in both the Multicountry section and Dashboard signoff widget

### Scope

**In Scope:**
- New `CitApprovalModalComponent` in `shared/components/` (reusable)
- Full-screen table expansion feature for Multicountry section
- Mock CIT document data with two views:
  - EY Summary Report (branded design, KPIs, structured sections)
  - Official CIT Form (tax form style, labeled fields)
- Toggle/tabs to switch between document views
- Approval/Reject workflow with comments (local state only)
- Action buttons in Multicountry section header (Expand, Approve, Eye icon for preview)
- Integration with existing `SignoffWidgetComponent` on Dashboard
- All columns from the CTR Review Dashboard screenshot

**Out of Scope:**
- Backend API integration for approval workflow
- Actual PDF document storage/retrieval
- Email notifications for approvals
- Approval history/audit trail
- Multi-user approval workflows

## Context for Development

### Codebase Patterns

**Existing Modal Pattern (from `SignoffWidgetComponent`):**
```typescript
// Uses Angular CDK Overlay for rendering outside parent containers
private readonly overlay = inject(Overlay);
private readonly viewContainerRef = inject(ViewContainerRef);
private modalOverlayRef: OverlayRef | null = null;

openModal(): void {
  this.modalOverlayRef = this.overlay.create({
    hasBackdrop: false, // Custom backdrop in template
    positionStrategy: this.overlay.position().global(),
    scrollStrategy: this.overlay.scrollStrategies.block(),
  });
  const portal = new TemplatePortal(this.modalTemplate, this.viewContainerRef);
  this.modalOverlayRef.attach(portal);
}
```

**State Management Pattern:**
```typescript
readonly selectedEntity = signal<MultiCountryData | null>(null);
readonly isApproving = signal(false);
readonly approvalComment = signal('');
readonly documentViewMode = signal<'ey-report' | 'official-form'>('ey-report');
```

**SCSS Design Tokens (from `service-insights.component.scss`):**
```scss
$ey-yellow: #FFE600;
$ey-yellow-hover: #FFD000;
$ey-yellow-light: rgba(255, 230, 0, 0.08);
$ey-dark: #2E2E38;
$ey-black: #1A1A1F;
$surface-primary: #FFFFFF;
$surface-secondary: #F8F9FA;
$text-primary: #1A1A1F;
$text-secondary: #5F6368;
$text-tertiary: #9AA0A6;
$radius-lg: 16px;
$transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.ts` | Main component with Multicountry section, `MultiCountryData` interface |
| `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.html` | Template with master-detail view to enhance |
| `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.scss` | SCSS with design tokens and dark theme filter bar |
| `frontend/src/app/features/home/components/signoff-widget/signoff-widget.component.ts` | **KEY REFERENCE** - Existing approval modal with CDK Overlay pattern |
| `frontend/src/app/shared/components/document-preview-modal/document-preview-modal.component.ts` | Modal with table/PDF preview patterns |
| `frontend/src/app/shared/components/drill-down-modal/drill-down-modal.component.ts` | Modal with signal-based state |
| `frontend/src/app/core/models/entity.model.ts` | `EntityTaxReport` interface with comprehensive tax data |
| `frontend/src/app/shared/pipes/currency-ey.pipe.ts` | Currency formatting for financial values |

### Technical Decisions

1. **Component Location:** Create `CitApprovalModalComponent` in `shared/components/cit-approval-modal/` for reusability between Multicountry and Dashboard

2. **Modal Implementation:** Use Angular CDK Overlay (same pattern as `SignoffWidgetComponent`) to render outside parent containers and avoid overflow clipping

3. **Table Columns (based on CTR Review Dashboard screenshot):**
   - Entity, Fund, Year, Currency, Tax Memo, IP Memo, Tax Conso
   - Commercial Result, Tax Balance Sheet Result, Net Worth Tax, SA INV
   - Total Tax Losses, FTA Year, Recapture, SBA Memo
   - Taxable Result before TLCF, Taxable Result after TLCF
   - Participation Income, Qsfu Parts

4. **CIT Document Preview - Two Selectable Views:**
   - **EY Summary Report:** Premium branded design with KPIs, charts, structured sections
   - **Official CIT Form:** Tax form style (inspired by IRS Form 1120) with labeled fields
   - Toggle/tabs to switch between views

5. **Approval State:**
   ```typescript
   interface ApprovalState {
     status: 'pending' | 'approved' | 'rejected';
     comment: string;
     approvedBy?: string;
     approvedAt?: string;
   }
   ```

6. **Data Model Extension:** Extend `MultiCountryData` interface with additional columns

## Implementation Plan

### Tasks

#### Phase 1: Data Model & Interface Updates

- [x] **Task 1: Extend MultiCountryData interface**
  - File: `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.ts`
  - Action: Add new fields to `MultiCountryData` interface to match CTR Review Dashboard columns
  - Fields to add:
    ```typescript
    export interface MultiCountryData {
      // Existing fields...
      id: string;
      entity: string;
      subFund: string;
      year: number;
      taxBase: number;
      taxDeductibleDepreciationPY: number;
      taxDeductibleDepreciationCY: number;
      taxLossCarryForward: number;
      interestExpenseFromStatutory: number;
      statutoryProfit: number;
      participationExemption: number;
      internationalAllocation: number;
      debtToEquityRatio: number;
      dividendOrCapital: number;
      // NEW fields from CTR Review Dashboard
      fund?: string;
      currency?: 'EUR' | 'GBP' | 'USD';
      taxMemo?: string;
      ipMemo?: string;
      taxConso?: string;
      commercialResult?: number;
      taxBalanceSheetResult?: number;
      netWorthTax?: number;
      saInv?: number;
      totalTaxLosses?: number;
      ftaYear?: number;
      recapture?: number;
      sbaMemo?: string;
      taxableResultBeforeTLCF?: number;
      taxableResultAfterTLCF?: number;
      participationIncome?: number;
      qsfuParts?: number;
      // Approval state
      approvalStatus?: 'pending' | 'approved' | 'rejected';
      approvalComment?: string;
      approvedAt?: string;
    }
    ```

- [x] **Task 2: Update mock data with new fields**
  - File: `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.ts`
  - Action: Update `multiCountryData` signal with all new fields populated with mock values
  - Notes: Ensure data matches the CTR Review Dashboard screenshot structure

#### Phase 2: Create CIT Approval Modal Component

- [x] **Task 3: Create CitApprovalModalComponent file structure**
  - File: `frontend/src/app/shared/components/cit-approval-modal/cit-approval-modal.component.ts` (NEW)
  - Action: Create new standalone component with inline template and styles
  - Structure:
    ```typescript
    @Component({
      selector: 'app-cit-approval-modal',
      standalone: true,
      imports: [CommonModule, FormsModule, LucideAngularModule, CurrencyEyPipe],
      template: `...`,
      styles: [`...`],
      changeDetection: ChangeDetectionStrategy.OnPush,
    })
    export class CitApprovalModalComponent {
      // Input for entity data
      @Input() entity: MultiCountryData | null = null;
      @Input() allEntities: MultiCountryData[] = [];
      @Input() mode: 'preview' | 'table-expand' = 'preview';

      // Output events
      @Output() close = new EventEmitter<void>();
      @Output() approve = new EventEmitter<{entityId: string, comment: string}>();
      @Output() reject = new EventEmitter<{entityId: string, comment: string}>();

      // State
      readonly documentViewMode = signal<'ey-report' | 'official-form'>('ey-report');
      readonly comment = signal('');
      readonly isProcessing = signal(false);
    }
    ```

- [x] **Task 4: Implement modal template with two sections**
  - File: `frontend/src/app/shared/components/cit-approval-modal/cit-approval-modal.component.ts`
  - Action: Create modal template with:
    1. **Header:** Title, entity name, close button
    2. **Main content area (grid layout):**
       - Left side: Document preview with view toggle (EY Report / Official Form)
       - Right side: Comment section + Approve/Reject buttons
    3. **Full-screen table mode:** When `mode='table-expand'`, show all entities in a table

- [x] **Task 5: Implement EY Summary Report view**
  - File: `frontend/src/app/shared/components/cit-approval-modal/cit-approval-modal.component.ts`
  - Action: Create branded EY report template showing:
    - Entity header with logo placeholder
    - KPI cards (Tax Base, Statutory Profit, Tax Loss CF)
    - Structured sections: Tax Attributes, Depreciation, Income & Expenses
    - EY branding colors (yellow accents, dark headers)

- [x] **Task 6: Implement Official CIT Form view**
  - File: `frontend/src/app/shared/components/cit-approval-modal/cit-approval-modal.component.ts`
  - Action: Create tax form style template:
    - Form header (entity ID, tax period, jurisdiction)
    - Labeled fields in form-like layout
    - Sections: Gross Receipts, Deductions, Taxable Income, Tax Computation
    - Gray background, bordered sections, monospace numbers

- [x] **Task 7: Implement full-screen table expansion view**
  - File: `frontend/src/app/shared/components/cit-approval-modal/cit-approval-modal.component.ts`
  - Action: Create table showing ALL columns without horizontal scroll:
    - Entity, Fund, Year, Currency, Tax Memo, IP Memo, Tax Conso
    - Commercial Result, Tax Balance Sheet Result, Net Worth Tax, SA INV
    - Total Tax Losses, FTA Year, Recapture, SBA Memo
    - Taxable Before TLCF, Taxable After TLCF, Participation Income, Qsfu Parts
  - Notes: Use smaller font size (11-12px), compact padding to fit all columns

- [x] **Task 8: Implement approval/reject workflow**
  - File: `frontend/src/app/shared/components/cit-approval-modal/cit-approval-modal.component.ts`
  - Action: Add approval logic:
    - Comment textarea (optional)
    - Approve button (green) - emits `approve` event
    - Reject button (red outline) - emits `reject` event
    - Loading state during processing
    - Close button

- [x] **Task 9: Add modal styles**
  - File: `frontend/src/app/shared/components/cit-approval-modal/cit-approval-modal.component.ts`
  - Action: Add SCSS styles using EY design tokens:
    - Modal overlay (rgba(0,0,0,0.5))
    - Modal content (white, rounded corners, shadow)
    - Grid layout for preview + comment section
    - Full-width table styles for expand mode
    - View toggle (tabs/buttons)
    - Animations (fadeIn, slideUp)

- [x] **Task 10: Export component from shared index**
  - File: `frontend/src/app/shared/components/index.ts`
  - Action: Add export for `CitApprovalModalComponent`

#### Phase 3: Integrate Modal into Service Insights

- [x] **Task 11: Add action buttons to Multicountry section header**
  - File: `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.html`
  - Action: Add buttons to `.section-header__right` in Multicountry section:
    ```html
    <div class="mc-action-buttons">
      <button class="mc-action-btn" (click)="openTableExpand()" title="Expand table">
        <lucide-icon [img]="icons.maximize2" [size]="16"></lucide-icon>
      </button>
      <button class="mc-action-btn" (click)="openCitPreview()" title="Preview CIT document">
        <lucide-icon [img]="icons.eye" [size]="16"></lucide-icon>
      </button>
      <button class="mc-action-btn mc-action-btn--primary" (click)="openApprovalModal()" title="Approve">
        <lucide-icon [img]="icons.checkCircle" [size]="16"></lucide-icon>
        Approve
      </button>
    </div>
    ```

- [x] **Task 12: Add modal state and methods to ServiceInsightsComponent**
  - File: `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.ts`
  - Action: Add:
    - Import `CitApprovalModalComponent`
    - Import CDK Overlay dependencies
    - Add icons: `Maximize2`, `Eye`, `CheckCircle`, `XCircle`
    - Add state signals:
      ```typescript
      readonly showCitModal = signal(false);
      readonly citModalMode = signal<'preview' | 'table-expand'>('preview');
      readonly selectedEntityForApproval = signal<MultiCountryData | null>(null);
      ```
    - Add methods: `openTableExpand()`, `openCitPreview()`, `openApprovalModal()`, `closeCitModal()`, `handleApprove()`, `handleReject()`

- [x] **Task 13: Add modal template reference in HTML**
  - File: `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.html`
  - Action: Add modal component at end of template:
    ```html
    @if (showCitModal()) {
      <app-cit-approval-modal
        [entity]="selectedEntityForApproval()"
        [allEntities]="filteredMultiCountryData()"
        [mode]="citModalMode()"
        (close)="closeCitModal()"
        (approve)="handleApprove($event)"
        (reject)="handleReject($event)"
      ></app-cit-approval-modal>
    }
    ```

- [x] **Task 14: Add action button styles**
  - File: `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.scss`
  - Action: Add styles for `.mc-action-buttons` and `.mc-action-btn`:
    ```scss
    .mc-action-buttons {
      display: flex;
      gap: 8px;
    }

    .mc-action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: $surface-secondary;
      border: 1px solid $border-light;
      border-radius: $radius-sm;
      font-size: 12px;
      font-weight: 600;
      color: $text-secondary;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        background: $surface-tertiary;
        border-color: $border-medium;
        color: $text-primary;
      }

      &--primary {
        background: $ey-yellow;
        border-color: $ey-yellow;
        color: $ey-dark;

        &:hover {
          background: $ey-yellow-hover;
        }
      }
    }
    ```

#### Phase 4: Integrate with Dashboard SignoffWidget

- [x] **Task 15: Update SignoffWidgetComponent to use shared modal**
  - File: `frontend/src/app/features/home/components/signoff-widget/signoff-widget.component.ts`
  - Action:
    - Import `CitApprovalModalComponent`
    - Replace inline approval modal template with `<app-cit-approval-modal>` component
    - Map `SignOffDocument` to `MultiCountryData` format for modal input
    - Handle approve/reject events

### Acceptance Criteria

#### Full-Screen Table Expansion

- [x] **AC 1:** Given the user is on the Multicountry section, when they click the Expand button (Maximize2 icon), then a full-screen modal opens displaying all entities in a table with all columns visible without horizontal scroll.

- [x] **AC 2:** Given the full-screen table modal is open, when the user clicks the X button or presses Escape, then the modal closes and returns to the normal Multicountry view.

- [x] **AC 3:** Given the full-screen table is displayed, when viewing the table, then all columns from the CTR Review Dashboard are visible: Entity, Fund, Year, Currency, Tax Memo, IP Memo, Tax Conso, Commercial Result, Tax Balance Sheet Result, Net Worth Tax, SA INV, Total Tax Losses, FTA Year, Recapture, SBA Memo, Taxable Before TLCF, Taxable After TLCF, Participation Income, Qsfu Parts.

#### CIT Document Preview

- [x] **AC 4:** Given the user has an entity selected in Multicountry, when they click the Eye icon, then a modal opens showing the CIT document preview for that entity.

- [x] **AC 5:** Given the CIT preview modal is open, when the user clicks "EY Report" toggle, then they see a branded EY summary with KPIs and structured sections.

- [x] **AC 6:** Given the CIT preview modal is open, when the user clicks "Official Form" toggle, then they see a tax form style layout with labeled fields.

- [x] **AC 7:** Given the CIT preview modal is open, when the view is toggled between EY Report and Official Form, then the same entity data is displayed in both views with appropriate formatting.

#### Approval Workflow

- [x] **AC 8:** Given the CIT preview modal is open, when the user enters a comment and clicks "Approve", then the entity's `approvalStatus` is updated to 'approved', the comment is saved, and a success message is shown.

- [x] **AC 9:** Given the CIT preview modal is open, when the user enters a comment and clicks "Reject", then the entity's `approvalStatus` is updated to 'rejected', the comment is saved, and a confirmation message is shown.

- [x] **AC 10:** Given the CIT preview modal is open, when the user clicks "Close" without approving/rejecting, then the modal closes and no changes are made to the entity's approval status.

- [x] **AC 11:** Given an approval/rejection is in progress, when the action is processing, then the buttons show a loading spinner and are disabled.

#### Dashboard Integration

- [x] **AC 12:** Given the user is on the Dashboard with pending documents to sign off, when they click "Approve" on an entity, then the same CIT Approval Modal opens with the entity's CIT document preview.

- [x] **AC 13:** Given the Dashboard approval modal is open, when the user approves or rejects, then the document is removed from the "Documents to Sign Off" list.

## Additional Context

### Dependencies

- **Angular CDK:** `@angular/cdk/overlay`, `@angular/cdk/portal` (already installed based on `SignoffWidgetComponent`)
- **Existing Components:**
  - `CurrencyEyPipe` for financial formatting
  - `ButtonComponent` for consistent button styling
  - `SkeletonComponent` for loading states
- **Lucide Icons:** `Maximize2`, `Eye`, `CheckCircle`, `XCircle`, `X`, `MessageSquare`, `FileText`, `Check`, `Loader2`

### Testing Strategy

**Manual Testing (POC Phase):**

1. **Table Expansion:**
   - Navigate to Service Detail > Insights > Multicountry section
   - Click Expand button - verify full-screen table opens
   - Verify all columns are visible without horizontal scroll
   - Click X or press Escape - verify modal closes

2. **CIT Preview:**
   - Select an entity in Multicountry list
   - Click Eye icon - verify modal opens with entity data
   - Toggle between EY Report and Official Form views
   - Verify all data fields display correctly in both views

3. **Approval Workflow:**
   - Open CIT preview for an entity
   - Enter a comment, click Approve - verify status updates
   - Open another entity, click Reject - verify status updates
   - Verify loading states during processing

4. **Dashboard Integration:**
   - Navigate to Dashboard
   - Click Approve on a pending document
   - Verify same modal opens
   - Approve - verify document removed from list

### Notes

**Risk Areas:**
- Full-screen table may need responsive font scaling for smaller screens
- CDK Overlay z-index may conflict with navbar - test layering
- Mock data structure must match exactly between Multicountry and Dashboard

**Future Considerations (Out of Scope):**
- Backend integration for persisting approval status
- Approval audit trail
- Multi-level approval workflow
- PDF export of CIT document
- Real document preview (actual PDF rendering)

**Reference Materials:**
- [IRS Form 1120](https://www.irs.gov/forms-pubs/about-form-1120) - US Corporate Income Tax Return structure
- EY Design System - Yellow (#FFE600), Dark (#2E2E38), consistent spacing and typography
