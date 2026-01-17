import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Engagement } from '../../../../core';
import {
  RiskBadgeComponent,
  ProgressBarComponent,
  ButtonComponent,
  BadgeComponent,
} from '../../../../shared';

@Component({
  selector: 'app-engagement-list',
  standalone: true,
  imports: [
    CommonModule,
    RiskBadgeComponent,
    ProgressBarComponent,
    ButtonComponent,
    BadgeComponent,
  ],
  templateUrl: './engagement-list.component.html',
  styleUrl: './engagement-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementListComponent {
  @Input({ required: true }) engagements: Engagement[] = [];

  @Output() viewDashboard = new EventEmitter<Engagement>();
  @Output() uploadDocs = new EventEmitter<Engagement>();
  @Output() askEve = new EventEmitter<Engagement>();

  expandedId = signal<string | null>(null);

  toggleExpand(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  isExpanded(id: string): boolean {
    return this.expandedId() === id;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      waiting: 'En attente',
      received: 'Reçu',
      processing: 'En cours',
      completed: 'Terminé',
    };
    return labels[status] || status;
  }

  getStatusVariant(status: string): 'info' | 'warning' | 'success' | 'error' {
    const variants: Record<string, 'info' | 'warning' | 'success' | 'error'> = {
      waiting: 'warning',
      received: 'info',
      processing: 'info',
      completed: 'success',
    };
    return variants[status] || 'info';
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  getMissingDocsCount(engagement: Engagement): number {
    return engagement.documentsRequired.length - engagement.documentsUploaded.length;
  }

  trackById(index: number, engagement: Engagement): string {
    return engagement.id;
  }
}
