import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { BadgeComponent } from '../badge/badge.component';

export type UploadState = 'default' | 'dragover' | 'uploading' | 'success' | 'error';

export interface FilePreview {
  id: string;
  file: File;
  name: string;
  size: number;
  extension: string;
  isValid: boolean;
  errorMessage?: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'classifying' | 'success' | 'error';
  classificationResult?: string;
}

export interface UploadResult {
  file: File;
  success: boolean;
  response?: unknown;
  error?: string;
}

const ALLOWED_EXTENSIONS = ['xlsx', 'xls', 'pdf', 'csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Component({
  selector: 'app-upload-zone',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BadgeComponent],
  templateUrl: './upload-zone.component.html',
  styleUrl: './upload-zone.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadZoneComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() engagementId: string | null = null;
  @Input() disabled = false;

  @Output() uploadStart = new EventEmitter<FilePreview[]>();
  @Output() uploadSuccess = new EventEmitter<UploadResult>();
  @Output() uploadError = new EventEmitter<UploadResult>();
  @Output() uploadComplete = new EventEmitter<UploadResult[]>();
  @Output() filesSelected = new EventEmitter<FilePreview[]>();

  state = signal<UploadState>('default');
  selectedFiles = signal<FilePreview[]>([]);
  errorMessage = signal<string | null>(null);

  hasFiles = computed(() => this.selectedFiles().length > 0);
  validFiles = computed(() => this.selectedFiles().filter(f => f.isValid));
  invalidFiles = computed(() => this.selectedFiles().filter(f => !f.isValid));
  canUpload = computed(() =>
    this.validFiles().length > 0 &&
    this.state() !== 'uploading' &&
    this.engagementId !== null
  );

  get zoneClasses(): string {
    const classes = ['upload-zone'];
    classes.push(`upload-zone--${this.state()}`);
    if (this.disabled) classes.push('upload-zone--disabled');
    return classes.join(' ');
  }

  // Drag & Drop handlers
  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled && this.state() !== 'uploading') {
      this.state.set('dragover');
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled && this.state() !== 'uploading') {
      this.state.set('dragover');
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.state() === 'dragover') {
      this.state.set('default');
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled || this.state() === 'uploading') return;

    this.state.set('default');
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  // Click to select
  onZoneClick(): void {
    if (!this.disabled && this.state() !== 'uploading') {
      this.fileInput.nativeElement.click();
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(Array.from(input.files));
      // Reset input to allow selecting the same file again
      input.value = '';
    }
  }

  processFiles(files: File[]): void {
    const newPreviews: FilePreview[] = files.map(file => {
      const extension = this.getFileExtension(file.name);
      const validation = this.validateFile(file, extension);

      return {
        id: this.generateId(),
        file,
        name: file.name,
        size: file.size,
        extension,
        isValid: validation.isValid,
        errorMessage: validation.errorMessage,
        uploadProgress: 0,
        uploadStatus: 'pending',
      };
    });

    this.selectedFiles.update(current => [...current, ...newPreviews]);
    this.filesSelected.emit(this.selectedFiles());
  }

  removeFile(id: string): void {
    this.selectedFiles.update(files => files.filter(f => f.id !== id));
    this.filesSelected.emit(this.selectedFiles());
  }

  clearAllFiles(): void {
    this.selectedFiles.set([]);
    this.state.set('default');
    this.errorMessage.set(null);
    this.filesSelected.emit([]);
  }

  // Called by parent to trigger upload
  async startUpload(uploadFn: (file: File, engagementId: string) => Promise<unknown>): Promise<UploadResult[]> {
    if (!this.canUpload() || !this.engagementId) return [];

    const results: UploadResult[] = [];
    const filesToUpload = this.validFiles();

    this.state.set('uploading');
    this.uploadStart.emit(filesToUpload);

    for (const preview of filesToUpload) {
      // Update individual file status
      this.updateFileStatus(preview.id, 'uploading', 50);

      try {
        const response = await uploadFn(preview.file, this.engagementId);

        // Brief classifying phase to show animation
        this.updateFileStatus(preview.id, 'classifying', 80);
        await this.delay(500); // Short delay for visual feedback

        const result: UploadResult = { file: preview.file, success: true, response };
        results.push(result);

        // Extract classification result from response
        const responseData = response as Record<string, unknown>;
        const docType = responseData?.['type'] as string | undefined;
        const aiSummary = responseData?.['ai_summary'] as string | undefined;
        this.updateFileStatusWithClassification(preview.id, 'success', 100, docType, aiSummary);
        this.uploadSuccess.emit(result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Upload failed';
        const result: UploadResult = { file: preview.file, success: false, error: errorMsg };
        results.push(result);

        this.updateFileStatus(preview.id, 'error', 0);
        this.uploadError.emit(result);
      }
    }

    const allSuccess = results.every(r => r.success);
    this.state.set(allSuccess ? 'success' : 'error');
    this.uploadComplete.emit(results);

    // Reset to default after a delay if success
    if (allSuccess) {
      setTimeout(() => {
        this.clearAllFiles();
      }, 2000);
    }

    return results;
  }

  private updateFileStatus(
    id: string,
    status: 'pending' | 'uploading' | 'classifying' | 'success' | 'error',
    progress: number
  ): void {
    this.selectedFiles.update(files =>
      files.map(f =>
        f.id === id
          ? { ...f, uploadStatus: status, uploadProgress: progress }
          : f
      )
    );
  }

  private updateFileStatusWithClassification(
    id: string,
    status: 'success',
    progress: number,
    docType?: string,
    aiSummary?: string
  ): void {
    const classificationResult = docType
      ? this.getDocumentTypeLabel(docType)
      : 'Non classé';
    this.selectedFiles.update(files =>
      files.map(f =>
        f.id === id
          ? { ...f, uploadStatus: status, uploadProgress: progress, classificationResult }
          : f
      )
    );
  }

  private getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      general_ledger: 'Grand Livre',
      trial_balance: 'Balance Générale',
      tax_return: 'Déclaration Fiscale',
      financial_statement: 'États Financiers',
      bank_statement: 'Relevé Bancaire',
    };
    return labels[type] || type;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private validateFile(
    file: File,
    extension: string
  ): { isValid: boolean; errorMessage?: string } {
    if (!ALLOWED_EXTENSIONS.includes(extension.toLowerCase())) {
      return {
        isValid: false,
        errorMessage: `Format non autorisé. Formats acceptés: ${ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        errorMessage: `Fichier trop volumineux. Taille max: 10 MB`,
      };
    }

    return { isValid: true };
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  private generateId(): string {
    return `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  getExtensionVariant(extension: string): 'neutral' | 'success' | 'warning' | 'error' | 'info' {
    const variants: Record<string, 'neutral' | 'success' | 'warning' | 'error' | 'info'> = {
      xlsx: 'success',
      xls: 'success',
      pdf: 'error',
      csv: 'info',
    };
    return variants[extension.toLowerCase()] ?? 'neutral';
  }

  getFileIcon(extension: string): string {
    const icons: Record<string, string> = {
      xlsx: 'file-spreadsheet',
      xls: 'file-spreadsheet',
      pdf: 'file-text',
      csv: 'clipboard-list',
    };
    return icons[extension.toLowerCase()] ?? 'file';
  }
}
