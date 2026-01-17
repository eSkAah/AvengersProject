import {
  Directive,
  Input,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  HostListener,
} from '@angular/core';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnInit, OnDestroy {
  @Input('appTooltip') tooltipContent = '';
  @Input() tooltipPosition: TooltipPosition = 'top';
  @Input() tooltipShowSource = false;
  @Input() tooltipSource: string | null = null;
  @Input() tooltipShowCmdHint = false;

  private tooltipElement: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly el: ElementRef,
    private readonly renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
  }

  ngOnDestroy(): void {
    this.removeTooltip();
    if (this.showTimeout) clearTimeout(this.showTimeout);
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.showTimeout = setTimeout(() => this.showTooltip(), 200);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.hideTimeout = setTimeout(() => this.removeTooltip(), 100);
  }

  private showTooltip(): void {
    if (this.tooltipElement || !this.tooltipContent) return;

    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'app-tooltip');
    this.renderer.addClass(this.tooltipElement, `app-tooltip--${this.tooltipPosition}`);

    // Main content
    const content = this.renderer.createElement('div');
    this.renderer.addClass(content, 'app-tooltip__content');
    const text = this.renderer.createText(this.tooltipContent);
    this.renderer.appendChild(content, text);
    this.renderer.appendChild(this.tooltipElement, content);

    // Source document
    if (this.tooltipShowSource && this.tooltipSource) {
      const source = this.renderer.createElement('div');
      this.renderer.addClass(source, 'app-tooltip__source');
      const sourceText = this.renderer.createText(`Source: ${this.tooltipSource}`);
      this.renderer.appendChild(source, sourceText);
      this.renderer.appendChild(this.tooltipElement, source);
    }

    // CMD+Click hint
    if (this.tooltipShowCmdHint) {
      const hint = this.renderer.createElement('div');
      this.renderer.addClass(hint, 'app-tooltip__hint');
      const hintText = this.renderer.createText('⌘+Click pour demander à Eve');
      this.renderer.appendChild(hint, hintText);
      this.renderer.appendChild(this.tooltipElement, hint);
    }

    // Add styles
    this.applyTooltipStyles();

    // Append to body
    this.renderer.appendChild(document.body, this.tooltipElement);

    // Position tooltip
    this.positionTooltip();
  }

  private applyTooltipStyles(): void {
    if (!this.tooltipElement) return;

    const styles: Record<string, string> = {
      position: 'fixed',
      zIndex: '9999',
      backgroundColor: '#FFFFFF',
      color: '#2E2E38',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      fontFamily: 'Inter, system-ui, sans-serif',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
      border: '1px solid #E5E5E5',
      maxWidth: '300px',
      opacity: '0',
      transition: 'opacity 200ms ease-out',
      pointerEvents: 'none',
    };

    Object.entries(styles).forEach(([key, value]) => {
      this.renderer.setStyle(this.tooltipElement, key, value);
    });

    // Fade in
    setTimeout(() => {
      if (this.tooltipElement) {
        this.renderer.setStyle(this.tooltipElement, 'opacity', '1');
      }
    }, 10);
  }

  private positionTooltip(): void {
    if (!this.tooltipElement) return;

    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const spacing = 8;

    let top = 0;
    let left = 0;

    switch (this.tooltipPosition) {
      case 'top':
        top = hostRect.top - tooltipRect.height - spacing;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + spacing;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - spacing;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + spacing;
        break;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 8) left = 8;
    if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }

  private removeTooltip(): void {
    if (this.tooltipElement) {
      this.renderer.setStyle(this.tooltipElement, 'opacity', '0');
      setTimeout(() => {
        if (this.tooltipElement && this.tooltipElement.parentNode) {
          this.renderer.removeChild(document.body, this.tooltipElement);
          this.tooltipElement = null;
        }
      }, 200);
    }
  }
}
