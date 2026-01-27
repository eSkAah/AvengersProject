---
title: 'Document Tree Search Filter'
slug: 'document-tree-search-filter'
created: '2026-01-26'
status: 'review'
stepsCompleted: [1, 2, 3]
tech_stack:
  - Angular 19 (standalone components, Signals)
  - TypeScript 5.7
  - Tailwind CSS
  - Lucide Icons
  - FormsModule (Angular)
files_to_modify:
  - frontend/src/app/features/documents/components/document-tree/document-tree.component.ts
  - frontend/src/app/features/documents/components/document-tree/document-tree.component.html
  - frontend/src/app/features/documents/components/document-tree/document-tree.component.scss
code_patterns:
  - ChangeDetectionStrategy.OnPush
  - Angular Signals (signal, computed)
  - Standalone components with explicit imports
  - Recursive ng-template for tree rendering
  - SCSS with @use 'styles/variables'
test_patterns:
  - No existing tests in documents feature (greenfield)
---

# Tech-Spec: Document Tree Search Filter

**Created:** 2026-01-26

## Overview

### Problem Statement

Users need to quickly find specific entities or documents in the Document Library tree without manually expanding and scanning through the hierarchy.

### Solution

Add a search input at the top of the `DocumentTreeComponent` that filters the tree in real-time as the user types, showing only matching entities and documents with their parent paths auto-expanded.

### Scope

**In Scope:**
- Search input UI at the top of the tree
- Real-time filtering (immediate, no debounce delay)
- Match against entity names AND document names
- Hide non-matching nodes, auto-expand parent paths of matches
- "No results found" empty state message
- Clear search button (X icon)

**Out of Scope:**
- Backend search API
- Fuzzy matching / typo tolerance
- Search history / recent searches
- Advanced filters (by type, year, status)

## Context for Development

### Codebase Patterns

1. **Component Architecture:**
   - Uses `ChangeDetectionStrategy.OnPush` for performance
   - Standalone components with explicit imports array
   - Angular Signals for state management (`signal()`, `computed()`)

2. **Tree Data Structure:**
   - `TreeNode` interface with types: `library`, `entity`, `year`, `doctype`, `document`
   - Tree built via `computed()` from `documentsSignal`
   - Recursive rendering via `ng-template #treeNodeTpl`
   - Node expansion state via `expandedNodes` signal (Set<string>)

3. **Existing Search Component:**
   - `SearchBarComponent` exists in shared (`app/shared/components/search-bar/`)
   - Supports configurable debounce via `[debounceMs]` input (use `0` for immediate)
   - Emits `(valueChange)` and `(search)` events
   - Already exported from `@shared` barrel

4. **Styling:**
   - SCSS with `@use 'styles/variables' as *`
   - Uses EY Design System variables (`$ey-yellow`, `$spacing-*`, `$radius-*`)
   - Transitions: 200ms ease-out

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `document-tree.component.ts` | Main component - add search signal, filtered tree computed |
| `document-tree.component.html` | Template - add search input, update tree binding |
| `document-tree.component.scss` | Styles - add search input container and empty state |
| `search-bar.component.ts` | Reusable search input (import and use) |

### Technical Decisions

1. **Reuse SearchBarComponent** - Already exists with proper EY styling and clear button. Set `debounceMs=0` for immediate filtering.

2. **Filtering Strategy:**
   - Create `searchQuery` signal for input binding
   - Create `filteredTreeData` computed that filters based on query
   - Case-insensitive matching on `node.label`
   - When a document matches, include its full parent path (entity → year → doctype)
   - When an entity matches, include all its children
   - Auto-expand all parent nodes of matches via `searchExpandedNodes` computed

3. **Empty State:**
   - Show centered "No results found" message when query exists but no matches
   - Include search-x icon and helpful text

## Implementation Plan

### Tasks

- [ ] **Task 1: Add imports and search signal**
  - File: `document-tree.component.ts`
  - Action: Import `SearchBarComponent` from shared, add `FormsModule` to imports array
  - Action: Add `searchQuery = signal<string>('')` for search input binding
  - Action: Add `onSearchChange(query: string)` method to update the signal

- [ ] **Task 2: Create recursive filter function**
  - File: `document-tree.component.ts`
  - Action: Add private method `filterTreeNode(node: TreeNode, query: string): TreeNode | null`
  - Logic:
    - If query is empty, return node unchanged
    - Check if node.label matches query (case-insensitive)
    - Recursively filter children
    - If node matches OR any child matches, return filtered node with matching children
    - If no match, return null

