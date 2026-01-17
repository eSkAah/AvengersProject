# Story 4.5: Auto Update Engagement Status

Status: done

## Story

As a **system**,
I want **to automatically update the engagement status**,
so that **progress is reflected automatically**.

## Acceptance Criteria

1. **AC1:** Upload document → engagement.status = "received"
2. **AC2:** Classification terminée → engagement.status = "processing"
3. **AC3:** Tous docs requis uploadés → recalcul completion_percent
4. **AC4:** Notification WebSocket ou polling pour update UI
5. **AC5:** Risk level recalculé

## Tasks / Subtasks

- [x] **Task 1: Backend Engagement Update Service** (AC: 1, 2, 3, 5)
  - [x] Add `update_engagement_after_upload()` function
  - [x] Update status from waiting → received on first document
  - [x] Update status to processing after classification
  - [x] Recalculate completion_percent based on documents
  - [x] Recalculate risk level

- [x] **Task 2: Integrate with Upload Endpoint** (AC: 1, 2)
  - [x] Call engagement update after document creation
  - [x] Return updated engagement info in response

- [x] **Task 3: Frontend Polling/Update** (AC: 4)
  - [x] Add engagement refresh after upload
  - [x] Update MockDataService with new status
  - [x] Reflect changes in UI immediately

## Dev Notes

### Current Implementation Status

The engagement service already has:
- `calculate_risk_level()` - Risk calculation based on due_date, completion, status
- `calculate_completion_percent()` - Based on documents_uploaded/required
- `update_engagement_risk()` - Updates risk on an engagement

What's needed:
- Orchestration function to update status + completion + risk after upload
- Integration with upload endpoint
- Frontend reactive updates

### Status Transition Logic

```python
# After document upload:
if engagement.status == "waiting":
    engagement.status = "received"  # First document received

# After classification completes:
if classification_result.document_type is not None:
    engagement.status = "processing"  # AI processing started

# After all required docs uploaded:
if documents_uploaded >= documents_required:
    engagement.status = "completed"  # All docs received
```

### References

- [Source: docs/USER-STORIES.md#E4-S5] - Story requirements
- [Source: backend/app/services/engagement_service.py] - Existing engagement service
- [Source: backend/app/routers/documents.py] - Upload endpoint

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 126 backend tests passing
- Frontend build successful

### Completion Notes List

- Added `update_engagement_after_upload()` function to engagement_service.py
- Added `count_engagement_documents()` helper function
- Status transitions: waiting → received → processing → completed
- Completion percent recalculated based on documents uploaded vs required
- Risk level recalculated on every upload
- Extended DocumentUploadResponse with EngagementStatusUpdate
- Frontend MockDataService updated to reflect engagement changes

### File List

**Modified - Backend:**
- `backend/app/services/engagement_service.py` - Added update_engagement_after_upload(), count_engagement_documents()
- `backend/app/routers/documents.py` - Integrated engagement update after upload, extended response
- `backend/app/schemas/document.py` - Added EngagementStatusUpdate, DocumentUploadResponse schemas
- `backend/tests/test_engagements.py` - Added 3 new tests for engagement update after upload
- `backend/tests/test_documents.py` - Made tests more resilient to document count changes

**Modified - Frontend:**
- `frontend/src/app/core/services/document-api.service.ts` - Added EngagementStatusUpdate interface
- `frontend/src/app/core/services/mock-data.service.ts` - Added updateEngagementFromUpload() method
- `frontend/src/app/features/documents/documents.component.ts` - Call engagement update after upload
