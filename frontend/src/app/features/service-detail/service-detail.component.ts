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
import { LucideAngularModule, ArrowLeft, ChevronRight, ChevronUp, ChevronDown, X } from 'lucide-angular';
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
    FormsModule,
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
    chevronUp: ChevronUp,
    chevronDown: ChevronDown,
    x: X,
  };

  // Filter state
  readonly countryFilter = signal<string>('');
  readonly statusFilter = signal<EntityStatus | ''>('');

  // Sort state
  readonly sortColumn = signal<'name' | 'status' | 'progress' | 'lastUpdated'>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  // Status options for filter dropdown
  readonly statusOptions: { value: EntityStatus; label: string }[] = [
    { value: 'not-started', label: 'Not Started' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'completed', label: 'Completed' },
  ];

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

  readonly uniqueCountries = computed<{ flag: string; name: string }[]>(() => {
    const entityList = this.entities();
    const countryMap = new Map<string, string>();

    entityList.forEach(entity => {
      if (!countryMap.has(entity.countryFlag)) {
        // Extract country name from entity name or use flag as fallback
        const countryName = this.getCountryName(entity.countryFlag);
        countryMap.set(entity.countryFlag, countryName);
      }
    });

    return Array.from(countryMap.entries())
      .map(([flag, name]) => ({ flag, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly filteredAndSortedEntities = computed<ServiceEntity[]>(() => {
    let result = [...this.entities()];

    // Apply country filter (exact match for single-country, or contains for multi-country entities)
    const country = this.countryFilter();
    if (country) {
      result = result.filter(e => e.countryFlag === country || e.countryFlag.length > 4 && e.countryFlag.includes(country));
    }

    // Apply status filter
    const status = this.statusFilter();
    if (status) {
      result = result.filter(e => e.status === status);
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
    return this.countryFilter() !== '' || this.statusFilter() !== '';
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

  toggleSort(column: 'name' | 'status' | 'progress' | 'lastUpdated'): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  onSortKeydown(event: KeyboardEvent, column: 'name' | 'status' | 'progress' | 'lastUpdated'): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleSort(column);
    }
  }

  getAriaSortValue(column: 'name' | 'status' | 'progress' | 'lastUpdated'): 'ascending' | 'descending' | 'none' {
    if (this.sortColumn() !== column) return 'none';
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  clearFilters(): void {
    this.countryFilter.set('');
    this.statusFilter.set('');
  }

  private getStatusOrder(status: EntityStatus): number {
    const order: Record<EntityStatus, number> = {
      'not-started': 0,
      'in-progress': 1,
      'reviewing': 2,
      'completed': 3,
    };
    return order[status];
  }

  /**
   * Maps flag emoji to country name.
   * Note: Country flag emojis are composed of two regional indicator symbols,
   * each being a surrogate pair (2 UTF-16 code units), totaling 4 characters.
   */
  private getCountryName(flag: string): string {
    const countryNames: Record<string, string> = {
      '🇫🇷': 'France',
      '🇩🇪': 'Germany',
      '🇳🇱': 'Netherlands',
      '🇱🇺': 'Luxembourg',
      '🇪🇸': 'Spain',
      '🇧🇪': 'Belgium',
      '🇮🇹': 'Italy',
      '🇵🇹': 'Portugal',
      '🇦🇹': 'Austria',
      '🇨🇭': 'Switzerland',
      '🇬🇧': 'United Kingdom',
      '🇮🇪': 'Ireland',
      '🇵🇱': 'Poland',
    };
    // Extract first flag from multi-flag strings (e.g., 🇫🇷🇩🇪 → 🇫🇷)
    // Each flag emoji = 4 UTF-16 code units (2 regional indicators × 2 surrogates each)
    const firstFlag = flag.slice(0, 4);
    return countryNames[firstFlag] || flag;
  }
}
