import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, LayoutGrid, Table2, Search, Calendar, Briefcase, AlertTriangle, X, ChevronDown, ChevronRight, Eye, Upload, MessageSquare } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { MockDataService, Engagement, DocumentType, DocumentRequirementStatus, STATUS_LABELS } from '../../core';
import { RiskBadgeComponent, ProgressBarComponent, BadgeComponent } from '../../shared';

export type ViewMode = 'cards' | 'table';

export interface EngagementFilters {
  search: string;
  status: string[];
  year: string;
  service: string[];
  riskLevel: string[];
}

const VIEW_MODE_KEY = 'avengers_engagements_view_mode';
const FILTERS_STORAGE_KEY = 'avengers_engagement_filters';

@Component({
  selector: 'app-engagements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    RiskBadgeComponent,
    ProgressBarComponent,
    BadgeComponent
  ],
  templateUrl: './engagements.component.html',
  styleUrl: './engagements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ height: 0, opacity: 0 })),
      ]),
    ]),
  ],
})
export class EngagementsComponent implements OnInit {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Icons
  readonly icons = {
    layoutGrid: LayoutGrid,
    table: Table2,
    search: Search,
    calendar: Calendar,
    briefcase: Briefcase,
    alertTriangle: AlertTriangle,
    x: X,
    chevronDown: ChevronDown,
    chevronRight: ChevronRight,
    eye: Eye,
    upload: Upload,
    messageSquare: MessageSquare
  };

  readonly statusLabels = STATUS_LABELS;

  // View mode
  readonly viewMode = signal<ViewMode>('cards');

  // Expanded row (for table view)
  readonly expandedId = signal<string | null>(null);

  // Filter state
  readonly filters = signal<EngagementFilters>({
    search: '',
    status: [],
    year: '',
    service: [],
    riskLevel: [],
  });

  // Filter options
  readonly statusOptions = [
    { value: 'waiting', label: 'Pending' },
    { value: 'received', label: 'Received' },
    { value: 'processing', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];
  readonly serviceOptions = ['Corporate Tax', 'VAT', 'CTR'];
  readonly yearOptions = ['2025', '2024', '2023'];
  readonly riskLevelOptions = [
    { value: 'high', label: 'High', color: '#EF4444' },
    { value: 'medium', label: 'Medium', color: '#F59E0B' },
    { value: 'low', label: 'Low', color: '#10B981' }
  ];

  // Filtered engagements
  readonly filteredEngagements = computed(() => {
    const allEngagements = this.mockData.engagements();
    const currentFilters = this.filters();

    return allEngagements.filter(engagement => {
      // Search filter
      if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        const matchesEntity = engagement.entity.toLowerCase().includes(searchLower);
        const matchesService = engagement.service.toLowerCase().includes(searchLower);
        if (!matchesEntity && !matchesService) return false;
      }

      // Status filter
      if (currentFilters.status.length > 0 && !currentFilters.status.includes(engagement.status)) {
        return false;
      }

      // Year filter
      if (currentFilters.year && engagement.fiscalYear.toString() !== currentFilters.year) {
        return false;
      }

      // Service filter
      if (currentFilters.service.length > 0 && !currentFilters.service.includes(engagement.service)) {
        return false;
      }

      // Risk level filter
      if (currentFilters.riskLevel.length > 0 && !currentFilters.riskLevel.includes(engagement.riskLevel)) {
        return false;
      }

      return true;
    });
  });

