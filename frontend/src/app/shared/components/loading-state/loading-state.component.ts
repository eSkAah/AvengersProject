import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';

export type LoadingVariant = 'card' | 'list' | 'table' | 'kpi' | 'chart';

/**
 * Loading State Component
 *
 * Displays skeleton loaders while content is loading.
 * Provides different variants for various UI patterns.
 */
@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    @switch (variant) {
      @case ('kpi') {
        <div class="loading-kpis">
          @for (i of [1,2,3,4]; track i) {
            <div class="loading-kpi">
              <app-skeleton variant="circular" width="48px" height="48px"></app-skeleton>
              <div class="loading-kpi__content">
                <app-skeleton width="60px" height="24px"></app-skeleton>
                <app-skeleton width="100px" height="14px"></app-skeleton>
              </div>
            </div>
          }
        </div>
      }
      @case ('list') {
        <div class="loading-list">
          @for (i of getItems(); track i) {
            <div class="loading-list-item">
              <app-skeleton width="100%" height="72px"></app-skeleton>
            </div>
          }
        </div>
      }
      @case ('card') {
        <div class="loading-cards">
          @for (i of getItems(); track i) {
            <div class="loading-card">
              <app-skeleton width="100%" height="120px"></app-skeleton>
              <div class="loading-card__content">
                <app-skeleton width="80%" height="16px"></app-skeleton>
                <app-skeleton width="60%" height="14px"></app-skeleton>
              </div>
            </div>
          }
        </div>
      }
      @case ('chart') {
        <div class="loading-chart">
          <app-skeleton width="100%" height="300px"></app-skeleton>
        </div>
      }
      @default {
        <div class="loading-table">
          <app-skeleton width="100%" height="48px"></app-skeleton>
          @for (i of getItems(); track i) {
            <app-skeleton width="100%" height="56px"></app-skeleton>
          }
        </div>
      }
    }
  `,
  styles: [`
    .loading-kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .loading-kpi {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #FFFFFF;
      border-radius: 12px;
      border: 1px solid #E5E5E5;
    }

    .loading-kpi__content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .loading-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .loading-list-item {
      border-radius: 12px;
      overflow: hidden;
    }

    .loading-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .loading-card {
      background: #FFFFFF;
      border-radius: 12px;
      border: 1px solid #E5E5E5;
      overflow: hidden;
    }

    .loading-card__content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .loading-chart {
      background: #FFFFFF;
      border-radius: 12px;
      border: 1px solid #E5E5E5;
      overflow: hidden;
    }

    .loading-table {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    @media (max-width: 1024px) {
      .loading-kpis {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .loading-kpis {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingStateComponent {
  @Input() variant: LoadingVariant = 'list';
  @Input() count = 5;

  getItems(): number[] {
    return Array.from({ length: this.count }, (_, i) => i + 1);
  }
}
