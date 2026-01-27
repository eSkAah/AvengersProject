import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Briefcase,
  ChevronRight,
  AlertTriangle,
  Calendar,
} from 'lucide-angular';
import { Engagement, MockDataService, STATUS_LABELS } from '../../../../core';
import { DonutSegment } from '../donut-widget/donut-widget.component';

@Component({
  selector: 'app-engagement-list-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './engagement-list-widget.component.html',
  styleUrl: './engagement-list-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementListWidgetComponent {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  readonly icons = {
    briefcase: Briefcase,
    chevronRight: ChevronRight,
    alertTriangle: AlertTriangle,
    calendar: Calendar,
  };

  readonly statusLabels = STATUS_LABELS;

  // Input for filtering based on donut selection
  readonly filter = input<DonutSegment>('all');

  readonly filteredEngagements = computed<Engagement[]>(() => {
    const engagements = this.mockData.engagements();
    const currentFilter = this.filter();

    let filtered: Engagement[];
    switch (currentFilter) {
      case 'late':
        filtered = engagements.filter(e => e.riskLevel === 'high');
        break;
      case 'soon':
        filtered = engagements.filter(e => e.riskLevel === 'medium');
        break;
      case 'in_progress':
        filtered = engagements.filter(e => e.riskLevel === 'low' && e.status !== 'completed');
        break;
      default:
        filtered = engagements;
    }

    // Return top 5
    return filtered.slice(0, 5);
  });

  readonly totalCount = computed(() => {
    const engagements = this.mockData.engagements();
    const currentFilter = this.filter();

    switch (currentFilter) {
      case 'late':
        return engagements.filter(e => e.riskLevel === 'high').length;
      case 'soon':
        return engagements.filter(e => e.riskLevel === 'medium').length;
      case 'in_progress':
        return engagements.filter(e => e.riskLevel === 'low' && e.status !== 'completed').length;
      default:
        return engagements.length;
    }
  });

  readonly filterLabel = computed(() => {
    const labels: Record<DonutSegment, string> = {
      all: 'All Engagements',
      late: 'Late Engagements',
      soon: 'Approaching Deadline',
      in_progress: 'In Progress',
    };
    return labels[this.filter()];
  });

  onEngagementClick(engagement: Engagement): void {
    this.router.navigate(['/app/engagements', engagement.id]);
  }

  onViewAll(): void {
    const filter = this.filter();
    const queryParams: Record<string, string> = {};

    if (filter === 'late') {
      queryParams['risk'] = 'high';
    } else if (filter === 'soon') {
      queryParams['risk'] = 'medium';
    } else if (filter === 'in_progress') {
      queryParams['risk'] = 'low';
    }

    this.router.navigate(['/app/engagements'], { queryParams });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
    });
  }
}
