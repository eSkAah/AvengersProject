import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MockDataService, Engagement, DocumentType, DocumentRequirementStatus } from '../../core';
import { EngagementListComponent } from '../landing';

export interface EngagementFilters {
  entity: string;
  status: string[];
  year: string;
  service: string[];
  riskLevel: string[];
}

const FILTERS_STORAGE_KEY = 'avengers_engagement_filters';

@Component({
  selector: 'app-engagements',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EngagementListComponent],
  templateUrl: './engagements.component.html',
  styleUrl: './engagements.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementsComponent implements OnInit {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Filter state
  readonly filters = signal<EngagementFilters>({
    entity: '',
    status: [],
    year: '',
    service: [],
    riskLevel: [],
  });

  // Filter options
  readonly statusOptions = ['waiting', 'received', 'processing', 'completed'];
  readonly serviceOptions = ['Corporate Tax', 'VAT', 'CTR'];
  readonly yearOptions = ['2024', '2023', '2022'];
  readonly riskLevelOptions = ['high', 'medium', 'low'];

  // Unique entities from data
  readonly entityOptions = computed(() => {
    const entities = this.mockData.engagements().map(e => e.entity);
    return [...new Set(entities)].sort();
  });

  // Filtered engagements
  readonly filteredEngagements = computed(() => {
    const allEngagements = this.mockData.engagements();
    const currentFilters = this.filters();

    return allEngagements.filter(engagement => {
      // Entity filter (search)
      if (currentFilters.entity && !engagement.entity.toLowerCase().includes(currentFilters.entity.toLowerCase())) {
        return false;
      }

      // Status filter (multi-select)
      if (currentFilters.status.length > 0 && !currentFilters.status.includes(engagement.status)) {
        return false;
      }

      // Year filter
      if (currentFilters.year && !engagement.dueDate.startsWith(currentFilters.year)) {
        return false;
      }

      // Service filter (multi-select)
      if (currentFilters.service.length > 0 && !currentFilters.service.includes(engagement.service)) {
        return false;
      }

      // Risk level filter (multi-select)
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
    return f.entity !== '' || f.status.length > 0 || f.year !== '' || f.service.length > 0 || f.riskLevel.length > 0;
  });

  ngOnInit(): void {
    // Check for query params first (takes priority over session storage)
    const params = this.route.snapshot.queryParams;
    const hasQueryFilters = params['status'] || params['risk'];

    if (hasQueryFilters) {
      // Apply filters from query params
      const newFilters: EngagementFilters = {
        entity: '',
        status: params['status'] ? params['status'].split(',') : [],
        year: '',
        service: [],
        riskLevel: params['risk'] ? [params['risk']] : [],
      };
      this.filters.set(newFilters);
      this.saveFiltersToSession();

      // Clear query params from URL to keep it clean
      this.router.navigate([], {
        queryParams: {},
        replaceUrl: true,
      });
    } else {
      this.loadFiltersFromSession();
    }
  }

  // Entity search
  onEntitySearch(value: string): void {
    this.updateFilter('entity', value);
  }

  // Status toggle
  toggleStatus(status: string): void {
    const current = this.filters().status;
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    this.updateFilter('status', updated);
  }

  // Year select
  onYearChange(year: string): void {
    this.updateFilter('year', year);
  }

  // Service toggle
  toggleService(service: string): void {
    const current = this.filters().service;
    const updated = current.includes(service)
      ? current.filter(s => s !== service)
      : [...current, service];
    this.updateFilter('service', updated);
  }

  // Clear all filters
  clearFilters(): void {
    this.filters.set({
      entity: '',
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

  // Risk level toggle
  toggleRiskLevel(riskLevel: string): void {
    const current = this.filters().riskLevel;
    const updated = current.includes(riskLevel)
      ? current.filter(r => r !== riskLevel)
      : [...current, riskLevel];
    this.updateFilter('riskLevel', updated);
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

  onViewDashboard(engagement: Engagement): void {
    this.router.navigate(['/engagements', engagement.id]);
  }

  onUploadDocs(engagement: Engagement): void {
    this.router.navigate(['/documents'], {
      queryParams: { engagement: engagement.id },
    });
  }

  onAskEve(engagement: Engagement): void {
    this.router.navigate(['/eve'], {
      queryParams: { engagement: engagement.id },
    });
  }

  /**
   * Handle upload for a specific document type within an engagement
   */
  onUploadDocType(event: { engagement: Engagement; docType: DocumentType }): void {
    this.router.navigate(['/documents'], {
      queryParams: {
        tab: 'upload',
        entity: event.engagement.entity,
        type: event.docType,
      },
    });
  }

  /**
   * Handle viewing documents by status (uploaded/validated)
   */
  onViewDocsByStatus(event: { engagement: Engagement; status: DocumentRequirementStatus; type: DocumentType }): void {
    this.router.navigate(['/documents'], {
      queryParams: {
        entity: event.engagement.entity,
        type: event.type,
        status: event.status === 'validated' ? 'analyzed' : 'analyzing',
      },
    });
  }
}
