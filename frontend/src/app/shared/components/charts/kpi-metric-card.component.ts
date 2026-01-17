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
            <div class="kpi-hint">⌘+Click pour demander à Eve</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .kpi-metric-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: #FFFFFF;
      border: 1px solid #E5E5E5;
      border-radius: 12px;
      cursor: pointer;
      transition: all 200ms ease-out;
    }

    .kpi-metric-card:hover {
      border-color: #D4D4D4;
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
      background: linear-gradient(90deg, #F5F5F5 0%, #E5E5E5 50%, #F5F5F5 100%);
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
      background: linear-gradient(90deg, #F5F5F5 0%, #E5E5E5 50%, #F5F5F5 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    .skeleton-label {
      height: 16px;
      width: 80px;
      border-radius: 4px;
      background: linear-gradient(90deg, #F5F5F5 0%, #E5E5E5 50%, #F5F5F5 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      flex-shrink: 0;
    }

    .kpi-icon--default {
      background: #F5F5F5;
      color: #6B7280;
    }

    .kpi-icon--positive {
      background: #D1FAE5;
      color: #047857;
    }

    .kpi-icon--negative {
      background: #FEE2E2;
      color: #B91C1C;
    }

    .kpi-icon--info {
      background: #DBEAFE;
      color: #1D4ED8;
    }

    .kpi-icon--warning {
      background: #FEF3C7;
      color: #B45309;
    }

    .kpi-icon--accent {
      background: #FFF9CC;
      color: #2E2E38;
    }

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
      color: #2E2E38;
      line-height: 1.2;
    }

    .kpi-value__variance {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 13px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 9999px;
    }

    .kpi-value__variance--positive {
      background: #D1FAE5;
      color: #047857;
    }

    .kpi-value__variance--negative {
      background: #FEE2E2;
      color: #B91C1C;
    }

    .kpi-label {
      font-size: 13px;
      color: #6B7280;
      margin-top: 4px;
    }

    .kpi-hint {
      font-size: 11px;
      color: #9CA3AF;
      margin-top: 8px;
      opacity: 0;
      transition: opacity 200ms ease-out;
    }

    .kpi-metric-card:hover .kpi-hint {
      opacity: 1;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiMetricCardComponent {
  @Input() metric!: KpiMetric;
  @Input() loading = false;
  @Input() colorClass: 'default' | 'positive' | 'negative' | 'info' | 'warning' | 'accent' = 'default';
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
    return new Intl.NumberFormat('fr-FR', {
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
      this.cmdClick.emit(this.metric);
    }

    this.kpiClick.emit({
      metric: this.metric,
      isCmdClick,
    });
  }
}
