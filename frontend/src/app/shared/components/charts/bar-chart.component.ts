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
    // Handle data or horizontal changes when canvas is ready
    if ((changes['data'] || changes['horizontal']) && this.chartCanvas) {
      this.updateChart();
    }

    // When loading changes from true to false, canvas just appeared in DOM
    // Need to wait for next tick for ViewChild to resolve
    if (changes['loading'] && !this.loading && this.data) {
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
    if (!this.chartCanvas || !this.data) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Create gradient backgrounds for premium look
    const createGradient = (color: string, index: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      // Parse color and create lighter/darker variants
      if (color === '#FFE600' || color.toLowerCase() === '#ffe600') {
        gradient.addColorStop(0, '#FFE600');
        gradient.addColorStop(1, '#FFD000');
      } else if (color === '#E5E5E5' || color.toLowerCase() === '#e5e5e5') {
        gradient.addColorStop(0, '#F0F0F0');
        gradient.addColorStop(1, '#D4D4D4');
      } else {
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color);
      }
      return gradient;
    };

    const chartData: ChartData<'bar'> = {
      labels: this.data.labels,
      datasets: this.data.datasets.map((ds, i) => {
        const bgColor = Array.isArray(ds.backgroundColor)
          ? ds.backgroundColor.map((c, j) => createGradient(c, j))
          : createGradient(ds.backgroundColor, i);
        return {
          label: ds.label,
          data: ds.data,
          backgroundColor: bgColor,
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: Array.isArray(ds.backgroundColor)
            ? ds.backgroundColor.map(c => c === '#FFE600' ? '#FFD000' : c)
            : (ds.backgroundColor === '#FFE600' ? '#FFD000' : ds.backgroundColor),
        };
      }),
    };

    const options: ChartOptions<'bar'> = {
      indexAxis: this.horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: this.showLegend && this.data.datasets.length > 1,
          position: 'top',
          align: 'end',
          labels: {
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 12,
              weight: 500,
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'rectRounded',
            boxWidth: 8,
            boxHeight: 8,
            color: '#6B7280',
          },
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
          boxPadding: 6,
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
          displayColors: true,
          usePointStyle: true,
          callbacks: {
            title: (items) => items[0]?.label || '',
            label: (context) => {
              const value = context.parsed.y ?? context.parsed.x ?? 0;
              const formatted = new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(value);
              return ` ${context.dataset.label}: ${formatted}`;
            },
            afterBody: () => {
              if (this.cmdClickEnabled) {
                return ['\n⌘+Clic pour plus de détails'];
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
              size: 11,
              weight: 500,
            },
            color: '#9CA3AF',
            padding: 8,
          },
        },
        y: {
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.04)',
            lineWidth: 1,
          },
          border: {
            display: false,
            dash: [4, 4],
          },
          ticks: {
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 11,
              weight: 500,
            },
            color: '#9CA3AF',
            padding: 12,
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
