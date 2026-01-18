import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchBarComponent, ButtonComponent } from '../../../../shared';
import { DocumentType, DocumentStatus, Engagement } from '../../../../core';

export interface DocumentFilters {
  search: string;
  type: DocumentType | null;
  status: DocumentStatus | null;
  engagementId: string | null;
}

@Component({
  selector: 'app-document-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchBarComponent, ButtonComponent],
  templateUrl: './document-filters.component.html',
  styleUrl: './document-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentFiltersComponent {
  @Input() engagements: Engagement[] = [];

  @Output() filtersChange = new EventEmitter<DocumentFilters>();

  filters = signal<DocumentFilters>({
    search: '',
    type: null,
    status: null,
    engagementId: null,
  });

  readonly documentTypes: { value: DocumentType; label: string }[] = [
    { value: 'general_ledger', label: 'General Ledger' },
    { value: 'trial_balance', label: 'Trial Balance' },
    { value: 'bank_statement', label: 'Bank Statement' },
    { value: 'tax_return', label: 'Tax Return' },
  ];

  readonly documentStatuses: { value: DocumentStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'analyzing', label: 'Analyzing' },
    { value: 'analyzed', label: 'Analyzed' },
    { value: 'error', label: 'Error' },
  ];

  onSearchChange(value: string): void {
    this.updateFilters({ search: value });
  }

  onTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.updateFilters({ type: value ? (value as DocumentType) : null });
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.updateFilters({ status: value ? (value as DocumentStatus) : null });
  }

  onEngagementChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.updateFilters({ engagementId: value || null });
  }

  clearFilters(): void {
    this.filters.set({
      search: '',
      type: null,
      status: null,
      engagementId: null,
    });
    this.filtersChange.emit(this.filters());
  }

  hasActiveFilters(): boolean {
    const f = this.filters();
    return !!(f.search || f.type || f.status || f.engagementId);
  }

  private updateFilters(partial: Partial<DocumentFilters>): void {
    this.filters.update((current) => ({ ...current, ...partial }));
    this.filtersChange.emit(this.filters());
  }
}
