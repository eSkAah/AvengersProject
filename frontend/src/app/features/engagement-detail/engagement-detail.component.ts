import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  OnInit,
  DestroyRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MockDataService, Engagement, Document, DocumentType } from '../../core';
import { EveApiService } from '../../core/services/eve-api.service';
import {
  RiskBadgeComponent,
  ProgressBarComponent,
  KpiCardComponent,
  BadgeComponent,
  BreadcrumbComponent,
  BreadcrumbItem,
  DocumentRequirementsSectionComponent,
  DocumentUploadEvent,
  DrillDownModalComponent,
  DrillDownData,
} from '../../shared';
import { Document as DocumentModel } from '../../core/models/document.model';
import { KpiSectionComponent } from '../dashboard/components/kpi-section/kpi-section.component';
import {
  KpiMetric,
  KpiClickEvent,
} from '../../shared/components/charts/kpi-metric-card.component';
import {
  ChartsSectionComponent,
  DrillDownEvent,
} from '../dashboard/components/charts-section/charts-section.component';

@Component({
  selector: 'app-engagement-detail',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    RiskBadgeComponent,
    ProgressBarComponent,
    KpiCardComponent,
    BadgeComponent,
    BreadcrumbComponent,
    DocumentRequirementsSectionComponent,
    KpiSectionComponent,
    ChartsSectionComponent,
    DrillDownModalComponent,
  ],
  templateUrl: './engagement-detail.component.html',
  styleUrl: './engagement-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mockData = inject(MockDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly eveService = inject(EveApiService);

  @ViewChild(DrillDownModalComponent) drillDownModal!: DrillDownModalComponent;

  readonly engagementId = signal<string | null>(null);
  readonly drillDownData = signal<DrillDownData | null>(null);

  readonly engagement = computed(() => {
    const id = this.engagementId();
    if (!id) return null;
    return this.mockData.engagements().find((e) => e.id === id) ?? null;
  });

  readonly documents = computed(() => {
    const id = this.engagementId();
    if (!id) return [];
    return this.mockData.documents().filter((d) => d.engagementIds.includes(id));
  });

  readonly documentRequirements = computed(() => {
    const eng = this.engagement();
    return eng?.documentRequirements ?? [];
  });

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const eng = this.engagement();
    return [
      { label: 'Accueil', path: '/' },
      { label: eng?.entity ?? 'Engagement' },
    ];
  });

  readonly statusConfig = computed(() => {
    const eng = this.engagement();
    if (!eng) return { label: '', variant: 'neutral' as const, icon: 'circle' };

    const configs: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info'; icon: string }> = {
      waiting: { label: 'En attente', variant: 'warning', icon: 'clock' },
      received: { label: 'Reçu', variant: 'info', icon: 'inbox' },
      processing: { label: 'En cours', variant: 'info', icon: 'loader' },
      completed: { label: 'Terminé', variant: 'success', icon: 'check-circle' },
    };

    return configs[eng.status] ?? { label: eng.status, variant: 'info' as const, icon: 'circle' };
  });

  readonly daysRemaining = computed(() => {
    const eng = this.engagement();
    if (!eng) return 0;
    const due = new Date(eng.dueDate);
    const today = new Date();
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  });

  readonly formattedDueDate = computed(() => {
    const eng = this.engagement();
    if (!eng) return '';
    return new Date(eng.dueDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        this.engagementId.set(id);

        // Set Eve context when engagement changes
        if (id) {
          const engagement = this.mockData.engagements().find((e) => e.id === id);
          this.eveService.setEngagementContext(id, engagement?.entity ?? 'Engagement');
        }
      });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  goToDocuments(): void {
    const id = this.engagementId();
    if (id) {
      this.router.navigate(['/app/documents'], { queryParams: { engagement: id } });
    }
  }

  askEve(): void {
    // Open Eve panel - context is already set
    this.eveService.openPanel();
  }

  goBack(): void {
    this.router.navigate(['/app']);
  }

  getFileFormat(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  getDocumentIcon(filename: string): string {
    const format = this.getFileFormat(filename);
    const icons: Record<string, string> = {
      xlsx: 'file-spreadsheet',
      xls: 'file-spreadsheet',
      pdf: 'file-text',
      csv: 'file-spreadsheet',
    };
    return icons[format] ?? 'file';
  }

  getStatusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'info' {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      analyzed: 'success',
      uploaded: 'info',
      analyzing: 'warning',
      pending: 'info',
      error: 'error',
    };
    return variants[status] ?? 'info';
  }

  onDocumentUpload(event: DocumentUploadEvent): void {
    const eng = this.engagement();
    if (eng) {
      // Navigate to documents page with upload context
      this.router.navigate(['/app/documents'], {
        queryParams: {
          tab: 'upload',
          entity: eng.entity,
          type: event.type,
          year: event.fiscalYear,
        },
      });
    }
  }

  onDocumentClick(doc: DocumentModel): void {
    const eng = this.engagement();
    if (eng) {
      // Navigate to document library filtered to this document
      this.router.navigate(['/app/documents'], {
        queryParams: {
          entity: eng.entity,
          type: doc.type,
        },
      });
    }
  }

  // KPI Section handlers
  onKpiClick(event: KpiClickEvent): void {
    const metric = event.metric;
    this.drillDownData.set({
      title: metric.label,
      value: metric.value,
      sourceDocument: metric.sourceDocument,
      details: [
        ...(metric.previousValue !== undefined
          ? [{ label: 'Valeur N-1', value: metric.previousValue, type: 'currency' as const }]
          : []),
        ...(metric.variancePercent !== undefined
          ? [{ label: 'Variation', value: metric.variancePercent, type: 'percentage' as const, highlight: true }]
          : []),
      ],
    });
    this.drillDownModal?.open();
  }

  onKpiCmdClick(metric: KpiMetric): void {
    const engagementId = this.engagementId();
    if (!engagementId) return;

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

  // Charts Section handlers
  onDrillDown(event: DrillDownEvent): void {
    this.drillDownData.set({
      title: event.label,
      value: event.value,
      details: [
        { label: 'Type de graphique', value: event.chartType, type: 'text' as const },
      ],
      context: event.additionalData,
    });
    this.drillDownModal?.open();
  }

  onChartCmdClick(event: DrillDownEvent): void {
    const engagementId = this.engagementId();
    if (!engagementId) return;

    this.eveService.openPanel();
    this.eveService
      .explainValue(
        this.formatCurrency(event.value),
        event.label,
        engagementId,
        {
          chartType: event.chartType,
          ...event.additionalData,
        }
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  closeDrillDown(): void {
    this.drillDownData.set(null);
  }

  onDrillDownAskEve(data: DrillDownData): void {
    const engagementId = this.engagementId();
    if (!engagementId) return;

    this.eveService.openPanel();
    const question = `Peux-tu m'expliquer ${data.title} (${this.formatCurrency(data.value)}) ?`;
    this.eveService.sendMessage(question).subscribe();
    this.closeDrillDown();
  }
}
