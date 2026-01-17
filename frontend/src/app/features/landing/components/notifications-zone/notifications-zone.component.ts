import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NotificationItemComponent,
  Notification,
  BadgeComponent,
} from '../../../../shared';

@Component({
  selector: 'app-notifications-zone',
  standalone: true,
  imports: [CommonModule, NotificationItemComponent, BadgeComponent],
  templateUrl: './notifications-zone.component.html',
  styleUrl: './notifications-zone.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsZoneComponent {
  @Input() set notifications(value: Notification[]) {
    this.notificationsSignal.set(value);
  }

  @Output() notificationClick = new EventEmitter<Notification>();

  private notificationsSignal = signal<Notification[]>([]);
  private dismissedIds = signal<Set<string>>(new Set());

  visibleNotifications = computed(() => {
    const dismissed = this.dismissedIds();
    return this.notificationsSignal().filter((n) => !dismissed.has(n.id));
  });

  notificationCount = computed(() => this.visibleNotifications().length);

  collapsed = signal(false);

  onDismiss(id: string): void {
    this.dismissedIds.update((ids) => new Set([...ids, id]));
  }

  onNotificationClick(notification: Notification): void {
    this.notificationClick.emit(notification);
  }

  toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }

  trackById(index: number, notification: Notification): string {
    return notification.id;
  }
}
