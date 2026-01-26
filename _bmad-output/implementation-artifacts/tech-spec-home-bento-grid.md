---
title: 'Home Dashboard Bento Grid Layout'
slug: 'home-bento-grid'
created: '2026-01-23'
status: 'completed'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - Angular 19
  - SCSS
  - CSS Grid (grid-template-areas)
files_to_modify:
  - frontend/src/app/features/home/home.component.scss
code_patterns:
  - 4-column grid with grid-template-areas
  - Responsive breakpoints at 1100px and 768px
  - Uses $spacing-3 (12px) for gap
  - Card styling with 12px border-radius
test_patterns:
  - Visual verification only (CSS changes)
---

# Tech-Spec: Home Dashboard Bento Grid Layout

**Created:** 2026-01-23

## Overview

### Problem Statement

The current home dashboard at `/app` uses a uniform 4-column CSS Grid where most rows have 50/50 splits. This creates a monotonous layout that lacks the premium "bento box" aesthetic seen in modern Apple/Stripe-style interfaces.

### Solution

Refactor the grid layout to use a 12-column CSS Grid system with asymmetric column spans per row, creating visual hierarchy and a premium bento effect.

### Scope

**In Scope:**
- Row 1: Welcome (66%) / Drop File (33%) — 8/4 columns
- Row 2: Services (40%) / Missing Docs (60%) — 5/7 columns
- Row 3: Recent Activity (40%) / Sign Off (60%) — 5/7 columns
- Row 4: News / Contacts — keep existing proportions (~75/25 → 9/3 columns)
- Maintain responsive breakpoints behavior

**Out of Scope:**
- Widget internal styling changes
- Complete responsive breakpoints redesign
- Any other pages or components
- Adding new widgets or features

## Context for Development

### Codebase Patterns

**Current Grid Structure (home.component.scss:22-57):**
```scss
.bento-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: $spacing-3;
  max-width: 1400px;
  margin: 0 auto;

  grid-template-areas:
    "welcome  welcome  upload   upload"
    "services services missing  missing"
    "activity activity signoff  signoff"
    "news     news     news     contacts";
}
```

**Design System Variables Used:**
- `$spacing-3` = 12px (grid gap)
- `$radius-xl` = 12px (card border-radius)
- Breakpoints: 1100px (tablet), 768px (mobile)

**Naming Conventions:**
- BEM-style: `.bento-tile--welcome`, `.bento-tile--upload`, etc.
- Grid areas match tile modifier names

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `frontend/src/app/features/home/home.component.scss` | Main file to modify - grid layout |
| `frontend/src/app/features/home/home.component.html` | Reference - widget placement (no changes needed) |
| `frontend/src/styles/_variables.scss` | Spacing and design tokens |

### Technical Decisions

1. **12-column grid**: Switch from 4-column to 12-column for precise control
   - `grid-template-columns: repeat(12, 1fr)`

2. **Column spans via grid-template-areas**:
   - Row 1: Welcome spans 8 cols, Upload spans 4 cols (8+4=12)
   - Row 2-3: Left spans 5 cols, Right spans 7 cols (5+7=12)
   - Row 4: News spans 9 cols, Contacts spans 3 cols (9+3=12)

3. **Responsive strategy**:
   - Desktop (>1100px): Full 12-column bento layout
   - Tablet (768-1100px): Simplify to 2-column 50/50
   - Mobile (<768px): Single column stack

## Implementation Plan

### Tasks

- [x] **Task 1: Update grid-template-columns to 12-column system**
  - File: `frontend/src/app/features/home/home.component.scss`
  - Action: Change line 24 from `grid-template-columns: 1fr 1fr 1fr 1fr;` to `grid-template-columns: repeat(12, 1fr);`
  - Notes: This enables fine-grained control over column spans

