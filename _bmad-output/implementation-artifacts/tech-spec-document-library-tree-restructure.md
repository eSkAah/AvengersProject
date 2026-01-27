---
title: 'Document Library Tree Restructure'
slug: 'document-library-tree-restructure'
created: '2026-01-26'
status: 'ready'
stepsCompleted: [1, 2, 3]
tech_stack: ['Angular 19', 'TypeScript', 'Tailwind CSS', 'Signals']
files_to_modify:
  - frontend/src/app/features/documents/components/document-tree/document-tree.component.ts
  - frontend/src/app/features/documents/components/document-tree/document-tree.component.html
  - frontend/src/app/features/documents/components/document-tree/document-tree.component.scss
  - frontend/src/app/features/documents/documents.component.ts
  - frontend/src/app/features/documents/documents.component.html
  - frontend/src/app/core/models/document.model.ts
code_patterns: ['Angular Signals', 'OnPush Change Detection', 'Standalone Components']
test_patterns: []
---

# Tech-Spec: Document Library Tree Restructure

**Created:** 2026-01-26

## Overview

### Problem Statement

The current document library tree has:
1. A redundant "Document Library" root node
2. Documents organized by Document Type (General Ledger, Trial Balance, etc.) which doesn't align with the service-centric navigation used elsewhere in the application
3. Too many status filters (9 options) that clutter the interface

### Solution

1. Remove the root "Document Library" node - entities become the top-level
2. Change hierarchy from `Entity → Year → DocType` to `Entity → Year → Service`
3. Map document types to services: CIT, VAT, Others
4. Simplify filters to only "Missing" and "Unclassified"
5. Add drag & drop to move documents between folders
6. Add ability to create custom folders
7. Allow manual classification from "Others" folder

### Scope

**In Scope:**
- Remove the "Document Library" root node
- Change tree hierarchy to Entity → Year → Service → Documents
- Document Type → Service mapping:
  - `general_ledger`, `trial_balance`, `tax_return`, `financial_statement` → **CIT**
  - `bank_statement` → **VAT**
  - No serviceType or unclassified → **Others**
- Simplify filters to only **Missing** and **Unclassified**
- Drag & drop documents between service folders
- Manual classification from "Others" folder
- Custom folder creation within Year level

**Out of Scope:**
- Backend API changes (mock data only for POC)
- Document upload flow changes
- Grid/List view modifications (only tree structure changes)

## Context for Development

### Codebase Patterns

