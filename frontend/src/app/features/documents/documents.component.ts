import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  ViewChild,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  MockDataService,
  Document,
  DocumentApiService,
  DocumentType,
} from '../../core';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
  ViewToggleComponent,
  ViewMode,
  UploadZoneComponent,
  FilePreview,
  UploadResult,
  ToastService,
  ButtonComponent,
  DocumentPreviewModalComponent,
  FlyingDocumentComponent,
  EntityAutocompleteComponent,
} from '../../shared';
import { PlacementAnimation } from '../../shared/components/flying-document/flying-document.component';
import {
  DocumentTreeComponent,
  TreeNode,
} from './components/document-tree/document-tree.component';
import { DocumentGridComponent } from './components/document-grid/document-grid.component';
import { DocumentListComponent } from './components/document-list/document-list.component';
import { ClassificationDialogComponent, ClassificationResult } from './components/classification-dialog/classification-dialog.component';

export type ActiveTab = 'library' | 'upload';

export interface GlobalFilters {
  search: string;
  entity: string;
  year: string;
  type: string;
  status: string;
}

export interface DetectedMetadata {
  entity: string | null;
  year: number | null;
  type: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface PendingFile {
  file: FilePreview;
  metadata: DetectedMetadata;
  isProcessing: boolean;
  isValidated: boolean;
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    BreadcrumbComponent,
    ViewToggleComponent,
    DocumentTreeComponent,
    DocumentGridComponent,
    DocumentListComponent,
    UploadZoneComponent,
    ButtonComponent,
    DocumentPreviewModalComponent,
    FlyingDocumentComponent,
    ClassificationDialogComponent,
    EntityAutocompleteComponent,
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsComponent implements OnInit {
  @ViewChild(UploadZoneComponent) uploadZone!: UploadZoneComponent;
  @ViewChild(DocumentTreeComponent) documentTree!: DocumentTreeComponent;

  private readonly mockData = inject(MockDataService);
  private readonly documentApi = inject(DocumentApiService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  // Animation service removed - animations disabled

  readonly engagements = this.mockData.engagements;
  readonly allDocuments = this.mockData.documents;

  // Tab state (replaces libraryMode)
  activeTab = signal<ActiveTab>('library');

  // Upload state
  isUploading = signal(false);
  pendingFiles = signal<PendingFile[]>([]);

  // Classification dialog state
  showClassificationDialog = signal(false);
  fileNeedingClassification = signal<PendingFile | null>(null);
  classificationQueue = signal<PendingFile[]>([]);

  // Placement animation state
  activeAnimation = signal<PlacementAnimation | null>(null);
  animationTargetPosition = signal<{ x: number; y: number } | null>(null);

  // Document preview modal
  previewDocument = signal<Document | null>(null);

  // Document highlight (from notification deep-link)
  highlightDocumentId = signal<string | null>(null);

  viewMode = signal<ViewMode>('grid');

  // Global filters
  globalFilters = signal<GlobalFilters>({
    search: '',
    entity: '',
    year: '',
    type: '',
    status: '',
  });

  // Unique filter options
  readonly entityOptions = computed(() => {
    const docs = this.allDocuments();
    const entities = new Set<string>();
    docs.forEach((d) => {
      if (d.entityName) {
        entities.add(d.entityName);
      }
    });
    return Array.from(entities).sort();
  });

  readonly yearOptions = computed(() => {
    const docs = this.allDocuments();
    const years = new Set<string>();
    docs.forEach((d) => {
      if (d.year) {
        years.add(String(d.year));
      }
    });
    return Array.from(years).sort().reverse();
  });

  readonly typeOptions = ['general_ledger', 'trial_balance', 'bank_statement', 'tax_return', 'financial_statement'];
  readonly statusOptions = ['missing', 'uploaded', 'analyzed', 'validated'];

  // Bulk download state
  readonly bulkDownloadProgress = signal(0);
  readonly isBulkDownloading = signal(false);
  readonly bulkDownloadTotal = signal(0);
  readonly bulkDownloadCurrent = signal(0);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [{ label: 'Library', icon: '📁' }];
    return items;
  });

  // Missing documents from engagement requirements
  readonly missingDocuments = computed<Document[]>(() => {
    const engagements = this.engagements();
    const missingDocs: Document[] = [];

    engagements.forEach(eng => {
      const requirements = eng.documentRequirements || [];
      requirements
        .filter(req => req.status === 'missing')
        .forEach(req => {
          missingDocs.push({
            id: `missing-${eng.id}-${req.type}`,
            name: `${req.label} (Required)`,
            type: req.type,
            engagementIds: [eng.id],
            uploadedAt: '',
            status: 'missing' as Document['status'],
            size: 0,
            year: eng.fiscalYear,
            entityId: eng.id,
            entityName: eng.entity,
            isMissing: true,
          } as Document & { isMissing: boolean });
        });
    });

    return missingDocs;
  });

  // All documents including missing ones
  readonly allDocsWithMissing = computed(() => {
    return [...this.allDocuments(), ...this.missingDocuments()];
  });

  // Status counts for filter badges
  readonly statusCounts = computed(() => {
    const allDocs = this.allDocsWithMissing();
    const entityFilter = this.globalFilters().entity;

    const filteredDocs = entityFilter
      ? allDocs.filter(d => d.entityName === entityFilter)
      : allDocs;

    return {
      missing: filteredDocs.filter(d => (d as Document & { isMissing?: boolean }).isMissing).length,
      uploaded: filteredDocs.filter(d => d.status === 'analyzing' || d.status === 'pending').length,
      analyzed: filteredDocs.filter(d => d.status === 'analyzed').length,
      validated: filteredDocs.filter(d => d.status === 'validated').length,
    };
  });

  // Filtered documents
  filteredDocuments = computed(() => {
    let docs = this.allDocsWithMissing();
    const gf = this.globalFilters();

    // Filter by entity
    if (gf.entity) {
      docs = docs.filter((d) => d.entityName === gf.entity);
    }

    // Filter by year
    if (gf.year) {
      docs = docs.filter((d) => String(d.year) === gf.year);
    }

    // Filter by type
    if (gf.type) {
      docs = docs.filter((d) => d.type === gf.type);
    }

    // Filter by status
    if (gf.status) {
      if (gf.status === 'missing') {
        docs = docs.filter((d) => (d as Document & { isMissing?: boolean }).isMissing);
      } else if (gf.status === 'uploaded') {
        docs = docs.filter((d) => d.status === 'analyzing' || d.status === 'pending');
      } else if (gf.status === 'analyzed') {
        docs = docs.filter((d) => d.status === 'analyzed');
      } else if (gf.status === 'validated') {
        docs = docs.filter((d) => d.status === 'validated');
      }
    }

    return docs;
  });

  // Filtered documents for tree (only by entity filter)
  filteredTreeDocuments = computed(() => {
    const entityFilter = this.globalFilters().entity;
    if (!entityFilter) {
      return this.allDocuments();
    }
    return this.allDocuments().filter(d => d.entityName === entityFilter);
  });

  ngOnInit(): void {
    // Check for query params
    this.route.queryParams.subscribe((params) => {
      const entity = params['entity'];
      const status = params['status'];
      const type = params['type'];
      const highlight = params['highlight'];
      const tab = params['tab'];

      // Handle tab switching from deep link
      if (tab === 'upload') {
        this.activeTab.set('upload');
      }

      if (entity || status || type) {
        this.globalFilters.update(f => ({
          ...f,
          entity: entity || '',
          status: status || '',
          type: type || '',
        }));
      }

      // Handle document highlight (from notification deep-link)
      if (highlight) {
        this.highlightDocumentId.set(highlight);
        setTimeout(() => {
          this.highlightDocumentId.set(null);
        }, 3000);
      }
    });
  }

  // Tab toggle
  setActiveTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'upload') {
      // Reset pending files when switching to upload tab
      this.pendingFiles.set([]);
    }
  }

  // Global filter methods
  onGlobalSearchChange(search: string): void {
    this.globalFilters.update((f) => ({ ...f, search }));
  }

  onGlobalEntityChange(entity: string): void {
    this.globalFilters.update((f) => ({ ...f, entity }));
  }

  onGlobalYearChange(year: string): void {
    this.globalFilters.update((f) => ({ ...f, year }));
  }

  onGlobalTypeChange(type: string): void {
    this.globalFilters.update((f) => ({ ...f, type }));
  }

  onGlobalStatusChange(status: string): void {
    this.globalFilters.update((f) => ({ ...f, status }));
  }

  clearGlobalFilters(): void {
    this.globalFilters.set({
      search: '',
      entity: '',
      year: '',
      type: '',
      status: '',
    });
  }

  hasActiveGlobalFilters(): boolean {
    const gf = this.globalFilters();
    return !!(gf.entity || gf.year || gf.type || gf.status);
  }

  // Bulk download methods
  async startBulkDownload(): Promise<void> {
    const docs = this.filteredDocuments().filter(d => !(d as Document & { isMissing?: boolean }).isMissing);
    if (docs.length === 0) {
      this.toast.warning('No documents to download');
      return;
    }

    this.isBulkDownloading.set(true);
    this.bulkDownloadTotal.set(docs.length);
    this.bulkDownloadCurrent.set(0);
    this.bulkDownloadProgress.set(0);

    try {
      for (let i = 0; i < docs.length; i++) {
        // Check if cancelled
        if (!this.isBulkDownloading()) break;

        const doc = docs[i];
        await this.simulateDownload(doc);

        this.bulkDownloadCurrent.set(i + 1);
        this.bulkDownloadProgress.set(Math.round(((i + 1) / docs.length) * 100));
      }

      if (this.isBulkDownloading()) {
        this.toast.success(`Downloaded ${docs.length} documents`);
      }
    } catch (error) {
      this.toast.error('Download failed');
    } finally {
      this.isBulkDownloading.set(false);
      this.bulkDownloadProgress.set(0);
    }
  }

  cancelBulkDownload(): void {
    this.isBulkDownloading.set(false);
    this.toast.info('Download cancelled');
  }

  private async simulateDownload(doc: Document): Promise<void> {
    // Simulate download delay (300-800ms per file)
    await this.delay(300 + Math.random() * 500);
  }

  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  onTreeNodeSelect(node: TreeNode): void {
    // Apply filters based on tree node selection
    if (node.type === 'entity') {
      this.globalFilters.update(f => ({ ...f, entity: node.label }));
    } else if (node.type === 'year' && node.parentEntity) {
      this.globalFilters.update(f => ({
        ...f,
        entity: node.parentEntity!,
        year: node.label,
      }));
    } else if (node.type === 'doctype' && node.parentEntity && node.parentYear) {
      this.globalFilters.update(f => ({
        ...f,
        entity: node.parentEntity!,
        year: String(node.parentYear!),
        type: node.docType || '',
      }));
    }
  }

  onBreadcrumbNavigate(item: BreadcrumbItem): void {
    this.clearGlobalFilters();
  }

  onBreadcrumbHome(): void {
    this.clearGlobalFilters();
    this.activeTab.set('library');
  }

  onDocumentClick(doc: Document): void {
    this.onPreview(doc);
  }

  onDownload(doc: Document): void {
    this.toast.info(`Downloading ${doc.name}...`);
  }

  onPreview(doc: Document): void {
    this.previewDocument.set(doc);
  }

  closePreview(): void {
    this.previewDocument.set(null);
  }

  onAskEve(doc: Document): void {
    this.toast.info(`Ask Eve about ${doc.name}`);
  }

  // Upload handling
  onFilesSelected(files: FilePreview[]): void {
    const newPendingFiles: PendingFile[] = files.map(file => ({
      file,
      metadata: this.detectMetadata(file.name),
      isProcessing: false,
      isValidated: false,
    }));
    this.pendingFiles.set(newPendingFiles);
  }

  /**
   * Auto-detect metadata from filename
   */
  private detectMetadata(filename: string): DetectedMetadata {
    const lowerName = filename.toLowerCase();
    let entity: string | null = null;
    let year: number | null = null;
    let type: string | null = null;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    // Detect entity
    const entityPatterns: Record<string, string> = {
      'france': 'France SPV',
      'germany': 'Germany PropCo',
      'netherlands': 'Netherlands BV',
      'belgium': 'Belgium HoldCo',
      'luxembourg': 'Luxembourg Fund',
    };
    for (const [pattern, entityName] of Object.entries(entityPatterns)) {
      if (lowerName.includes(pattern)) {
        entity = entityName;
        break;
      }
    }

    // Detect year (2020-2030)
    const yearMatch = filename.match(/20(2[0-9]|30)/);
    if (yearMatch) {
      year = parseInt(yearMatch[0], 10);
    }

    // Detect document type
    const typePatterns: Record<string, string> = {
      'grand_livre': 'general_ledger',
      'grand livre': 'general_ledger',
      'general_ledger': 'general_ledger',
      'balance': 'trial_balance',
      'trial_balance': 'trial_balance',
      'tax': 'tax_return',
      'fiscal': 'tax_return',
      'declaration': 'tax_return',
      'financial': 'financial_statement',
      'etats_financiers': 'financial_statement',
      'états financiers': 'financial_statement',
    };
    for (const [pattern, docType] of Object.entries(typePatterns)) {
      if (lowerName.includes(pattern)) {
        type = docType;
        break;
      }
    }

    // Calculate confidence
    const detectedCount = [entity, year, type].filter(Boolean).length;
    if (detectedCount >= 3) {
      confidence = 'high';
    } else if (detectedCount >= 2) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return { entity, year, type, confidence };
  }

  /**
   * Remove a file from pending uploads
   */
  removePendingFile(fileId: string): void {
    this.pendingFiles.update(files => files.filter(f => f.file.id !== fileId));
  }

  /**
   * Validate and start uploads
   */
  async validateUploads(): Promise<void> {
    const pending = this.pendingFiles();
    if (pending.length === 0) return;

    // Find files that need classification (low confidence)
    const needsClassification = pending.filter(p => p.metadata.confidence !== 'high');
    const readyToUpload = pending.filter(p => p.metadata.confidence === 'high');

    if (needsClassification.length > 0) {
      // Queue files needing classification
      this.classificationQueue.set([...needsClassification]);
      this.processNextClassification();
    }

    // Upload high-confidence files immediately
    for (const pf of readyToUpload) {
      await this.uploadFile(pf);
    }
  }

  /**
   * Process next file in classification queue
   */
  private processNextClassification(): void {
    const queue = this.classificationQueue();
    if (queue.length === 0) {
      this.showClassificationDialog.set(false);
      this.fileNeedingClassification.set(null);
      return;
    }

    const nextFile = queue[0];
    this.fileNeedingClassification.set(nextFile);
    this.showClassificationDialog.set(true);
  }

  /**
   * Handle classification confirmation
   */
  async onClassificationConfirm(result: ClassificationResult): Promise<void> {
    const file = this.fileNeedingClassification();
    if (!file) return;

    // Update file metadata with confirmed classification
    const updatedFile: PendingFile = {
      ...file,
      metadata: {
        entity: result.entity,
        year: result.year,
        type: result.type,
        confidence: 'high', // Now confirmed
      },
    };

    // Remove from queue
    this.classificationQueue.update(q => q.slice(1));

    // Upload the file
    await this.uploadFile(updatedFile);

    // Process next in queue
    this.processNextClassification();
  }

  /**
   * Handle classification cancel
   */
  onClassificationCancel(): void {
    const file = this.fileNeedingClassification();
    if (!file) return;

    // Remove from queue and pending
    this.classificationQueue.update(q => q.slice(1));
    this.pendingFiles.update(files => files.filter(f => f.file.id !== file.file.id));

    // Process next in queue
    this.processNextClassification();
  }

  /**
   * Upload a single file with metadata
   */
  private async uploadFile(pf: PendingFile): Promise<void> {
    const { file, metadata } = pf;

    // Mark as processing
    this.pendingFiles.update(files =>
      files.map(f => f.file.id === file.id ? { ...f, isProcessing: true } : f)
    );

    try {
      // Simulate upload with metadata
      const response = await this.simulateUpload(file, metadata);

      // Find engagement ID from entity name
      const matchingEngagement = this.engagements().find(
        e => e.entity === metadata.entity
      );
      const engagementIds = matchingEngagement ? [matchingEngagement.id] : [];

      // Create document in mock data
      const newDoc: Document = {
        id: crypto.randomUUID(),
        name: file.name,
        type: (metadata.type || 'general_ledger') as Document['type'],
        engagementIds,
        uploadedAt: new Date().toISOString(),
        status: 'analyzing',
        size: file.size,
        year: metadata.year || new Date().getFullYear(),
        entityId: matchingEngagement?.id || crypto.randomUUID(),
        entityName: metadata.entity || 'Unclassified',
      };
      this.mockData.addDocument(newDoc);

      // Trigger placement animation
      await this.triggerPlacementAnimation(file, response, metadata);

      // Remove from pending
      this.pendingFiles.update(files => files.filter(f => f.file.id !== file.id));

      this.toast.success(`${file.name} classified in ${metadata.entity} / ${metadata.year}`);
    } catch (error) {
      this.toast.error(`Upload failed: ${file.name}`);
      this.pendingFiles.update(files =>
        files.map(f => f.file.id === file.id ? { ...f, isProcessing: false } : f)
      );
    }
  }

  /**
   * Simulate upload (mock for demo)
   */
  private async simulateUpload(
    file: FilePreview,
    metadata: DetectedMetadata
  ): Promise<Record<string, unknown>> {
    await this.delay(800);
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: metadata.type,
      entity_name: metadata.entity,
      year: metadata.year,
      status: 'analyzing',
    };
  }

  /**
   * Trigger placement animation to document tree
   */
  private async triggerPlacementAnimation(
    file: FilePreview,
    response: Record<string, unknown>,
    metadata: DetectedMetadata
  ): Promise<void> {
    if (!this.documentTree || !metadata.entity || !metadata.year || !metadata.type) {
      return;
    }

    const docType = metadata.type as DocumentType;
    const targetNodeId = `type-${metadata.entity}-${metadata.year}-${docType}`;

    // Expand tree to target location
    this.documentTree.expandAndHighlight(
      metadata.entity,
      metadata.year,
      docType
    );

    await this.delay(200);

    // Get target position
    const targetElement = document.querySelector(`[data-node-id="${targetNodeId}"]`) as HTMLElement;
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      this.animationTargetPosition.set({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }

    // Highlight the node
    this.documentTree.highlightNode(targetNodeId, 2000);
  }

  getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      general_ledger: 'General Ledger',
      trial_balance: 'Trial Balance',
      bank_statement: 'Bank Statement',
      tax_return: 'Tax Return',
      financial_statement: 'Financial Statement',
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      missing: 'Missing',
      uploaded: 'Uploaded',
      analyzed: 'Analyzed',
      validated: 'Validated',
      pending: 'Uploaded',
      analyzing: 'Uploaded',
      error: 'Error',
    };
    return labels[status] || status;
  }

  // Attribution Review Methods

  /**
   * Check if a pending file has all required attribution
   */
  isFileComplete(pf: PendingFile): boolean {
    return !!(pf.metadata.entity && pf.metadata.year && pf.metadata.type);
  }

  /**
   * Handle inline attribution changes
   */
  onAttributionChange(fileId: string, field: 'entity' | 'year' | 'type', value: string | number): void {
    this.pendingFiles.update(files =>
      files.map(f => {
        if (f.file.id !== fileId) return f;

        const updatedMetadata = { ...f.metadata };
        if (field === 'entity') {
          updatedMetadata.entity = value as string || null;
        } else if (field === 'year') {
          updatedMetadata.year = value ? Number(value) : null;
        } else if (field === 'type') {
          updatedMetadata.type = value as string || null;
        }

        // Recalculate confidence based on completeness
        const detectedCount = [updatedMetadata.entity, updatedMetadata.year, updatedMetadata.type].filter(Boolean).length;
        if (detectedCount >= 3) {
          updatedMetadata.confidence = 'high';
        } else if (detectedCount >= 2) {
          updatedMetadata.confidence = 'medium';
        } else {
          updatedMetadata.confidence = 'low';
        }

        return {
          ...f,
          metadata: updatedMetadata,
          isValidated: false, // Reset validation when editing
        };
      })
    );
  }

  /**
   * Mark a single file as validated
   */
  validateSingleFile(fileId: string): void {
    this.pendingFiles.update(files =>
      files.map(f =>
        f.file.id === fileId ? { ...f, isValidated: true } : f
      )
    );
    this.toast.success('Attribution validated');
  }

  /**
   * Edit attribution (unvalidate to allow changes)
   */
  editAttribution(fileId: string): void {
    this.pendingFiles.update(files =>
      files.map(f =>
        f.file.id === fileId ? { ...f, isValidated: false } : f
      )
    );
  }

  /**
   * Get count of incomplete files (missing attribution)
   */
  getIncompleteCount(): number {
    return this.pendingFiles().filter(pf => !this.isFileComplete(pf)).length;
  }

  /**
   * Get count of validated files
   */
  getValidatedCount(): number {
    return this.pendingFiles().filter(pf => pf.isValidated).length;
  }

  /**
   * Get count of complete but not validated files
   */
  getCompleteUnvalidatedCount(): number {
    return this.pendingFiles().filter(pf => this.isFileComplete(pf) && !pf.isValidated).length;
  }

  /**
   * Validate all complete files at once
   */
  validateAllComplete(): void {
    this.pendingFiles.update(files =>
      files.map(f => {
        if (this.isFileComplete(f) && !f.isValidated) {
          return { ...f, isValidated: true };
        }
        return f;
      })
    );
    const count = this.getCompleteUnvalidatedCount();
    if (count > 0) {
      this.toast.success(`${count} file(s) validated`);
    }
  }

  /**
   * Place all validated documents (upload and classify)
   */
  async placeValidatedDocuments(): Promise<void> {
    const validatedFiles = this.pendingFiles().filter(pf => pf.isValidated);
    if (validatedFiles.length === 0) {
      this.toast.warning('No validated files to place');
      return;
    }

    this.isUploading.set(true);

    for (let i = 0; i < validatedFiles.length; i++) {
      const pf = validatedFiles[i];

      // Get source position from the row element
      const rowElement = document.querySelector(`[data-file-id="${pf.file.id}"]`) as HTMLElement;
      const sourcePosition = rowElement
        ? {
            x: rowElement.getBoundingClientRect().left + rowElement.getBoundingClientRect().width / 2,
            y: rowElement.getBoundingClientRect().top + rowElement.getBoundingClientRect().height / 2,
          }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 };

      await this.uploadFileWithAnimation(pf, sourcePosition);

      // Small delay between documents for visual effect
      if (i < validatedFiles.length - 1) {
        await this.delay(300);
      }
    }

    this.isUploading.set(false);
    this.toast.success(`${validatedFiles.length} document(s) placed successfully`);
  }

  /**
   * Upload file with placement animation
   */
  private async uploadFileWithAnimation(
    pf: PendingFile,
    sourcePosition: { x: number; y: number }
  ): Promise<void> {
    const { file, metadata } = pf;

    // Mark as processing
    this.pendingFiles.update(files =>
      files.map(f => f.file.id === file.id ? { ...f, isProcessing: true } : f)
    );

    // Prepare target position in tree
    if (this.documentTree && metadata.entity && metadata.year && metadata.type) {
      const docType = metadata.type as DocumentType;

      // Expand tree to show target location
      this.documentTree.expandAndHighlight(
        metadata.entity,
        metadata.year,
        docType
      );

      await this.delay(200);

      // Get target position
      const targetNodeId = `type-${metadata.entity}-${metadata.year}-${docType}`;
      const targetElement = document.querySelector(`[data-node-id="${targetNodeId}"]`) as HTMLElement;

      let targetPos = { x: 100, y: 300 };
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        targetPos = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }

      // Create and start animation
      const animation: PlacementAnimation = {
        id: crypto.randomUUID(),
        documentId: file.id,
        documentName: file.name,
        documentType: docType,
        sourcePosition,
        status: 'flying',
      };

      this.activeAnimation.set(animation);
      this.animationTargetPosition.set(targetPos);

      // Wait for animation to complete
      await this.delay(800);

      // Update animation status to landed
      this.activeAnimation.update(anim =>
        anim ? { ...anim, status: 'landed' } : null
      );

      await this.delay(300);

      // Highlight target node
      this.documentTree.highlightNode(targetNodeId, 2000);

      // Clear animation
      this.activeAnimation.set(null);
    }

    // Now perform the actual upload
    try {
      const response = await this.simulateUpload(file, metadata);

      // Find engagement ID from entity name
      const matchingEngagement = this.engagements().find(
        e => e.entity === metadata.entity
      );
      const engagementIds = matchingEngagement ? [matchingEngagement.id] : [];

      // Create document in mock data
      const newDoc: Document = {
        id: crypto.randomUUID(),
        name: file.name,
        type: (metadata.type || 'general_ledger') as Document['type'],
        engagementIds,
        uploadedAt: new Date().toISOString(),
        status: 'analyzing',
        size: file.size,
        year: metadata.year || new Date().getFullYear(),
        entityId: matchingEngagement?.id || crypto.randomUUID(),
        entityName: metadata.entity || 'Unclassified',
      };
      this.mockData.addDocument(newDoc);

      // Remove from pending
      this.pendingFiles.update(files => files.filter(f => f.file.id !== file.id));
    } catch (error) {
      this.toast.error(`Upload failed: ${file.name}`);
      this.pendingFiles.update(files =>
        files.map(f => f.file.id === file.id ? { ...f, isProcessing: false } : f)
      );
    }
  }

  // Helper to check if document is missing
  isDocumentMissing(doc: Document): boolean {
    return !!(doc as Document & { isMissing?: boolean }).isMissing;
  }

  // Navigate to upload for missing document
  onUploadMissing(doc: Document): void {
    // Switch to upload tab with context
    this.activeTab.set('upload');
    this.toast.info(`Upload ${this.getDocumentTypeLabel(doc.type)} for ${doc.entityName}`);
  }

  onUploadStart(files: FilePreview[]): void {
    this.isUploading.set(true);
  }

  onUploadSuccess(result: UploadResult): void {
    // Handled by validateUploads flow
  }

  onUploadError(result: UploadResult): void {
    this.toast.error(`Failed: ${result.file.name} - ${result.error}`);
  }

  onUploadComplete(results: UploadResult[]): void {
    this.isUploading.set(false);
  }

  /**
   * Handle placement animation after document classification (legacy support)
   */
  async onPlacementReady(event: {
    preview: FilePreview;
    sourceElement: HTMLElement;
    response: Record<string, unknown>;
  }): Promise<void> {
    const { preview, sourceElement, response } = event;

    const docType = response['type'] as DocumentType | undefined;
    const entityName = response['entity_name'] as string | undefined;
    const year = response['year'] as number | undefined;

    if (!docType || !entityName || !year || !this.documentTree) {
      return;
    }

    const targetNodeId = `type-${entityName}-${year}-${docType}`;

    this.documentTree.expandAndHighlight(entityName, year, docType);
    await this.delay(200);

    const targetElement = document.querySelector(`[data-node-id="${targetNodeId}"]`) as HTMLElement;
    if (!targetElement) {
      const treeContainer = document.querySelector('.document-tree') as HTMLElement;
      if (treeContainer) {
        const rect = treeContainer.getBoundingClientRect();
        this.animationTargetPosition.set({
          x: rect.left + rect.width / 2,
          y: rect.top + 100,
        });
      }
    } else {
      const rect = targetElement.getBoundingClientRect();
      this.animationTargetPosition.set({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }

    // Animation feature disabled - service was removed
    // Just highlight the target node directly
    this.documentTree.highlightNode(targetNodeId, 2000);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
