import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Engagement } from '../../../../core';
import {
  EngagementApiService,
  RiskDetailsResponse,
  PredictionResponse,
} from '../../../../core/services';
import {
  RiskBadgeComponent,
  RiskDetails,
  ProgressBarComponent,
  ButtonComponent,
  BadgeComponent,
} from '../../../../shared';

@Component({
  selector: 'app-engagement-list',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RiskBadgeComponent,
    ProgressBarComponent,
    ButtonComponent,
    BadgeComponent,
  ],
  templateUrl: './engagement-list.component.html',
  styleUrl: './engagement-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0 }),
        animate('250ms ease-out', style({ height: '*', opacity: 1, paddingTop: '*', paddingBottom: '*' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0 })),
      ]),
    ]),
    trigger('rotateChevron', [
      transition('collapsed => expanded', [
        animate('200ms ease-out'),
      ]),
      transition('expanded => collapsed', [
        animate('200ms ease-out'),
      ]),
    ]),
  ],
})
export class EngagementListComponent {
  private readonly engagementApi = inject(EngagementApiService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) engagements: Engagement[] = [];

  @Output() viewDashboard = new EventEmitter<Engagement>();
  @Output() uploadDocs = new EventEmitter<Engagement>();
  @Output() askEve = new EventEmitter<Engagement>();

  expandedId = signal<string | null>(null);
  readonly riskDetailsMap = signal<Map<string, RiskDetails>>(new Map());
  readonly predictionsMap = signal<Map<string, PredictionResponse>>(new Map());

  toggleExpand(id: string): void {
    const newId = this.expandedId() === id ? null : id;
    this.expandedId.set(newId);

    // Fetch risk details and prediction when expanding
    if (newId) {
      this.loadRiskDetails(newId);
      this.loadPrediction(newId);
    }
  }

  private loadRiskDetails(engagementId: string): void {
    this.engagementApi
      .getRiskDetails(engagementId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (details) => {
          this.riskDetailsMap.update((map) => {
            const newMap = new Map(map);
            newMap.set(engagementId, {
              reasons: details.reasons,
              suggestedActions: details.suggested_actions,
              daysRemaining: details.days_remaining,
              missingDocuments: details.missing_documents,
            });
            return newMap;
          });
        },
      });
  }

  private loadPrediction(engagementId: string): void {
    this.engagementApi
      .getPrediction(engagementId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (prediction) => {
          this.predictionsMap.update((map) => {
            const newMap = new Map(map);
            newMap.set(engagementId, prediction);
            return newMap;
          });
        },
      });
  }

  getRiskDetails(engagementId: string): RiskDetails | null {
    return this.riskDetailsMap().get(engagementId) ?? null;
  }

  getPrediction(engagementId: string): PredictionResponse | null {
    return this.predictionsMap().get(engagementId) ?? null;
  }

  getPredictionDisplay(engagementId: string): { text: string; color: string; icon: string } | null {
    const prediction = this.getPrediction(engagementId);
    if (!prediction) return null;
    return this.engagementApi.formatPrediction(prediction);
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

  hasVarianceAlerts(engagement: Engagement): boolean {
    return (engagement.varianceAlerts?.length ?? 0) > 0;
  }

  getVarianceCount(engagement: Engagement): number {
    return engagement.varianceAlerts?.length ?? 0;
  }

  getVarianceSummary(engagement: Engagement): string {
    const alerts = engagement.varianceAlerts ?? [];
    if (alerts.length === 0) return '';

    if (alerts.length === 1) {
      const v = alerts[0];
      const direction = v.variance_type === 'increase' ? '↑' : '↓';
      return `${v.metric_label} ${direction}${Math.abs(v.variance_percent).toFixed(0)}%`;
    }

    return `${alerts.length} variances N-1 détectées`;
  }

  trackById(index: number, engagement: Engagement): string {
    return engagement.id;
  }
}
