import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonComponent } from '../button/button.component';

/**
 * Error State Component
 *
 * Displays an error message with optional retry action.
 * Used when API calls fail or unexpected errors occur.
 */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ButtonComponent],
  template: `
    <div class="error-state">
      <div class="error-state__icon">
        <lucide-icon name="alert-circle" [size]="48"></lucide-icon>
      </div>
      <h3 class="error-state__title">{{ title }}</h3>
      <p class="error-state__description">{{ description }}</p>
      @if (showRetry) {
        <app-button variant="primary" (clicked)="retry.emit()">
          <lucide-icon name="loader" [size]="16" style="margin-right: 8px"></lucide-icon>
          Réessayer
        </app-button>
      }
    </div>
  `,
  styles: [`
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .error-state__icon {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: #FEF2F2;
      color: #DC2626;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .error-state__title {
      font-size: 18px;
      font-weight: 600;
      color: #2E2E38;
      margin: 0 0 8px 0;
    }

    .error-state__description {
      font-size: 14px;
      color: #6B7280;
      margin: 0 0 24px 0;
      max-width: 400px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  @Input() title = 'Une erreur est survenue';
  @Input() description = 'Nous n\'avons pas pu charger les données. Veuillez réessayer.';
  @Input() showRetry = true;

  @Output() retry = new EventEmitter<void>();
}
