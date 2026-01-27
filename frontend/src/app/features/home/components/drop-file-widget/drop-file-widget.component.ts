import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Upload, FileText, CloudUpload } from 'lucide-angular';
import {
  UploadProgressModalComponent,
  UploadingFile,
} from '../upload-progress-modal/upload-progress-modal.component';

@Component({
  selector: 'app-drop-file-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UploadProgressModalComponent],
  template: `
    <!-- Ultra-Compact Upload Bar - Apple Style -->
    <div
      class="upload-bar"
      [class.upload-bar--dragover]="isDragOver()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <input
        type="file"
        id="drop-file-input"
        class="upload-bar__input"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
        (change)="onFileSelect($event)"
      />
      <label for="drop-file-input" class="upload-bar__content">
        <div class="upload-bar__icon">
          <lucide-icon [img]="icons.cloudUpload" [size]="18"></lucide-icon>
        </div>
        <span class="upload-bar__text">Drop files or click to upload</span>
        <span class="upload-bar__separator"></span>
        <span class="upload-bar__formats">PDF, Excel, CSV</span>
      </label>
    </div>

    <!-- Upload Progress Modal -->
    <app-upload-progress-modal
      [isOpen]="showProgressModal()"
      [files]="uploadingFiles()"
      (close)="closeProgressModal()"
    />
  `,
  styles: [
    `
      // =============================================================================
      // DROP FILE WIDGET - EY Design System
      // Card: white bg, border #e5e7eb, border-radius 12px, shadow-card, hover lift
      // =============================================================================

      :host {
        display: block;
        width: 100%;
        height: 100%;
        font-family:
          'Inter',
          -apple-system,
          BlinkMacSystemFont,
          'Segoe UI',
          sans-serif;
      }

      .upload-bar {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 56px;
        background: #ffffff;
        border: 2px dashed #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        transition: all 200ms ease-out;
        box-sizing: border-box;

        &:hover {
          border-color: #ffe600;
          background: #fffdf5;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);

          .upload-bar__icon {
            background: #ffe600;
            transform: scale(1.02);

            lucide-icon {
              color: #2e2e38;
            }
          }
        }

        &--dragover {
          border-color: #ffe600;
          border-style: solid;
          background: #fff9cc; // ey-yellow-light
          box-shadow: 0 4px 12px rgba(255, 230, 0, 0.15);
          transform: translateY(-1px);
        }
      }

      .upload-bar__input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        z-index: 1;
      }

      .upload-bar__content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        height: 100%;
        padding: 0 20px;
        cursor: pointer;
      }

      .upload-bar__icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        transition: all 200ms ease-out;
        flex-shrink: 0;

        lucide-icon {
          color: #ffe600;
          transition: color 200ms ease-out;
        }
      }

      .upload-bar__text {
        font-size: 14px; // text-body
        font-weight: 500;
        color: #2e2e38;
      }

      .upload-bar__separator {
        width: 1px;
        height: 16px;
        background: #e5e7eb;
      }

      .upload-bar__formats {
        font-size: 12px; // text-caption
        font-weight: 500;
        color: #6b7280; // secondary text
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropFileWidgetComponent {
  readonly icons = {
    upload: Upload,
    fileText: FileText,
    cloudUpload: CloudUpload,
  };

  readonly isDragOver = signal(false);
  readonly showProgressModal = signal(false);
  readonly uploadingFiles = signal<UploadingFile[]>([]);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(Array.from(input.files));
      input.value = ''; // Reset input
    }
  }

  private processFiles(files: File[]): void {
    // Create uploading file entries
    const uploadingFiles: UploadingFile[] = files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading' as const,
    }));

    this.uploadingFiles.set(uploadingFiles);
    this.showProgressModal.set(true);

    // Simulate upload and classification
    this.simulateUploadProcess(uploadingFiles);
  }

  private simulateUploadProcess(files: UploadingFile[]): void {
    // Simulated entity/document type classification
    const entities = [
      'CCP 5 Paris Office SPV',
      'CCP 5 Munich Logistics PropCo',
      'EPISO 6 Madrid Residential SL',
      'EPISO 6 Milan Mixed-Use Srl',
      'EPISO 6 Luxembourg HoldCo',
      'Tristan Capital Partners LLP',
    ];

    const documentTypes = [
      'General Ledger',
      'Trial Balance',
      'Bank Statement',
      'Tax Return',
      'Financial Statement',
    ];

    files.forEach((file, index) => {
      // Simulate upload progress
      let progress = 0;
      const uploadInterval = setInterval(
        () => {
          progress += Math.random() * 30 + 10;
          if (progress >= 100) {
            progress = 100;
            clearInterval(uploadInterval);

            // Update to classifying status
            this.uploadingFiles.update(current =>
              current.map(f =>
                f.id === file.id ? { ...f, progress: 100, status: 'classifying' as const } : f
              )
            );

            // Simulate classification delay
            setTimeout(
              () => {
                // Random success/error (90% success rate)
                const isSuccess = Math.random() > 0.1;

                this.uploadingFiles.update(current =>
                  current.map(f =>
                    f.id === file.id
                      ? isSuccess
                        ? {
                            ...f,
                            status: 'classified' as const,
                            classificationResult: {
                              entity: entities[Math.floor(Math.random() * entities.length)],
                              documentType:
                                documentTypes[Math.floor(Math.random() * documentTypes.length)],
                              fiscalYear: 2025,
                            },
                          }
                        : {
                            ...f,
                            status: 'error' as const,
                            errorMessage: 'Classification failed',
                          }
                      : f
                  )
                );
              },
              1000 + Math.random() * 1500
            );
          } else {
            this.uploadingFiles.update(current =>
              current.map(f => (f.id === file.id ? { ...f, progress: Math.min(progress, 99) } : f))
            );
          }
        },
        200 + index * 100
      );
    });
  }

  closeProgressModal(): void {
    this.showProgressModal.set(false);
    this.uploadingFiles.set([]);
  }
}
