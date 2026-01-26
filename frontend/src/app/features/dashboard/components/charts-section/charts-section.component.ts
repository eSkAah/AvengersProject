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

// EY Design System Chart Colors
const EY_CHART_COLORS = {
  primary: '#FFE600',    // EY Yellow
  secondary: '#9ca3af',  // Gray
  tertiary: '#2E2E38',   // Dark
  blue: '#3b82f6',
  green: '#10b981',
  orange: '#f59e0b',
  purple: '#8b5cf6',
};

export interface DrillDownEvent {
  chartType: 'assets' | 'comparison' | 'breakdown';
  label: string;
  value: number;
  additionalData?: Record<string, unknown>;
}

// Legend item interface for custom legend component
interface LegendItem {
  label: string;
  color: string;
  colorClass: string;
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
              Assets Breakdown
            </h3>
          </div>

          <!-- Custom Legend - EY Design System -->
          <div class="chart-legend">
            @for (item of assetsLegend; track item.label) {
              <div class="legend-item">
                <span class="legend-dot" [class]="item.colorClass"></span>
                <span class="legend-label">{{ item.label }}</span>
              </div>
            }
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
              YoY Comparison
            </h3>
          </div>

          <!-- Custom Legend - EY Design System -->
          <div class="chart-legend">
            @for (item of comparisonLegend; track item.label) {
              <div class="legend-item">
                <span class="legend-dot" [class]="item.colorClass"></span>
                <span class="legend-label">{{ item.label }}</span>
              </div>
            }
          </div>

          <div class="chart-card__content">
            <app-bar-chart
              [data]="comparisonChartData()"
              [loading]="loadingCharts()"
              [showLegend]="false"
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
              {{ breakdownChart()?.title ?? 'Breakdown' }}
            </h3>
          </div>

          <!-- Custom Legend for Pie Chart - EY Design System -->
          <div class="chart-legend chart-legend--vertical">
            @for (item of breakdownLegend(); track item.label) {
              <div class="legend-item">
                <span class="legend-dot" [style.background]="item.color"></span>
                <span class="legend-label">{{ item.label }}</span>
              </div>
            }
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
    /* EY Design System - Charts Section */
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

    /* EY Design System - Chart Card */
    .chart-card {
      background: #FFFFFF;
      border: 1px solid #E5E5E5;
      border-radius: 12px;
      overflow: hidden;
      transition: all 200ms ease-out;
    }

    .chart-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
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
      min-height: 200px;
      max-height: 250px;
    }

    /* EY Design System - Custom Chart Legend */
    .chart-legend {
      display: flex;
      gap: 16px;
      padding: 12px 20px;
      flex-wrap: wrap;
      border-bottom: 1px solid #F3F4F6;
    }

    .chart-legend--vertical {
      flex-direction: column;
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #6B7280;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    /* EY Color Classes for Legend */
    .legend-dot--yellow {
      background: #FFE600;
    }

    .legend-dot--gray {
      background: #9ca3af;
    }

    .legend-dot--dark {
      background: #2E2E38;
    }

    .legend-dot--blue {
      background: #3b82f6;
    }

    .legend-dot--green {
      background: #10b981;
    }

    .legend-dot--orange {
      background: #f59e0b;
    }

    .legend-dot--purple {
      background: #8b5cf6;
    }

    /* Area chart gradient style */
    .legend-dot--yellow-area {
      background: linear-gradient(180deg, rgba(255, 230, 0, 0.6) 0%, rgba(255, 230, 0, 0.2) 100%);
    }

    .legend-label {
      white-space: nowrap;
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

  // EY Design System - Custom legends
  readonly assetsLegend: LegendItem[] = [
    { label: 'Current Assets', color: EY_CHART_COLORS.primary, colorClass: 'legend-dot--yellow' },
    { label: 'Fixed Assets', color: EY_CHART_COLORS.secondary, colorClass: 'legend-dot--gray' },
  ];

  readonly comparisonLegend: LegendItem[] = [
    { label: 'Current Year', color: EY_CHART_COLORS.primary, colorClass: 'legend-dot--yellow' },
    { label: 'Previous Year', color: EY_CHART_COLORS.secondary, colorClass: 'legend-dot--gray' },
  ];

  // Dynamic legend for breakdown chart
  readonly breakdownLegend = computed<LegendItem[]>(() => {
    const data = this.breakdownChart();
    if (!data) return [];
    return data.items.map((item) => ({
      label: item.label,
      color: item.color || EY_CHART_COLORS.secondary,
      colorClass: '', // Use inline style for dynamic colors
    }));
  });

  readonly assetsChartData = computed<BarChartData | null>(() => {
    const data = this.assetsChart();
    if (!data) return null;

    // Apply EY color palette to datasets
    return {
      labels: data.data.labels,
      datasets: data.data.datasets.map((ds, index) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: index === 0 ? EY_CHART_COLORS.primary : EY_CHART_COLORS.secondary,
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

    // Apply EY color palette: yellow for current year, gray for previous
    return {
      labels: data.labels,
      datasets: datasets.map((ds, index) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: index === 0 ? EY_CHART_COLORS.primary : EY_CHART_COLORS.secondary,
        borderColor: ds.borderColor,
      })),
    };
  });

  readonly breakdownChartData = computed<PieChartData | null>(() => {
    const data = this.breakdownChart();
    if (!data) return null;

    // Use EY-compatible colors for pie segments
    const eyColors = [
      EY_CHART_COLORS.primary,
      EY_CHART_COLORS.tertiary,
      EY_CHART_COLORS.secondary,
      EY_CHART_COLORS.blue,
      EY_CHART_COLORS.green,
      EY_CHART_COLORS.orange,
      EY_CHART_COLORS.purple,
    ];

    return {
      title: data.title,
      total: data.total,
      items: data.items.map((item, index) => ({
        label: item.label,
        value: item.value,
        percentage: item.percentage,
        color: item.color || eyColors[index % eyColors.length],
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
