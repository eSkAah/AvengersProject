# Story 9.3: Document Preview Inline

Status: ready-for-dev

## Story

As a **user**,
I want **to preview documents without downloading them**,
so that **I can quickly review content and save time**.

## Acceptance Criteria

1. **AC1:** Modal preview opens when clicking "Preview" on a document
2. **AC2:** PDF documents display in an embedded viewer with page navigation
3. **AC3:** Excel files (.xlsx, .xls) render as HTML tables
4. **AC4:** PDF viewer supports page navigation (previous/next, page number input)
5. **AC5:** Download button available in the preview modal

## Tasks / Subtasks

- [ ] Task 1: Backend - Add document content endpoint (AC: #1)
  - [ ] 1.1: Create `GET /api/documents/{id}/preview` endpoint
  - [ ] 1.2: Return appropriate content type based on document format
  - [ ] 1.3: For Excel: Convert to JSON array for frontend rendering
  - [ ] 1.4: For PDF: Return file stream with proper headers
  - [ ] 1.5: Write unit tests for preview endpoint

- [ ] Task 2: Backend - Excel to JSON conversion (AC: #3)
  - [ ] 2.1: Add `openpyxl` dependency for Excel parsing
  - [ ] 2.2: Create `excel_service.py` with `parse_excel_to_json()` function
  - [ ] 2.3: Handle multiple sheets (return first sheet by default)
  - [ ] 2.4: Limit rows for performance (max 100 rows in preview)
  - [ ] 2.5: Write tests for Excel parsing

- [ ] Task 3: Frontend - Create DocumentPreviewModalComponent (AC: #1, #5)
  - [ ] 3.1: Create `shared/components/document-preview-modal/document-preview-modal.component.ts`
  - [ ] 3.2: Implement modal overlay with close button and ESC key support
  - [ ] 3.3: Add header with document name and download button
  - [ ] 3.4: Add loading state while fetching content
  - [ ] 3.5: Handle error state with retry option

- [ ] Task 4: Frontend - PDF Viewer implementation (AC: #2, #4)
  - [ ] 4.1: Use `<iframe>` with PDF blob URL for basic viewing
  - [ ] 4.2: Alternative: Use pdf.js for advanced features (if time permits)
  - [ ] 4.3: Add page navigation controls (prev/next buttons)
  - [ ] 4.4: Display current page number / total pages
  - [ ] 4.5: Handle PDF loading errors gracefully

- [ ] Task 5: Frontend - Excel Table rendering (AC: #3)
  - [ ] 5.1: Create table component for Excel data display
  - [ ] 5.2: Style with EY design system (zebra striping, headers)
  - [ ] 5.3: Add horizontal scroll for wide tables
  - [ ] 5.4: Show row count indicator
  - [ ] 5.5: Handle empty cells and formatting

- [ ] Task 6: Frontend - Integration with document views
  - [ ] 6.1: Add preview button to document-card.component.ts (grid view)
  - [ ] 6.2: Add preview action to document-list.component.ts (list view)
  - [ ] 6.3: Wire up DocumentApiService with preview method
  - [ ] 6.4: Add keyboard shortcuts (ESC to close, arrow keys for PDF pages)

- [ ] Task 7: Testing & Validation
  - [ ] 7.1: Backend tests for preview endpoint
  - [ ] 7.2: Frontend tests for modal and viewer components
  - [ ] 7.3: Manual testing with various file types

## Dev Notes

### Architecture Compliance

This feature follows existing patterns:
- **Backend:** Use existing document router and service patterns
- **Frontend:** Modal pattern similar to other dialogs in the app
- **File handling:** Follow existing upload/download patterns

### Technical Approach

1. **PDF Preview Options:**
   - **Option A (Simple):** Use `<iframe src="blob:...">` - works for most browsers
   - **Option B (Advanced):** Use pdf.js library for full control
   - Recommendation: Start with Option A, upgrade if needed

2. **Excel Preview:**
   ```python
   # backend/app/services/excel_service.py
   import openpyxl

   def parse_excel_to_json(file_path: str, max_rows: int = 100) -> dict:
       wb = openpyxl.load_workbook(file_path, read_only=True)
       sheet = wb.active
       headers = [cell.value for cell in sheet[1]]
       rows = []
       for row in sheet.iter_rows(min_row=2, max_row=max_rows + 1, values_only=True):
           rows.append(dict(zip(headers, row)))
       return {"headers": headers, "rows": rows, "total_rows": sheet.max_row - 1}
   ```

3. **Modal Component Pattern:**
   ```typescript
   @Component({
     selector: 'app-document-preview-modal',
     standalone: true,
     template: `
       <div class="modal-overlay" (click)="close()">
         <div class="modal-content" (click)="$event.stopPropagation()">
           <header>...</header>
           <main>
             @if (loading()) { <app-skeleton /> }
             @else if (isPdf()) { <pdf-viewer /> }
             @else if (isExcel()) { <excel-table /> }
           </main>
         </div>
       </div>
     `
   })
   ```

### File Structure

```
backend/app/
├── services/
│   └── excel_service.py              # NEW
├── routers/
│   └── documents.py                  # MODIFY: add /preview endpoint

frontend/src/app/
├── shared/components/
│   └── document-preview-modal/
│       ├── document-preview-modal.component.ts    # NEW
│       ├── pdf-viewer.component.ts                # NEW
│       └── excel-table.component.ts               # NEW
├── features/documents/components/
│   ├── document-card/                # MODIFY: add preview button
│   └── document-list/                # MODIFY: add preview action
├── core/services/
│   └── document-api.service.ts       # MODIFY: add preview method
```

### Project Structure Notes

- Modal follows existing toast/notification overlay patterns
- Table styling reuses existing Tailwind table classes
- No routing needed - modal is overlay

### References

- [Source: docs/USER-STORIES.md#E9-S3] - Original story definition
- [Source: docs/ARCHITECTURE.md#Section-3.1] - Frontend component structure
- [Source: backend/app/routers/documents.py] - Existing document endpoints
- [Source: frontend/src/app/features/documents/] - Document library components

### Previous Story Intelligence

From Story 9-2 patterns:
- Service layer patterns established
- Modal can use similar overlay patterns to Eve panel
- Download functionality already exists in document components

### Library/Framework Requirements

- **Backend:** `openpyxl` for Excel parsing (add to requirements.txt)
- **Frontend:**
  - Optional: `pdfjs-dist` for advanced PDF viewing
  - Built-in: Native iframe PDF viewing (no library needed)

### Testing Requirements

- **Backend:** pytest tests for excel_service and preview endpoint
- **Frontend:** Karma tests for modal, PDF viewer, Excel table components
- **Manual:** Test with sample PDF and Excel files from demo data

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
