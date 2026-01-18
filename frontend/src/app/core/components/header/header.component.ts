import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, inject, computed, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MockDataService } from '../../services/mock-data.service';

export interface HeaderNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  message: string;
  engagementId?: string;
  timestamp: Date;
  read: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @Input() title = 'Avengers Project';
  @Input() sidebarCollapsed = false;
  @Output() menuToggle = new EventEmitter<void>();

  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  // Track read notification IDs
  private readNotificationIds = signal<Set<string>>(new Set());
  showNotificationDropdown = signal(false);

  // Transform mock notifications to header notifications with read state
  readonly notifications = computed<HeaderNotification[]>(() => {
    const mockNotifications = this.mockData.notifications();
    const readIds = this.readNotificationIds();

    return mockNotifications.map((n) => ({
      id: n.id,
      type: n.type as HeaderNotification['type'],
      message: n.message,
      engagementId: n.engagementId,
      timestamp: n.timestamp,
      read: readIds.has(n.id),
    }));
  });

  readonly unreadCount = computed(() => {
    return this.notifications().filter((n) => !n.read).length;
  });

  readonly recentNotifications = computed(() => {
    // Show only last 5 notifications in dropdown
    return this.notifications().slice(0, 5);
  });

  constructor() {
    this.loadReadNotifications();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.showNotificationDropdown.set(false);
    }
  }

  toggleNotificationDropdown(): void {
    this.showNotificationDropdown.update((v) => !v);
  }

  closeNotificationDropdown(): void {
    this.showNotificationDropdown.set(false);
  }

  markAsRead(notification: HeaderNotification, event: Event): void {
    event.stopPropagation();
    this.readNotificationIds.update((ids) => {
      const newIds = new Set(ids);
      newIds.add(notification.id);
      return newIds;
    });
    this.saveReadNotifications();
  }

  markAllAsRead(): void {
    const allIds = this.notifications().map((n) => n.id);
    this.readNotificationIds.set(new Set(allIds));
    this.saveReadNotifications();
  }

  onNotificationClick(notification: HeaderNotification): void {
    // Mark as read
    this.readNotificationIds.update((ids) => {
      const newIds = new Set(ids);
      newIds.add(notification.id);
      return newIds;
    });
    this.saveReadNotifications();

    // Navigate to engagement if available
    if (notification.engagementId) {
      this.router.navigate(['/engagements', notification.engagementId, 'dashboard']);
    }

    this.closeNotificationDropdown();
  }

  getNotificationIcon(type: HeaderNotification['type']): string {
    switch (type) {
      case 'urgent':
        return 'alert-circle';
      case 'warning':
        return 'alert-triangle';
      case 'success':
        return 'check-circle';
      case 'info':
      default:
        return 'info';
    }
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  }

  private saveReadNotifications(): void {
    try {
      const ids = Array.from(this.readNotificationIds());
      sessionStorage.setItem('avengers_read_notifications', JSON.stringify(ids));
    } catch {
      // Session storage not available
    }
  }

  private loadReadNotifications(): void {
    try {
      const saved = sessionStorage.getItem('avengers_read_notifications');
      if (saved) {
        const ids = JSON.parse(saved) as string[];
        this.readNotificationIds.set(new Set(ids));
      }
    } catch {
      // Session storage not available
    }
  }
}
