import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  DestroyRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
  DrillDownModalComponent,
  DrillDownData,
} from '../../../shared';
import { EveApiService } from '../../../core/services/eve-api.service';
import { KpiSectionComponent } from '../components/kpi-section/kpi-section.component';
import { ChartsSectionComponent, DrillDownEvent } from '../components/charts-section/charts-section.component';
import { KpiMetric, KpiClickEvent } from '../../../shared/components/charts/kpi-metric-card.component';

@Component({
  selector: 'app-engagement-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    BreadcrumbComponent,
    KpiSectionComponent,
    ChartsSectionComponent,
    DrillDownModalComponent,
  ],
  template: `
    <div class="engagement-dashboard">
      <!-- Breadcrumb -->
      <app-breadcrumb [items]="breadcrumbs"></app-breadcrumb>

      <!-- Header -->
      <div class="dashboard-header">
        <div class="dashboard-header__content">
          <h1>Tableau de Bord Financier</h1>
          <p>Analyse détaillée de l'engagement</p>
        </div>
        <button class="btn btn--outline" (click)="goBack()">
          <lucide-icon name="arrow-left" [size]="18"></lucide-icon>
          Retour
        </button>
      </div>

      @if (engagementId()) {
        <!-- KPI Section -->
        <section class="dashboard-section">
          <app-kpi-section
            [engagementId]="engagementId()"
            (kpiClick)="onKpiClick($event)"
            (cmdClick)="onKpiCmdClick($event)"
          ></app-kpi-section>
        </section>

        <!-- Charts Section -->
        <section class="dashboard-section">
          <app-charts-section
            [engagementId]="engagementId()"
            (drillDown)="onDrillDown($event)"
            (cmdClick)="onChartCmdClick($event)"
          ></app-charts-section>
        </section>
      } @else {
        <div class="empty-state">
          <lucide-icon name="bar-chart-2" [size]="64"></lucide-icon>
          <h2>Aucun engagement sélectionné</h2>
          <p>Veuillez sélectionner un engagement pour voir son tableau de bord.</p>
          <button class="btn btn--primary" (click)="goBack()">
            Retour à l'accueil
          </button>
        </div>
      }

      <!-- Drill-down Modal -->
      <app-drill-down-modal
        #drillDownModal
        [data]="drillDownData()"
        (closeModal)="onModalClose()"
        (askEveClick)="onDrillDownAskEve($event)"
      ></app-drill-down-modal>
    </div>
  `,
  styles: [`
    .engagement-dashboard {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      padding: 24px;
      background: linear-gradient(135deg, #FFE600 0%, #FFD000 100%);
      border-radius: 16px;
    }

    .dashboard-header__content h1 {
      font-size: 24px;
      font-weight: 700;
      color: #2E2E38;
      margin: 0 0 4px 0;
    }

    .dashboard-header__content p {
      font-size: 14px;
      color: #4A4A55;
      margin: 0;
    }

    .dashboard-section {
      margin-bottom: 32px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 200ms ease-out;
      border: none;
    }

    .btn--outline {
      background: rgba(255, 255, 255, 0.9);
      color: #2E2E38;
      border: 1px solid #E5E5E5;
    }

    .btn--outline:hover {
      background: #FFFFFF;
      border-color: #D4D4D4;
    }

    .btn--primary {
      background: #FFE600;
      color: #2E2E38;
    }

    .btn--primary:hover {
      background: #FFD000;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      text-align: center;
      color: #6B7280;
    }

    .empty-state lucide-icon {
      color: #D4D4D4;
      margin-bottom: 24px;
    }

    .empty-state h2 {
      font-size: 20px;
      font-weight: 600;
      color: #2E2E38;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      font-size: 14px;
      margin: 0 0 24px 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementDashboardComponent implements OnInit {
  @ViewChild('drillDownModal') drillDownModal!: DrillDownModalComponent;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly eveService = inject(EveApiService);

  readonly engagementId = signal<string | null>(null);
  readonly drillDownData = signal<DrillDownData | null>(null);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Tableau de bord' },
  ];

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        this.engagementId.set(id);
        // Set Eve context for this engagement
        if (id) {
          this.eveService.setEngagementContext(id, 'Engagement Dashboard');
        }
      });
  }

  onKpiClick(event: KpiClickEvent): void {
    const metric = event.metric;
    this.drillDownData.set({
      title: metric.label,
      value: metric.value,
      sourceDocument: metric.sourceDocument,
      details: [
        {
          label: 'Valeur actuelle',
          value: metric.value,
          type: 'currency',
          highlight: true,
        },
        ...(metric.previousValue !== undefined
          ? [
              {
                label: 'Valeur N-1',
                value: metric.previousValue,
                type: 'currency' as const,
              },
            ]
          : []),
        ...(metric.variancePercent !== undefined
          ? [
              {
                label: 'Variation',
                value: metric.variancePercent,
                type: 'percentage' as const,
              },
            ]
          : []),
      ],
    });
    this.drillDownModal.open();
  }

  onKpiCmdClick(metric: KpiMetric): void {
    const engagementId = this.engagementId();
    if (!engagementId) return;

    // Use the explain API for CMD+Click on KPIs
    this.eveService.openPanel();
    this.eveService
      .explainValue(
        this.formatCurrency(metric.value),
        metric.label,
        engagementId,
        { sourceDocument: metric.sourceDocument }
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onDrillDown(event: DrillDownEvent): void {
    const chartTypeLabels: Record<string, string> = {
      assets: 'Répartition des Actifs',
      comparison: 'Comparaison N/N-1',
      breakdown: 'Répartition',
    };

    this.drillDownData.set({
      title: event.label,
      value: event.value,
      details: [
        {
          label: 'Valeur',
          value: event.value,
          type: 'currency',
          highlight: true,
        },
        {
          label: 'Graphique',
          value: chartTypeLabels[event.chartType] ?? event.chartType,
          type: 'text',
        },
        ...(event.additionalData?.['percentage'] !== undefined
          ? [
              {
                label: 'Part du total',
                value: event.additionalData['percentage'] as number,
                type: 'percentage' as const,
              },
            ]
          : []),
      ],
      context: event.additionalData,
    });
    this.drillDownModal.open();
  }

  onChartCmdClick(event: DrillDownEvent): void {
    const engagementId = this.engagementId();
    if (!engagementId) return;

    // Use the explain API for CMD+Click on charts
    this.eveService.openPanel();
    this.eveService
      .explainValue(
        this.formatCurrency(event.value),
        event.label,
        engagementId,
        { chartType: event.chartType, ...event.additionalData }
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onModalClose(): void {
    this.drillDownData.set(null);
  }

  onDrillDownAskEve(data: DrillDownData): void {
    this.askEve(`Expliquez-moi en détail "${data.title}" avec une valeur de ${this.formatCurrency(data.value)}`);
  }

  private askEve(question: string): void {
    // Open Eve panel and send the question
    this.eveService.openPanel();
    this.eveService
      .sendMessage(question)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  goBack(): void {
    const id = this.engagementId();
    if (id) {
      this.router.navigate(['/engagements', id]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
