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
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  ArrowLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-angular';
import {
  ServiceEntityService,
  Service,
  ServiceEntity,
  EntityStatus,
} from '../../core/services/service-entity.service';
import {
  PieChartComponent,
  PieChartData,
} from '../../shared/components/charts/pie-chart.component';
import {
  StackedBarChartComponent,
  StackedBarDataPoint,
} from '../../shared/components/charts/stacked-bar-chart.component';
import { ServiceDocumentsComponent } from './components/service-documents/service-documents.component';
import { ServiceInsightsComponent } from './components/service-insights/service-insights.component';
import { ServiceContactsComponent } from './components/service-contacts/service-contacts.component';

export type ServiceTab = 'entities' | 'documents' | 'insights' | 'contacts';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    PieChartComponent,
    StackedBarChartComponent,
    ServiceDocumentsComponent,
    ServiceInsightsComponent,
    ServiceContactsComponent,
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
    chevronUp: ChevronUp,
    chevronDown: ChevronDown,
    x: X,
  };

  // Filter state - Multi-country filters
  readonly yearFilter = signal<string>('');
  readonly jurisdictionFilter = signal<string>('');
  readonly entityFilter = signal<string>('');
  readonly subfundFilter = signal<string>('');

  // Sort state
  readonly sortColumn = signal<'name' | 'status' | 'progress' | 'lastUpdated'>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

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

  // Unique filter options computed from entities
  readonly uniqueYears = computed<number[]>(() => {
    const entityList = this.entities();
    const years = new Set<number>();
    entityList.forEach(e => {
      if (e.year) years.add(e.year);
    });
    return Array.from(years).sort((a, b) => b - a); // Most recent first
  });

  readonly uniqueJurisdictions = computed<string[]>(() => {
    const entityList = this.entities();
    const jurisdictions = new Set<string>();
    entityList.forEach(e => {
      if (e.jurisdiction) jurisdictions.add(e.jurisdiction);
    });
    return Array.from(jurisdictions).sort();
  });

  readonly uniqueEntityNames = computed<string[]>(() => {
    const entityList = this.entities();
    const names = new Set<string>();
    entityList.forEach(e => {
      if (e.entity) names.add(e.entity);
    });
    return Array.from(names).sort();
  });

  readonly uniqueSubfunds = computed<string[]>(() => {
    const entityList = this.entities();
    const subfunds = new Set<string>();
    entityList.forEach(e => {
      if (e.subfund) subfunds.add(e.subfund);
    });
    return Array.from(subfunds).sort();
  });

  readonly filteredAndSortedEntities = computed<ServiceEntity[]>(() => {
    let result = [...this.entities()];

    // Apply year filter
    const year = this.yearFilter();
    if (year) {
      result = result.filter(e => e.year?.toString() === year);
    }

    // Apply jurisdiction filter
    const jurisdiction = this.jurisdictionFilter();
    if (jurisdiction) {
      result = result.filter(e => e.jurisdiction === jurisdiction);
    }

    // Apply entity filter
    const entity = this.entityFilter();
    if (entity) {
      result = result.filter(e => e.entity === entity);
    }

    // Apply subfund filter
    const subfund = this.subfundFilter();
    if (subfund) {
      result = result.filter(e => e.subfund === subfund);
    }

    // Apply sorting
    const column = this.sortColumn();
    const direction = this.sortDirection();

    result.sort((a, b) => {
      let comparison = 0;

      switch (column) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = this.getStatusOrder(a.status) - this.getStatusOrder(b.status);
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'lastUpdated':
          comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return result;
  });

  readonly hasActiveFilters = computed<boolean>(() => {
    return (
      this.yearFilter() !== '' ||
      this.jurisdictionFilter() !== '' ||
      this.entityFilter() !== '' ||
      this.subfundFilter() !== ''
    );
  });

  // Sorted entities for Entities tab (no filtering)
  readonly sortedEntities = computed<ServiceEntity[]>(() => {
    const result = [...this.entities()];
    const column = this.sortColumn();
    const direction = this.sortDirection();

    result.sort((a, b) => {
      let comparison = 0;

      switch (column) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = this.getStatusOrder(a.status) - this.getStatusOrder(b.status);
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'lastUpdated':
          comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return result;
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
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
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
      reviewing: 'Reviewing',
      completed: 'Completed',
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

  toggleSort(column: 'name' | 'status' | 'progress' | 'lastUpdated'): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  onSortKeydown(
    event: KeyboardEvent,
    column: 'name' | 'status' | 'progress' | 'lastUpdated'
  ): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleSort(column);
    }
  }

  getAriaSortValue(
    column: 'name' | 'status' | 'progress' | 'lastUpdated'
  ): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  clearFilters(): void {
    this.yearFilter.set('');
    this.jurisdictionFilter.set('');
    this.entityFilter.set('');
    this.subfundFilter.set('');
  }

  private getStatusOrder(status: EntityStatus): number {
    const order: Record<EntityStatus, number> = {
      'not-started': 0,
      'in-progress': 1,
      reviewing: 2,
      completed: 3,
    };
    return order[status];
  }
}
