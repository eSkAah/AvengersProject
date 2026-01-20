import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  CtrResults,
  CtrResultDocument,
  CtrTaxData,
  EtrAdjustment,
} from '../../../../core/models/engagement.model';
import {
  KpiMetricCardComponent,
  WaterfallChartComponent,
  WaterfallDataPoint,
  WaterfallClickEvent,
  PieChartComponent,
  PieChartData,
  PieClickEvent,
  BarChartComponent,
  BarChartData,
  ChartClickEvent,
  BadgeComponent,
} from '../../../../shared';

export interface ResultsKpiClickEvent {
  metric: string;
  value: number;
  label: string;
}

@Component({
  selector: 'app-results-tab',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    KpiMetricCardComponent,
    WaterfallChartComponent,
    PieChartComponent,
    BarChartComponent,
    BadgeComponent,
  ],
  templateUrl: './results-tab.component.html',
  styleUrl: './results-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsTabComponent {
  @Input() ctrResults: CtrResults | null = null;
  @Input() entityName = '';

  @Output() downloadDocument = new EventEmitter<CtrResultDocument>();
  @Output() previewDocument = new EventEmitter<CtrResultDocument>();
  @Output() kpiClick = new EventEmitter<ResultsKpiClickEvent>();
  @Output() cmdClick = new EventEmitter<ResultsKpiClickEvent>();

  // Computed: CTR documents
  readonly documents = computed(() => this.ctrResults?.documents ?? []);

  // Computed: Tax data
  readonly taxData = computed(() => this.ctrResults?.taxData ?? null);

  // Computed: Waterfall chart data from ETR adjustments
  readonly waterfallData = computed<WaterfallDataPoint[]>(() => {
    const data = this.taxData();
    if (!data) return [];

    const adjustments = data.etrAdjustments;
    const result: WaterfallDataPoint[] = [];

    // First bar: Statutory Rate
    result.push({
      label: 'Statutory Rate',
      value: data.statutoryRate,
      description: 'Starting corporate tax rate',
      isTotal: true,
    });

    // Intermediate adjustments (skip first which is statutory)
    adjustments.slice(1).forEach((adj) => {
      result.push({
        label: adj.label,
        value: adj.value,
        description: adj.description,
      });
    });

    // Final bar: Effective Rate
    result.push({
      label: 'Effective Rate',
      value: data.effectiveRate,
      description: 'Final effective tax rate',
      isTotal: true,
    });

    return result;
  });

  // Computed: Current vs Deferred Tax pie chart
  readonly taxSplitData = computed<PieChartData | null>(() => {
    const data = this.taxData();
    if (!data) return null;

    const total = data.currentTax + data.deferredTax;
    return {
      title: 'Tax Expense Split',
      total,
      items: [
        {
          label: 'Current Tax',
          value: data.currentTax,
          percentage: (data.currentTax / total) * 100,
          color: '#FFE600',
        },
        {
          label: 'Deferred Tax',
          value: data.deferredTax,
          percentage: (data.deferredTax / total) * 100,
          color: '#2E2E38',
        },
      ],
    };
  });

  // Computed: Tax by Category bar chart
  readonly taxByCategoryData = computed<BarChartData | null>(() => {
    const data = this.taxData();
    if (!data) return null;

    return {
      labels: data.taxByCategory.map((c) => c.category),
      datasets: [
        {
          label: 'Tax Amount',
          data: data.taxByCategory.map((c) => c.amount),
          backgroundColor: '#FFE600',
        },
      ],
    };
  });

  // Format currency helper
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  // Format date
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Document icon
  getDocumentIcon(type: 'pdf' | 'xml'): string {
    return type === 'pdf' ? 'file-text' : 'file-code';
  }

  // Event handlers
  onDownload(doc: CtrResultDocument): void {
    this.downloadDocument.emit(doc);
  }

  onPreview(doc: CtrResultDocument): void {
    this.previewDocument.emit(doc);
  }

  onKpiClick(metric: string, value: number, label: string): void {
    this.kpiClick.emit({ metric, value, label });
  }

  onKpiCmdClick(metric: string, value: number, label: string, event: MouseEvent): void {
    if (event.metaKey || event.altKey) {
      this.cmdClick.emit({ metric, value, label });
    }
  }

  onWaterfallClick(event: WaterfallClickEvent): void {
    this.kpiClick.emit({
      metric: 'etr_adjustment',
      value: event.value,
      label: event.label,
    });
  }

  onWaterfallCmdClick(event: WaterfallClickEvent): void {
    this.cmdClick.emit({
      metric: 'etr_adjustment',
      value: event.value,
      label: event.label,
    });
  }

  onChartClick(event: ChartClickEvent, chartType: string): void {
    this.kpiClick.emit({
      metric: chartType,
      value: event.value,
      label: event.label,
    });
  }

  onChartCmdClick(event: ChartClickEvent, chartType: string): void {
    this.cmdClick.emit({
      metric: chartType,
      value: event.value,
      label: event.label,
    });
  }

  onPieClick(event: PieClickEvent, chartType: string): void {
    this.kpiClick.emit({
      metric: chartType,
      value: event.value,
      label: event.label,
    });
  }

  onPieCmdClick(event: PieClickEvent, chartType: string): void {
    this.cmdClick.emit({
      metric: chartType,
      value: event.value,
      label: event.label,
    });
  }
}
