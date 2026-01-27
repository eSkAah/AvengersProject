import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-angular';

export interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'classifying' | 'classified' | 'error';
  classificationResult?: {
    entity: string;
    documentType: string;
    fiscalYear: number;
  };
  errorMessage?: string;
}

@Component({
  selector: 'app-upload-progress-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="onOverlayClick($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-title">
              <lucide-icon [img]="icons.upload" [size]="20"></lucide-icon>
              <h3>Uploading Documents</h3>
            </div>
            <button class="close-btn" (click)="close.emit()">
              <lucide-icon [img]="icons.x" [size]="20"></lucide-icon>
            </button>
          </div>

          <!-- AI Classification Info -->
          <div class="ai-info">
            <lucide-icon [img]="icons.sparkles" [size]="16"></lucide-icon>
            <span>Documents will be automatically classified using AI</span>
          </div>

          <!-- Files List -->
          <div class="files-list">
            @for (file of files(); track file.id) {
              <div
                class="file-item"
                [class.file-item--success]="file.status === 'classified'"
                [class.file-item--error]="file.status === 'error'"
              >
                <div class="file-info">
                  <lucide-icon [img]="icons.fileText" [size]="18"></lucide-icon>
                  <div class="file-details">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  </div>
                </div>

                <div class="file-status">
                  @switch (file.status) {
                    @case ('uploading') {
                      <div class="status-uploading">
                        <div class="progress-bar">
                          <div class="progress-fill" [style.width.%]="file.progress"></div>
                        </div>
                        <span class="progress-text">{{ file.progress }}%</span>
                      </div>
                    }
                    @case ('classifying') {
                      <div class="status-classifying">
                        <lucide-icon [img]="icons.loader2" [size]="16" class="spin"></lucide-icon>
                        <span>Classifying...</span>
                      </div>
                    }
                    @case ('classified') {
                      <div class="status-classified">
                        <lucide-icon [img]="icons.checkCircle" [size]="16"></lucide-icon>
                        <div class="classification-result">
                          <span class="entity">{{ file.classificationResult?.entity }}</span>
                          <span class="doc-type">{{
                            file.classificationResult?.documentType
                          }}</span>
                        </div>
                      </div>
                    }
                    @case ('error') {
                      <div class="status-error">
                        <lucide-icon [img]="icons.alertCircle" [size]="16"></lucide-icon>
                        <span>{{ file.errorMessage || 'Upload failed' }}</span>
                      </div>
                    }
                  }
                </div>
              </div>
            }
          </div>

          <!-- Summary -->
          <div class="modal-footer">
            <div class="summary">
              <span class="summary-item">
                <lucide-icon [img]="icons.checkCircle" [size]="14"></lucide-icon>
                {{ classifiedCount() }} classified
              </span>
              @if (uploadingCount() > 0) {
                <span class="summary-item uploading">
                  <lucide-icon [img]="icons.loader2" [size]="14" class="spin"></lucide-icon>
                  {{ uploadingCount() }} uploading
                </span>
              }
              @if (errorCount() > 0) {
                <span class="summary-item error">
                  <lucide-icon [img]="icons.alertCircle" [size]="14"></lucide-icon>
                  {{ errorCount() }} failed
                </span>
              }
            </div>
            @if (allCompleted()) {
              <button class="done-btn" (click)="close.emit()">Done</button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      // =============================================================================
      // UPLOAD PROGRESS MODAL - EY Design System
      // Modal: border-radius 12px, shadow-modal, 300ms slide animation
      // Typography: Inter font, 11px labels uppercase, 13-14px body, 18px values
      // =============================================================================

      :host {
        font-family:
          'Inter',
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          sans-serif;
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 200ms ease-out;
      }

      .modal-content {
        background: #ffffff;
        border-radius: 12px;
        width: 90%;
        max-width: 520px;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16); // shadow-modal
        animation: slideUp 300ms ease-out;
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
      }

      .modal-title {
        display: flex;
        align-items: center;
        gap: 10px;

        lucide-icon {
          color: #ffe600;
        }

        h3 {
          margin: 0;
          font-size: 18px; // text-h3
          font-weight: 600;
          color: #2e2e38;
          line-height: 1.4;
        }
      }

      .close-btn {
        background: none;
        border: none;
        padding: 8px;
        cursor: pointer;
        color: #6b7280;
        border-radius: 6px;
        transition: all 200ms ease-out;

        &:hover {
          background: #f5f5f5;
          color: #2e2e38;
        }
      }

      .ai-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: #fff9cc; // ey-yellow-light
        border-bottom: 1px solid #e5e7eb;
        font-size: 13px;
        font-weight: 500;
        color: #b45309; // warning-dark

        lucide-icon {
          color: #f59e0b; // warning
        }
      }

      .files-list {
        flex: 1;
        overflow-y: auto;
        padding: 16px 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        background: #fafafa;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        transition: all 200ms ease-out;

        &--success {
          background: #d1fae5; // success-light
          border-color: #a7f3d0;
        }

        &--error {
          background: #fee2e2; // error-light
          border-color: #fecaca;
        }
      }

      .file-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;

        lucide-icon {
          color: #6b7280;
          flex-shrink: 0;
        }
      }

      .file-details {
        display: flex;
        flex-direction: column;
        min-width: 0;
        gap: 2px;
      }

      .file-name {
        font-size: 14px;
        font-weight: 500;
        color: #2e2e38;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-size {
        font-size: 12px;
        color: #6b7280;
      }

      .file-status {
        flex-shrink: 0;
        margin-left: 16px;
      }

      .status-uploading {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .progress-bar {
        width: 80px;
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: #ffe600;
        border-radius: 2px;
        transition: width 200ms ease-out;
      }

      .progress-text {
        font-size: 12px;
        color: #6b7280;
        width: 35px;
        font-variant-numeric: tabular-nums;
      }

      .status-classifying {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #f59e0b; // warning
        font-size: 13px;
        font-weight: 500;
      }

      .status-classified {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #10b981; // success
      }

      .classification-result {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
      }

      .entity {
        font-size: 12px;
        font-weight: 600;
        color: #2e2e38;
      }

      .doc-type {
        font-size: 11px;
        color: #6b7280;
      }

      .status-error {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #ef4444; // error
        font-size: 13px;
        font-weight: 500;
      }

      .modal-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 24px;
        border-top: 1px solid #e5e7eb;
        background: #fafafa;
      }

      .summary {
        display: flex;
        gap: 16px;
      }

      .summary-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        font-weight: 500;
        color: #10b981; // success

        &.uploading {
          color: #f59e0b; // warning
        }

        &.error {
          color: #ef4444; // error
        }
      }

      .done-btn {
        background: #ffe600;
        color: #2e2e38;
        border: none;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 200ms ease-out;

        &:hover {
          background: #ffd000;
          transform: scale(1.02);
        }

        &:active {
          transform: scale(0.98);
        }
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
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

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadProgressModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly files = input<UploadingFile[]>([]);
  readonly close = output<void>();

  readonly icons = {
    x: X,
    upload: Upload,
    checkCircle: CheckCircle,
    alertCircle: AlertCircle,
    fileText: FileText,
    sparkles: Sparkles,
    loader2: Loader2,
  };

  readonly classifiedCount = computed(
    () => this.files().filter(f => f.status === 'classified').length
  );

  readonly uploadingCount = computed(
    () => this.files().filter(f => f.status === 'uploading' || f.status === 'classifying').length
  );

  readonly errorCount = computed(() => this.files().filter(f => f.status === 'error').length);

  readonly allCompleted = computed(() => this.files().length > 0 && this.uploadingCount() === 0);

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onOverlayClick(event: Event): void {
    if (this.allCompleted()) {
      this.close.emit();
    }
  }
}
