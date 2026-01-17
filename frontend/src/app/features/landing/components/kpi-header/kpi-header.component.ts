import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { KpiCardComponent, KpiVariant } from '../../../../shared';

export type KpiFilter = 'all' | 'processing' | 'high-risk' | 'completed';

interface KpiData {
  total: number;
  processing: number;
  highRisk: number;
  completed: number;
}

@Component({
  selector: 'app-kpi-header',
  standalone: true,
  imports: [CommonModule, KpiCardComponent],
  templateUrl: './kpi-header.component.html',
  styleUrl: './kpi-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('staggerCards', [
      transition(':enter', [
        query('.kpi-card-wrapper', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
})
export class KpiHeaderComponent {
  @Input({ required: true }) data!: KpiData;

  @Output() filterChange = new EventEmitter<KpiFilter>();

  activeFilter = signal<KpiFilter>('all');

  onFilterClick(filter: KpiFilter): void {
    if (this.activeFilter() === filter) {
      this.activeFilter.set('all');
      this.filterChange.emit('all');
    } else {
      this.activeFilter.set(filter);
      this.filterChange.emit(filter);
    }
  }

  isActive(filter: KpiFilter): boolean {
    return this.activeFilter() === filter;
  }
}
