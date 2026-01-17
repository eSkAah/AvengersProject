import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type NotificationType = 'warning' | 'info' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  engagementId?: string;
  timestamp: Date;
}

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-item.component.html',
  styleUrl: './notification-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationItemComponent {
  @Input({ required: true }) notification!: Notification;
  @Input() dismissible = true;

  @Output() dismiss = new EventEmitter<string>();
  @Output() notificationClick = new EventEmitter<Notification>();

  readonly icons: Record<NotificationType, string> = {
    warning: '⚠️',
    info: 'ℹ️',
    urgent: '🚨',
  };

  get icon(): string {
    return this.icons[this.notification.type];
  }

  onDismiss(event: Event): void {
    event.stopPropagation();
    this.dismiss.emit(this.notification.id);
  }

  onClick(): void {
    this.notificationClick.emit(this.notification);
  }
}
