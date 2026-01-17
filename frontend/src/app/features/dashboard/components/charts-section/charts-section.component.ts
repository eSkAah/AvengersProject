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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  DashboardApiService,
  AssetsChartResponse,
  ComparisonChartResponse,
  BreakdownChartResponse,
} from '../../../../core/services/dashboard-api.service';
import {
  BarChartComponent,
  BarChartData,
  ChartClickEvent,
} from '../../../../shared/components/charts/bar-chart.component';
import {
  PieChartComponent,
  PieChartData,
  PieClickEvent,
} from '../../../../shared/components/charts/pie-chart.component';

export interface DrillDownEvent {
  chartType: 'assets' | 'comparison' | 'breakdown';
  label: string;
  value: number;
  additionalData?: Record<string, unknown>;
}

@Component({
  selector: 'app-charts-section',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    BarChartComponent,
    PieChartComponent,
  ],
  template: `
    <div class="charts-section">
      <div class="charts-grid">
        <!-- Assets Bar Chart -->
        <div class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">
              <lucide-icon name="bar-chart-2" [size]="18"></lucide-icon>
              Répartition des Actifs
            </h3>
          </div>
          <div class="chart-card__content">
            <app-bar-chart
              [data]="assetsChartData()"
              [loading]="loadingCharts()"
              [sourceDocument]="assetsChart()?.source_document ?? null"
              [showLegend]="false"
              (barClick)="onAssetsClick($event)"
              (cmdClick)="onAssetsCmdClick($event)"
            ></app-bar-chart>
          </div>
        </div>

        <!-- Comparison Bar Chart (N vs N-1) -->
        <div class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">
              <lucide-icon name="git-compare" [size]="18"></lucide-icon>
              Comparaison N / N-1
            </h3>
          </div>
          <div class="chart-card__content">
            <app-bar-chart
              [data]="comparisonChartData()"
              [loading]="loadingCharts()"
              [showLegend]="true"
              (barClick)="onComparisonClick($event)"
              (cmdClick)="onComparisonCmdClick($event)"
            ></app-bar-chart>
          </div>
        </div>

        <!-- Breakdown Pie Chart -->
        <div class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">
              <lucide-icon name="pie-chart" [size]="18"></lucide-icon>
              {{ breakdownChart()?.title ?? 'Répartition' }}
            </h3>
          </div>
          <div class="chart-card__content">
            <app-pie-chart
              [data]="breakdownChartData()"
              [loading]="loadingCharts()"
              [sourceDocument]="breakdownChart()?.source_document ?? null"
              (segmentClick)="onBreakdownClick($event)"
              (cmdClick)="onBreakdownCmdClick($event)"
            ></app-pie-chart>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .charts-section {
      width: 100%;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 24px;
    }

    @media (min-width: 1280px) {
      .charts-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .chart-card {
      background: #FFFFFF;
      border: 1px solid #E5E5E5;
      border-radius: 12px;
      overflow: hidden;
    }

    .chart-card__header {
      padding: 16px 20px;
      border-bottom: 1px solid #F3F4F6;
    }

    .chart-card__title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #2E2E38;
      margin: 0;
    }

    .chart-card__content {
      padding: 20px;
      min-height: 300px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartsSectionComponent implements OnInit, OnChanges {
  private readonly dashboardApi = inject(DashboardApiService);

  @Input() engagementId: string | null = null;

  @Output() drillDown = new EventEmitter<DrillDownEvent>();
  @Output() cmdClick = new EventEmitter<DrillDownEvent>();

  readonly loadingCharts = this.dashboardApi.loadingCharts;
  readonly assetsChart = this.dashboardApi.assetsChart;
  readonly comparisonChart = this.dashboardApi.comparisonChart;
  readonly breakdownChart = this.dashboardApi.breakdownChart;

  readonly assetsChartData = computed<BarChartData | null>(() => {
    const data = this.assetsChart();
    if (!data) return null;
    return {
      labels: data.data.labels,
      datasets: data.data.datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.backgroundColor ?? '#6B7280',
        borderColor: ds.borderColor,
        borderWidth: ds.borderWidth,
      })),
    };
  });

  readonly comparisonChartData = computed<BarChartData | null>(() => {
    const data = this.comparisonChart();
    if (!data) return null;

    const datasets = [data.current_year];
    if (data.previous_year) {
      datasets.push(data.previous_year);
    }

    return {
      labels: data.labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.backgroundColor,
        borderColor: ds.borderColor,
      })),
    };
  });

  readonly breakdownChartData = computed<PieChartData | null>(() => {
    const data = this.breakdownChart();
    if (!data) return null;

    return {
      title: data.title,
      total: data.total,
      items: data.items.map((item) => ({
        label: item.label,
        value: item.value,
        percentage: item.percentage,
        color: item.color,
      })),
    };
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
      this.dashboardApi.loadDashboardData(this.engagementId);
    }
  }

  onAssetsClick(event: ChartClickEvent): void {
    this.drillDown.emit({
      chartType: 'assets',
      label: event.label,
      value: event.value,
      additionalData: { datasetLabel: event.datasetLabel, index: event.index },
    });
  }

  onAssetsCmdClick(event: ChartClickEvent): void {
    this.cmdClick.emit({
      chartType: 'assets',
      label: event.label,
      value: event.value,
      additionalData: { datasetLabel: event.datasetLabel, index: event.index },
    });
  }

  onComparisonClick(event: ChartClickEvent): void {
    this.drillDown.emit({
      chartType: 'comparison',
      label: event.label,
      value: event.value,
      additionalData: { datasetLabel: event.datasetLabel, index: event.index },
    });
  }

  onComparisonCmdClick(event: ChartClickEvent): void {
    this.cmdClick.emit({
      chartType: 'comparison',
      label: event.label,
      value: event.value,
      additionalData: { datasetLabel: event.datasetLabel, index: event.index },
    });
  }

  onBreakdownClick(event: PieClickEvent): void {
    this.drillDown.emit({
      chartType: 'breakdown',
      label: event.label,
      value: event.value,
      additionalData: { percentage: event.percentage, index: event.index },
    });
  }

  onBreakdownCmdClick(event: PieClickEvent): void {
    this.cmdClick.emit({
      chartType: 'breakdown',
      label: event.label,
      value: event.value,
      additionalData: { percentage: event.percentage, index: event.index },
    });
  }
}
