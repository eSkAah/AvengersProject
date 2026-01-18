# Story 9.1: Gantt Chart Generation

Status: done

## Story

As a **user**,
I want **to ask Eve to generate a Gantt chart of my engagements**,
so that **I can visualize the planning timeline and manage deadlines effectively**.

## Acceptance Criteria

1. **AC1:** User can prompt Eve with "Génère le planning des obligations" (or similar) to trigger Gantt generation
2. **AC2:** Gantt chart displays all active engagements with their entity names
3. **AC3:** Chart shows estimated start dates and due dates for each engagement
4. **AC4:** Gantt chart is rendered and displayed within the Eve panel
5. **AC5:** User can export the Gantt chart as PNG image

## Tasks / Subtasks

- [x] Task 1: Backend - Add Gantt data endpoint (AC: #2, #3)
  - [x] 1.1: Create `GET /api/dashboard/gantt` endpoint returning engagement timeline data
  - [x] 1.2: Add `GanttItem` Pydantic schema with entity_name, start_date, due_date, completion_percent, risk_level
  - [x] 1.3: Implement service method to calculate estimated start dates (created_at or first document upload)
  - [x] 1.4: Write unit tests for gantt endpoint (8 tests)

- [x] Task 2: Backend - Add Eve Gantt prompt handling (AC: #1)
  - [x] 2.1: Add "gantt" intent detection in Eve service (keywords: "planning", "gantt", "timeline", "obligations")
  - [x] 2.2: Create `EVE_GANTT_PROMPT` template in eve_service.py
  - [x] 2.3: Return special response type `{ response_type: "gantt", data: {...} }` when gantt requested
  - [x] 2.4: Write unit tests for gantt intent detection (8 tests)

- [x] Task 3: Frontend - Create GanttChartComponent (AC: #2, #3)
  - [x] 3.1: Create `shared/components/gantt-chart/gantt-chart.component.ts` (standalone)
  - [x] 3.2: Implement horizontal bar chart using Chart.js with linear scale (day offsets)
  - [x] 3.3: Color bars by risk_level (red: high, orange: medium, green: low)
  - [x] 3.4: Show completion_percent as filled portion (solid overlay on semi-transparent bar)
  - [x] 3.5: Add tooltip on hover showing entity details (progression, risk, dates)
  - [x] 3.6: Apply EY design system colors and styling

- [x] Task 4: Frontend - Integrate Gantt in Eve Panel (AC: #4)
  - [x] 4.1: Add `response_type` and `data` fields to ChatResponse and ConversationMessage
  - [x] 4.2: Render GanttChartComponent in EveMessageComponent when response_type is "gantt"
  - [x] 4.3: Loading state handled by existing Eve panel loading indicator
  - [x] 4.4: Gantt container styled with full-width bubble for chart display

- [x] Task 5: Frontend - Export to PNG (AC: #5)
  - [x] 5.1: Add export button below gantt chart in EveMessageComponent
  - [x] 5.2: Use Chart.js `toBase64Image()` method for PNG export
  - [x] 5.3: Trigger download with filename `planning-engagements-{date}.png`
  - [x] 5.4: Toast notification skipped (export triggers download directly)

- [x] Task 6: Integration & Testing
  - [x] 6.1: All 74 backend tests pass (dashboard + eve)
  - [x] 6.2: Empty state handled with "Aucun engagement à afficher" message
  - [x] 6.3: Frontend build successful, lint passes

## Dev Notes

### Architecture Compliance

This feature follows the existing patterns established in Epics 5-6:
- **Charts:** Use Chart.js + ng2-charts (already in project)
- **Eve Integration:** Follow the existing EveApiService pattern
- **Component Structure:** Standalone component in shared/components/

### Technical Approach

1. **Gantt with Chart.js:** Use horizontal bar chart with time scale
   - X-axis: Date timeline (min: earliest start, max: latest due_date)
   - Y-axis: Engagement entity names
   - Each bar: start_date → due_date with risk_level coloring

2. **Eve Response Types:** Extend existing Eve response handling
   ```typescript
   interface EveResponse {
     message: string;
     sources?: DocumentSource[];
     type?: 'text' | 'gantt' | 'chart';  // NEW: add type
     data?: any;  // NEW: add data for structured responses
   }
   ```

3. **Export Logic:** Chart.js provides native PNG export
   ```typescript
   const canvas = this.chart.toBase64Image();
   const link = document.createElement('a');
   link.download = `gantt-planning-${new Date().toISOString().slice(0,10)}.png`;
   link.href = canvas;
   link.click();
   ```

### File Structure

```
frontend/src/app/
├── shared/components/
│   ├── gantt-chart/
│   │   └── gantt-chart.component.ts     # NEW
│   └── charts/index.ts                  # Update exports
├── shared/components/eve-panel/
│   └── eve-panel.component.ts           # MODIFY: add gantt handling

backend/app/
├── api/
│   └── dashboard.py                     # MODIFY: add /gantt endpoint
├── schemas/
│   └── dashboard.py                     # MODIFY: add GanttItem schema
├── services/
│   └── eve_service.py                   # MODIFY: add gantt intent
├── ai/
│   └── prompts.py                       # MODIFY: add GANTT_PROMPT
```

### Project Structure Notes

- Alignment: Follows existing chart patterns in `shared/components/charts/`
- Testing: Use existing test infrastructure (Karma for FE, pytest for BE)
- No conflicts with existing features detected

### References

- [Source: docs/USER-STORIES.md#E9-S1] - Original story definition
- [Source: docs/PRD.md#Section-5.5] - Eve capabilities including Gantt generation
- [Source: docs/ARCHITECTURE.md#Section-3] - Chart.js + ng2-charts patterns
- [Source: frontend/src/app/shared/components/charts/] - Existing chart components

### Previous Story Intelligence

From Epic 8 (last completed):
- Route animations are in place (`core/animations/route-animations.ts`)
- Loading states use skeleton loaders (LoadingStateComponent)
- Toast notifications available via ToastService
- Build passes with current bundle budgets

### Library/Framework Requirements

- **Chart.js:** Already installed, use existing configuration
- **ng2-charts:** Already installed, use BaseChartDirective
- **Date handling:** Use native JS Date or existing date utils
- **Export:** Use Chart.js native `toBase64Image()` - no additional library needed

### Testing Requirements

- **Backend:** pytest tests for new endpoint and Eve intent detection
- **Frontend:** Karma tests for GanttChartComponent
- **E2E:** Playwright test for full flow (optional for POC)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Gantt endpoint path conflict: Initially used `/api/engagements/gantt` but it was matched by `/{engagement_id}` routes. Fixed by mounting at `/api/dashboard/gantt`
- Chart.js date adapter: Removed `chartjs-adapter-date-fns` import since using linear scale with day offsets instead of time scale

### Completion Notes List

1. **Backend Gantt Endpoint:** Created `/api/dashboard/gantt` returning all engagements with timeline data. Uses `created_at` as start_date (simulating estimated start). Risk colors mapped from EY design system (error/warning/success).

2. **Eve Intent Detection:** Added `is_gantt_intent()` function with comprehensive French keyword matching. Returns structured response with `response_type: "gantt"` and `data` containing gantt chart data.

3. **Frontend GanttChartComponent:** Standalone Chart.js component using horizontal bars. Features:
   - Floating bars with [start, end] values in days
   - Semi-transparent bars with solid completion overlay
   - Tooltips with engagement details (progression, risk level, dates)
   - French date formatting

4. **Eve Panel Integration:** Extended `ConversationMessage` interface with `response_type` and `data`. `EveMessageComponent` detects gantt messages and renders the chart inline with full-width styling.

5. **PNG Export:** Button below chart triggers `exportToPng()` which uses Chart.js native `toBase64Image()` and creates download link.

### File List

**Backend (Modified):**
- `backend/app/schemas/dashboard.py` - Added GanttItem, GanttChartResponse schemas
- `backend/app/services/dashboard_service.py` - Added get_gantt_data(), get_risk_color()
- `backend/app/routers/dashboard.py` - Added GET /gantt endpoint
- `backend/app/main.py` - Added /api/dashboard router mount
- `backend/app/schemas/eve.py` - Added response_type, data fields to ChatResponse
- `backend/app/services/eve_service.py` - Added is_gantt_intent(), EVE_GANTT_PROMPT, gantt handling in process_chat()
- `backend/tests/test_dashboard.py` - Added 8 gantt tests
- `backend/tests/test_eve.py` - Added TestGanttIntent class with 8 tests

**Frontend (New):**
- `frontend/src/app/shared/components/gantt-chart/gantt-chart.component.ts` - GanttChartComponent

**Frontend (Modified):**
- `frontend/src/app/shared/components/charts/index.ts` - Export GanttChartComponent
- `frontend/src/app/core/services/eve-api.service.ts` - Added response_type, data to interfaces
- `frontend/src/app/shared/components/eve-message/eve-message.component.ts` - Gantt rendering and export
