---
title: 'Add Euro Currency Symbol to Financial Data'
slug: 'currency-euro-symbol'
created: '2026-01-26'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
  - Angular 19 (standalone components, Signals)
  - TypeScript 5.7
  - Intl.NumberFormat API
files_to_modify:
  - frontend/src/app/shared/pipes/currency-ey.pipe.ts (create)
  - frontend/src/app/shared/pipes/index.ts
  - frontend/src/app/features/service-detail/components/service-insights/service-insights.component.ts
  - frontend/src/app/features/service-detail/components/service-insights/service-insights.component.html
  - frontend/src/app/features/entity-detail/components/entity-insights/entity-insights.component.ts
  - frontend/src/app/features/entity-detail/components/entity-tax-report/entity-tax-report.component.ts
  - frontend/src/app/features/entity-detail/components/entity-tax-report/entity-tax-report.component.html
code_patterns:
  - Standalone pipe with `standalone: true`
  - ChangeDetectionStrategy.OnPush compatible (pure pipe)
  - UK format via Intl.NumberFormat('en-GB') + ' €' suffix
test_patterns:
  - No existing pipe tests found
  - Manual verification via UI
---

# Tech-Spec: Add Euro Currency Symbol to Financial Data

**Created:** 2026-01-26

## Overview

### Problem Statement

Financial data displayed in Service Insights and other components lacks the € currency symbol, making it unclear what currency values represent. The `service-insights.component.ts` has `formatCurrency()` and `formatCompact()` methods that format numbers without the € symbol, while `entity-insights.component.ts` inconsistently adds it.

### Solution

Create a shared `CurrencyEyPipe` that formats numbers in UK format (`1,234.56 €`) and apply it consistently across all financial data displays (tables and KPI cards). The pipe will support both full number formatting and compact notation (M, K suffixes).

### Scope

**In Scope:**
- Create `CurrencyEyPipe` with support for full numbers and compact notation (M, K)
- Update `service-insights.component.ts` to use the pipe
- Update `entity-insights.component.ts` to use the pipe (for consistency)
- Apply to KPI values showing financial amounts

**Out of Scope:**
- Multi-currency support (only € for now)
- Backend changes
- Charts/tooltips (keep existing format for readability)

## Context for Development

### Codebase Patterns

1. **Number Formatting:**
   - Target format: UK style `1,234.56 €` (comma thousand, dot decimal, € suffix)
   - Using `Intl.NumberFormat('en-GB')` for locale + manual ` €` suffix
   - Negative values shown as `(1,234.56) €` (parentheses)

2. **Component Architecture:**
   - Standalone components with `ChangeDetectionStrategy.OnPush`
   - Shared pipes in `frontend/src/app/shared/pipes/`
   - Barrel exports via `index.ts`

3. **Current Format Methods (to replace):**
   - `service-insights.component.ts:583` - `formatCurrency()` without €
   - `service-insights.component.ts:595` - `formatCompact()` without €
   - `entity-insights.component.ts:964` - `formatNumber()` without €
   - `entity-insights.component.ts:968` - `formatCurrency()` with €
   - `entity-tax-report.component.ts:30` - `formatCurrency()` without €

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `shared/pipes/index.ts` | Barrel export - add CurrencyEyPipe |
| `service-insights.component.ts` | Primary: 60+ template usages of formatCurrency/formatCompact |
| `service-insights.component.html` | Template with `{{ formatCurrency(value) }}` calls |
| `entity-insights.component.ts` | Inline template with formatCurrency calls |
| `entity-tax-report.component.ts` | 40+ formatCurrency usages in template |

### Technical Decisions

1. **Pipe Design:**
   - Name: `CurrencyEyPipe` with selector `currencyEy`
   - Pure pipe (default) for OnPush compatibility
   - Two modes via parameter: `'full'` (default) and `'compact'`

2. **Format Specification:**
   - Full: `1,234.56 €` (2 decimal places)
   - Compact: `1.2M €`, `456.7K €`, `123 €`
   - Negative: `(1,234.56) €`
   - Zero: `0.00 €`

3. **Migration Strategy:**
   - Keep existing component methods during transition
   - Replace template calls with pipe: `{{ value | currencyEy }}` or `{{ value | currencyEy:'compact' }}`
   - Remove component methods once migrated

## Implementation Plan

### Tasks

- [ ] **Task 1: Create CurrencyEyPipe**
  - File: `frontend/src/app/shared/pipes/currency-ey.pipe.ts` (create new)
  - Action: Create a standalone Angular pipe with the following:
    ```typescript
    @Pipe({ name: 'currencyEy', standalone: true })
    export class CurrencyEyPipe implements PipeTransform {
      transform(value: number | null | undefined, mode: 'full' | 'compact' = 'full'): string
    }
    ```
  - Logic for `full` mode:
    - If null/undefined: return `'-'`
    - If zero: return `'0.00 €'`
    - Format with `Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`
    - If negative: wrap in parentheses `(1,234.56) €`
    - Append ` €` suffix
  - Logic for `compact` mode:
    - If >= 1,000,000: divide by 1M, format to 1-2 decimals, append `M €`
    - If >= 1,000: divide by 1K, format to 1-2 decimals, append `K €`
    - Otherwise: format as integer + ` €`
    - Negatives: prefix with `-` (e.g., `-127.62M €`)

