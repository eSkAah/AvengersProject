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
  ChartOptions,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

/**
 * Interface for a single Gantt chart item
 */
export interface GanttItem {
  engagement_id: string;
  entity_name: string;
  start_date: string;
  due_date: string;
  completion_percent: number;
  risk_level: 'high' | 'medium' | 'low';
  status: string;
  color: string;
}

/**
 * Interface for Gantt chart data
 */
export interface GanttChartData {
  items: GanttItem[];
  min_date: string;
  max_date: string;
  total_engagements: number;
}

/**
 * Gantt Chart Component
 *
 * Displays engagement timelines as a horizontal bar chart.
 * Bars are colored by risk level and show completion percentage.
 */
@Component({
  selector: 'app-gantt-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gantt-chart-container" [class.gantt-chart-container--loading]="loading">
      @if (loading) {
        <div class="chart-skeleton">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row">
              <div class="skeleton-label"></div>
              <div class="skeleton-bar" [style.width.%]="40 + i * 10"></div>
            </div>
          }
        </div>
      } @else if (data && data.items.length > 0) {
        <canvas #chartCanvas></canvas>
      } @else {
        <div class="empty-state">
          <p>No engagements to display</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .gantt-chart-container {
      position: relative;
      width: 100%;
      min-height: 300px;
      max-height: 400px;
    }

    .gantt-chart-container--loading {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 20px;
    }

    .chart-skeleton {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
    }

    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .skeleton-label {
      width: 120px;
      height: 16px;
      background: linear-gradient(90deg, #F5F5F5 0%, #E5E5E5 50%, #F5F5F5 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: 4px;
    }

    .skeleton-bar {
      flex: 1;
      height: 24px;
      background: linear-gradient(90deg, #F5F5F5 0%, #E5E5E5 50%, #F5F5F5 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: 4px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #6B7280;
      font-size: 14px;
    }

    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() data: GanttChartData | null = null;
  @Input() loading = false;

  @Output() barClick = new EventEmitter<GanttItem>();
  @Output() exportRequest = new EventEmitter<void>();

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    if (this.data && !this.loading && this.data.items.length > 0) {
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

  /**
   * Export chart as PNG image
   * @returns Base64 encoded PNG image
   */
  exportToPng(): string | null {
    if (!this.chart) return null;
    return this.chart.toBase64Image('image/png', 1);
  }

  private createChart(): void {
    if (!this.chartCanvas || !this.data || this.data.items.length === 0) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Prepare data for horizontal bar chart
    const labels = this.data.items.map(item => item.entity_name);

    // Calculate duration in days for each engagement
    const durations = this.data.items.map(item => {
      const start = new Date(item.start_date).getTime();
      const end = new Date(item.due_date).getTime();
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    });

    // Calculate offsets (days from min_date to start_date)
    const minDate = new Date(this.data.min_date).getTime();
    const offsets = this.data.items.map(item => {
      const start = new Date(item.start_date).getTime();
      return Math.ceil((start - minDate) / (1000 * 60 * 60 * 24));
    });

    // Create floating bars: [start, end] for each bar
    const barData = this.data.items.map((item, index) => {
      return [offsets[index], offsets[index] + durations[index]];
    });

    // Background colors based on risk level with transparency for incomplete portion
    const backgroundColors = this.data.items.map(item => item.color);

    // Create completion overlay data
    const completionData = this.data.items.map((item, index) => {
      const duration = durations[index];
      const completedDuration = Math.round(duration * (item.completion_percent / 100));
      return [offsets[index], offsets[index] + completedDuration];
    });

    const options: ChartOptions<'bar'> = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 400,
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
            weight: 'bold',
          },
          bodyFont: {
            family: 'Inter',
            size: 12,
          },
          callbacks: {
            title: (items) => {
              if (items.length > 0) {
                const index = items[0].dataIndex;
                return this.data!.items[index].entity_name;
              }
              return '';
            },
            label: (context) => {
              const index = context.dataIndex;
              const item = this.data!.items[index];
              const lines = [
                `Progress: ${item.completion_percent}%`,
                `Risk: ${this.getRiskLabel(item.risk_level)}`,
                `Start: ${this.formatDate(item.start_date)}`,
                `Due: ${this.formatDate(item.due_date)}`,
              ];
              return lines;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          position: 'top',
          grid: {
            color: '#F3F4F6',
          },
          ticks: {
            font: {
              family: 'Inter',
              size: 10,
            },
            color: '#6B7280',
            callback: (value) => {
              // Convert days back to date
              const date = new Date(minDate + (value as number) * 24 * 60 * 60 * 1000);
              return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            },
          },
          title: {
            display: false,
          },
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: 'Inter',
              size: 12,
            },
            color: '#2E2E38',
          },
        },
      },
      onClick: (_event, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          this.barClick.emit(this.data!.items[index]);
        }
      },
    };

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Duration',
            data: barData as any,
            backgroundColor: backgroundColors.map(c => this.hexToRgba(c, 0.3)),
            borderColor: backgroundColors,
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
            barPercentage: 0.6,
          },
          {
            label: 'Completed',
            data: completionData as any,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors,
            borderWidth: 0,
            borderRadius: 4,
            borderSkipped: false,
            barPercentage: 0.6,
          },
        ],
      },
      options,
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    this.destroyChart();
    if (this.data && !this.loading && this.data.items.length > 0) {
      setTimeout(() => this.createChart(), 0);
    }
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private getRiskLabel(risk: string): string {
    const labels: Record<string, string> = {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    };
    return labels[risk] || risk;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
