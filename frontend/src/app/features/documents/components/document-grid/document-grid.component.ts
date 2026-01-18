import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Document, DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '../../../../core';
import { BadgeComponent } from '../../../../shared';

@Component({
  selector: 'app-document-grid',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BadgeComponent],
  templateUrl: './document-grid.component.html',
  styleUrl: './document-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentGridComponent {
  @Input({ required: true }) documents: Document[] = [];

  @Output() documentClick = new EventEmitter<Document>();
  @Output() download = new EventEmitter<Document>();
  @Output() preview = new EventEmitter<Document>();
  @Output() askEve = new EventEmitter<Document>();

  readonly typeLabels = DOCUMENT_TYPE_LABELS;
  readonly statusLabels = DOCUMENT_STATUS_LABELS;

  readonly typeIcons: Record<string, string> = {
    general_ledger: 'book-open',
    trial_balance: 'bar-chart-3',
    bank_statement: 'landmark',
    tax_return: 'clipboard-list',
    financial_statement: 'file-text',
  };

  getTypeIcon(type: string): string {
    return this.typeIcons[type] || 'file-text';
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
    return date.toLocaleDateString('en-US', {
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

  truncateName(name: string, maxLength = 25): string {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const baseName = name.substring(0, name.lastIndexOf('.'));
    const truncated = baseName.substring(0, maxLength - 3 - (ext?.length || 0));
    return `${truncated}...${ext}`;
  }

  trackById(index: number, doc: Document): string {
    return doc.id;
  }
}
