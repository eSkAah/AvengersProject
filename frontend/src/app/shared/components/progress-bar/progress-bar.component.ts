import { Component, ChangeDetectionStrategy, Input, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskLevel } from '../../../core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent implements OnInit {
  @Input({ required: true }) value = 0;
  @Input() riskLevel: RiskLevel = 'low';
  @Input() showLabel = true;
  @Input() label?: string;
  @Input() animate = true;
  @Input() height: 'sm' | 'md' | 'lg' = 'md';

  displayValue = signal(0);

  ngOnInit(): void {
    if (this.animate) {
      // Animate from 0 to value
      setTimeout(() => {
        this.animateValue(0, this.value, 800);
      }, 100);
    } else {
      this.displayValue.set(this.value);
    }
  }

  private animateValue(start: number, end: number, duration: number): void {
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeOut);

      this.displayValue.set(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  get displayLabel(): string {
    if (this.label) {
      return this.label;
    }
    return `${this.displayValue()}%`;
  }
}
