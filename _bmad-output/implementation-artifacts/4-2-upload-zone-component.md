# Story 4.2: Upload Zone Component

Status: done

## Story

As a **user**,
I want **an intuitive drag & drop zone**,
so that **I can easily upload my documents to engagements**.

## Acceptance Criteria

1. **AC1:** Visible drag & drop zone with clear visual feedback
2. **AC2:** States: default, dragover (highlighted), uploading, success, error
3. **AC3:** Support click to select files
4. **AC4:** Support multi-file selection (bulk upload)
5. **AC5:** Preview files before upload with ability to remove
6. **AC6:** "Upload" button to confirm upload action
7. **AC7:** Calls backend POST /api/documents/upload for each file

## Tasks / Subtasks

- [x] **Task 1: Create Upload Zone Component** (AC: 1, 2, 3)
  - [x] Create `upload-zone.component.ts` in `shared/components/upload-zone/`
  - [x] Implement drag & drop event handlers (dragenter, dragover, dragleave, drop)
  - [x] Implement click-to-select with hidden file input
  - [x] Add visual states: default, dragover, uploading, success, error
  - [x] Use SCSS with EY design system colors (border-dashed, rounded-xl, border-ey-yellow on dragover)

- [x] **Task 2: Add File Preview List** (AC: 4, 5)
  - [x] Display selected files with name, size, type icon
  - [x] Show file extension badge (xlsx, pdf, csv, xls)
  - [x] Add remove button for each file
  - [x] Validate file format before adding to list
  - [x] Show error for invalid files

- [x] **Task 3: Create Document API Service** (AC: 7)
  - [x] Create `document-api.service.ts` in `core/services/`
  - [x] Implement `uploadDocument(file, engagementId)` method
  - [x] Use HttpClient to POST to /api/documents/upload
  - [x] Handle response and errors with French error messages

- [x] **Task 4: Integrate Upload Logic** (AC: 6, 7)
  - [x] Add "Upload" button component
  - [x] Call API service for each selected file
  - [x] Show progress per file (spinner animation)
  - [x] Emit events: uploadStart, uploadSuccess, uploadError, uploadComplete

- [x] **Task 5: Add to Documents Page** (AC: 1-7)
  - [x] Add UploadZoneComponent to documents page
  - [x] Position above document grid/list with toggle button
  - [x] Pass selected engagement ID from tree selection
  - [x] Refresh document list after successful upload via MockDataService

## Dev Notes

### Angular Patterns (from codebase analysis)

**Component Structure:**
- Standalone component with OnPush change detection
- Use Angular Signals for state management
- Emit events via @Output() EventEmitter
- Use inject() for dependencies

**Styling:**
- Tailwind CSS with EY design system colors
- Border dashed for drop zone
- `border-ey-yellow` and `bg-ey-yellow-light` for dragover state

### Upload Zone States

```typescript
type UploadState = 'default' | 'dragover' | 'uploading' | 'success' | 'error';
```

### File Preview Interface

```typescript
interface FilePreview {
  file: File;
  name: string;
  size: number;
  extension: string;
  isValid: boolean;
  errorMessage?: string;
}
```

### Design Specifications

```
Default State:
- border-2 border-dashed border-gray-300
- bg-surface rounded-xl
- p-8 text-center

Dragover State:
- border-ey-yellow
- bg-ey-yellow-light

Uploading State:
- opacity-75
- pointer-events-none

Success State:
- border-success
- bg-success-light (brief flash)

Error State:
- border-error
- bg-error-light
```

### Allowed Extensions

```typescript
const ALLOWED_EXTENSIONS = ['xlsx', 'xls', 'pdf', 'csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

### API Integration

```typescript
// document-api.service.ts
uploadDocument(file: File, engagementId: string): Observable<Document> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('engagement_id', engagementId);

  return this.http.post<Document>('/api/documents/upload', formData);
}
```

### References

- [Source: docs/USER-STORIES.md#E4-S2] - Story requirements
- [Source: frontend/src/app/shared/components/] - Shared component patterns
- [Source: frontend/tailwind.config.js] - Design system colors
- [Source: backend/app/routers/documents.py] - Upload API endpoint

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Angular build successful after fixing TypeScript type issues
- All component files compile without errors

### Completion Notes List

- All 5 tasks completed successfully
- Upload zone component with full drag & drop support
- File preview list with validation (format + size)
- Remove individual files before upload
- Document API service for HTTP communication
- Integration with documents page via toggle button
- Toast notifications for upload feedback
- French language UI strings
- EY design system compliance (colors, spacing, typography)

### File List

**Created:**
- `frontend/src/app/shared/components/upload-zone/upload-zone.component.ts` - Upload zone component with drag & drop, file validation, signals
- `frontend/src/app/shared/components/upload-zone/upload-zone.component.html` - Template with drop zone, file list, states
- `frontend/src/app/shared/components/upload-zone/upload-zone.component.scss` - Styles following EY design system
- `frontend/src/app/core/services/document-api.service.ts` - HTTP service for document upload/CRUD

**Modified:**
- `frontend/src/app/shared/index.ts` - Added UploadZoneComponent export
- `frontend/src/app/core/services/index.ts` - Added DocumentApiService export
- `frontend/src/app/features/documents/documents.component.ts` - Added upload zone integration
- `frontend/src/app/features/documents/documents.component.html` - Added upload zone UI with toggle
- `frontend/src/app/features/documents/documents.component.scss` - Added upload section styles
- `frontend/src/environments/environment.prod.ts` - Fixed Environment interface export