  readonly totalCount = computed(() => this.mockData.engagements().length);
  readonly filteredCount = computed(() => this.filteredEngagements().length);

  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return f.search !== '' || f.status.length > 0 || f.year !== '' || f.service.length > 0 || f.riskLevel.length > 0;
  });

  readonly activeFilterCount = computed(() => {
    const f = this.filters();
    let count = 0;
    if (f.search) count++;
    count += f.status.length;
    if (f.year) count++;
    count += f.service.length;
    count += f.riskLevel.length;
    return count;
  });

  ngOnInit(): void {
    this.loadViewMode();

    // Check for query params first
    const params = this.route.snapshot.queryParams;
    const hasQueryFilters = params['status'] || params['risk'];

    if (hasQueryFilters) {
      const newFilters: EngagementFilters = {
        search: '',
        status: params['status'] ? params['status'].split(',') : [],
        year: '',
        service: [],
        riskLevel: params['risk'] ? [params['risk']] : [],
      };
      this.filters.set(newFilters);
      this.saveFiltersToSession();

      this.router.navigate([], {
        queryParams: {},
        replaceUrl: true,
      });
    } else {
      this.loadFiltersFromSession();
    }
  }

  // View mode methods
  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.saveViewMode(mode);
    // Reset expanded state when switching views
    this.expandedId.set(null);
  }

  private loadViewMode(): void {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
      if (saved === 'cards' || saved === 'table') {
        this.viewMode.set(saved);
      }
    } catch {
      // localStorage not available
    }
  }

  private saveViewMode(mode: ViewMode): void {
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // localStorage not available
    }
  }

  // Table expand/collapse
  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  isExpanded(id: string): boolean {
    return this.expandedId() === id;
  }

  // Filter methods
  onSearchChange(value: string): void {
    this.updateFilter('search', value);
  }

  toggleStatus(status: string): void {
    const current = this.filters().status;
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    this.updateFilter('status', updated);
  }

  onYearChange(year: string): void {
    this.updateFilter('year', year);
  }

  toggleService(service: string): void {
    const current = this.filters().service;
    const updated = current.includes(service)
      ? current.filter(s => s !== service)
      : [...current, service];
    this.updateFilter('service', updated);
  }

  toggleRiskLevel(riskLevel: string): void {
    const current = this.filters().riskLevel;
    const updated = current.includes(riskLevel)
      ? current.filter(r => r !== riskLevel)
      : [...current, riskLevel];
    this.updateFilter('riskLevel', updated);
  }

  clearFilters(): void {
    this.filters.set({
      search: '',
      status: [],
      year: '',
      service: [],
      riskLevel: [],
    });
    this.saveFiltersToSession();
  }

  isStatusSelected(status: string): boolean {
    return this.filters().status.includes(status);
  }

  isServiceSelected(service: string): boolean {
    return this.filters().service.includes(service);
  }

  isRiskLevelSelected(riskLevel: string): boolean {
    return this.filters().riskLevel.includes(riskLevel);
  }

  private updateFilter<K extends keyof EngagementFilters>(key: K, value: EngagementFilters[K]): void {
    this.filters.update(f => ({ ...f, [key]: value }));
    this.saveFiltersToSession();
  }

  private saveFiltersToSession(): void {
    try {
      sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(this.filters()));
    } catch {
      // Session storage not available
    }
  }

  private loadFiltersFromSession(): void {
    try {
      const saved = sessionStorage.getItem(FILTERS_STORAGE_KEY);
      if (saved) {
        this.filters.set(JSON.parse(saved));
      }
    } catch {
      // Session storage not available or invalid data
    }
  }

  // Navigation methods
  onViewDetails(engagement: Engagement): void {
    this.router.navigate(['/app/engagements', engagement.id]);
  }

  onUploadDocs(engagement: Engagement): void {
    this.router.navigate(['/app/documents'], {
      queryParams: { engagement: engagement.id },
    });
  }

  onAskEve(engagement: Engagement): void {
    this.router.navigate(['/app/eve'], {
      queryParams: { engagement: engagement.id },
    });
  }

  // Helpers
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getDocsCount(engagement: Engagement): string {
    const uploaded = engagement.documentRequirements?.filter(
      r => r.status === 'uploaded' || r.status === 'validated'
    ).length ?? engagement.documentsUploaded.length;
    const total = engagement.documentRequirements?.filter(r => r.required).length
      ?? engagement.documentsRequired.length;
    return `${uploaded}/${total}`;
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

  trackById(index: number, engagement: Engagement): string {
    return engagement.id;
  }
}
