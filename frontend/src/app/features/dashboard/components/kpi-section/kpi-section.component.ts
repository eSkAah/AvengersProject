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

@Component({
  selector: 'app-kpi-section',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, KpiMetricCardComponent],
  template: `
    <div class="kpi-section">
      <div class="kpi-section__header">
        <h2 class="kpi-section__title">
          <lucide-icon name="bar-chart-3" [size]="20"></lucide-icon>
          Indicateurs Clés
        </h2>
        @if (stats()) {
          <span class="kpi-section__period">Exercice {{ currentYear }}</span>
        }
      </div>

      <div class="kpi-grid">
        @for (kpi of kpiMetrics(); track kpi.label) {
          <app-kpi-metric-card
            [metric]="kpi"
            [loading]="loading()"
            [colorClass]="getColorClass(kpi)"
            [showCmdHint]="showCmdHint"
            (kpiClick)="onKpiClick($event)"
            (cmdClick)="onCmdClick($event)"
          ></app-kpi-metric-card>
        }
      </div>
    </div>
  `,
  styles: [`
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
      color: #2E2E38;
      margin: 0;
    }

    .kpi-section__period {
      font-size: 13px;
      color: #6B7280;
      padding: 4px 12px;
      background: #F5F5F5;
      border-radius: 9999px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    @media (min-width: 1024px) {
      .kpi-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  `],
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

  readonly kpiMetrics = computed<KpiMetric[]>(() => {
    const data = this.stats();
    if (!data) {
      return this.getEmptyKpis();
    }

    return [
      {
        label: 'Total Actifs',
        value: data.current_year.total_assets,
        previousValue: data.previous_year?.total_assets,
        variancePercent: data.variance_percent?.total_assets,
        icon: 'trending-up',
        sourceDocument: 'Bilan comptable',
      },
      {
        label: 'Total Passifs',
        value: data.current_year.total_liabilities,
        previousValue: data.previous_year?.total_liabilities,
        variancePercent: data.variance_percent?.total_liabilities,
        icon: 'trending-down',
        sourceDocument: 'Bilan comptable',
      },
      {
        label: 'Capitaux Propres',
        value: data.current_year.equity,
        previousValue: data.previous_year?.equity,
        variancePercent: data.variance_percent?.equity,
        icon: 'wallet',
        sourceDocument: 'Bilan comptable',
      },
      {
        label: 'Chiffre d\'Affaires',
        value: data.current_year.revenue,
        previousValue: data.previous_year?.revenue,
        variancePercent: data.variance_percent?.revenue,
        icon: 'coins',
        sourceDocument: 'Compte de résultat',
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

  private getEmptyKpis(): KpiMetric[] {
    return [
      { label: 'Total Actifs', value: 0, icon: 'trending-up' },
      { label: 'Total Passifs', value: 0, icon: 'trending-down' },
      { label: 'Capitaux Propres', value: 0, icon: 'wallet' },
      { label: 'Chiffre d\'Affaires', value: 0, icon: 'coins' },
    ];
  }

  getColorClass(kpi: KpiMetric): 'default' | 'positive' | 'negative' | 'info' | 'warning' | 'accent' {
    if (kpi.variancePercent === undefined) return 'default';
    if (kpi.label === 'Total Passifs') {
      // For liabilities, decrease is positive
      return kpi.variancePercent < 0 ? 'positive' : kpi.variancePercent > 0 ? 'negative' : 'default';
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
