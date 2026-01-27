import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

// EY Design System KPI Variants
export type KpiVariant =
  | 'default'
  | 'dark'
  | 'light'
  | 'highlight'
  | 'info'
  | 'warning'
  | 'error'
  | 'success';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardComponent implements OnInit {
  @Input({ required: true }) value!: number;
  @Input({ required: true }) label!: string;
  @Input() icon = 'bar-chart-3';
  @Input() variant: KpiVariant = 'light';
  @Input() clickable = true;
  @Input() active = false;
  @Input() animate = true;
  @Input() unit = '';

  @Output() cardClick = new EventEmitter<void>();

  displayValue = signal(0);

  ngOnInit(): void {
    if (this.animate) {
      setTimeout(() => {
        this.animateValue(0, this.value, 1000);
      }, 200);
    } else {
      this.displayValue.set(this.value);
    }
  }

  private animateValue(start: number, end: number, duration: number): void {
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeOut);

      this.displayValue.set(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  onClick(): void {
    if (this.clickable) {
      this.cardClick.emit();
    }
  }
}
