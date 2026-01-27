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
import { CHART_RENDER_DELAY_MS } from '../../../core/constants';
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

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export interface WaterfallDataPoint {
  label: string;
  value: number;
  description?: string;
  isTotal?: boolean;
}

export interface WaterfallClickEvent {
  label: string;
  value: number;
  description: string;
  index: number;
}

@Component({
  selector: 'app-waterfall-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="waterfall-chart-container" [class.waterfall-chart-container--loading]="loading">
      @if (loading) {
        <div class="chart-skeleton">
          <div class="skeleton-bar skeleton-bar--start" style="height: 80%"></div>
          <div class="skeleton-bar skeleton-bar--negative" style="height: 20%"></div>
          <div class="skeleton-bar skeleton-bar--positive" style="height: 15%"></div>
          <div class="skeleton-bar skeleton-bar--negative" style="height: 25%"></div>
          <div class="skeleton-bar skeleton-bar--end" style="height: 70%"></div>
        </div>
      } @else {
        <canvas #chartCanvas></canvas>
      }
    </div>
  `,
  styles: [
    `
      .waterfall-chart-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 280px;
      }

      .waterfall-chart-container--loading {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 20px;
      }

      .chart-skeleton {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        width: 100%;
        height: 220px;
      }

      .skeleton-bar {
        flex: 1;
        background: linear-gradient(90deg, #f5f5f5 0%, #e5e5e5 50%, #f5f5f5 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
        border-radius: 4px;

        &--start,
        &--end {
          background: linear-gradient(90deg, #fff9cc 0%, #ffe600 50%, #fff9cc 100%);
        }

        &--positive {
          background: linear-gradient(90deg, #dcfce7 0%, #22c55e 50%, #dcfce7 100%);
        }

        &--negative {
          background: linear-gradient(90deg, #fee2e2 0%, #ef4444 50%, #fee2e2 100%);
        }
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      canvas {
        width: 100% !important;
        height: 100% !important;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaterfallChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() data: WaterfallDataPoint[] = [];
  @Input() loading = false;
  @Input() cmdClickEnabled = true;
  @Input() unit = '%';

  @Output() barClick = new EventEmitter<WaterfallClickEvent>();
  @Output() cmdClick = new EventEmitter<WaterfallClickEvent>();

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    if (this.data.length > 0 && !this.loading) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chartCanvas) {
      this.updateChart();
    }

    if (changes['loading'] && !this.loading && this.data.length > 0) {
      setTimeout(() => {
        if (this.chartCanvas && !this.chart) {
          this.createChart();
        }
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private createChart(): void {
    if (!this.chartCanvas || this.data.length === 0) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Calculate waterfall positions
    const { datasets, colors, runningTotal } = this.calculateWaterfallData();

    const chartData: ChartData<'bar'> = {
      labels: this.data.map(d => d.label),
      datasets: [
        {
          label: 'ETR Reconciliation',
          data: datasets,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.85', '1')),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          titleColor: '#1F2937',
          bodyColor: '#4B5563',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          borderWidth: 1,
          padding: { top: 12, bottom: 12, left: 16, right: 16 },
          cornerRadius: 12,
          titleFont: {
            family: 'Inter, system-ui, sans-serif',
            size: 13,
            weight: 600,
          },
          bodyFont: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: 400,
          },
          callbacks: {
            title: items => {
              const idx = items[0]?.dataIndex ?? 0;
              return this.data[idx]?.label || '';
            },
            label: context => {
              const idx = context.dataIndex;
              const item = this.data[idx];
              const value = item.value;
              const sign = value > 0 && !item.isTotal ? '+' : '';
              return ` ${sign}${value.toFixed(1)}${this.unit}`;
            },
            afterLabel: context => {
              const idx = context.dataIndex;
              const item = this.data[idx];
              if (item.description) {
                return item.description;
              }
              return '';
            },
            afterBody: () => {
              if (this.cmdClickEnabled) {
                return ['\nCmd+Click to Ask Eve'];
              }
              return [];
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 10,
              weight: 500,
            },
            color: '#6B7280',
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          min: 0,
          max: Math.max(...runningTotal) * 1.1,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.04)',
          },
          border: {
            display: false,
          },
          ticks: {
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 11,
              weight: 500,
            },
            color: '#9CA3AF',
            callback: value => `${value}${this.unit}`,
          },
        },
      },
      onClick: (event: ChartEvent, elements) => {
        if (elements.length > 0) {
          const element = elements[0];
          const index = element.index;
          const item = this.data[index];

          const clickEvent: WaterfallClickEvent = {
            label: item.label,
            value: item.value,
            description: item.description || '',
            index,
          };

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

  private calculateWaterfallData(): {
    datasets: [number, number][];
    colors: string[];
    runningTotal: number[];
  } {
    const datasets: [number, number][] = [];
    const colors: string[] = [];
    const runningTotal: number[] = [];
    let running = 0;

    this.data.forEach((item, index) => {
      if (index === 0 || item.isTotal) {
        // Starting or ending total - full bar from 0
        datasets.push([0, item.value]);
        colors.push('rgba(255, 230, 0, 0.85)'); // EY Yellow
        running = item.value;
      } else {
        // Intermediate adjustment
        const start = running;
        const end = running + item.value;
        if (item.value >= 0) {
          datasets.push([start, end]);
          colors.push('rgba(239, 68, 68, 0.85)'); // Red for increases
        } else {
          datasets.push([end, start]);
          colors.push('rgba(34, 197, 94, 0.85)'); // Green for decreases
        }
        running = end;
      }
      runningTotal.push(running);
    });

    return { datasets, colors, runningTotal };
  }

  private updateChart(): void {
    this.destroyChart();
    if (this.data.length > 0 && !this.loading) {
      setTimeout(() => this.createChart(), CHART_RENDER_DELAY_MS);
    }
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
