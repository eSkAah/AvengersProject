import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  FileWarning,
  Upload,
  ChevronRight,
  Building2,
  FileText,
  X,
  CloudUpload,
  Sparkles,
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-angular';
import { MockDataService } from '../../../../core';

interface MissingDocumentByEntity {
  entityId: string;
  entity: string;
  countryFlag: string;
  missingDocuments: string[];
}

interface UploadingFile {
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
  selector: 'app-missing-documents-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="missing-docs-widget">
      <div class="widget-header">
        <div class="widget-title">
          <lucide-icon [img]="icons.fileWarning" [size]="18"></lucide-icon>
          <h3>Missing Documents</h3>
        </div>
        <span class="total-badge">{{ totalMissing() }}</span>
      </div>

      @if (missingByEntity().length === 0) {
        <div class="empty-state">
          <lucide-icon [img]="icons.checkCircle" [size]="28"></lucide-icon>
          <span>All documents uploaded</span>
        </div>
      } @else {
        <div class="entity-list">
          @for (item of displayedEntities(); track item.entityId) {
            <div class="entity-row">
              <div class="entity-info">
                <span class="entity-flag">{{ item.countryFlag }}</span>
                <span class="entity-name">{{ item.entity }}</span>
              </div>
              <div class="missing-docs">
                @for (doc of item.missingDocuments.slice(0, 2); track doc) {
                  <span class="doc-badge">{{ doc }}</span>
                }
                @if (item.missingDocuments.length > 2) {
                  <span class="doc-badge more">+{{ item.missingDocuments.length - 2 }}</span>
                }
              </div>
              <button class="upload-btn" (click)="openUploadModal(item)">
                <lucide-icon [img]="icons.upload" [size]="14"></lucide-icon>
              </button>
            </div>
          }
        </div>
        @if (missingByEntity().length > 5) {
          <div class="widget-footer">
            <button class="view-all-btn" (click)="viewAllMissing()">
              View All
              <lucide-icon [img]="icons.arrowRight" [size]="14"></lucide-icon>
            </button>
          </div>
        }
      }
    </div>

