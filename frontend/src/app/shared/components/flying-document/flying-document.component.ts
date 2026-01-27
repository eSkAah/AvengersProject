import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DOCUMENT_TYPE_LABELS, DocumentType } from '../../../core';

// Local interface for animation (simplified from removed service)
export interface PlacementAnimation {
  id: string;
  documentId: string;
  documentName: string;
  documentType: DocumentType;
  sourcePosition: { x: number; y: number };
  status: 'pending' | 'flying' | 'landed' | 'completed';
}

@Component({
  selector: 'app-flying-document',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      #flyingCard
      class="flying-document"
      [class.flying-document--flying]="animation?.status === 'flying'"
      [class.flying-document--landed]="animation?.status === 'landed'"
      [style.left.px]="currentPosition().x"
      [style.top.px]="currentPosition().y"
      [style.transform]="'translate(-50%, -50%) scale(' + currentScale() + ')'"
    >
      <div class="flying-document__icon">
        <lucide-icon [name]="getDocIcon()" [size]="20"></lucide-icon>
      </div>
      <div class="flying-document__info">
        <span class="flying-document__name">{{ truncatedName() }}</span>
        <span class="flying-document__type">{{ typeLabel() }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      }

      .flying-document {
        position: absolute;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: white;
        border: 2px solid #ffe600;
        border-radius: 0.5rem;
        box-shadow:
          0 10px 25px -5px rgba(0, 0, 0, 0.2),
          0 8px 10px -6px rgba(0, 0, 0, 0.1);
        transition: transform 0.1s ease-out;
        will-change: left, top, transform;

        &--flying {
          animation: pulse 0.4s ease-in-out infinite;
        }

        &--landed {
          animation: landed 0.3s ease-out forwards;
        }

        &__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: #ffe600;
          border-radius: 0.375rem;
          color: #2e2e38;
          flex-shrink: 0;
        }

        &__info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        &__name {
          font-size: 0.75rem;
          font-weight: 600;
          color: #2e2e38;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }

        &__type {
          font-size: 0.625rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      }

      @keyframes pulse {
        0%,
        100% {
          box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.2),
            0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        50% {
          box-shadow:
            0 15px 30px -5px rgba(255, 230, 0, 0.3),
            0 10px 15px -6px rgba(255, 230, 0, 0.2);
        }
      }

      @keyframes landed {
        0% {
          transform: translate(-50%, -50%) scale(1);
        }
        50% {
          transform: translate(-50%, -50%) scale(1.1);
        }
        100% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlyingDocumentComponent implements AfterViewInit, OnDestroy {
  @ViewChild('flyingCard') flyingCard!: ElementRef<HTMLDivElement>;

  @Input() animation: PlacementAnimation | null = null;
  @Input() targetPosition: { x: number; y: number } | null = null;

  private animationFrame: number | null = null;
  private startTime = 0;
  private readonly duration = 800; // Animation duration in ms

  currentPosition = signal({ x: 0, y: 0 });
  currentScale = signal(1);

  private readonly typeIcons: Record<string, string> = {
    general_ledger: 'book-open',
    trial_balance: 'bar-chart-3',
    bank_statement: 'landmark',
    tax_return: 'clipboard-list',
    financial_statement: 'file-text',
  };

  constructor() {
    effect(() => {
      const anim = this.animation;
      if (anim && anim.status === 'flying' && this.targetPosition) {
        this.startAnimation();
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.animation && this.animation.status === 'flying' && this.targetPosition) {
      this.startAnimation();
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private startAnimation(): void {
    if (!this.animation || !this.targetPosition) return;

    const source = this.animation.sourcePosition;
    const target = this.targetPosition;

    this.startTime = Date.now();
    this.currentPosition.set(source);

    const animate = () => {
      const elapsed = Date.now() - this.startTime;
      const progress = Math.min(1, elapsed / this.duration);

      // Cubic bezier easing
      const eased = this.easeOutCubic(progress);

      // Calculate current position with arc motion
      const arcHeight = 50; // Height of the arc
      const midProgress = Math.sin(progress * Math.PI);

      const x = source.x + (target.x - source.x) * eased;
      const y = source.y + (target.y - source.y) * eased - arcHeight * midProgress;

      this.currentPosition.set({ x, y });

      // Scale down as we approach the target
      const scale = 1 - 0.3 * eased;
      this.currentScale.set(scale);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  truncatedName = () => {
    const name = this.animation?.documentName || '';
    if (name.length > 25) {
      return name.substring(0, 22) + '...';
    }
    return name;
  };

  typeLabel = () => {
    const type = this.animation?.documentType;
    return type ? (DOCUMENT_TYPE_LABELS[type] ?? '') : '';
  };

  getDocIcon(): string {
    const type = this.animation?.documentType;
    return type ? this.typeIcons[type] || 'file-text' : 'file-text';
  }
}
