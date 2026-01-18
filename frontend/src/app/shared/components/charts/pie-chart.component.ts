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
  ChartEvent,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

export interface PieChartItem {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface PieChartData {
  title: string;
  total: number;
  items: PieChartItem[];
}

export interface PieClickEvent {
  label: string;
  value: number;
  percentage: number;
  index: number;
}

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pie-chart-container" [class.pie-chart-container--loading]="loading">
      @if (loading) {
        <div class="chart-skeleton-pie">
          <div class="skeleton-circle"></div>
        </div>
      } @else {
        <div class="chart-wrapper">
          <canvas #chartCanvas></canvas>
          @if (data) {
            <div class="chart-center">
              <span class="chart-center__value">{{ formatCurrency(data.total) }}</span>
              <span class="chart-center__label">Total</span>
            </div>
          }
        </div>
        @if (data) {
          <div class="chart-legend">
            @for (item of data.items; track item.label) {
              <div class="legend-item" (click)="onLegendClick(item, $index, $event)">
                <div class="legend-color" [style.backgroundColor]="item.color"></div>
                <div class="legend-content">
                  <span class="legend-label">{{ item.label }}</span>
                  <span class="legend-value">{{ item.percentage.toFixed(1) }}%</span>
                </div>
              </div>
            }
          </div>
        }
      }
      @if (sourceDocument) {
        <div class="chart-source">
          Source: {{ sourceDocument }}
        </div>
      }
    </div>
  `,
  styles: [`
    .pie-chart-container {
      position: relative;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .pie-chart-container--loading {
      min-height: 300px;
      justify-content: center;
      align-items: center;
    }

    .chart-skeleton-pie {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 200px;
    }

    .skeleton-circle {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      background: linear-gradient(90deg, #F5F5F5 0%, #E5E5E5 50%, #F5F5F5 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .chart-wrapper {
      position: relative;
      width: 100%;
      height: 220px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    canvas {
      max-width: 220px;
      max-height: 220px;
    }

    .chart-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      pointer-events: none;
    }

    .chart-center__value {
      display: block;
      font-size: 18px;
      font-weight: 700;
      color: #2E2E38;
    }

    .chart-center__label {
      display: block;
      font-size: 12px;
      color: #6B7280;
      margin-top: 2px;
    }

    .chart-legend {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 200ms ease-out;
    }

    .legend-item:hover {
      background: #F5F5F5;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .legend-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .legend-label {
      font-size: 12px;
      color: #2E2E38;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .legend-value {
      font-size: 11px;
      color: #6B7280;
      font-weight: 500;
    }

    .chart-source {
      font-size: 11px;
      color: #9CA3AF;
      font-style: italic;
      text-align: right;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() data: PieChartData | null = null;
  @Input() loading = false;
  @Input() sourceDocument: string | null = null;
  @Input() cmdClickEnabled = true;

  @Output() segmentClick = new EventEmitter<PieClickEvent>();
  @Output() cmdClick = new EventEmitter<PieClickEvent>();

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    if (this.data && !this.loading) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chartCanvas) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  onLegendClick(item: PieChartItem, index: number, event: MouseEvent): void {
    const clickEvent: PieClickEvent = {
      label: item.label,
      value: item.value,
      percentage: item.percentage,
      index,
    };

    if (event.metaKey || event.altKey) {
      event.preventDefault();
      event.stopPropagation();
      this.cmdClick.emit(clickEvent);
      return;
    }

    this.segmentClick.emit(clickEvent);
  }

  private createChart(): void {
    if (!this.chartCanvas || !this.data) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const options: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      animation: {
        duration: 300,
        easing: 'easeOutQuart',
      },
      plugins: {
        legend: {
          display: false,
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
              const item = this.data!.items[context.dataIndex];
              const formatted = this.formatCurrency(item.value);
              return `${formatted} (${item.percentage.toFixed(1)}%)`;
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
      onClick: (event: ChartEvent, elements) => {
        if (elements.length > 0) {
          const element = elements[0];
          const index = element.index;
          const item = this.data!.items[index];

          const clickEvent: PieClickEvent = {
            label: item.label,
            value: item.value,
            percentage: item.percentage,
            index,
          };

          const nativeEvent = event.native as MouseEvent;
          if (nativeEvent && (nativeEvent.metaKey || nativeEvent.altKey)) {
            this.cmdClick.emit(clickEvent);
          } else {
            this.segmentClick.emit(clickEvent);
          }
        }
      },
    };

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: this.data.items.map((i) => i.label),
        datasets: [
          {
            data: this.data.items.map((i) => i.value),
            backgroundColor: this.data.items.map((i) => i.color),
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      },
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
