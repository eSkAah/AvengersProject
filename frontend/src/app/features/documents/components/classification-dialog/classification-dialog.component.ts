import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { FilePreview, ButtonComponent } from '../../../../shared';
import { DetectedMetadata } from '../../documents.component';

export interface ClassificationResult {
  entity: string;
  year: number;
  type: string;
}

@Component({
  selector: 'app-classification-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ButtonComponent],
  template: `
    <div class="dialog-backdrop" (click)="onBackdropClick($event)">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog__header">
          <lucide-icon name="file-question" [size]="24"></lucide-icon>
          <h3>Confirm Classification</h3>
          <button class="dialog__close" (click)="cancel.emit()">
            <lucide-icon name="x" [size]="20"></lucide-icon>
          </button>
        </div>

        <div class="dialog__content">
          <div class="dialog__file-info">
            <lucide-icon name="file-text" [size]="32"></lucide-icon>
            <div class="dialog__file-details">
              <span class="dialog__file-name">{{ file.name }}</span>
              <span class="dialog__file-size">
                {{ (file.size / 1024 / 1024).toFixed(2) }} MB
              </span>
            </div>
          </div>

          <p class="dialog__message">
            The application could not automatically identify all information.
            Please complete or correct the classification.
          </p>

          <div class="dialog__form">
            <!-- Entity -->
            <div class="dialog__field">
              <label for="entity">Entity</label>
              <select
                id="entity"
                [(ngModel)]="selectedEntity"
                [class.dialog__field--missing]="!selectedEntity()"
              >
                <option value="">-- Select --</option>
                @for (entity of entities; track entity) {
                  <option [value]="entity">{{ entity }}</option>
                }
              </select>
              @if (!selectedEntity()) {
                <span class="dialog__field-hint">Required</span>
              }
            </div>

            <!-- Year -->
            <div class="dialog__field">
              <label for="year">Fiscal Year</label>
              <input
                id="year"
                type="number"
                [(ngModel)]="selectedYear"
                min="2020"
                max="2030"
                [class.dialog__field--missing]="!selectedYear()"
              />
              @if (!selectedYear()) {
                <span class="dialog__field-hint">Required</span>
              }
            </div>

            <!-- Type -->
            <div class="dialog__field">
              <label for="type">Document Type</label>
              <select
                id="type"
                [(ngModel)]="selectedType"
                [class.dialog__field--missing]="!selectedType()"
              >
                <option value="">-- Select --</option>
                @for (type of documentTypes; track type) {
                  <option [value]="type">{{ getTypeLabel(type) }}</option>
                }
              </select>
              @if (!selectedType()) {
                <span class="dialog__field-hint">Required</span>
              }
            </div>
          </div>
        </div>

        <div class="dialog__actions">
          <app-button variant="secondary" (clicked)="cancel.emit()">
            Cancel
          </app-button>
          <app-button
            variant="primary"
            [disabled]="!isValid()"
            (clicked)="onConfirm()"
          >
            <lucide-icon name="check" [size]="16"></lucide-icon>
            Confirm
          </app-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './classification-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationDialogComponent implements OnInit {
  @Input({ required: true }) file!: FilePreview;
  @Input({ required: true }) suggestedMetadata!: DetectedMetadata;
  @Input({ required: true }) entities: string[] = [];
  @Input({ required: true }) documentTypes: string[] = [];

  @Output() confirm = new EventEmitter<ClassificationResult>();
  @Output() cancel = new EventEmitter<void>();

  selectedEntity = signal<string>('');
  selectedYear = signal<number | null>(null);
  selectedType = signal<string>('');

  ngOnInit(): void {
    // Pre-fill with suggested values
    if (this.suggestedMetadata.entity) {
      this.selectedEntity.set(this.suggestedMetadata.entity);
    }
    if (this.suggestedMetadata.year) {
      this.selectedYear.set(this.suggestedMetadata.year);
    }
    if (this.suggestedMetadata.type) {
      this.selectedType.set(this.suggestedMetadata.type);
    }
  }

  isValid(): boolean {
    return !!(
      this.selectedEntity() &&
      this.selectedYear() &&
      this.selectedType()
    );
  }

  onConfirm(): void {
    if (!this.isValid()) return;

    this.confirm.emit({
      entity: this.selectedEntity(),
      year: this.selectedYear()!,
      type: this.selectedType(),
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      general_ledger: 'General Ledger',
      trial_balance: 'Trial Balance',
      tax_return: 'Tax Return',
      financial_statement: 'Financial Statement',
    };
    return labels[type] || type;
  }
}