    <!-- Upload Modal -->
    @if (showUploadModal()) {
      <div class="modal-overlay" (click)="closeUploadModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-title">
              <lucide-icon [img]="icons.cloudUpload" [size]="20"></lucide-icon>
              <div class="modal-title-text">
                <h3>Upload Documents</h3>
                <span class="modal-subtitle">{{ selectedEntity()?.entity }}</span>
              </div>
            </div>
            <button class="close-btn" (click)="closeUploadModal()">
              <lucide-icon [img]="icons.x" [size]="20"></lucide-icon>
            </button>
          </div>

          <!-- Missing Documents Info -->
          <div class="missing-info">
            <span class="missing-label">Missing documents:</span>
            <div class="missing-tags">
              @for (doc of selectedEntity()?.missingDocuments || []; track doc) {
                <span class="missing-tag">{{ doc }}</span>
              }
            </div>
          </div>

          <!-- Drop Zone -->
          <div
            class="drop-zone"
            [class.drop-zone--dragover]="isDragOver()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
          >
            <input
              type="file"
              id="modal-file-input"
              class="drop-zone__input"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
              (change)="onFileSelect($event)"
            />
            <label for="modal-file-input" class="drop-zone__content">
              <div class="drop-zone__icon">
                <lucide-icon [img]="icons.upload" [size]="32"></lucide-icon>
              </div>
              <span class="drop-zone__title">Drop files here</span>
              <span class="drop-zone__subtitle">or click to browse</span>
            </label>
          </div>

          <!-- Uploading Files -->
          @if (uploadingFiles().length > 0) {
            <div class="uploading-section">
              <div class="ai-info">
                <lucide-icon [img]="icons.sparkles" [size]="14"></lucide-icon>
                <span>Documents will be automatically classified using AI</span>
              </div>

              <div class="files-list">
                @for (file of uploadingFiles(); track file.id) {
                  <div class="file-item" [class.file-item--success]="file.status === 'classified'" [class.file-item--error]="file.status === 'error'">
                    <div class="file-info">
                      <lucide-icon [img]="icons.fileText" [size]="16"></lucide-icon>
                      <span class="file-name">{{ file.name }}</span>
                    </div>

                    @switch (file.status) {
                      @case ('uploading') {
                        <div class="status-uploading">
                          <div class="progress-bar">
                            <div class="progress-fill" [style.width.%]="file.progress"></div>
                          </div>
                          <span>{{ file.progress }}%</span>
                        </div>
                      }
                      @case ('classifying') {
                        <div class="status-classifying">
                          <lucide-icon [img]="icons.loader2" [size]="14" class="spin"></lucide-icon>
                          <span>Classifying...</span>
                        </div>
                      }
                      @case ('classified') {
                        <div class="status-success">
                          <lucide-icon [img]="icons.checkCircle" [size]="14"></lucide-icon>
                          <span>{{ file.classificationResult?.documentType }}</span>
                        </div>
                      }
                      @case ('error') {
                        <div class="status-error">
                          <lucide-icon [img]="icons.alertCircle" [size]="14"></lucide-icon>
                          <span>Failed</span>
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Footer -->
          @if (allCompleted()) {
            <div class="modal-footer">
              <button class="done-btn" (click)="closeUploadModal()">Done</button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .missing-docs-widget {
      display: flex;
      flex-direction: column;
    }

    .widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .widget-title {
      display: flex;
      align-items: center;
      gap: 8px;

      lucide-icon {
        color: #f59e0b;
      }

      h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #2E2E38;
      }
    }

    .total-badge {
      background: #fef3c7;
      color: #92400e;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #10b981;
      gap: 6px;
      padding: 16px 0;

      span {
        font-size: 13px;
      }
    }

    .entity-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .entity-row {
      display: grid;
      grid-template-columns: 1fr auto 32px;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: #f9fafb;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      transition: all 0.2s;

      &:hover {
        border-color: #FFE600;
        background: #FFFDF5;
      }
    }

    .entity-info {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .entity-flag {
      font-size: 14px;
      flex-shrink: 0;
    }

    .entity-name {
      font-size: 12px;
      font-weight: 500;
      color: #2E2E38;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .missing-docs {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .doc-badge {
      background: #fee2e2;
      color: #991b1b;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      white-space: nowrap;

      &.more {
        background: #f3f4f6;
        color: #6b7280;
      }
    }

    .upload-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #FFE600;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;

      lucide-icon {
        color: #2E2E38;
      }

      &:hover {
        background: #FFD000;
        transform: scale(1.05);
      }
    }

    .widget-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #f0f0f0;
    }

    .view-all-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: transparent;
      border: none;
      color: #6b7280;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s;

      lucide-icon {
        transition: transform 0.2s;
      }

      &:hover {
        color: #2E2E38;
        background: #f3f4f6;

        lucide-icon {
          transform: translateX(2px);
        }
      }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 480px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.3s ease-out;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #f0f0f0;
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: 12px;

      lucide-icon {
        color: #FFE600;
      }
    }

    .modal-title-text {
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #2E2E38;
      }

      .modal-subtitle {
        font-size: 13px;
        color: #6b7280;
      }
    }

    .close-btn {
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: #6b7280;
      border-radius: 8px;
      transition: all 0.2s;

      &:hover {
        background: #f3f4f6;
        color: #2E2E38;
      }
    }

    .missing-info {
      padding: 12px 24px;
      background: #fef2f2;
      border-bottom: 1px solid #fecaca;
    }

    .missing-label {
      font-size: 12px;
      color: #991b1b;
      margin-bottom: 6px;
      display: block;
    }

    .missing-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .missing-tag {
      background: white;
      color: #991b1b;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid #fecaca;
    }

    .drop-zone {
      margin: 20px 24px;
      position: relative;
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      background: #f9fafb;
      transition: all 0.3s ease;
      min-height: 140px;

      &:hover {
        border-color: #FFE600;
        background: #FFFDF5;
      }

      &--dragover {
        border-color: #FFE600;
        border-style: solid;
        background: #FFF9E0;
      }
    }

    .drop-zone__input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    .drop-zone__content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 140px;
      cursor: pointer;
    }

    .drop-zone__icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 14px;
      margin-bottom: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      lucide-icon {
        color: #FFE600;
      }
    }

    .drop-zone__title {
      font-size: 14px;
      font-weight: 600;
      color: #2E2E38;
    }

    .drop-zone__subtitle {
      font-size: 13px;
      color: #6b7280;
    }

    .uploading-section {
      border-top: 1px solid #f0f0f0;
    }

    .ai-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 24px;
      background: #FFF9E0;
      font-size: 12px;
      color: #92400e;