- [ ] **Task 2: Export pipe from barrel**
  - File: `frontend/src/app/shared/pipes/index.ts`
  - Action: Add export statement:
    ```typescript
    export { CurrencyEyPipe } from './currency-ey.pipe';
    ```

- [ ] **Task 3: Update service-insights component**
  - File: `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.ts`
  - Action: Add `CurrencyEyPipe` to imports array
  - Action: Keep existing `formatCurrency()` and `formatCompact()` methods for chart tooltips (out of scope)

- [ ] **Task 4: Update service-insights template - Table cells**
  - File: `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.html`
  - Action: Replace all `{{ formatCurrency(value) }}` with `{{ value | currencyEy }}`
  - Locations (lines 201-242): Entity table cells, totals bar values
  - Example: `{{ formatCurrency(row.commercialResult) }}` → `{{ row.commercialResult | currencyEy }}`

- [ ] **Task 5: Update service-insights template - Compact values**
  - File: `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.html`
  - Action: Replace all `{{ formatCompact(value) }}` with `{{ value | currencyEy:'compact' }}`
  - Locations (lines 147-159, 292-298, 408-425): Entity cards, multicountry list items, totals bar
  - Example: `{{ formatCompact(row.taxBase) }}` → `{{ row.taxBase | currencyEy:'compact' }}`

- [ ] **Task 6: Update service-insights template - Detail panel**
  - File: `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.html`
  - Action: Replace `{{ formatCurrency(entity.xxx) }}` with `{{ entity.xxx | currencyEy }}`
  - Locations (lines 326-380): Multicountry detail panel key metrics and detail items

- [ ] **Task 7: Update entity-insights component**
  - File: `frontend/src/app/features/entity-detail/components/entity-insights/entity-insights.component.ts`
  - Action: Add `CurrencyEyPipe` to imports array
  - Action: Replace inline `formatCurrency()` method calls in template with pipe
  - Template locations: Participation table cells (lines 331-350)
  - Example: `{{ formatCurrency(group.acquisitionPrice) }}` → `{{ group.acquisitionPrice | currencyEy }}`

- [ ] **Task 8: Update entity-tax-report component**
  - File: `frontend/src/app/features/entity-detail/components/entity-tax-report/entity-tax-report.component.ts`
  - Action: Add `CurrencyEyPipe` to imports array

- [ ] **Task 9: Update entity-tax-report template**
  - File: `frontend/src/app/features/entity-detail/components/entity-tax-report/entity-tax-report.component.html`
  - Action: Replace all `{{ formatCurrency(value) }}` with `{{ value | currencyEy }}`
  - Locations: ~40 occurrences across tax summary cards, CIT table, MBT table, NWT table, tax base section

### Acceptance Criteria

- [ ] **AC1:** Given a positive number `1234567.89`, when displayed with `| currencyEy`, then it shows `1,234,567.89 €`

- [ ] **AC2:** Given a negative number `-171713.26`, when displayed with `| currencyEy`, then it shows `(171,713.26) €`

- [ ] **AC3:** Given zero `0`, when displayed with `| currencyEy`, then it shows `0.00 €`

- [ ] **AC4:** Given a large number `127620000`, when displayed with `| currencyEy:'compact'`, then it shows `127.62M €`

- [ ] **AC5:** Given a medium number `164050`, when displayed with `| currencyEy:'compact'`, then it shows `164.05K €`

- [ ] **AC6:** Given a negative large number `-127620000`, when displayed with `| currencyEy:'compact'`, then it shows `-127.62M €`

- [ ] **AC7:** Given `null` or `undefined`, when displayed with `| currencyEy`, then it shows `-`

- [ ] **AC8:** Given Service Insights Entities table view is displayed, when I view the Commercial Result column, then all values show the `€` symbol (e.g., `(171,713.26) €`)

- [ ] **AC9:** Given Service Insights Entity cards view is displayed, when I view the metric values, then all values show compact format with `€` (e.g., `-171.71K €`)

- [ ] **AC10:** Given Entity Detail Insights tab is displayed, when I view the participation table, then all currency values show the `€` symbol

## Additional Context

### Dependencies

None - pure Angular pipe using built-in `Intl.NumberFormat` API

### Testing Strategy

**Manual UI Verification:**
1. Navigate to Service Detail → Insights tab
2. Verify KPI cards show values like `-127.62M €`
3. Verify Entity table shows values like `(171,713.26) €`
4. Verify Multicountry detail panel shows € on all values
5. Navigate to Entity Detail → Insights tab
6. Verify participation table shows `1,699,308 €` format

**Edge Cases:**
- Zero values: `0.00 €`
- Large negatives: `(127,620,000.00) €` or `(127.62M) €`
- Small values < 1000: `456.78 €`
- Undefined/null: return `-` or empty string

### Notes

- User preference: UK format with € suffix (not prefix)
- Both full precision and compact (M/K) values get € symbol
- Charts/tooltips excluded from scope (keep existing format for readability)
- Priority components: `service-insights`, `entity-insights`, `entity-tax-report`
