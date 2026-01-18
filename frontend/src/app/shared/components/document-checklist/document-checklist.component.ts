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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DocumentRequirement, DocumentType, DocumentRequirementStatus } from '../../../core';

export interface DocumentStatusClickEvent {
  status: DocumentRequirementStatus;
  type: DocumentType;
}

@Component({
  selector: 'app-document-checklist',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="document-checklist">
      <div class="checklist-header">
        <span class="checklist-header__title">Documents requis</span>
        <span class="checklist-header__count" [class]="'checklist-header__count--' + overallStatus()">
          {{ uploadedCount() }}/{{ totalCount() }}
        </span>
      </div>

      <div class="checklist-items">
        @for (req of requirements; track req.type) {
          <div
            class="checklist-item"
            [class]="'checklist-item--' + req.status"
            [class.checklist-item--required]="req.required"
            [class.checklist-item--clickable]="req.status !== 'missing'"
            (click)="onStatusClick(req.status, req.type)"
            [title]="req.status !== 'missing' ? 'Voir dans la bibliothèque' : ''"
          >
            <div class="checklist-item__icon">
              @switch (req.status) {
                @case ('missing') {
                  <lucide-icon name="circle" [size]="16" class="icon--missing"></lucide-icon>
                }
                @case ('uploaded') {
                  <lucide-icon name="clock" [size]="16" class="icon--uploaded"></lucide-icon>
                }
                @case ('validated') {
                  <lucide-icon name="check-circle" [size]="16" class="icon--validated"></lucide-icon>
                }
              }
            </div>

            <span class="checklist-item__label">
              {{ req.label }}
              @if (!req.required) {
                <span class="checklist-item__optional">(optionnel)</span>
              }
            </span>

            @if (req.status === 'missing' && req.required) {
              <button
                class="checklist-item__upload-btn"
                (click)="onUploadClick(req.type); $event.stopPropagation()"
                title="Uploader ce document"
              >
                <lucide-icon name="upload" [size]="14"></lucide-icon>
              </button>
            } @else if (req.status !== 'missing') {
              <lucide-icon name="external-link" [size]="14" class="checklist-item__link-icon"></lucide-icon>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .document-checklist {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .checklist-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid #e5e7eb;

      &__title {
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      &__count {
        font-size: 0.875rem;
        font-weight: 600;

        &--complete {
          color: #059669;
        }

        &--partial {
          color: #d97706;
        }

        &--empty {
          color: #dc2626;
        }
      }
    }

    .checklist-items {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.5rem;
      border-radius: 0.375rem;
      transition: background-color 0.15s ease;

      &:hover {
        background: #f9fafb;
      }

      &__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .icon--missing {
          color: #9ca3af;
        }

        .icon--uploaded {
          color: #f59e0b;
        }

        .icon--validated {
          color: #10b981;
        }
      }

      &__label {
        flex: 1;
        font-size: 0.8125rem;
        color: #374151;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &__optional {
        font-size: 0.6875rem;
        color: #9ca3af;
        font-style: italic;
        margin-left: 0.25rem;
      }

      &__upload-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border: none;
        background: #ffe600;
        color: #2e2e38;
        border-radius: 0.25rem;
        cursor: pointer;
        opacity: 0;
        transform: scale(0.9);
        transition: all 0.15s ease;

        &:hover {
          background: #ffd000;
          transform: scale(1.05);
        }
      }

      &:hover .checklist-item__upload-btn {
        opacity: 1;
        transform: scale(1);
      }

      &--clickable {
        cursor: pointer;

        &:hover {
          background: #f3f4f6;

          .checklist-item__link-icon {
            opacity: 1;
          }
        }
      }

      &__link-icon {
        color: #9ca3af;
        opacity: 0;
        transition: opacity 0.15s ease;
        flex-shrink: 0;
      }

      // Status-based styling
      &--missing {
        .checklist-item__label {
          color: #6b7280;
        }
      }

      &--uploaded {
        .checklist-item__label {
          color: #374151;
        }
      }

      &--validated {
        .checklist-item__label {
          color: #374151;
        }
      }

      // Required but missing - emphasize
      &--missing.checklist-item--required {
        background: rgba(239, 68, 68, 0.05);

        .checklist-item__label {
          color: #dc2626;
          font-weight: 500;
        }

        .icon--missing {
          color: #dc2626;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentChecklistComponent implements OnChanges {
  @Input() requirements: DocumentRequirement[] = [];
  @Output() uploadClick = new EventEmitter<DocumentType>();
  @Output() statusClick = new EventEmitter<DocumentStatusClickEvent>();

  private readonly requirementsSignal = signal<DocumentRequirement[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requirements']) {
      this.requirementsSignal.set(this.requirements);
    }
  }

  totalCount = computed(() => this.requirementsSignal().filter(r => r.required).length);

  uploadedCount = computed(() =>
    this.requirementsSignal().filter(r => r.required && (r.status === 'uploaded' || r.status === 'validated')).length
  );

  overallStatus = computed((): 'complete' | 'partial' | 'empty' => {
    const total = this.totalCount();
    const uploaded = this.uploadedCount();

    if (total === 0) return 'complete';
    if (uploaded === total) return 'complete';
    if (uploaded > 0) return 'partial';
    return 'empty';
  });

  onUploadClick(type: DocumentType): void {
    this.uploadClick.emit(type);
  }

  onStatusClick(status: DocumentRequirementStatus, type: DocumentType): void {
    // Only emit for non-missing statuses (clickable items)
    if (status !== 'missing') {
      this.statusClick.emit({ status, type });
    }
  }
}