      lucide-icon {
        color: #f59e0b;
      }
    }

    .files-list {
      padding: 12px 24px;
      max-height: 200px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      &--success {
        background: #f0fdf4;
        border-color: #86efac;
      }

      &--error {
        background: #fef2f2;
        border-color: #fecaca;
      }
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      flex: 1;

      lucide-icon {
        color: #6b7280;
        flex-shrink: 0;
      }
    }

    .file-name {
      font-size: 13px;
      color: #2E2E38;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .status-uploading {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #6b7280;
    }

    .progress-bar {
      width: 60px;
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #FFE600;
      transition: width 0.2s;
    }

    .status-classifying {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #f59e0b;
      font-size: 12px;
    }

    .status-success {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #10b981;
      font-size: 12px;
    }

    .status-error {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #ef4444;
      font-size: 12px;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: flex-end;
    }

    .done-btn {
      background: #FFE600;
      color: #2E2E38;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #FFD000;
      }
    }

    .spin {
      animation: spin 1s linear infinite;
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

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissingDocumentsWidgetComponent {
  private readonly mockData = inject(MockDataService);

  private readonly router = inject(Router);

  readonly icons = {
    fileWarning: FileWarning,
    upload: Upload,
    chevronRight: ChevronRight,
    building2: Building2,
    fileText: FileText,
    x: X,
    cloudUpload: CloudUpload,
    sparkles: Sparkles,
    checkCircle: CheckCircle,
    loader2: Loader2,
    alertCircle: AlertCircle,
    arrowRight: ArrowRight,
  };

  readonly showUploadModal = signal(false);
  readonly selectedEntity = signal<MissingDocumentByEntity | null>(null);
  readonly isDragOver = signal(false);
  readonly uploadingFiles = signal<UploadingFile[]>([]);

  readonly missingByEntity = computed<MissingDocumentByEntity[]>(() => {
    const engagements = this.mockData.engagements();
    const entityMap = new Map<string, MissingDocumentByEntity>();

    engagements.forEach(eng => {
      const requirements = eng.documentRequirements || [];
      const missingDocs = requirements
        .filter(req => req.status === 'missing')
        .map(req => req.label);

      if (missingDocs.length > 0) {
        // Use entity name as key to group by entity
        const key = eng.entity;
        if (!entityMap.has(key)) {
          entityMap.set(key, {
            entityId: eng.id,
            entity: eng.entity,
            countryFlag: eng.countryFlag,
            missingDocuments: [...missingDocs],
          });
        } else {
          // Merge missing documents (avoid duplicates)
          const existing = entityMap.get(key)!;
          missingDocs.forEach(doc => {
            if (!existing.missingDocuments.includes(doc)) {
              existing.missingDocuments.push(doc);
            }
          });
        }
      }
    });

    return Array.from(entityMap.values());
  });

  readonly totalMissing = computed(() => {
    return this.missingByEntity().reduce(
      (sum, entity) => sum + entity.missingDocuments.length,
      0
    );
  });

  readonly displayedEntities = computed(() => {
    return this.missingByEntity().slice(0, 5);
  });

  viewAllMissing(): void {
    this.router.navigate(['/app/documents'], {
      queryParams: { filter: 'missing' }
    });
  }

  readonly allCompleted = computed(() => {
    const files = this.uploadingFiles();
    return files.length > 0 && files.every(f => f.status === 'classified' || f.status === 'error');
  });

  openUploadModal(entity: MissingDocumentByEntity): void {
    this.selectedEntity.set(entity);
    this.showUploadModal.set(true);
    this.uploadingFiles.set([]);
  }

  closeUploadModal(): void {
    this.showUploadModal.set(false);
    this.selectedEntity.set(null);
    this.uploadingFiles.set([]);
  }

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
      input.value = '';
    }
  }

  private processFiles(files: File[]): void {
    const uploadingFiles: UploadingFile[] = files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading' as const,
    }));

    this.uploadingFiles.update(current => [...current, ...uploadingFiles]);
    this.simulateUploadProcess(uploadingFiles);
  }

  private simulateUploadProcess(files: UploadingFile[]): void {
    const entity = this.selectedEntity();
    const missingDocs = entity?.missingDocuments || [];

    files.forEach((file, index) => {
      let progress = 0;
      const uploadInterval = setInterval(() => {
        progress += Math.random() * 30 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(uploadInterval);

          this.uploadingFiles.update(current =>
            current.map(f =>
              f.id === file.id ? { ...f, progress: 100, status: 'classifying' as const } : f
            )
          );

          setTimeout(() => {
            this.uploadingFiles.update(current =>
              current.map(f =>
                f.id === file.id
                  ? {
                      ...f,
                      status: 'classified' as const,
                      classificationResult: {
                        entity: entity?.entity || 'Unknown',
                        documentType: missingDocs[index % missingDocs.length] || 'Document',
                        fiscalYear: 2025,
                      },
                    }
                  : f
              )
            );
          }, 1000 + Math.random() * 1000);
        } else {
          this.uploadingFiles.update(current =>
            current.map(f =>
              f.id === file.id ? { ...f, progress: Math.min(progress, 99) } : f
            )
          );
        }
      }, 200 + index * 100);
    });
  }
}
