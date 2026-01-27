import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface KpiMetric {
  label: string;
  value: number;
  previousValue?: number;
  variancePercent?: number;
  icon: string;
  sourceDocument?: string;
}

export interface KpiClickEvent {
  metric: KpiMetric;
  isCmdClick: boolean;
}

// EY Design System color classes
type ColorClass = 'default' | 'positive' | 'negative' | 'info' | 'warning' | 'accent';

@Component({
  selector: 'app-kpi-metric-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="kpi-metric-card"
      [class.kpi-metric-card--positive]="isPositive"
      [class.kpi-metric-card--negative]="isNegative"
      [class.kpi-metric-card--loading]="loading"
      (click)="onClick($event)"
    >
      @if (loading) {
        <!-- Skeleton Loader - EY Design System -->
        <div class="kpi-skeleton">
          <div class="skeleton-icon"></div>
          <div class="skeleton-content">
            <div class="skeleton-value"></div>
            <div class="skeleton-label"></div>
          </div>
        </div>
      } @else {
        <div class="kpi-icon" [class]="'kpi-icon--' + colorClass">
          <lucide-icon [name]="metric.icon" [size]="24"></lucide-icon>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">
            <span class="kpi-value__amount">{{ formatValue(metric.value) }}</span>
            @if (metric.variancePercent !== undefined) {
              <span
                class="kpi-value__variance"
                [class.kpi-value__variance--positive]="metric.variancePercent >= 0"
                [class.kpi-value__variance--negative]="metric.variancePercent < 0"
              >
                <lucide-icon
                  [name]="metric.variancePercent >= 0 ? 'trending-up' : 'trending-down'"
                  [size]="14"
                ></lucide-icon>
                {{ formatVariance(metric.variancePercent) }}
              </span>
            }
          </div>
          <div class="kpi-label">{{ metric.label }}</div>
          @if (showCmdHint) {
            <div class="kpi-hint">Cmd+Click to ask Eve</div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* ==========================================================================
       EY Design System - KPI Metric Card
       Cards: white bg, border-radius 12px, subtle shadow, hover lift
       Transitions: 200ms ease-out
       ========================================================================== */

      .kpi-metric-card {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 20px;
        background: #ffffff;
        border: 1px solid #e5e5e5;
        border-radius: 12px;
        cursor: pointer;
        transition: all 200ms ease-out;
      }

      .kpi-metric-card:hover {
        border-color: #d4d4d4;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }

      .kpi-metric-card--loading {
        cursor: default;
      }

      .kpi-metric-card--loading:hover {
        transform: none;
        box-shadow: none;
      }

      /* Skeleton Loader - EY Design System */
      .kpi-skeleton {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        width: 100%;
      }

      .skeleton-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(90deg, #f5f5f5 0%, #e5e5e5 50%, #f5f5f5 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }

      .skeleton-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .skeleton-value {
        height: 28px;
        width: 120px;
        border-radius: 4px;
        background: linear-gradient(90deg, #f5f5f5 0%, #e5e5e5 50%, #f5f5f5 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }

      .skeleton-label {
        height: 16px;
        width: 80px;
        border-radius: 4px;
        background: linear-gradient(90deg, #f5f5f5 0%, #e5e5e5 50%, #f5f5f5 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      /* Icon Styles - EY Design System */
      .kpi-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        flex-shrink: 0;
        transition: all 200ms ease-out;
      }

      .kpi-icon--default {
        background: #f5f5f5;
        color: #6b7280;
      }

      .kpi-icon--positive {
        background: #d1fae5;
        color: #047857;
      }

      .kpi-icon--negative {
        background: #fee2e2;
        color: #b91c1c;
      }

      .kpi-icon--info {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .kpi-icon--warning {
        background: #fef3c7;
        color: #b45309;
      }

      .kpi-icon--accent {
        background: #fff9cc;
        color: #2e2e38;
      }

      /* Content Styles */
      .kpi-content {
        flex: 1;
        min-width: 0;
      }

      .kpi-value {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .kpi-value__amount {
        font-size: 22px;
        font-weight: 700;
        color: #2e2e38;
        line-height: 1.2;
        font-variant-numeric: tabular-nums;
      }

      /* Variance Badge - EY Design System */
      .kpi-value__variance {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        font-size: 12px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 9999px;
      }

      .kpi-value__variance--positive {
        background: #d1fae5;
        color: #047857;
      }

      .kpi-value__variance--negative {
        background: #fee2e2;
        color: #b91c1c;
      }

      .kpi-label {
        font-size: 13px;
        color: #6b7280;
        margin-top: 4px;
      }

      /* CMD+Click Hint */
      .kpi-hint {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 8px;
        opacity: 0;
        transition: opacity 200ms ease-out;
      }

      .kpi-metric-card:hover .kpi-hint {
        opacity: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiMetricCardComponent {
  @Input() metric!: KpiMetric;
  @Input() loading = false;
  @Input() colorClass: ColorClass = 'default';
  @Input() showCmdHint = true;

  @Output() kpiClick = new EventEmitter<KpiClickEvent>();
  @Output() cmdClick = new EventEmitter<KpiMetric>();

  get isPositive(): boolean {
    return this.metric?.variancePercent !== undefined && this.metric.variancePercent > 0;
  }

  get isNegative(): boolean {
    return this.metric?.variancePercent !== undefined && this.metric.variancePercent < 0;
  }

  formatValue(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  formatVariance(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  onClick(event: MouseEvent): void {
    if (this.loading) return;

    const isCmdClick = event.metaKey || event.altKey;

    if (isCmdClick) {
      event.preventDefault();
      event.stopPropagation();
      this.cmdClick.emit(this.metric);
      return; // Don't emit kpiClick when CMD+Click is used
    }

    this.kpiClick.emit({
      metric: this.metric,
      isCmdClick: false,
    });
  }
}