- [x] **Task 2: Update grid-template-areas for desktop layout**
  - File: `frontend/src/app/features/home/home.component.scss`
  - Action: Replace the grid-template-areas block (lines 29-33) with new 12-column layout:
    ```scss
    grid-template-areas:
      "welcome  welcome  welcome  welcome  welcome  welcome  welcome  welcome  upload   upload   upload   upload"
      "services services services services services missing  missing  missing  missing  missing  missing  missing"
      "activity activity activity activity activity signoff  signoff  signoff  signoff  signoff  signoff  signoff"
      "news     news     news     news     news     news     news     news     news     contacts contacts contacts";
    ```
  - Notes: Row 1 = 8/4, Row 2-3 = 5/7, Row 4 = 9/3

- [x] **Task 3: Update tablet breakpoint (1100px)**
  - File: `frontend/src/app/features/home/home.component.scss`
  - Action: Update the `@media (max-width: 1100px)` block (lines 36-43) to use 2-column grid:
    ```scss
    @media (max-width: 1100px) {
      grid-template-columns: 1fr 1fr;
      grid-template-areas:
        "welcome  upload"
        "services missing"
        "activity signoff"
        "news     contacts";
    }
    ```
  - Notes: Tablet reverts to simple 50/50 split for all rows

- [x] **Task 4: Verify mobile breakpoint (768px) unchanged**
  - File: `frontend/src/app/features/home/home.component.scss`
  - Action: Confirm the `@media (max-width: 768px)` block remains as single-column stack
  - Notes: No changes needed - single column already works correctly

### Acceptance Criteria

- [ ] **AC 1:** Given the home dashboard is viewed on desktop (>1100px), when the page loads, then the Welcome tile occupies approximately 66% width and Drop File occupies 33% width on the first row.

- [ ] **AC 2:** Given the home dashboard is viewed on desktop (>1100px), when the page loads, then the Services tile occupies approximately 40% width and Missing Documents occupies 60% width on the second row.

- [ ] **AC 3:** Given the home dashboard is viewed on desktop (>1100px), when the page loads, then the Recent Activity tile occupies approximately 40% width and Sign Off occupies 60% width on the third row.

- [ ] **AC 4:** Given the home dashboard is viewed on desktop (>1100px), when the page loads, then the News tile occupies approximately 75% width and Contacts occupies 25% width on the fourth row (unchanged from current).

- [ ] **AC 5:** Given the home dashboard is viewed on tablet (768px-1100px), when the page loads, then all rows display as 50/50 two-column layout.

- [ ] **AC 6:** Given the home dashboard is viewed on mobile (<768px), when the page loads, then all widgets stack in a single column.

- [ ] **AC 7:** Given the grid layout changes, when inspecting the page, then the 12px gap between tiles is preserved.

## Additional Context

### Dependencies

None - purely CSS/SCSS changes with no external dependencies.

### Testing Strategy

**Visual Verification (Manual):**
1. Open http://localhost:4200/app in Chrome
2. Desktop test: Verify row proportions match spec (66/33, 40/60, 40/60, 75/25)
3. Tablet test: Resize to 900px width, verify 50/50 layout
4. Mobile test: Resize to 600px width, verify single-column stack
5. DevTools: Inspect grid overlay to confirm 12-column structure

**Browser DevTools Grid Inspector:**
- Enable CSS Grid overlay in Chrome DevTools
- Verify 12 equal columns are rendered
- Verify each tile spans the correct number of columns

### Notes

**Risk Mitigation:**
- Low risk: Single file change, CSS-only, no logic changes
- Easily reversible via git if issues arise

**Known Limitations:**
- Tablet breakpoint uses simplified 50/50 to avoid overly complex responsive grid
- Very narrow desktop (1100-1200px) may feel slightly cramped on 40% tiles

**Future Considerations (Out of Scope):**
- Could add intermediate breakpoint at ~1300px for gradual ratio transitions
- Could animate grid transitions on resize (not recommended for performance)

## Review Notes

- Adversarial review completed: 2026-01-23
- Findings: 10 total, 2 fixed, 8 skipped (noise/not code-fixable)
- Resolution approach: Auto-fix
- Fixed: F2 (comment accuracy), F3 (breakpoint alignment with design system)
