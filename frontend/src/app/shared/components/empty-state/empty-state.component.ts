import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

/**
 * Empty State Component
 *
 * Displays a friendly message when there's no data to show.
 * Used for empty lists, search results, or initial states.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="empty-state">
      <div class="empty-state__icon">
        <lucide-icon [name]="icon" [size]="48"></lucide-icon>
      </div>
      <h3 class="empty-state__title">{{ title }}</h3>
      <p class="empty-state__description">{{ description }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-state__icon {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: #F5F5F5;
      color: #9CA3AF;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .empty-state__title {
      font-size: 18px;
      font-weight: 600;
      color: #2E2E38;
      margin: 0 0 8px 0;
    }

    .empty-state__description {
      font-size: 14px;
      color: #6B7280;
      margin: 0 0 24px 0;
      max-width: 400px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Aucune donnée';
  @Input() description = 'Il n\'y a rien à afficher pour le moment.';
}
