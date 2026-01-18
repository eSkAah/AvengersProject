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
          <h3>Confirmer la classification</h3>
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
            L'application n'a pas pu identifier automatiquement toutes les informations.
            Veuillez compléter ou corriger la classification.
          </p>

          <div class="dialog__form">
            <!-- Entity -->
            <div class="dialog__field">
              <label for="entity">Entité</label>
              <select
                id="entity"
                [(ngModel)]="selectedEntity"
                [class.dialog__field--missing]="!selectedEntity()"
              >
                <option value="">-- Sélectionner --</option>
                @for (entity of entities; track entity) {
                  <option [value]="entity">{{ entity }}</option>
                }
              </select>
              @if (!selectedEntity()) {
                <span class="dialog__field-hint">Requis</span>
              }
            </div>

            <!-- Year -->
            <div class="dialog__field">
              <label for="year">Année fiscale</label>
              <input
                id="year"
                type="number"
                [(ngModel)]="selectedYear"
                min="2020"
                max="2030"
                [class.dialog__field--missing]="!selectedYear()"
              />
              @if (!selectedYear()) {
                <span class="dialog__field-hint">Requis</span>
              }
            </div>

            <!-- Type -->
            <div class="dialog__field">
              <label for="type">Type de document</label>
              <select
                id="type"
                [(ngModel)]="selectedType"
                [class.dialog__field--missing]="!selectedType()"
              >
                <option value="">-- Sélectionner --</option>
                @for (type of documentTypes; track type) {
                  <option [value]="type">{{ getTypeLabel(type) }}</option>
                }
              </select>
              @if (!selectedType()) {
                <span class="dialog__field-hint">Requis</span>
              }
            </div>
          </div>
        </div>

        <div class="dialog__actions">
          <app-button variant="secondary" (clicked)="cancel.emit()">
            Annuler
          </app-button>
          <app-button
            variant="primary"
            [disabled]="!isValid()"
            (clicked)="onConfirm()"
          >
            <lucide-icon name="check" [size]="16"></lucide-icon>
            Confirmer
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
      general_ledger: 'Grand Livre',
      trial_balance: 'Balance Générale',
      tax_return: 'Déclaration Fiscale',
      financial_statement: 'États Financiers',
    };
    return labels[type] || type;
  }
}
