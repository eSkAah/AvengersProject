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
import {
  Chart,
  ChartConfiguration,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components for bar chart
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Re-export the same interface for compatibility
export interface StackedBarDataPoint {
  date: string;
  notStarted: number;
  inProgress: number;
  reviewing: number;
  completed: number;
}

@Component({
  selector: 'app-stacked-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stacked-bar-container" [class.stacked-bar-container--loading]="loading">
      @if (loading) {
        <div class="chart-skeleton">
          <div class="skeleton-bars">
            @for (bar of skeletonBars; track bar) {
              <div class="skeleton-bar"></div>
            }
          </div>
        </div>
      } @else {
        <div class="chart-wrapper">
          <canvas #chartCanvas></canvas>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .stacked-bar-container {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .stacked-bar-container--loading {
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
      padding: 0 20px 40px;
    }

    .skeleton-bars {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      gap: 8px;
    }

    .skeleton-bar {
      flex: 1;
      max-width: 40px;
      height: 60%;
      border-radius: 4px 4px 0 0;
      background: linear-gradient(90deg, #F5F5F5 0%, #E5E5E5 50%, #F5F5F5 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    .skeleton-bar:nth-child(1) { height: 30%; }
    .skeleton-bar:nth-child(2) { height: 45%; }
    .skeleton-bar:nth-child(3) { height: 55%; }
    .skeleton-bar:nth-child(4) { height: 70%; }
    .skeleton-bar:nth-child(5) { height: 85%; }
    .skeleton-bar:nth-child(6) { height: 95%; }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .chart-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StackedBarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() data: StackedBarDataPoint[] = [];
  @Input() loading = false;

  private chart: Chart | null = null;

  // Skeleton placeholder bars
  readonly skeletonBars = [1, 2, 3, 4, 5, 6];

  // Status colors matching the EY design system
  private readonly colors = {
    completed: '#10B981',    // Green
    reviewing: '#F59E0B',    // Amber
    inProgress: '#3B82F6',   // Blue
    notStarted: '#E5E7EB',   // Gray
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

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          // Order: bottom to top in the stack (Completed at bottom, Not Started at top)
          {
            label: 'Completed',
            data: this.data.map(d => d.completed),
            backgroundColor: this.colors.completed,
            borderColor: this.colors.completed,
            borderWidth: 0,
            borderRadius: {
              topLeft: 0,
              topRight: 0,
              bottomLeft: 4,
              bottomRight: 4,
            },
            borderSkipped: false,
          },
          {
            label: 'Reviewing',
            data: this.data.map(d => d.reviewing),
            backgroundColor: this.colors.reviewing,
            borderColor: this.colors.reviewing,
            borderWidth: 0,
            borderRadius: 0,
            borderSkipped: false,
          },
          {
            label: 'In Progress',
            data: this.data.map(d => d.inProgress),
            backgroundColor: this.colors.inProgress,
            borderColor: this.colors.inProgress,
            borderWidth: 0,
            borderRadius: 0,
            borderSkipped: false,
          },
          {
            label: 'Not Started',
            data: this.data.map(d => d.notStarted),
            backgroundColor: this.colors.notStarted,
            borderColor: '#D1D5DB',
            borderWidth: 0,
            borderRadius: {
              topLeft: 4,
              topRight: 4,
              bottomLeft: 0,
              bottomRight: 0,
            },
            borderSkipped: false,
          },
        ],
      },
      options: {
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
        scales: {
          x: {
            stacked: true,
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
            beginAtZero: true,
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
              precision: 0,
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
              pointStyle: 'rectRounded',
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
              title: (items) => items[0]?.label ?? '',
              label: (context) => {
                const label = context.dataset.label ?? '';
                const value = context.parsed.y;
                return ` ${label}: ${value} ${value === 1 ? 'entity' : 'entities'}`;
              },
              afterBody: (items) => {
                const total = items.reduce((sum, item) => sum + (item.parsed.y || 0), 0);
                return `\nTotal: ${total} ${total === 1 ? 'entity' : 'entities'}`;
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
