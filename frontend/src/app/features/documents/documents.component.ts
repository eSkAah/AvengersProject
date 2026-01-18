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

  readonly typeOptions = ['general_ledger', 'trial_balance', 'tax_return', 'financial_statement'];
  readonly statusOptions = ['pending', 'analyzing', 'analyzed', 'error'];

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [{ label: 'Bibliothèque', icon: '📁' }];
    return items;
  });

  // Filtered documents
  filteredDocuments = computed(() => {
    let docs = this.allDocuments();
    const gf = this.globalFilters();

    // Search by name or keywords
    if (gf.search) {
      const search = gf.search.toLowerCase();
      docs = docs.filter((d) =>
        d.name.toLowerCase().includes(search) ||
        this.getDocumentTypeLabel(d.type).toLowerCase().includes(search)
      );
    }

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
      docs = docs.filter((d) => d.status === gf.status);
    }

    return docs;
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
    return !!(gf.search || gf.entity || gf.year || gf.type || gf.status);
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
    this.toast.info(`Téléchargement de ${doc.name}...`);
  }

  onPreview(doc: Document): void {
    this.previewDocument.set(doc);
  }

  closePreview(): void {
    this.previewDocument.set(null);
  }

  onAskEve(doc: Document): void {
    this.toast.info(`Demander à Eve à propos de ${doc.name}`);
  }

  // Upload handling
  onFilesSelected(files: FilePreview[]): void {
    const newPendingFiles: PendingFile[] = files.map(file => ({
      file,
      metadata: this.detectMetadata(file.name),
      isProcessing: false,
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

      // Create document in mock data
      const newDoc: Document = {
        id: crypto.randomUUID(),
        name: file.name,
        type: (metadata.type || 'general_ledger') as Document['type'],
        engagementIds: [],
        uploadedAt: new Date().toISOString(),
        status: 'analyzing',
        size: file.size,
        year: metadata.year || new Date().getFullYear(),
        entityId: crypto.randomUUID(),
        entityName: metadata.entity || 'Non classé',
      };
      this.mockData.addDocument(newDoc);

      // Trigger placement animation
      await this.triggerPlacementAnimation(file, response, metadata);

      // Remove from pending
      this.pendingFiles.update(files => files.filter(f => f.file.id !== file.id));

      this.toast.success(`${file.name} classé dans ${metadata.entity} / ${metadata.year}`);
    } catch (error) {
      this.toast.error(`Échec de l'upload: ${file.name}`);
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
      general_ledger: 'Grand Livre',
      trial_balance: 'Balance Générale',
      tax_return: 'Déclaration Fiscale',
      financial_statement: 'États Financiers',
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      analyzing: 'En analyse',
      analyzed: 'Analysé',
      error: 'Erreur',
    };
    return labels[status] || status;
  }

  onUploadStart(files: FilePreview[]): void {
    this.isUploading.set(true);
  }

  onUploadSuccess(result: UploadResult): void {
    // Handled by validateUploads flow
  }

  onUploadError(result: UploadResult): void {
    this.toast.error(`Échec: ${result.file.name} - ${result.error}`);
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