- **Signals-based state**: All state uses Angular Signals (`signal()`, `computed()`)
- **OnPush change detection**: All components use `ChangeDetectionStrategy.OnPush`
- **Standalone components**: No NgModules, self-contained imports
- **EY Design System**: Yellow (#FFE600) for selections, dark backgrounds (#2E2E38)

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `document-tree.component.ts` | Main tree component with `buildTreeFromDocuments()` method |
| `document-tree.component.html` | Tree template with recursive rendering |
| `documents.component.ts` | Parent component with filters and document state |
| `documents.component.html` | Main layout with filter pills |
| `document.model.ts` | Document interface with `ServiceType` type |

### Technical Decisions

1. **Service Mapping**: Create a `DOCUMENT_TYPE_TO_SERVICE` constant for mapping
2. **TreeNode Type**: Add `'service'` and `'custom'` to the type union
3. **Drag & Drop**: Use native HTML5 drag/drop API with Angular event bindings
4. **Custom Folders**: Store in component state (signal) - ephemeral for POC

## Implementation Plan

### Tasks

#### Task 1: Update Document Model
**File:** `frontend/src/app/core/models/document.model.ts`

1. Add mapping constant `DOCUMENT_TYPE_TO_SERVICE`
2. Add 'others' to ServiceType

```typescript
export type ServiceType = 'cit' | 'vat' | 'assessment' | 'transfer-pricing' | 'others';

export const DOCUMENT_TYPE_TO_SERVICE: Record<DocumentType, ServiceType> = {
  general_ledger: 'cit',
  trial_balance: 'cit',
  tax_return: 'cit',
  financial_statement: 'cit',
  bank_statement: 'vat',
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  'cit': 'CIT',
  'vat': 'VAT',
  'assessment': 'Tax Assessment',
  'transfer-pricing': 'Transfer Pricing',
  'others': 'Others',
};
```

#### Task 2: Restructure Tree Builder
**File:** `frontend/src/app/features/documents/components/document-tree/document-tree.component.ts`

1. Update `TreeNode` interface to add `'service' | 'custom'` types
2. Modify `buildTreeFromDocuments()` to use Entity → Year → Service hierarchy
3. Remove root "Document Library" node - return entity nodes directly as array
4. Add service icons mapping
5. Group documents by service instead of docType
6. Add "Others" folder for unclassified documents

#### Task 3: Add Drag & Drop Support
**File:** `frontend/src/app/features/documents/components/document-tree/document-tree.component.ts`

1. Add drag state signals: `draggedDocument`, `dropTarget`
2. Add methods: `onDragStart()`, `onDragOver()`, `onDrop()`, `onDragEnd()`
3. Emit event when document is moved to new service folder
4. Add Output: `documentMoved: EventEmitter<{documentId: string, newService: ServiceType}>`

#### Task 4: Add Custom Folder Creation
**File:** `frontend/src/app/features/documents/components/document-tree/document-tree.component.ts`

1. Add signal for custom folders: `customFolders: signal<Map<string, CustomFolder[]>>(new Map())`
2. Add interface `CustomFolder { id: string; name: string; entityYear: string; documents: string[] }`
3. Add method `createCustomFolder(entityName: string, year: number, folderName: string)`
4. Add context menu or button for folder creation

#### Task 5: Update Tree Template for Drag & Drop
**File:** `frontend/src/app/features/documents/components/document-tree/document-tree.component.html`

1. Add `draggable="true"` to document nodes
2. Add drag event handlers: `(dragstart)`, `(dragover)`, `(drop)`, `(dragend)`
3. Add visual feedback for drag state (CSS classes)
4. Add "+" button for custom folder creation

#### Task 6: Simplify Status Filters
**File:** `frontend/src/app/features/documents/documents.component.ts`

1. Change `statusOptions` from 9 to 2: `['missing', 'unclassified']`
2. Update `statusCounts` computed to only track these 2

**File:** `frontend/src/app/features/documents/documents.component.html`

1. Remove excess status pills, keep only Missing and Unclassified + All

#### Task 7: Add Drag & Drop Styling
**File:** `frontend/src/app/features/documents/components/document-tree/document-tree.component.scss`

1. Add `.tree-node--dragging` class for dragged item
2. Add `.tree-node--drop-target` class for valid drop zone
3. Add `.tree-node--drop-invalid` for invalid zones
4. Add transition animations

### Acceptance Criteria

**AC1: Tree Structure**
- GIVEN the document library page
- WHEN it loads
- THEN entities are shown at root level (no "Document Library" wrapper)
- AND each entity expands to show years
- AND each year expands to show services (CIT, VAT, Others)
- AND each service expands to show documents

**AC2: Service Mapping**
- GIVEN a document with type `general_ledger`
- WHEN displayed in tree
- THEN it appears under the CIT service folder

- GIVEN a document with type `bank_statement`
- WHEN displayed in tree
- THEN it appears under the VAT service folder

- GIVEN a document with no serviceType or status `unclassified`
- WHEN displayed in tree
- THEN it appears under the Others folder

**AC3: Simplified Filters**
- GIVEN the document library page
- WHEN viewing the filter pills
- THEN only "All", "Missing", and "Unclassified" pills are visible

**AC4: Drag & Drop**
- GIVEN a document in the tree
- WHEN user drags it to a different service folder
- THEN the document moves to the new folder
- AND a toast confirms the move

**AC5: Manual Classification**
- GIVEN a document in the "Others" folder
- WHEN user drags it to CIT or VAT
- THEN the document is reclassified
- AND removed from Others

**AC6: Custom Folder**
- GIVEN a year node in the tree
- WHEN user clicks "+" or context menu
- THEN a prompt appears to name the folder
- AND the folder is created under that year
- AND documents can be dragged into it

## Additional Context

### Dependencies

- No external dependencies required
- Uses native HTML5 Drag & Drop API

### Testing Strategy

Manual testing for POC:
1. Verify tree hierarchy is correct
2. Test drag & drop between folders
3. Verify filters show only Missing/Unclassified
4. Test custom folder creation

### Notes

- This is a POC feature - custom folders are ephemeral (not persisted)
- Drag & drop uses native API for simplicity
- Service icons use Lucide icons from existing library
