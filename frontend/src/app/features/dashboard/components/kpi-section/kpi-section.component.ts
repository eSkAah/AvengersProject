import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
  computed,
  OnInit,
  OnChanges,
  SimpleChanges,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  DashboardApiService,
  EngagementStats,
} from '../../../../core/services/dashboard-api.service';
import {
  KpiMetricCardComponent,
  KpiMetric,
  KpiClickEvent,
} from '../../../../shared/components/charts/kpi-metric-card.component';

// EY Design System: KPI Card variants
type KpiCardVariant = 'dark' | 'light' | 'highlight';

interface EnhancedKpiMetric extends KpiMetric {
  variant: KpiCardVariant;
}

@Component({
  selector: 'app-kpi-section',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, KpiMetricCardComponent],
  template: `
    <div class="kpi-section">
      <!-- Section Header -->
      <div class="kpi-section__header">
        <h2 class="kpi-section__title">
          <lucide-icon name="bar-chart-3" [size]="20"></lucide-icon>
          Key Indicators
        </h2>
        @if (stats()) {
          <span class="kpi-section__period">Fiscal Year {{ currentYear }}</span>
        }
      </div>

      <!-- KPI Cards Row - EY Design System -->
      <div class="kpi-row">
        @for (kpi of kpiMetrics(); track kpi.label) {
          <app-kpi-metric-card
            [metric]="kpi"
            [loading]="loading()"
            [colorClass]="getColorClass(kpi)"
            [showCmdHint]="showCmdHint"
            [class]="'kpi-card-wrapper kpi-card-wrapper--' + getVariant(kpi)"
            (kpiClick)="onKpiClick($event)"
            (cmdClick)="onCmdClick($event)"
          ></app-kpi-metric-card>
        }
      </div>

      <!-- Currency Note - EY Design System -->
      @if (stats()) {
        <div class="currency-note">Values in EUR (thousands)</div>
      }
    </div>
  `,
  styles: [
    `
      .kpi-section {
        width: 100%;
      }

      .kpi-section__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .kpi-section__title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #2e2e38;
        margin: 0;
      }

      .kpi-section__period {
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
        padding: 4px 12px;
        background: #f5f5f5;
        border-radius: 9999px;
      }

      /* EY Design System: KPI Row with gap 12px */
      .kpi-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .kpi-card-wrapper {
        flex: 1;
        min-width: 200px;
      }

      /* Apply variant-specific styling through wrapper class */
      .kpi-card-wrapper--dark {
        /* Dark variant styles handled by inner component */
      }

      .kpi-card-wrapper--light {
        /* Light variant styles handled by inner component */
      }

      .kpi-card-wrapper--highlight {
        /* Highlight variant styles handled by inner component */
      }

      /* Currency Note - EY Design System */
      .currency-note {
        margin-top: 12px;
        padding: 8px 16px;
        background: #f3f4f6;
        border-radius: 6px;
        font-size: 12px;
        color: #6b7280;
        text-align: right;
      }

      @media (max-width: 1024px) {
        .kpi-row {
          flex-direction: column;
        }

        .kpi-card-wrapper {
          min-width: 100%;
        }
      }

      @media (min-width: 1280px) {
        .kpi-card-wrapper {
          flex: 1;
          min-width: 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiSectionComponent implements OnInit, OnChanges {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() engagementId: string | null = null;
  @Input() showCmdHint = true;

  @Output() kpiClick = new EventEmitter<KpiClickEvent>();
  @Output() cmdClick = new EventEmitter<KpiMetric>();

  readonly loading = this.dashboardApi.loadingStats;
  readonly stats = this.dashboardApi.currentStats;
  readonly currentYear = new Date().getFullYear();

  readonly kpiMetrics = computed<EnhancedKpiMetric[]>(() => {
    const data = this.stats();
    if (!data) {
      return this.getEmptyKpis();
    }

    return [
      {
        label: 'Total Assets',
        value: data.current_year.total_assets,
        previousValue: data.previous_year?.total_assets,
        variancePercent: data.variance_percent?.total_assets,
        icon: 'trending-up',
        sourceDocument: 'Balance Sheet',
        variant: 'dark', // Primary metric - dark variant
      },
      {
        label: 'Total Liabilities',
        value: data.current_year.total_liabilities,
        previousValue: data.previous_year?.total_liabilities,
        variancePercent: data.variance_percent?.total_liabilities,
        icon: 'trending-down',
        sourceDocument: 'Balance Sheet',
        variant: 'light', // Secondary metric - light variant
      },
      {
        label: 'Equity',
        value: data.current_year.equity,
        previousValue: data.previous_year?.equity,
        variancePercent: data.variance_percent?.equity,
        icon: 'wallet',
        sourceDocument: 'Balance Sheet',
        variant: 'light', // Secondary metric - light variant
      },
      {
        label: 'Revenue',
        value: data.current_year.revenue,
        previousValue: data.previous_year?.revenue,
        variancePercent: data.variance_percent?.revenue,
        icon: 'coins',
        sourceDocument: 'Income Statement',
        variant: this.hasSignificantVariance(data.variance_percent?.revenue)
          ? 'highlight'
          : 'light',
      },
    ];
  });

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['engagementId'] && !changes['engagementId'].firstChange) {
      this.loadData();
    }
  }

  private loadData(): void {
    if (this.engagementId) {
      this.dashboardApi
        .getEngagementStats(this.engagementId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    }
  }

  private getEmptyKpis(): EnhancedKpiMetric[] {
    return [
      { label: 'Total Assets', value: 0, icon: 'trending-up', variant: 'dark' },
      { label: 'Total Liabilities', value: 0, icon: 'trending-down', variant: 'light' },
      { label: 'Equity', value: 0, icon: 'wallet', variant: 'light' },
      { label: 'Revenue', value: 0, icon: 'coins', variant: 'light' },
    ];
  }

  private hasSignificantVariance(variance: number | undefined): boolean {
    if (variance === undefined) return false;
    return Math.abs(variance) > 10; // More than 10% variance is significant
  }

  getVariant(kpi: EnhancedKpiMetric): KpiCardVariant {
    return kpi.variant;
  }

  getColorClass(
    kpi: KpiMetric
  ): 'default' | 'positive' | 'negative' | 'info' | 'warning' | 'accent' {
    if (kpi.variancePercent === undefined) return 'default';
    if (kpi.label === 'Total Liabilities') {
      // For liabilities, decrease is positive
      return kpi.variancePercent < 0
        ? 'positive'
        : kpi.variancePercent > 0
          ? 'negative'
          : 'default';
    }
    // For other metrics, increase is positive
    return kpi.variancePercent > 0 ? 'positive' : kpi.variancePercent < 0 ? 'negative' : 'default';
  }

  onKpiClick(event: KpiClickEvent): void {
    this.kpiClick.emit(event);
  }

  onCmdClick(metric: KpiMetric): void {
    this.cmdClick.emit(metric);
  }
}
