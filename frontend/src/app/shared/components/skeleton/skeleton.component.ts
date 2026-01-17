import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() animation = true;

  get skeletonClasses(): string {
    return [
      'skeleton',
      `skeleton--${this.variant}`,
      this.animation ? 'skeleton--animated' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  get skeletonStyles(): Record<string, string> {
    return {
      width: this.width,
      height: this.height,
    };
  }
}
