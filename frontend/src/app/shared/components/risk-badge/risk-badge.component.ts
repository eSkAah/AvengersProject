import {
  Component,
  ChangeDetectionStrategy,
  Input,
  signal,
  computed,
  ElementRef,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { RiskLevel } from '../../../core';

export interface RiskDetails {
  reasons: string[];
  suggestedActions: string[];
  daysRemaining?: number;
  missingDocuments?: string[];
}

@Component({
  selector: 'app-risk-badge',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './risk-badge.component.html',
  styleUrl: './risk-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RiskBadgeComponent implements OnDestroy {
  private readonly el = inject(ElementRef);

  @Input({ required: true }) level!: RiskLevel;
  @Input() showLabel = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() pulse = true;
  @Input() riskDetails: RiskDetails | null = null;
  @Input() showRichTooltip = false;

  readonly isTooltipVisible = signal(false);
  readonly tooltipTop = signal(0);
  readonly tooltipLeft = signal(0);

  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly config: Record<RiskLevel, { color: string; label: string; tooltip: string; icon: string }> = {
    high: {
      color: '#EF4444',
      label: 'HIGH',
      tooltip: 'High risk: Immediate action required.',
      icon: 'alert-triangle',
    },
    medium: {
      color: '#F59E0B',
      label: 'MEDIUM',
      tooltip: 'Medium risk: Attention required.',
      icon: 'alert-circle',
    },
    low: {
      color: '#10B981',
      label: 'LOW',
      tooltip: 'Low risk: Everything under control.',
      icon: 'check-circle',
    },
  };

  get currentConfig() {
    return this.config[this.level];
  }

  get shouldPulse(): boolean {
    return this.pulse && this.level === 'high';
  }

  get iconSize(): number {
    const sizes = { sm: 12, md: 16, lg: 20 };
    return sizes[this.size];
  }

  get hasRichTooltip(): boolean {
    return this.showRichTooltip && this.riskDetails !== null;
  }

  get simpleTooltip(): string {
    if (this.hasRichTooltip) return '';
    return this.currentConfig.tooltip;
  }

  ngOnDestroy(): void {
    if (this.showTimeout) clearTimeout(this.showTimeout);
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
  }

  onMouseEnter(): void {
    if (!this.hasRichTooltip) return;

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.showTimeout = setTimeout(() => {
      this.calculatePosition();
      this.isTooltipVisible.set(true);
    }, 200);
  }

  onMouseLeave(): void {
    if (!this.hasRichTooltip) return;

    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.hideTimeout = setTimeout(() => {
      this.isTooltipVisible.set(false);
    }, 100);
  }

  private calculatePosition(): void {
    const triggerRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    const spacing = 12;

    let top = triggerRect.top - tooltipHeight - spacing;
    let left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + tooltipWidth > window.innerWidth - 8) {
      left = window.innerWidth - tooltipWidth - 8;
    }
    if (top < 8) {
      top = triggerRect.bottom + spacing;
    }

    this.tooltipTop.set(top);
    this.tooltipLeft.set(left);
  }
}
