import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  output,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, PieChart } from 'lucide-angular';
import { MockDataService } from '../../../../core';

export type DonutSegment = 'late' | 'in_progress' | 'soon' | 'all';

interface SegmentData {
  key: DonutSegment;
  label: string;
  count: number;
  color: string;
  percentage: number;
}

@Component({
  selector: 'app-donut-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './donut-widget.component.html',
  styleUrl: './donut-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonutWidgetComponent implements AfterViewInit {
  private readonly mockData = inject(MockDataService);

  readonly icons = {
    pieChart: PieChart,
  };

  readonly selectedSegment = signal<DonutSegment>('all');
  readonly segmentSelect = output<DonutSegment>();

  @ViewChild('donutCanvas') donutCanvas!: ElementRef<HTMLCanvasElement>;

  readonly segments = computed<SegmentData[]>(() => {
    const engagements = this.mockData.engagements();
    const total = engagements.length;

    // Calculate counts based on risk/deadline status
    const late = engagements.filter(e => e.riskLevel === 'high').length;
    const soon = engagements.filter(e => e.riskLevel === 'medium').length;
    const inProgress = engagements.filter(
      e => e.riskLevel === 'low' && e.status !== 'completed'
    ).length;

    return [
      {
        key: 'late' as DonutSegment,
        label: 'Late',
        count: late,
        color: '#EF4444',
        percentage: total > 0 ? Math.round((late / total) * 100) : 0,
      },
      {
        key: 'soon' as DonutSegment,
        label: 'Soon',
        count: soon,
        color: '#F59E0B',
        percentage: total > 0 ? Math.round((soon / total) * 100) : 0,
      },
      {
        key: 'in_progress' as DonutSegment,
        label: 'In Progress',
        count: inProgress,
        color: '#3B82F6',
        percentage: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      },
    ];
  });

  readonly totalEngagements = computed(() => this.mockData.engagements().length);

  ngAfterViewInit(): void {
    this.drawDonut();
  }

  onSegmentClick(segment: DonutSegment): void {
    if (this.selectedSegment() === segment) {
      this.selectedSegment.set('all');
      this.segmentSelect.emit('all');
    } else {
      this.selectedSegment.set(segment);
      this.segmentSelect.emit(segment);
    }
    this.drawDonut();
  }

  private drawDonut(): void {
    const canvas = this.donutCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 10;
    const innerRadius = outerRadius * 0.65;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const segments = this.segments();
    const total = segments.reduce((sum, s) => sum + s.count, 0);

    if (total === 0) {
      // Draw empty state
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
      ctx.fillStyle = '#E5E5E5';
      ctx.fill();
      return;
    }

    let startAngle = -Math.PI / 2; // Start from top

    segments.forEach(segment => {
      if (segment.count === 0) return;

      const sliceAngle = (segment.count / total) * Math.PI * 2;
      const isSelected = this.selectedSegment() === segment.key;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        isSelected ? outerRadius + 4 : outerRadius,
        startAngle,
        startAngle + sliceAngle
      );
      ctx.closePath();

      ctx.fillStyle = segment.color;
      ctx.globalAlpha = isSelected || this.selectedSegment() === 'all' ? 1 : 0.4;
      ctx.fill();

      startAngle += sliceAngle;
    });

    // Draw inner circle (donut hole)
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Draw center text
    ctx.fillStyle = '#2E2E38';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total.toString(), centerX, centerY - 8);

    ctx.fillStyle = '#6B7280';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Total', centerX, centerY + 14);
  }
}
