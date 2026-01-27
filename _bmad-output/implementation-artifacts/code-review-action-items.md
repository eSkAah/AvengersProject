# Code Review Action Items

**Project:** AvengersProject
**Review Date:** 2026-01-27
**Reviewer:** Claude Code (Adversarial Review)
**Status:** Critical Issues Fixed ✅

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 6 | ✅ Fixed |
| High | 5 | Pending |
| Medium | 17 | Pending |
| Low | 3 | Reclassified (see notes) |
| **Total** | **31** | **6 Fixed, 22 Pending** |

---

## Critical Issues - ✅ FIXED

### CR-001: Remove console.log debug statements ✅ FIXED
- [x] `frontend/src/app/features/service-detail/components/service-documents/service-documents.component.ts` - Replaced with ToastService
- [x] `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.ts` - Replaced with ToastService
- [x] `frontend/src/app/features/engagement-detail/engagement-detail.component.ts` - Replaced with ToastService

### CR-002: Replace native alerts with Toast/Modal components ✅ FIXED
- [x] `frontend/src/app/features/service-detail/components/service-documents/service-documents.component.ts` - Replaced `alert()` with `toastService.success()`
- [x] `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.ts` - Replaced alerts with `toastService.info()` and `toastService.warning()`

### CR-003: innerHTML usage - RECLASSIFIED as LOW RISK
After review:
- `eve-message.component.ts` - HTML is properly escaped (lines 244-247) before insertion. **Safe.**
- `pie-chart.component.ts` - HTML is constructed from internal trusted data, not user input. **Low risk.**

---

## High Issues

### CR-004: Replace `any` types with proper TypeScript types
- [ ] `frontend/src/app/core/components/navbar/navbar.component.ts:10` - Replace `icon: any` with `icon: Type<LucideIconComponent>` or similar
- [ ] `frontend/src/app/core/components/navbar/navbar.component.ts:205` - Replace `getNotificationIcon(): any` return type with `string`
- [ ] `frontend/src/app/core/services/service-entity.service.ts:10` - Replace `icon: any` with proper Lucide icon type
- [ ] `frontend/src/app/features/home/components/recent-activity-widget/recent-activity-widget.component.ts:11` - Replace `icon: any` with proper type
- [ ] `frontend/src/app/features/home/components/services-widget/services-widget.component.ts:18` - Replace `icon: any` with proper type

---

## Medium Issues

### CR-005: Add user notification for error handlers
Currently errors are logged but user is not informed. Add ToastService notifications:

- [ ] `frontend/src/app/core/components/navbar/navbar.component.ts:174` - Add toast for "Failed to load notifications"
- [ ] `frontend/src/app/core/components/navbar/navbar.component.ts:184` - Add toast for "Failed to dismiss notification"
- [ ] `frontend/src/app/core/components/navbar/navbar.component.ts:194` - Add toast for "Failed to dismiss all notifications"
- [ ] `frontend/src/app/core/services/engagement-api.service.ts:66` - Add error handling callback
- [ ] `frontend/src/app/core/services/engagement-api.service.ts:91` - Add error handling callback
- [ ] `frontend/src/app/core/services/dashboard-api.service.ts:124` - Add error handling callback
- [ ] `frontend/src/app/core/services/dashboard-api.service.ts:143` - Add error handling callback
- [ ] `frontend/src/app/core/services/dashboard-api.service.ts:160` - Add error handling callback
- [ ] `frontend/src/app/core/services/dashboard-api.service.ts:177` - Add error handling callback
- [ ] `frontend/src/app/core/services/dashboard-api.service.ts:201` - Add error handling callback
- [ ] `frontend/src/app/core/services/eve-api.service.ts:291` - Add error handling callback
- [ ] `frontend/src/app/core/services/eve-api.service.ts:472` - Add error handling callback
- [ ] `frontend/src/app/core/services/eve-api.service.ts:496` - Add error handling callback
- [ ] `frontend/src/app/core/services/eve-api.service.ts:520` - Add error handling callback
- [ ] `frontend/src/app/core/services/document-api.service.ts:268` - Review error handling strategy
- [ ] `frontend/src/app/shared/components/document-preview-modal/document-preview-modal.component.ts:371` - Add user-facing error message
- [ ] `frontend/src/app/shared/components/widget-system/widget.service.ts:138,157` - Consider silent fail or user notification

---

## Low Issues

### CR-006: Implement stub functions or remove them
- [ ] `frontend/src/app/features/service-detail/components/service-documents/service-documents.component.ts:278-291` - Implement `downloadDocument()`, `previewDocument()`, `askEve()` or mark as @deprecated

### CR-007: Replace direct DOM access with Renderer2
- [ ] `frontend/src/app/features/service-detail/components/service-insights/service-insights.component.ts` - Replace `document.getElementById()` with Renderer2 or ViewChild
- [ ] `frontend/src/app/features/documents/documents.component.ts` - Replace `document.querySelector()` with Angular abstractions

### CR-008: Clean up commented code blocks
- [ ] Review and remove unnecessary commented code from 72 files identified in review

---

## Quick Wins (Can be fixed in bulk)

### Regex patterns for search & replace:

**Remove console.log statements:**
```regex
^\s*console\.log\(.*\);?\s*$
```

**Find any types:**
```regex
:\s*any[;\s\)\]]
```

**Find alerts:**
```regex
alert\s*\(
```

---

## Notes

- All file paths are relative to `frontend/src/app/`
- Priority: Critical > High > Medium > Low
- Consider running `ng lint` to catch additional issues
- Consider adding ESLint rules to prevent these issues in future:
  - `no-console` - Disallow console statements
  - `@typescript-eslint/no-explicit-any` - Disallow any type
  - `no-alert` - Disallow use of alert, confirm, prompt

---

_Generated by Code Review Workflow on 2026-01-27_
