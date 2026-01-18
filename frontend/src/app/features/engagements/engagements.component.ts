import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MockDataService, Engagement } from '../../core';
import { EngagementListComponent } from '../landing';

export interface EngagementFilters {
  entity: string;
  status: string[];
  year: string;
  service: string[];
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

  // Filter state
  readonly filters = signal<EngagementFilters>({
    entity: '',
    status: [],
    year: '',
    service: [],
  });

  // Filter options
  readonly statusOptions = ['waiting', 'received', 'processing', 'completed'];
  readonly serviceOptions = ['Corporate Tax', 'VAT', 'CTR'];
  readonly yearOptions = ['2024', '2023', '2022'];

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

      return true;
    });
  });

  readonly totalCount = computed(() => this.mockData.engagements().length);
  readonly filteredCount = computed(() => this.filteredEngagements().length);
  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return f.entity !== '' || f.status.length > 0 || f.year !== '' || f.service.length > 0;
  });

  ngOnInit(): void {
    this.loadFiltersFromSession();
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
    });
    this.saveFiltersToSession();
  }

  isStatusSelected(status: string): boolean {
    return this.filters().status.includes(status);
  }

  isServiceSelected(service: string): boolean {
    return this.filters().service.includes(service);
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
    this.router.navigate(['/engagements', engagement.id, 'dashboard']);
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
}