- [ ] **Task 3: Create filtered tree computed signal**
  - File: `document-tree.component.ts`
  - Action: Add `filteredTreeData = computed<TreeNode | null>(() => { ... })`
  - Logic:
    - Get `searchQuery()` and `treeData()`
    - If query is empty, return full treeData
    - Otherwise, call `filterTreeNode(treeData, query.toLowerCase())`
  - Action: Add `hasSearchResults = computed(() => this.filteredTreeData() !== null)`

- [ ] **Task 4: Create search-expanded nodes computed**
  - File: `document-tree.component.ts`
  - Action: Add `searchExpandedNodes = computed<Set<string>>(() => { ... })`
  - Logic:
    - If no search query, return empty Set (use normal expandedNodes)
    - If searching, collect all node IDs from filteredTreeData (auto-expand all)
  - Action: Update `isExpanded(nodeId)` to check searchExpandedNodes when searching

- [ ] **Task 5: Add search input to template**
  - File: `document-tree.component.html`
  - Action: Add search container div above tree with SearchBarComponent:
    ```html
    <div class="document-tree__search">
      <app-search-bar
        placeholder="Search entities or documents..."
        [debounceMs]="0"
        (valueChange)="onSearchChange($event)"
      ></app-search-bar>
    </div>
    ```
  - Action: Update tree root binding from `treeData()` to `filteredTreeData()`

- [ ] **Task 6: Add empty state to template**
  - File: `document-tree.component.html`
  - Action: Add conditional empty state when searching with no results:
    ```html
    @if (searchQuery() && !hasSearchResults()) {
      <div class="document-tree__empty">
        <lucide-icon name="search-x" [size]="32"></lucide-icon>
        <p>No results found</p>
        <span>Try a different search term</span>
      </div>
    }
    ```

- [ ] **Task 7: Add SCSS styles**
  - File: `document-tree.component.scss`
  - Action: Add `.document-tree__search` styles (padding, margin-bottom)
  - Action: Add `.document-tree__empty` styles (centered, muted colors, icon + text layout)

### Acceptance Criteria

- [ ] **AC 1:** Given the document tree is displayed, when I look at the top of the tree panel, then I see a search input with placeholder "Search entities or documents..."

- [ ] **AC 2:** Given the search input is empty, when I view the tree, then I see the full unfiltered tree with normal expand/collapse behavior

- [ ] **AC 3:** Given I type "Paris" in the search input, when the input value changes, then the tree immediately filters to show only "CCP 5 Paris Office SPV" entity and its children (no debounce delay)

- [ ] **AC 4:** Given I type a document name like "GL_France", when the tree filters, then the matching document is shown with its full parent path (Entity → Year → DocType → Document) all expanded

- [ ] **AC 5:** Given an entity name matches the search, when the tree filters, then the entire entity subtree (all years, types, documents) is shown

- [ ] **AC 6:** Given I type "xyznonexistent" (no matches), when the tree filters, then I see "No results found" message with search-x icon and "Try a different search term" hint

- [ ] **AC 7:** Given I have filtered results showing, when I click the X clear button in the search input, then the search clears and the full tree is restored

- [ ] **AC 8:** Given I am searching, when matches are found, then all parent nodes of matches are auto-expanded (no manual expansion needed)

## Additional Context

### Dependencies

- No new npm packages required
- Uses existing `SearchBarComponent` from `@shared`
- Uses existing `FormsModule` from `@angular/forms`
- Uses existing `LucideAngularModule` for icons

### Testing Strategy

**Manual Testing:**
1. Load Document Library page
2. Verify search input appears at top of tree
3. Type entity name → verify immediate filtering
4. Type document name → verify parent path shown
5. Type non-matching text → verify empty state
6. Click clear (X) → verify tree restores
7. Test case-insensitivity (uppercase/lowercase)

**Edge Cases to Test:**
- Empty string (should show full tree)
- Single character search
- Special characters in search
- Partial matches (e.g., "Par" matching "Paris")

### Notes

**Implementation Details:**
- Search is case-insensitive using `toLowerCase()` comparison
- Uses `includes()` for partial matching (not exact match)
- Filtering is pure/stateless - computed from signals
- No external state management needed

**Performance Considerations:**
- Filtering runs on every keystroke (no debounce per requirement)
- Tree size is small (~50-100 nodes max) so performance is not a concern
- If tree grows large, consider adding debounce as optimization

**Future Enhancements (Out of Scope):**
- Highlight matching text within labels
- Keyboard navigation (arrow keys to move through results)
- Search by document type or year
