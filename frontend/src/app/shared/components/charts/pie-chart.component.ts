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
          <div #tooltipEl class="chartjs-tooltip"></div>
          @if (data) {
            <div class="chart-center">
              <span class="chart-center__value">{{ formatValue(data.total) }}</span>
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
        <div class="chart-source">Source: {{ sourceDocument }}</div>
      }
    </div>
  `,
  styles: [
    `
      .pie-chart-container {
        position: relative;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 20px;
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
        height: 200px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      canvas {
        max-width: 200px;
        max-height: 200px;
        filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08));
      }

      .chart-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        pointer-events: none;
        z-index: 1;
      }

      .chart-wrapper canvas {
        position: relative;
        z-index: 2;
      }

      /* External tooltip styling */
      :host ::ng-deep .chartjs-tooltip {
        position: absolute;
        z-index: 100;
        background: rgba(255, 255, 255, 0.98);
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 12px;
        padding: 12px 16px;
        pointer-events: none;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        font-family: 'Inter', system-ui, sans-serif;
        transition: all 150ms ease;
        opacity: 0;
      }

      :host ::ng-deep .chartjs-tooltip.active {
        opacity: 1;
      }

      :host ::ng-deep .chartjs-tooltip-title {
        font-size: 13px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      :host ::ng-deep .chartjs-tooltip-body {
        font-size: 12px;
        color: #4b5563;
      }

      :host ::ng-deep .chartjs-tooltip-body-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      :host ::ng-deep .chartjs-tooltip-color {
        width: 10px;
        height: 10px;
        border-radius: 3px;
        flex-shrink: 0;
      }

      :host ::ng-deep .chartjs-tooltip-footer {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
      }

      .chart-center__value {
        display: block;
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        letter-spacing: -0.02em;
      }

      .chart-center__label {
        display: block;
        font-size: 11px;
        color: #9ca3af;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 500;
      }

      .chart-legend {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid transparent;
      }

      .legend-item:hover {
        background: linear-gradient(
          135deg,
          rgba(255, 230, 0, 0.06) 0%,
          rgba(255, 208, 0, 0.02) 100%
        );
        border-color: rgba(255, 230, 0, 0.2);
        transform: translateX(4px);
      }

      .legend-color {
        width: 10px;
        height: 10px;
        border-radius: 4px;
        flex-shrink: 0;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .legend-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        flex: 1;
      }

      .legend-label {
        font-size: 12px;
        font-weight: 500;
        color: #374151;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .legend-value {
        font-size: 12px;
        color: #9ca3af;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }

      .chart-source {
        font-size: 11px;
        color: #d1d5db;
        font-style: normal;
        text-align: right;
        padding-top: 8px;
        border-top: 1px solid rgba(0, 0, 0, 0.04);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tooltipEl') tooltipEl!: ElementRef<HTMLDivElement>;

  @Input() data: PieChartData | null = null;
  @Input() loading = false;
  @Input() sourceDocument: string | null = null;
  @Input() cmdClickEnabled = true;
  @Input() displayMode: 'currency' | 'count' = 'currency';

  @Output() segmentClick = new EventEmitter<PieClickEvent>();
  @Output() cmdClick = new EventEmitter<PieClickEvent>();

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    if (this.data && !this.loading) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle data changes when canvas is ready
    if (changes['data'] && this.chartCanvas) {
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  formatCount(value: number): string {
    return value.toString();
  }

  formatValue(value: number): string {
    return this.displayMode === 'count' ? this.formatCount(value) : this.formatCurrency(value);
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

  private externalTooltipHandler(context: {
    chart: Chart;
    tooltip: {
      opacity: number;
      dataPoints?: { dataIndex: number }[];
      caretX: number;
      caretY: number;
    };
  }): void {
    const { chart, tooltip } = context;
    const tooltipEl = this.tooltipEl?.nativeElement;

    if (!tooltipEl) return;

    // Hide if no tooltip
    if (tooltip.opacity === 0) {
      tooltipEl.classList.remove('active');
      return;
    }

    // Set tooltip content
    if (tooltip.dataPoints && tooltip.dataPoints.length > 0) {
      const dataIndex = tooltip.dataPoints[0].dataIndex;
      const item = this.data!.items[dataIndex];
      const formatted = this.formatValue(item.value); // Respects displayMode (count vs currency)

      // Format display text based on mode
      const displayText =
        this.displayMode === 'count'
          ? `${formatted} ${item.value === 1 ? 'entity' : 'entities'}`
          : formatted;

      // Escape HTML to prevent XSS
      const escapeHtml = (str: string) =>
        str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

      // Validate color is a valid CSS color (hex, rgb, or named)
      const safeColor = /^(#[0-9A-Fa-f]{3,8}|rgb\(|rgba\(|[a-z]+)/.test(item.color)
        ? item.color
        : '#6B7280';

      let html = `<div class="chartjs-tooltip-title">${escapeHtml(item.label)}</div>`;
      html += `<div class="chartjs-tooltip-body">`;
      html += `<div class="chartjs-tooltip-body-item">`;
      html += `<span class="chartjs-tooltip-color" style="background-color: ${safeColor}"></span>`;
      html += `<span>${escapeHtml(displayText)} (${item.percentage.toFixed(1)}%)</span>`;
      html += `</div></div>`;

      if (this.cmdClickEnabled) {
        html += `<div class="chartjs-tooltip-footer">Cmd+Click for more details</div>`;
      }

      tooltipEl.innerHTML = html;
    }

    // Position tooltip
    const position = chart.canvas.getBoundingClientRect();
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;

    // Calculate position - center above the cursor
    let left = tooltip.caretX - tooltipWidth / 2;
    let top = tooltip.caretY - tooltipHeight - 15;

    // Keep tooltip within bounds
    if (left < 10) left = 10;
    if (left + tooltipWidth > position.width - 10) left = position.width - tooltipWidth - 10;
    if (top < 10) top = tooltip.caretY + 15; // Show below if no space above

    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.classList.add('active');
  }

  private createChart(): void {
    if (!this.chartCanvas || !this.data) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Premium color palette with subtle variations
    const premiumColors = [
      { base: '#FFE600', hover: '#FFD000' }, // EY Yellow
      { base: '#FFC107', hover: '#FFB300' }, // Amber
      { base: '#3B82F6', hover: '#2563EB' }, // Blue
      { base: '#8B5CF6', hover: '#7C3AED' }, // Purple
      { base: '#10B981', hover: '#059669' }, // Green
      { base: '#6B7280', hover: '#4B5563' }, // Gray
    ];

    // Map item colors to premium palette or use provided colors
    const getColorPair = (color: string, index: number) => {
      const preset = premiumColors.find(c => c.base.toLowerCase() === color.toLowerCase());
      if (preset) return preset;
      return premiumColors[index % premiumColors.length];
    };

    const options: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '70%',
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
        easing: 'easeOutQuart',
      },
      layout: {
        padding: 20,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
          external: context => this.externalTooltipHandler(context),
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
        labels: this.data.items.map(i => i.label),
        datasets: [
          {
            data: this.data.items.map(i => i.value),
            backgroundColor: this.data.items.map((item, i) => {
              const colorPair = getColorPair(item.color, i);
              return colorPair.base;
            }),
            hoverBackgroundColor: this.data.items.map((item, i) => {
              const colorPair = getColorPair(item.color, i);
              return colorPair.hover;
            }),
            borderWidth: 3,
            borderColor: '#FFFFFF',
            hoverOffset: 12,
            hoverBorderWidth: 3,
            spacing: 2,
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
