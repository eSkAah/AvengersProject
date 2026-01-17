import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartEvent,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface ChartClickEvent {
  label: string;
  value: number;
  datasetLabel: string;
  index: number;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bar-chart-container" [class.bar-chart-container--loading]="loading">
      @if (loading) {
        <div class="chart-skeleton">
          <div class="skeleton-bar" style="height: 60%"></div>
          <div class="skeleton-bar" style="height: 80%"></div>
          <div class="skeleton-bar" style="height: 45%"></div>
          <div class="skeleton-bar" style="height: 70%"></div>
        </div>
      } @else {
        <canvas #chartCanvas></canvas>
      }
      @if (sourceDocument) {
        <div class="chart-source">
          Source: {{ sourceDocument }}
        </div>
      }
    </div>
  `,
  styles: [`
    .bar-chart-container {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 250px;
    }

    .bar-chart-container--loading {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 20px;
    }

    .chart-skeleton {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      width: 100%;
      height: 200px;
    }

    .skeleton-bar {
      flex: 1;
      background: linear-gradient(90deg, #F5F5F5 0%, #E5E5E5 50%, #F5F5F5 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: 4px 4px 0 0;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .chart-source {
      position: absolute;
      bottom: 4px;
      right: 8px;
      font-size: 11px;
      color: #9CA3AF;
      font-style: italic;
    }

    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() data: BarChartData | null = null;
  @Input() horizontal = false;
  @Input() loading = false;
  @Input() sourceDocument: string | null = null;
  @Input() showLegend = true;
  @Input() cmdClickEnabled = true;

  @Output() barClick = new EventEmitter<ChartClickEvent>();
  @Output() cmdClick = new EventEmitter<ChartClickEvent>();

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    if (this.data && !this.loading) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['data'] || changes['horizontal']) && this.chartCanvas) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private createChart(): void {
    if (!this.chartCanvas || !this.data) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const chartData: ChartData<'bar'> = {
      labels: this.data.labels,
      datasets: this.data.datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.backgroundColor,
        borderColor: ds.borderColor || ds.backgroundColor,
        borderWidth: ds.borderWidth || 1,
        borderRadius: 4,
      })),
    };

    const options: ChartOptions<'bar'> = {
      indexAxis: this.horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 300,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: {
          display: this.showLegend && this.data.datasets.length > 1,
          position: 'top',
          labels: {
            font: {
              family: 'Inter',
              size: 12,
            },
            padding: 16,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: '#FFFFFF',
          titleColor: '#2E2E38',
          bodyColor: '#6B7280',
          borderColor: '#E5E5E5',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            family: 'Inter',
            size: 13,
            weight: 600,
          },
          bodyFont: {
            family: 'Inter',
            size: 12,
          },
          callbacks: {
            label: (context) => {
              const value = context.parsed.y ?? context.parsed.x ?? 0;
              const formatted = new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(value);
              return `${context.dataset.label}: ${formatted}`;
            },
            afterLabel: () => {
              if (this.cmdClickEnabled) {
                return '⌘+Click pour demander à Eve';
              }
              return '';
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: !this.horizontal,
            color: '#F3F4F6',
          },
          ticks: {
            font: {
              family: 'Inter',
              size: 11,
            },
            color: '#6B7280',
          },
        },
        y: {
          grid: {
            display: this.horizontal,
            color: '#F3F4F6',
          },
          ticks: {
            font: {
              family: 'Inter',
              size: 11,
            },
            color: '#6B7280',
            callback: (value) => {
              if (typeof value === 'number') {
                return new Intl.NumberFormat('fr-FR', {
                  notation: 'compact',
                  maximumFractionDigits: 1,
                }).format(value);
              }
              return value;
            },
          },
        },
      },
      onClick: (event: ChartEvent, elements) => {
        if (elements.length > 0) {
          const element = elements[0];
          const datasetIndex = element.datasetIndex;
          const index = element.index;
          const dataset = this.data!.datasets[datasetIndex];
          const label = this.data!.labels[index];
          const value = dataset.data[index];

          const clickEvent: ChartClickEvent = {
            label,
            value,
            datasetLabel: dataset.label,
            index,
          };

          // Check if CMD (Mac) or ALT (Windows) key is pressed
          const nativeEvent = event.native as MouseEvent;
          if (nativeEvent && (nativeEvent.metaKey || nativeEvent.altKey)) {
            this.cmdClick.emit(clickEvent);
          } else {
            this.barClick.emit(clickEvent);
          }
        }
      },
    };

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: chartData,
      options,
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    this.destroyChart();
    if (this.data && !this.loading) {
      setTimeout(() => this.createChart(), 0);
    }
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
