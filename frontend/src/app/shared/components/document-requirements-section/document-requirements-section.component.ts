import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  DocumentRequirement,
  DocumentRequirementStatus,
} from '../../../core/models/engagement.model';
import {
  Document,
  DocumentType,
  DocumentStatus,
  DOCUMENT_STATUS_LABELS,
} from '../../../core/models/document.model';
import { BadgeComponent } from '../badge/badge.component';

export interface DocumentUploadEvent {
  type: DocumentType;
  fiscalYear: number;
  files: FileList;
}

export interface DocumentRequirementWithFile extends DocumentRequirement {
  matchedDocument?: Document;
  yearMismatch?: boolean;
}

@Component({
  selector: 'app-document-requirements-section',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BadgeComponent],
  template: `
    <div class="document-requirements">
      <div class="requirements-header">
        <span class="requirements-header__title">
          Required Documents (Fiscal Year {{ fiscalYear }})
        </span>
        <span
          class="requirements-header__count"
          [class]="'requirements-header__count--' + overallStatus()"
        >
          {{ validatedCount() }}/{{ requiredCount() }} validated
        </span>
      </div>

      <div class="requirements-list">
        @for (item of enrichedRequirements(); track item.type) {
          <div
            class="requirement-item"
            [class.requirement-item--validated]="item.status === 'validated'"
            [class.requirement-item--uploaded]="item.status === 'uploaded'"
            [class.requirement-item--missing]="item.status === 'missing'"
            [class.requirement-item--optional]="!item.required"
            [class.requirement-item--year-mismatch]="item.status === 'year_mismatch'"
          >
            <!-- Status Icon -->
            <div class="requirement-item__status">
              @switch (item.status) {
                @case ('validated') {
                  <lucide-icon
                    name="check-circle"
                    [size]="20"
                    class="icon--validated"
                  ></lucide-icon>
                }
                @case ('uploaded') {
                  <lucide-icon
                    name="clock"
                    [size]="20"
                    class="icon--uploaded"
                  ></lucide-icon>
                }
                @case ('missing') {
                  @if (item.required) {
                    <lucide-icon
                      name="alert-circle"
                      [size]="20"
                      class="icon--missing-required"
                    ></lucide-icon>
                  } @else {
                    <lucide-icon
                      name="circle"
                      [size]="20"
                      class="icon--missing-optional"
                    ></lucide-icon>
                  }
                }
                @case ('year_mismatch') {
                  <lucide-icon
                    name="alert-triangle"
                    [size]="20"
                    class="icon--year-mismatch"
                  ></lucide-icon>
                }
              }
            </div>

            <!-- Requirement Info -->
            <div class="requirement-item__content">
              <div class="requirement-item__header">
                <span class="requirement-item__label">
                  {{ item.label }} {{ item.fiscalYear }}
                  @if (!item.required) {
                    <span class="requirement-item__optional">(optional)</span>
                  }
                </span>
                @if (item.status === 'year_mismatch') {
                  <app-badge variant="warning" size="sm">
                    Need {{ item.fiscalYear }}
                  </app-badge>
                }
              </div>

              <!-- Document attached or upload zone -->
              @if (item.status === 'year_mismatch' && item.matchedDocument) {
                <!-- Year mismatch: show found document + upload zone -->
                <div class="requirement-item__found-doc">
                  <span class="found-doc__label">Similar document found:</span>
                  <div
                    class="found-doc__info"
                    (click)="onDocumentClick(item.matchedDocument!)"
                  >
                    <lucide-icon
                      [name]="getDocumentIcon(item.matchedDocument.name)"
                      [size]="14"
                    ></lucide-icon>
                    <span class="found-doc__name">{{ item.matchedDocument.name }}</span>
                    <app-badge variant="warning" size="sm">
                      {{ item.matchedDocument.year }}
                    </app-badge>
                  </div>
                </div>
                <div
                  class="requirement-item__upload-zone"
                  [class.requirement-item__upload-zone--drag-over]="
                    dragOverType() === item.type
                  "
                  (click)="triggerFileInput(item)"
                  (dragover)="onDragOver($event, item.type)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event, item)"
                >
                  <lucide-icon name="upload" [size]="16"></lucide-icon>
                  <span>Upload {{ item.fiscalYear }} version</span>
                </div>
                <input
                  #fileInput
                  type="file"
                  class="hidden-input"
                  [attr.data-type]="item.type"
                  [attr.data-year]="item.fiscalYear"
                  (change)="onFileSelected($event, item)"
                  accept=".pdf,.xlsx,.xls,.csv"
                />
              } @else if (item.matchedDocument && item.status !== 'missing') {
                <!-- Document found with correct year -->
                <div
                  class="requirement-item__document"
                  (click)="onDocumentClick(item.matchedDocument!)"
                >
                  <lucide-icon
                    [name]="getDocumentIcon(item.matchedDocument.name)"
                    [size]="16"
                    class="doc-icon"
                  ></lucide-icon>
                  <span class="doc-name">{{ item.matchedDocument.name }}</span>
                  <app-badge
                    [variant]="getStatusVariant(item.matchedDocument.status)"
                    size="sm"
                  >
                    {{ getStatusLabel(item.matchedDocument.status) }}
                  </app-badge>
                  <lucide-icon
                    name="external-link"
                    [size]="14"
                    class="doc-link-icon"
                  ></lucide-icon>
                </div>
              } @else {
                <!-- No document found -->
                <div
                  class="requirement-item__upload-zone"
                  [class.requirement-item__upload-zone--drag-over]="
                    dragOverType() === item.type
                  "
                  (click)="triggerFileInput(item)"
                  (dragover)="onDragOver($event, item.type)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event, item)"
                >
                  <lucide-icon name="upload" [size]="16"></lucide-icon>
                  <span>Drop or click to upload</span>
                </div>
                <input
                  #fileInput
                  type="file"
                  class="hidden-input"
                  [attr.data-type]="item.type"
                  [attr.data-year]="item.fiscalYear"
                  (change)="onFileSelected($event, item)"
                  accept=".pdf,.xlsx,.xls,.csv"
                />
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .document-requirements {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .requirements-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e5e7eb;

        &__title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        &__count {
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;

          &--complete {
            color: #059669;
            background: rgba(5, 150, 105, 0.1);
          }

          &--partial {
            color: #d97706;
            background: rgba(217, 119, 6, 0.1);
          }

          &--empty {
            color: #dc2626;
            background: rgba(220, 38, 38, 0.1);
          }
        }
      }

      .requirements-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .requirement-item {
        display: flex;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: #fafafa;
        border-radius: 0.5rem;
        border: 1px solid transparent;
        transition: all 0.2s ease;

        &:hover {
          background: #f5f5f5;
        }

        &--validated {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.2);
        }

        &--uploaded {
          background: rgba(245, 158, 11, 0.05);
          border-color: rgba(245, 158, 11, 0.2);
        }

        &--missing {
          background: #fafafa;

          &:not(.requirement-item--optional) {
            background: rgba(239, 68, 68, 0.03);
            border-color: rgba(239, 68, 68, 0.15);
          }
        }

        &--year-mismatch {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.3);
        }

        &__status {
          display: flex;
          align-items: flex-start;
          padding-top: 0.125rem;
          flex-shrink: 0;

          .icon--validated {
            color: #10b981;
          }

          .icon--uploaded {
            color: #f59e0b;
          }

          .icon--missing-required {
            color: #ef4444;
          }

          .icon--missing-optional {
            color: #9ca3af;
          }

          .icon--year-mismatch {
            color: #f59e0b;
          }
        }

        &__content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-width: 0;
        }

        &__header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        &__label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        &__optional {
          font-size: 0.75rem;
          color: #9ca3af;
          font-style: italic;
          font-weight: 400;
        }

        &__document {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.15s ease;

          &:hover {
            background: #f9fafb;
            border-color: #d1d5db;

            .doc-link-icon {
              opacity: 1;
            }
          }

          .doc-icon {
            color: #ffe600;
            flex-shrink: 0;
          }

          .doc-name {
            flex: 1;
            font-size: 0.8125rem;
            color: #374151;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .doc-link-icon {
            color: #9ca3af;
            opacity: 0;
            transition: opacity 0.15s ease;
            flex-shrink: 0;
          }
        }

        &__upload-zone {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: white;
          border: 2px dashed #d1d5db;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.15s ease;
          color: #6b7280;
          font-size: 0.8125rem;

          &:hover {
            border-color: #ffe600;
            background: rgba(255, 230, 0, 0.05);
            color: #374151;
          }

          &--drag-over {
            border-color: #ffe600;
            background: rgba(255, 230, 0, 0.1);
            color: #374151;
          }

          lucide-icon {
            color: #9ca3af;
          }

          &:hover lucide-icon,
          &--drag-over lucide-icon {
            color: #ffe600;
          }
        }

        &__found-doc {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
      }

      .found-doc {
        &__label {
          font-size: 0.75rem;
          color: #6b7280;
          font-style: italic;
        }

        &__info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.625rem;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.15s ease;

          &:hover {
            background: rgba(245, 158, 11, 0.15);
            border-color: rgba(245, 158, 11, 0.3);
          }

          lucide-icon {
            color: #f59e0b;
            flex-shrink: 0;
          }
        }

        &__name {
          flex: 1;
          font-size: 0.8125rem;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .hidden-input {
        display: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentRequirementsSectionComponent implements OnChanges {
  @Input() requirements: DocumentRequirement[] = [];
  @Input() documents: Document[] = [];
  @Input() fiscalYear = new Date().getFullYear();

  @Output() uploadFile = new EventEmitter<DocumentUploadEvent>();
  @Output() documentClick = new EventEmitter<Document>();

  private readonly requirementsSignal = signal<DocumentRequirement[]>([]);
  private readonly documentsSignal = signal<Document[]>([]);
  readonly dragOverType = signal<DocumentType | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requirements']) {
      this.requirementsSignal.set(this.requirements);
    }
    if (changes['documents']) {
      this.documentsSignal.set(this.documents);
    }
  }

  readonly enrichedRequirements = computed<DocumentRequirementWithFile[]>(() => {
    const reqs = this.requirementsSignal();
    const docs = this.documentsSignal();

    return reqs.map((req) => {
      // Find matching document by type
      const matchedDoc = docs.find((d) => d.type === req.type);

      // Check if year matches
      const yearMismatch =
        matchedDoc && matchedDoc.year !== req.fiscalYear;

      // Update status based on document match AND year validation
      let status = req.status;
      if (matchedDoc) {
        if (yearMismatch) {
          // Document found but wrong year - NOT validated
          status = 'year_mismatch';
        } else if (matchedDoc.status === 'analyzed') {
          // Correct year + analyzed = validated
          status = 'validated';
        } else if (
          matchedDoc.status === 'uploaded' ||
          matchedDoc.status === 'analyzing' ||
          matchedDoc.status === 'pending'
        ) {
          // Correct year but still processing
          status = 'uploaded';
        }
      }

      return {
        ...req,
        status,
        matchedDocument: matchedDoc,
        yearMismatch: yearMismatch ?? false,
      };
    });
  });

  readonly requiredCount = computed(
    () => this.requirementsSignal().filter((r) => r.required).length
  );

  readonly validatedCount = computed(
    () =>
      this.enrichedRequirements().filter(
        (r) => r.required && r.status === 'validated' && !r.yearMismatch
      ).length
  );

  readonly overallStatus = computed((): 'complete' | 'partial' | 'empty' => {
    const total = this.requiredCount();
    const validated = this.validatedCount();

    if (total === 0) return 'complete';
    if (validated === total) return 'complete';
    if (validated > 0) return 'partial';
    return 'empty';
  });

  getDocumentIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const icons: Record<string, string> = {
      xlsx: 'file-spreadsheet',
      xls: 'file-spreadsheet',
      csv: 'file-spreadsheet',
      pdf: 'file-text',
    };
    return icons[ext] ?? 'file';
  }

  getStatusVariant(
    status: DocumentStatus
  ): 'success' | 'warning' | 'error' | 'info' {
    const variants: Record<
      DocumentStatus,
      'success' | 'warning' | 'error' | 'info'
    > = {
      analyzed: 'success',
      validated: 'success',
      analyzing: 'warning',
      uploaded: 'info',
      pending: 'info',
      missing: 'warning',
      error: 'error',
    };
    return variants[status] ?? 'info';
  }

  getStatusLabel(status: DocumentStatus): string {
    return DOCUMENT_STATUS_LABELS[status] ?? status;
  }

  triggerFileInput(item: DocumentRequirementWithFile): void {
    const input = document.querySelector(
      `input[data-type="${item.type}"][data-year="${item.fiscalYear}"]`
    ) as HTMLInputElement;
    input?.click();
  }

  onFileSelected(
    event: Event,
    item: DocumentRequirementWithFile
  ): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFile.emit({
        type: item.type,
        fiscalYear: item.fiscalYear,
        files: input.files,
      });
      // Reset input
      input.value = '';
    }
  }

  onDragOver(event: DragEvent, type: DocumentType): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverType.set(type);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverType.set(null);
  }

  onDrop(event: DragEvent, item: DocumentRequirementWithFile): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverType.set(null);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile.emit({
        type: item.type,
        fiscalYear: item.fiscalYear,
        files,
      });
    }
  }

  onDocumentClick(doc: Document): void {
    this.documentClick.emit(doc);
  }
}
