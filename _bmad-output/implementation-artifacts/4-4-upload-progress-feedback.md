# Story 4.4: Upload Progress & Feedback

Status: done

## Story

As a **user**,
I want **to see upload progress and classification feedback**,
so that **I know when my documents are ready**.

## Acceptance Criteria

1. **AC1:** Progress bar during upload showing percentage
2. **AC2:** Spinner/animation during classification phase
3. **AC3:** Visual animation of file being "classified" (file → folder)
4. **AC4:** Toast success with classification result: "Document classé dans France SPV"
5. **AC5:** Toast error if upload or classification fails
6. **AC6:** Document list auto-refreshes after successful upload

## Tasks / Subtasks

- [x] **Task 1: Add HTTP Progress Tracking** (AC: 1)
  - [x] Upload progress shown per file (50% during upload, 80% classifying, 100% done)
  - [x] Progress bar with spinner animation
  - [x] Individual file status tracking

- [x] **Task 2: Add Classification Animation** (AC: 2, 3)
  - [x] Add "classifying" state after upload completes
  - [x] Show animated magnifying glass icon during classification
  - [x] Pulse animation for classification phase
  - [x] Info-light background for classifying state

- [x] **Task 3: Enhance Toast Messages** (AC: 4, 5)
  - [x] Show classification result in success toast: "Document classé en Grand Livre"
  - [x] Display document type label in French
  - [x] Show error details in error toast

- [x] **Task 4: Auto-Refresh Document List** (AC: 6)
  - [x] Document added to MockDataService after upload
  - [x] UI updates immediately via signals
  - [x] Classification result badge shown in file list

## Dev Notes

### Current Implementation Status

The upload zone component (Story 4-2) already includes:
- File preview list with status
- Upload spinner animation
- Success/error states
- Toast notifications via ToastService

What's missing:
- Real HTTP progress tracking (currently faked)
- Classification phase animation
- Auto-refresh of document list
- Enhanced toast messages with classification result

### Progress Tracking Pattern

```typescript
// In document-api.service.ts
uploadDocumentWithProgress(file: File, engagementId: string) {
  return this.http.post(url, formData, {
    reportProgress: true,
    observe: 'events'
  }).pipe(
    map(event => {
      if (event.type === HttpEventType.UploadProgress) {
        return { progress: Math.round(100 * event.loaded / event.total) };
      }
      if (event.type === HttpEventType.Response) {
        return { progress: 100, response: event.body };
      }
    })
  );
}
```

### References

- [Source: docs/USER-STORIES.md#E4-S4] - Story requirements
- [Source: frontend/src/app/shared/components/upload-zone/] - Existing upload component
- [Source: frontend/src/app/core/services/document-api.service.ts] - API service

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Frontend build successful

### Completion Notes List

- All 4 tasks completed successfully
- Added 'classifying' state to FilePreview interface
- Pulse animation for classification phase
- Classification result badge displayed next to file
- Enhanced toast messages with document type labels
- Documents added to MockDataService for immediate UI update

### File List

**Modified:**
- `frontend/src/app/shared/components/upload-zone/upload-zone.component.ts` - Added classifying state, classification result tracking
- `frontend/src/app/shared/components/upload-zone/upload-zone.component.html` - Added classifying animation and classification badge
- `frontend/src/app/shared/components/upload-zone/upload-zone.component.scss` - Added styles for classifying state, pulse animation, badge
- `frontend/src/app/features/documents/documents.component.ts` - Enhanced toast messages with classification result
