# Story 9.4: Eve Proactive Notifications

Status: ready-for-dev

## Story

As a **user**,
I want **Eve to proactively alert me about important changes**,
so that **I don't miss critical deadlines or risk escalations**.

## Acceptance Criteria

1. **AC1:** User receives notification when an engagement becomes HIGH risk
2. **AC2:** User receives notification when deadline is approaching (J-7 days)
3. **AC3:** Notification badge appears on the Eve FAB button
4. **AC4:** Toast notification pops up for new alerts
5. **AC5:** List of pending notifications visible in Eve panel

## Tasks / Subtasks

- [ ] Task 1: Backend - Create notification service (AC: #1, #2)
  - [ ] 1.1: Create `notification_service.py` with notification types enum
  - [ ] 1.2: Implement `check_risk_escalations()` - detect engagements that became HIGH risk
  - [ ] 1.3: Implement `check_deadline_approaching()` - find engagements with due_date within 7 days
  - [ ] 1.4: Create Notification Pydantic schema with type, message, engagement_id, created_at
  - [ ] 1.5: Write unit tests for notification detection

- [ ] Task 2: Backend - Notification API endpoints
  - [ ] 2.1: Create `GET /api/notifications` endpoint returning pending notifications
  - [ ] 2.2: Create `POST /api/notifications/{id}/dismiss` to mark as read
  - [ ] 2.3: Add notification count to dashboard KPIs response
  - [ ] 2.4: Integrate notification check into engagement update flow
  - [ ] 2.5: Write API tests

- [ ] Task 3: Backend - Eve notification context (AC: #1, #2)
  - [ ] 3.1: Include pending notifications in Eve's system context
  - [ ] 3.2: Eve should mention new alerts when user opens chat
  - [ ] 3.3: Add notification-specific response prompts
  - [ ] 3.4: Write tests for Eve notification awareness

- [ ] Task 4: Frontend - Notification service and state
  - [ ] 4.1: Create `notification.service.ts` with signals for notifications
  - [ ] 4.2: Implement polling for new notifications (every 30 seconds)
  - [ ] 4.3: Add notification count computed signal
  - [ ] 4.4: Handle notification dismissal

- [ ] Task 5: Frontend - Eve FAB badge (AC: #3)
  - [ ] 5.1: Add badge counter to EveFabComponent
  - [ ] 5.2: Show red badge with count when notifications > 0
  - [ ] 5.3: Animate badge on new notification (pulse effect)
  - [ ] 5.4: Clear badge when Eve panel opened

- [ ] Task 6: Frontend - Toast notifications (AC: #4)
  - [ ] 6.1: Trigger toast when new notification detected
  - [ ] 6.2: Toast message includes engagement name and alert type
  - [ ] 6.3: Toast click navigates to engagement or opens Eve panel
  - [ ] 6.4: Use warning/error toast styles based on severity

- [ ] Task 7: Frontend - Notifications list in Eve panel (AC: #5)
  - [ ] 7.1: Add notifications tab/section in EvePanelComponent
  - [ ] 7.2: List pending notifications with dismiss action
  - [ ] 7.3: Click notification to ask Eve about it
  - [ ] 7.4: Show empty state when no notifications

- [ ] Task 8: Testing & Validation
  - [ ] 8.1: Backend tests for notification service
  - [ ] 8.2: Frontend tests for notification components
  - [ ] 8.3: Manual E2E testing of notification flow

## Dev Notes

### Architecture Compliance

This feature extends existing patterns:
- **Backend:** Follow existing service patterns (risk_service.py, eve_service.py)
- **Frontend:** Extend existing Eve components and toast service
- **Polling:** Use interval-based polling (WebSocket would be overkill for POC)

### Technical Approach

1. **Notification Types:**
   ```python
   class NotificationType(str, Enum):
       RISK_ESCALATION = "risk_escalation"
       DEADLINE_APPROACHING = "deadline_approaching"
       DOCUMENT_REQUIRED = "document_required"  # Future extension
   ```

2. **Notification Detection Logic:**
   ```python
   def check_risk_escalations(engagements: list[Engagement]) -> list[Notification]:
       notifications = []
       for eng in engagements:
           if eng.risk_level == RiskLevel.high and eng.previous_risk_level != RiskLevel.high:
               notifications.append(Notification(
                   type=NotificationType.RISK_ESCALATION,
                   message=f"⚠️ {eng.entity_name} est passé en risque ÉLEVÉ",
                   engagement_id=eng.id
               ))
       return notifications

   def check_deadline_approaching(engagements: list[Engagement]) -> list[Notification]:
       today = date.today()
       notifications = []
       for eng in engagements:
           days_remaining = (eng.due_date - today).days
           if 0 < days_remaining <= 7:
               notifications.append(Notification(
                   type=NotificationType.DEADLINE_APPROACHING,
                   message=f"📅 {eng.entity_name}: deadline dans {days_remaining} jours",
                   engagement_id=eng.id
               ))
       return notifications
   ```

3. **Frontend Polling Pattern:**
   ```typescript
   @Injectable({ providedIn: 'root' })
   export class NotificationService {
     private http = inject(HttpClient);

     notifications = signal<Notification[]>([]);
     unreadCount = computed(() => this.notifications().filter(n => !n.dismissed).length);

     constructor() {
       // Poll every 30 seconds
       interval(30000).pipe(
         switchMap(() => this.fetchNotifications())
       ).subscribe(notifications => this.notifications.set(notifications));
     }
   }
   ```

4. **FAB Badge Component:**
   ```typescript
   @Component({
     template: `
       <button class="eve-fab" (click)="openPanel()">
         <lucide-icon name="message-circle" />
         @if (notificationCount() > 0) {
           <span class="badge animate-pulse">{{ notificationCount() }}</span>
         }
       </button>
     `
   })
   ```

### File Structure

```
backend/app/
├── services/
│   └── notification_service.py       # NEW
├── schemas/
│   └── notification.py               # NEW
├── routers/
│   └── notifications.py              # NEW
├── main.py                           # MODIFY: add notifications router

frontend/src/app/
├── core/services/
│   └── notification.service.ts       # NEW
├── features/eve/
│   ├── eve-fab/
│   │   └── eve-fab.component.ts      # MODIFY: add badge
│   └── eve-panel/
│       ├── eve-panel.component.ts    # MODIFY: add notifications section
│       └── notification-list.component.ts  # NEW
├── shared/components/toast/
│   └── toast.component.ts            # MODIFY: add click handler
```

### Project Structure Notes

- Notifications stored in-memory for POC (no DB persistence needed)
- Uses existing toast infrastructure from Epic 1
- FAB badge follows existing badge patterns (risk-badge)

### References

- [Source: docs/USER-STORIES.md#E9-S4] - Original story definition
- [Source: docs/PRD.md#Section-5.1] - Notifications intelligentes (FR3)
- [Source: frontend/src/app/features/eve/] - Existing Eve components
- [Source: frontend/src/app/shared/components/toast/] - Toast component

### Previous Story Intelligence

From Story 9-3 patterns:
- Modal/overlay patterns established
- Service layer patterns for new features
- Frontend polling can use similar interval patterns

From Story 9-1 (Gantt):
- Eve panel extension patterns established
- Response type handling in place

### Library/Framework Requirements

- No new libraries required
- Use existing RxJS `interval` for polling
- Use existing Lucide icons for notification indicators

### Testing Requirements

- **Backend:** pytest tests for notification_service and API endpoints
- **Frontend:** Karma tests for notification service and components
- **Manual:** Test notification triggers by modifying engagement risk/dates

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
