import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { EveApiService } from '../../../core/services/eve-api.service';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Eve Floating Action Button (FAB)
 *
 * A fixed position button in the bottom-right corner that:
 * - Opens/closes the Eve chat panel
 * - Shows unread message badge
 * - Animates on hover and when panel is open
 */
@Component({
  selector: 'app-eve-fab',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <button
      class="eve-fab"
      [class.eve-fab--active]="eveService.isPanelOpen()"
      (click)="togglePanel()"
      [attr.aria-label]="eveService.isPanelOpen() ? 'Fermer Eve' : 'Ouvrir Eve'"
      [attr.aria-expanded]="eveService.isPanelOpen()"
    >
      <!-- Eve Icon or Close Icon based on state -->
      @if (eveService.isPanelOpen()) {
        <lucide-icon name="x" [size]="24"></lucide-icon>
      } @else {
        <lucide-icon name="bot" [size]="24"></lucide-icon>
      }

      <!-- Unread badge (includes notifications) -->
      @if (showBadge()) {
        <span
          class="eve-fab__badge"
          [class.eve-fab__badge--alert]="hasHighPriorityNotifications()"
          aria-live="polite"
        >
          {{ totalBadgeCount() }}
        </span>
      }

      <!-- Pulse animation for new messages -->
      @if (showBadge()) {
        <span class="eve-fab__pulse"></span>
      }
    </button>
  `,
  styles: [`
    .eve-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2E2E38 0%, #1E1E28 100%);
      color: #FFE600;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.15),
        0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000;
    }

    .eve-fab:hover {
      transform: scale(1.08);
      box-shadow:
        0 6px 20px rgba(0, 0, 0, 0.2),
        0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .eve-fab:active {
      transform: scale(0.95);
    }

    .eve-fab--active {
      background: #FFE600;
      color: #2E2E38;
      transform: rotate(0deg);
    }

    .eve-fab--active:hover {
      background: #FFD000;
    }

    .eve-fab__badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      background: #F59E0B;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #FFFFFF;
      animation: badgeBounce 300ms ease-out;
    }

    .eve-fab__badge--alert {
      background: #EF4444;
      animation: badgeBounce 300ms ease-out, alertPulse 1s ease-in-out infinite;
    }

    .eve-fab__pulse {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #FFE600;
      opacity: 0;
      animation: pulse 2s infinite;
    }

    @keyframes badgeBounce {
      0% {
        transform: scale(0);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
      }
    }

    @keyframes pulse {
      0% {
        opacity: 0.4;
        transform: scale(1);
      }
      100% {
        opacity: 0;
        transform: scale(1.8);
      }
    }

    @keyframes alertPulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .eve-fab {
        bottom: 16px;
        right: 16px;
        width: 48px;
        height: 48px;
      }

      .eve-fab lucide-icon {
        width: 20px;
        height: 20px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EveFabComponent {
  protected readonly eveService = inject(EveApiService);
  protected readonly notificationService = inject(NotificationService);

  /** Total badge count (unread messages + notifications) */
  protected readonly totalBadgeCount = computed(
    () => this.eveService.unreadCount() + this.notificationService.unreadCount()
  );

  /** Show badge only when there are unread items and panel is closed */
  protected readonly showBadge = computed(
    () => this.totalBadgeCount() > 0 && !this.eveService.isPanelOpen()
  );

  /** Check if there are high priority notifications */
  protected readonly hasHighPriorityNotifications = computed(
    () => this.notificationService.highPriorityCount() > 0
  );

  togglePanel(): void {
    this.eveService.togglePanel();
  }
}
