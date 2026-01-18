import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/components/toast/toast.service';

// Types
export interface Notification {
  id: string;
  type: 'risk_escalation' | 'deadline_approaching' | 'document_required';
  priority: 'high' | 'medium' | 'low';
  message: string;
  engagement_id: string;
  engagement_name: string;
  created_at: string;
  dismissed: boolean;
  dismissed_at: string | null;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export interface NotificationCountResponse {
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);
  private readonly apiUrl = environment.apiUrl;

  // State
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _loading = signal(false);
  private readonly _lastNotificationIds = signal<Set<string>>(new Set());

  // Public readonly signals
  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();

  // Computed
  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.dismissed).length
  );

  readonly hasUnread = computed(() => this.unreadCount() > 0);

  readonly highPriorityCount = computed(() =>
    this._notifications().filter(n => !n.dismissed && n.priority === 'high').length
  );

  // Polling interval (30 seconds)
  private readonly POLL_INTERVAL = 30000;

  constructor() {
    // Initial load
    this.loadNotifications();

    // Start polling
    interval(this.POLL_INTERVAL)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.fetchNotifications())
      )
      .subscribe();
  }

  /**
   * Load notifications from the API
   */
  loadNotifications(): void {
    this._loading.set(true);
    this.fetchNotifications().subscribe({
      next: () => this._loading.set(false),
      error: () => this._loading.set(false),
    });
  }

  /**
   * Fetch notifications from API
   */
  private fetchNotifications() {
    return this.http.get<NotificationListResponse>(`${this.apiUrl}/notifications`)
      .pipe(
        tap((response) => {
          const currentIds = this._lastNotificationIds();
          const newNotifications = response.notifications.filter(
            n => !currentIds.has(n.id) && !n.dismissed
          );

          // Show toast for new high priority notifications
          for (const notification of newNotifications) {
            if (notification.priority === 'high') {
              this.toastService.error(notification.message, 8000);
            } else if (notification.priority === 'medium') {
              this.toastService.warning(notification.message, 6000);
            }
          }

          // Update state
          this._notifications.set(response.notifications);
          this._lastNotificationIds.set(
            new Set(response.notifications.map(n => n.id))
          );
        })
      );
  }

  /**
   * Dismiss a notification
   */
  dismissNotification(notificationId: string): void {
    this.http.post(`${this.apiUrl}/notifications/${notificationId}/dismiss`, {})
      .subscribe({
        next: () => {
          this._notifications.update(notifications =>
            notifications.map(n =>
              n.id === notificationId
                ? { ...n, dismissed: true, dismissed_at: new Date().toISOString() }
                : n
            )
          );
        },
        error: (err) => {
          console.error('Failed to dismiss notification:', err);
        },
      });
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    this.http.post(`${this.apiUrl}/notifications/dismiss-all`, {})
      .subscribe({
        next: () => {
          this._notifications.update(notifications =>
            notifications.map(n => ({
              ...n,
              dismissed: true,
              dismissed_at: new Date().toISOString(),
            }))
          );
        },
        error: (err) => {
          console.error('Failed to dismiss all notifications:', err);
        },
      });
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'risk_escalation':
        return 'alert-triangle';
      case 'deadline_approaching':
        return 'clock';
      case 'document_required':
        return 'file-text';
      default:
        return 'bell';
    }
  }

  /**
   * Get notification color based on priority
   */
  getNotificationColor(priority: Notification['priority']): string {
    switch (priority) {
      case 'high':
        return '#EF4444'; // red
      case 'medium':
        return '#F59E0B'; // orange
      case 'low':
        return '#10B981'; // green
      default:
        return '#6B7280'; // gray
    }
  }
}
