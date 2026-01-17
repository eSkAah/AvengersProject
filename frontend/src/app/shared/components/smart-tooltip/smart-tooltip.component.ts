import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ElementRef,
  HostListener,
  signal,
  computed,
  Renderer2,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export type SmartTooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

@Component({
  selector: 'app-smart-tooltip',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="smart-tooltip-trigger"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      <ng-content></ng-content>
    </div>

    @if (isVisible()) {
      <div
        class="smart-tooltip"
        [class]="'smart-tooltip--' + computedPosition()"
        [style.top.px]="tooltipTop()"
        [style.left.px]="tooltipLeft()"
      >
        <div class="smart-tooltip__content">
          {{ content }}
        </div>

        @if (value) {
          <div class="smart-tooltip__value">
            <lucide-icon name="hash" [size]="12"></lucide-icon>
            {{ formattedValue }}
          </div>
        }

        @if (sourceDocument) {
          <div class="smart-tooltip__source">
            <lucide-icon name="file-text" [size]="12"></lucide-icon>
            Source: {{ sourceDocument }}
          </div>
        }

        @if (showCmdHint) {
          <div class="smart-tooltip__hint">
            <lucide-icon name="command" [size]="12"></lucide-icon>
            ⌘+Click pour demander à Eve
          </div>
        }

        <div class="smart-tooltip__arrow"></div>
      </div>
    }
  `,
  styles: [`
    :host {
      position: relative;
      display: inline-block;
    }

    .smart-tooltip-trigger {
      cursor: pointer;
    }

    .smart-tooltip {
      position: fixed;
      z-index: 9999;
      background: #FFFFFF;
      border: 1px solid #E5E5E5;
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      max-width: 320px;
      font-family: 'Inter', system-ui, sans-serif;
      animation: tooltipFadeIn 200ms ease-out;
    }

    @keyframes tooltipFadeIn {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .smart-tooltip__content {
      font-size: 13px;
      color: #2E2E38;
      line-height: 1.5;
    }

    .smart-tooltip__value {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: #2E2E38;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #F3F4F6;
    }

    .smart-tooltip__source {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #9CA3AF;
      font-style: italic;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #F3F4F6;
    }

    .smart-tooltip__hint {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #6B7280;
      margin-top: 8px;
      padding: 6px 8px;
      background: #F5F5F5;
      border-radius: 4px;
    }

    .smart-tooltip__arrow {
      position: absolute;
      width: 12px;
      height: 12px;
      background: #FFFFFF;
      border: 1px solid #E5E5E5;
      transform: rotate(45deg);
    }

    .smart-tooltip--top .smart-tooltip__arrow {
      bottom: -7px;
      left: 50%;
      margin-left: -6px;
      border-top: none;
      border-left: none;
    }

    .smart-tooltip--bottom .smart-tooltip__arrow {
      top: -7px;
      left: 50%;
      margin-left: -6px;
      border-bottom: none;
      border-right: none;
    }

    .smart-tooltip--left .smart-tooltip__arrow {
      right: -7px;
      top: 50%;
      margin-top: -6px;
      border-top: none;
      border-left: none;
    }

    .smart-tooltip--right .smart-tooltip__arrow {
      left: -7px;
      top: 50%;
      margin-top: -6px;
      border-bottom: none;
      border-right: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartTooltipComponent implements OnDestroy {
  private readonly el = inject(ElementRef);

  @Input() content = '';
  @Input() value: number | string | null = null;
  @Input() sourceDocument: string | null = null;
  @Input() showCmdHint = true;
  @Input() position: SmartTooltipPosition = 'auto';
  @Input() delay = 200;

  readonly isVisible = signal(false);
  readonly tooltipTop = signal(0);
  readonly tooltipLeft = signal(0);
  readonly computedPosition = signal<'top' | 'bottom' | 'left' | 'right'>('top');

  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  get formattedValue(): string {
    if (typeof this.value === 'number') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(this.value);
    }
    return String(this.value ?? '');
  }

  ngOnDestroy(): void {
    if (this.showTimeout) clearTimeout(this.showTimeout);
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
  }

  onMouseEnter(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.showTimeout = setTimeout(() => {
      this.calculatePosition();
      this.isVisible.set(true);
    }, this.delay);
  }

  onMouseLeave(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.hideTimeout = setTimeout(() => {
      this.isVisible.set(false);
    }, 100);
  }

  private calculatePosition(): void {
    const triggerRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 120;
    const spacing = 12;

    let pos = this.position;
    if (pos === 'auto') {
      // Determine best position based on available space
      const spaceAbove = triggerRect.top;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = window.innerWidth - triggerRect.right;

      if (spaceAbove >= tooltipHeight + spacing) {
        pos = 'top';
      } else if (spaceBelow >= tooltipHeight + spacing) {
        pos = 'bottom';
      } else if (spaceRight >= tooltipWidth + spacing) {
        pos = 'right';
      } else {
        pos = 'left';
      }
    }

    this.computedPosition.set(pos);

    let top = 0;
    let left = 0;

    switch (pos) {
      case 'top':
        top = triggerRect.top - tooltipHeight - spacing;
        left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + spacing;
        left = triggerRect.left + (triggerRect.width - tooltipWidth) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
        left = triggerRect.left - tooltipWidth - spacing;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipHeight) / 2;
        left = triggerRect.right + spacing;
        break;
    }

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + tooltipWidth > window.innerWidth - 8) {
      left = window.innerWidth - tooltipWidth - 8;
    }
    if (top < 8) top = 8;
    if (top + tooltipHeight > window.innerHeight - 8) {
      top = window.innerHeight - tooltipHeight - 8;
    }

    this.tooltipTop.set(top);
    this.tooltipLeft.set(left);
  }
}
