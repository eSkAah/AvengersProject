import {
  Component,
  Input,
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
  LineController,
  LineElement,
  PointElement,
  Filler,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  Filler,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export interface StackedAreaDataPoint {
  date: string;
  notStarted: number;
  inProgress: number;
  reviewing: number;
  completed: number;
}

@Component({
  selector: 'app-stacked-area-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stacked-area-container" [class.stacked-area-container--loading]="loading">
      @if (loading) {
        <div class="chart-skeleton">
          <div class="skeleton-rect"></div>
        </div>
      } @else {
        <div class="chart-wrapper">
          <canvas #chartCanvas></canvas>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .stacked-area-container {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .stacked-area-container--loading {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }

      .chart-skeleton {
        width: 100%;
        height: 200px;
        display: flex;
        align-items: flex-end;
        padding: 0 20px;
      }

      .skeleton-rect {
        width: 100%;
        height: 80%;
        border-radius: 8px;
        background: linear-gradient(90deg, #f5f5f5 0%, #e5e5e5 50%, #f5f5f5 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      .chart-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StackedAreaChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() data: StackedAreaDataPoint[] = [];
  @Input() loading = false;

  private chart: Chart | null = null;

  // Status colors matching the design system
  private readonly colors = {
    completed: '#10B981', // Green
    reviewing: '#F59E0B', // Yellow/Amber
    inProgress: '#3B82F6', // Blue
    notStarted: '#E5E7EB', // Gray
  };

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

    const labels = this.data.map(d => d.date);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          // Order: bottom to top for stacking
          {
            label: 'Completed',
            data: this.data.map(d => d.completed),
            backgroundColor: this.hexToRgba(this.colors.completed, 0.8),
            borderColor: this.colors.completed,
            borderWidth: 2,
            fill: 'origin',
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: this.colors.completed,
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 2,
          },
          {
            label: 'Reviewing',
            data: this.data.map(d => d.reviewing),
            backgroundColor: this.hexToRgba(this.colors.reviewing, 0.8),
            borderColor: this.colors.reviewing,
            borderWidth: 2,
            fill: '-1',
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: this.colors.reviewing,
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 2,
          },
          {
            label: 'In Progress',
            data: this.data.map(d => d.inProgress),
            backgroundColor: this.hexToRgba(this.colors.inProgress, 0.8),
            borderColor: this.colors.inProgress,
            borderWidth: 2,
            fill: '-1',
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: this.colors.inProgress,
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 2,
          },
          {
            label: 'Not Started',
            data: this.data.map(d => d.notStarted),
            backgroundColor: this.hexToRgba(this.colors.notStarted, 0.8),
            borderColor: '#D1D5DB',
            borderWidth: 2,
            fill: '-1',
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: this.colors.notStarted,
            pointHoverBorderColor: '#FFFFFF',
            pointHoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart',
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 11,
                family: "'Inter', system-ui, sans-serif",
              },
              color: '#9CA3AF',
              maxRotation: 0,
            },
            border: {
              display: false,
            },
          },
          y: {
            stacked: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.04)',
            },
            ticks: {
              font: {
                size: 11,
                family: "'Inter', system-ui, sans-serif",
              },
              color: '#9CA3AF',
              stepSize: 1,
            },
            border: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16,
              font: {
                size: 12,
                family: "'Inter', system-ui, sans-serif",
              },
              color: '#4B5563',
            },
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            titleColor: '#1F2937',
            bodyColor: '#4B5563',
            borderColor: 'rgba(0, 0, 0, 0.08)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 13,
              weight: 'bold',
              family: "'Inter', system-ui, sans-serif",
            },
            bodyFont: {
              size: 12,
              family: "'Inter', system-ui, sans-serif",
            },
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              title: items => items[0]?.label ?? '',
              label: context => {
                const label = context.dataset.label ?? '';
                const value = context.parsed.y;
                return ` ${label}: ${value} ${value === 1 ? 'entity' : 'entities'}`;
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
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

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
