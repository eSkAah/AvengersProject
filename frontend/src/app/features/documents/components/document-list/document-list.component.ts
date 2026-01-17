import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Document, Engagement, DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '../../../../core';
import { BadgeComponent, ButtonComponent } from '../../../../shared';

type SortColumn = 'name' | 'type' | 'status' | 'uploadedAt' | 'size';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, ButtonComponent],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentListComponent {
  @Input({ required: true }) documents: Document[] = [];
  @Input() engagements: Engagement[] = [];

  @Output() documentClick = new EventEmitter<Document>();
  @Output() download = new EventEmitter<Document>();
  @Output() preview = new EventEmitter<Document>();
  @Output() askEve = new EventEmitter<Document>();

  readonly typeLabels = DOCUMENT_TYPE_LABELS;
  readonly statusLabels = DOCUMENT_STATUS_LABELS;

  sortColumn = signal<SortColumn>('uploadedAt');
  sortDirection = signal<SortDirection>('desc');

  get sortedDocuments(): Document[] {
    const column = this.sortColumn();
    const direction = this.sortDirection();

    return [...this.documents].sort((a, b) => {
      let comparison = 0;

      switch (column) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'uploadedAt':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });
  }

  onSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: SortColumn): string {
    if (this.sortColumn() !== column) return '↕️';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  getEngagementName(engagementId: string): string {
    const engagement = this.engagements.find((e) => e.id === engagementId);
    return engagement ? `${engagement.countryFlag} ${engagement.entity}` : engagementId;
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      pending: 'warning',
      analyzing: 'info',
      analyzed: 'success',
      error: 'error',
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

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  trackById(index: number, doc: Document): string {
    return doc.id;
  }
}
