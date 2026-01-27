import {
  Component,
  ChangeDetectionStrategy,
  Input,
  computed,
  signal,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

type RingColor = 'red' | 'amber' | 'green' | 'neutral';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-ring" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.viewBox]="viewBox" class="progress-ring__svg">
        <!-- Background circle -->
        <circle
          class="progress-ring__bg"
          [attr.cx]="center"
          [attr.cy]="center"
          [attr.r]="radius"
          [attr.stroke-width]="strokeWidth"
        />
        <!-- Progress circle -->
        <circle
          class="progress-ring__progress"
          [class]="'progress-ring__progress--' + colorState()"
          [attr.cx]="center"
          [attr.cy]="center"
          [attr.r]="radius"
          [attr.stroke-width]="strokeWidth"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset()"
          [style.transition]="'stroke-dashoffset 0.5s ease-out'"
        />
      </svg>
      <div class="progress-ring__content">
        <span class="progress-ring__count" [class]="'progress-ring__count--' + colorState()">
          {{ uploaded }}/{{ total }}
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-block;
      }

      .progress-ring {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;

        &__svg {
          transform: rotate(-90deg);
          width: 100%;
          height: 100%;
        }

        &__bg {
          fill: none;
          stroke: #e5e7eb; // gray-200
        }

        &__progress {
          fill: none;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease-out;

          &--red {
            stroke: #ef4444; // red-500
          }

          &--amber {
            stroke: #f59e0b; // amber-500
          }

          &--green {
            stroke: #10b981; // emerald-500
          }

          &--neutral {
            stroke: #9ca3af; // gray-400
          }
        }

        &__content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        &__count {
          font-weight: 600;
          font-size: 0.75rem;
          line-height: 1;

          &--red {
            color: #ef4444;
          }

          &--amber {
            color: #d97706;
          }

          &--green {
            color: #059669;
          }

          &--neutral {
            color: #6b7280;
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressRingComponent implements OnChanges {
  @Input() uploaded = 0;
  @Input() total = 0;
  @Input() size = 56;
  @Input() strokeWidth = 4;

  private uploadedSignal = signal(0);
  private totalSignal = signal(0);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['uploaded']) {
      this.uploadedSignal.set(this.uploaded);
    }
    if (changes['total']) {
      this.totalSignal.set(this.total);
    }
  }

  get center(): number {
    return this.size / 2;
  }

  get radius(): number {
    return (this.size - this.strokeWidth) / 2;
  }

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  get viewBox(): string {
    return `0 0 ${this.size} ${this.size}`;
  }

  percentage = computed(() => {
    const total = this.totalSignal();
    const uploaded = this.uploadedSignal();
    if (total === 0) return 0;
    return Math.min(100, Math.round((uploaded / total) * 100));
  });

  dashOffset = computed(() => {
    const percent = this.percentage();
    return this.circumference - (percent / 100) * this.circumference;
  });

  colorState = computed((): RingColor => {
    const percent = this.percentage();
    const total = this.totalSignal();

    if (total === 0) return 'neutral';
    if (percent >= 100) return 'green';
    if (percent >= 50) return 'amber';
    return 'red';
  });
}
