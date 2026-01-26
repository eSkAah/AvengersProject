import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, ArrowLeft, ChevronRight } from 'lucide-angular';
import { ServiceEntityService, Service, ServiceEntity, EntityStatus } from '../../core/services/service-entity.service';
import { PieChartComponent, PieChartData } from '../../shared/components/charts/pie-chart.component';
import { StackedBarChartComponent, StackedBarDataPoint } from '../../shared/components/charts/stacked-bar-chart.component';
import { ServiceDocumentsComponent } from './components/service-documents/service-documents.component';
import { ServiceInsightsComponent } from './components/service-insights/service-insights.component';

export type ServiceTab = 'entities' | 'documents' | 'insights';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    PieChartComponent,
    StackedBarChartComponent,
    ServiceDocumentsComponent,
    ServiceInsightsComponent,
  ],
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly serviceEntityService = inject(ServiceEntityService);

  readonly icons = {
    arrowLeft: ArrowLeft,
    chevronRight: ChevronRight,
  };

  readonly serviceId = signal<string | null>(null);
  readonly activeTab = signal<ServiceTab>('entities');
  readonly loading = signal<boolean>(true);

  readonly service = computed<Service | undefined>(() => {
    const id = this.serviceId();
    if (!id) return undefined;
    return this.serviceEntityService.getServiceById(id);
  });

  readonly entities = computed<ServiceEntity[]>(() => {
    const id = this.serviceId();
    if (!id) return [];
    return this.serviceEntityService.getEntitiesByService(id);
  });

  readonly progressionData = computed<StackedBarDataPoint[]>(() => {
    const id = this.serviceId();
    if (!id) return [];
    return this.serviceEntityService.getProgressionHistory(id);
  });

  readonly pieChartData = computed<PieChartData | null>(() => {
    const entityList = this.entities();
    if (entityList.length === 0) return null;

    const counts = {
      completed: entityList.filter(e => e.status === 'completed').length,
      reviewing: entityList.filter(e => e.status === 'reviewing').length,
      inProgress: entityList.filter(e => e.status === 'in-progress').length,
      notStarted: entityList.filter(e => e.status === 'not-started').length,
    };

    const total = entityList.length;

    return {
      title: 'Entity Distribution',
      total,
      items: [
        {
          label: 'Completed',
          value: counts.completed,
          percentage: (counts.completed / total) * 100,
          color: '#10B981',
        },
        {
          label: 'Reviewing',
          value: counts.reviewing,
          percentage: (counts.reviewing / total) * 100,
          color: '#F59E0B',
        },
        {
          label: 'In Progress',
          value: counts.inProgress,
          percentage: (counts.inProgress / total) * 100,
          color: '#3B82F6',
        },
        {
          label: 'Not Started',
          value: counts.notStarted,
          percentage: (counts.notStarted / total) * 100,
          color: '#E5E7EB',
        },
      ].filter(item => item.value > 0),
    };
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        this.serviceId.set(id);
        this.loading.set(false);
      });
  }

  setActiveTab(tab: ServiceTab): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.router.navigate(['/app']);
  }

  getStatusLabel(status: EntityStatus): string {
    const labels: Record<EntityStatus, string> = {
      'not-started': 'Not Started',
      'in-progress': 'In Progress',
      'reviewing': 'Reviewing',
      'completed': 'Completed',
    };
    return labels[status];
  }

  getStatusClass(status: EntityStatus): string {
    return `status-badge--${status}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  navigateToEntity(engagementId: string): void {
    this.router.navigate(['/app/entities', engagementId]);
  }
}
