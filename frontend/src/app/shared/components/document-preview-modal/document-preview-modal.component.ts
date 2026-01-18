import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import { ButtonComponent } from '../button/button.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';

export interface ExcelPreviewData {
  document_id: string;
  document_name: string;
  sheet_name: string;
  headers: string[];
  rows: Record<string, unknown>[];
  total_rows: number;
  preview_rows: number;
  truncated: boolean;
}

export interface DocumentPreviewData {
  document_id: string;
  document_name: string;
  format: string;
  preview_type: 'table' | 'pdf' | 'error';
  content_url?: string;
  table_data?: ExcelPreviewData;
}

@Component({
  selector: 'app-document-preview-modal',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ButtonComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <!-- Header -->
        <header class="modal-header">
          <div class="modal-title">
            <lucide-icon name="file-text" [size]="20"></lucide-icon>
            <span>{{ documentName }}</span>
          </div>
          <div class="modal-actions">
            <app-button variant="secondary" size="sm" (clicked)="download()">
              <lucide-icon name="download" [size]="16"></lucide-icon>
              Télécharger
            </app-button>
            <button class="close-button" (click)="close.emit()">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>
        </header>

        <!-- Content -->
        <main class="modal-body">
          @if (loading()) {
            <div class="loading-state">
              <app-skeleton height="400px"></app-skeleton>
            </div>
          } @else if (error()) {
            <div class="error-state">
              <lucide-icon name="alert-circle" [size]="48" class="error-icon"></lucide-icon>
              <p>{{ error() }}</p>
              <app-button variant="secondary" (clicked)="loadPreview()">
                Réessayer
              </app-button>
            </div>
          } @else if (previewData(); as data) {
            @if (data.preview_type === 'table' && data.table_data) {
              <div class="table-preview">
                <div class="table-info">
                  <span class="sheet-name">{{ data.table_data.sheet_name }}</span>
                  <span class="row-count">
                    {{ data.table_data.preview_rows }} / {{ data.table_data.total_rows }} lignes
                    @if (data.table_data.truncated) {
                      <span class="truncated-badge">(aperçu)</span>
                    }
                  </span>
                </div>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        @for (header of data.table_data.headers; track header) {
                          <th>{{ header }}</th>
                        }
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of data.table_data.rows; track $index) {
                        <tr>
                          @for (header of data.table_data.headers; track header) {
                            <td>{{ formatCellValue(row[header]) }}</td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            } @else if (data.preview_type === 'pdf' && pdfUrl()) {
              <div class="pdf-preview">
                <iframe
                  [src]="pdfUrl()"
                  type="application/pdf"
                  width="100%"
                  height="100%"
                ></iframe>
              </div>
            }
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 1000px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.2s ease-out;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #1f2937;
    }

    .modal-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .close-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s ease;

      &:hover {
        background: #f3f4f6;
        color: #1f2937;
      }
    }

    .modal-body {
      flex: 1;
      overflow: hidden;
      min-height: 400px;
    }

    .loading-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      height: 100%;
    }

    .error-state {
      gap: 1rem;
      color: #6b7280;

      .error-icon {
        color: #ef4444;
      }
    }

    .table-preview {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .table-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.5rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.875rem;
    }

    .sheet-name {
      font-weight: 500;
      color: #374151;
    }

    .row-count {
      color: #6b7280;
    }

    .truncated-badge {
      background: #fef3c7;
      color: #92400e;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-left: 0.5rem;
    }

    .table-container {
      flex: 1;
      overflow: auto;
      max-height: calc(90vh - 150px);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    th, td {
      padding: 0.625rem 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
    }

    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    td {
      color: #4b5563;
    }

    tbody tr:hover {
      background: #f9fafb;
    }

    .pdf-preview {
      height: calc(90vh - 100px);

      iframe {
        border: none;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentPreviewModalComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  @Input({ required: true }) documentId!: string;
  @Input({ required: true }) documentName!: string;
  @Input() documentFormat = '';

  @Output() close = new EventEmitter<void>();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly previewData = signal<DocumentPreviewData | null>(null);
  readonly pdfUrl = signal<SafeResourceUrl | null>(null);

  private readonly apiUrl = environment.apiUrl;

  ngOnInit(): void {
    this.loadPreview();
  }

  ngOnDestroy(): void {
    // Clean up any blob URLs
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  loadPreview(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<DocumentPreviewData>(`${this.apiUrl}/documents/${this.documentId}/preview`)
      .subscribe({
        next: (data) => {
          this.previewData.set(data);

          if (data.preview_type === 'pdf' && data.content_url) {
            // For PDF, create safe URL
            const fullUrl = `${this.apiUrl}${data.content_url.replace('/api', '')}`;
            this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl));
          }

          this.loading.set(false);
        },
        error: (err) => {
          console.error('Preview error:', err);
          this.error.set(
            err.error?.detail || 'Impossible de charger l\'aperçu du document.'
          );
          this.loading.set(false);
        },
      });
  }

  download(): void {
    const url = `${this.apiUrl}/documents/${this.documentId}/content`;
    window.open(url, '_blank');
  }

  formatCellValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'number') {
      // Format numbers with locale
      return value.toLocaleString('fr-FR');
    }

    return String(value);
  }
}
