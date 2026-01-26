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

// EY Design System: Map filters to appropriate KPI card variants
interface KpiConfig {
  filter: KpiFilter;
  label: string;
  icon: string;
  variant: KpiVariant;
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

  // EY Design System KPI configuration
  // Using dark/light/highlight variants appropriately
  readonly kpiConfigs: KpiConfig[] = [
    { filter: 'all', label: 'Total Engagements', icon: 'clipboard-list', variant: 'dark' },
    { filter: 'processing', label: 'In Progress', icon: 'clock', variant: 'light' },
    { filter: 'high-risk', label: 'At Risk', icon: 'alert-triangle', variant: 'highlight' },
    { filter: 'completed', label: 'Completed', icon: 'check-circle', variant: 'light' },
  ];

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

  getValue(filter: KpiFilter): number {
    switch (filter) {
      case 'all': return this.data.total;
      case 'processing': return this.data.processing;
      case 'high-risk': return this.data.highRisk;
      case 'completed': return this.data.completed;
      default: return 0;
    }
  }

  // Get variant - highlight risk if count > 0, otherwise use configured variant
  getVariant(config: KpiConfig): KpiVariant {
    if (config.filter === 'high-risk' && this.data.highRisk > 0) {
      return 'error'; // Show error variant when there are items at risk
    }
    if (config.filter === 'completed' && this.data.completed === this.data.total && this.data.total > 0) {
      return 'success'; // Show success when all completed
    }
    return config.variant;
  }
}
