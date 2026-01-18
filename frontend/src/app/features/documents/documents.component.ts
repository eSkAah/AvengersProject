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
import { MockDataService, Document, Engagement, DocumentApiService } from '../../core';
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
} from '../../shared';
import {
  DocumentTreeComponent,
  TreeNode,
} from './components/document-tree/document-tree.component';
import { DocumentFiltersComponent, DocumentFilters } from './components/document-filters/document-filters.component';
import { DocumentGridComponent } from './components/document-grid/document-grid.component';
import { DocumentListComponent } from './components/document-list/document-list.component';

export type LibraryMode = 'engagement' | 'global';

export interface GlobalFilters {
  search: string;
  entity: string;
  year: string;
  type: string;
  status: string;
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
    DocumentFiltersComponent,
    DocumentGridComponent,
    DocumentListComponent,
    UploadZoneComponent,
    ButtonComponent,
    DocumentPreviewModalComponent,
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsComponent implements OnInit {
  @ViewChild(UploadZoneComponent) uploadZone!: UploadZoneComponent;

  private readonly mockData = inject(MockDataService);
  private readonly documentApi = inject(DocumentApiService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  readonly engagements = this.mockData.engagements;
  readonly allDocuments = this.mockData.documents;

  showUploadZone = signal(false);
  isUploading = signal(false);

  // Document preview modal
  previewDocument = signal<Document | null>(null);

  // Hybrid mode
  libraryMode = signal<LibraryMode>('global');
  selectedEngagementId = signal<string | null>(null);

  viewMode = signal<ViewMode>('grid');
  filters = signal<DocumentFilters>({
    search: '',
    type: null,
    status: null,
    engagementId: null,
  });

  // Global filters
  globalFilters = signal<GlobalFilters>({
    search: '',
    entity: '',
    year: '',
    type: '',
    status: '',
  });

  // Get selected engagement details
  readonly selectedEngagement = computed(() => {
    const id = this.selectedEngagementId();
    if (!id) return null;
    return this.engagements().find((e) => e.id === id) ?? null;
  });

  // Engagement mode: Required, Uploaded, Missing documents
  readonly engagementDocStats = computed(() => {
    const eng = this.selectedEngagement();
    if (!eng) {
      return { required: [] as string[], uploaded: [] as Document[], missing: [] as string[] };
    }

    const docs = this.allDocuments();
    const uploadedDocs = docs.filter((d) => d.engagementIds.includes(eng.id));
    const uploadedTypes = new Set(uploadedDocs.map((d) => d.type as string));
    const requiredTypes = eng.documentsRequired;
    const missingTypes = requiredTypes.filter((t) => !uploadedTypes.has(t));

    return {
      required: requiredTypes,
      uploaded: uploadedDocs,
      missing: missingTypes,
    };
  });

  // Unique filter options for global mode
  readonly entityOptions = computed(() => {
    const docs = this.allDocuments();
    const entities = new Set<string>();
    docs.forEach((d) => {
      d.engagementIds.forEach((engId) => {
        const eng = this.engagements().find((e) => e.id === engId);
        if (eng) entities.add(eng.entity);
      });
    });
    return Array.from(entities).sort();
  });

  readonly yearOptions = computed(() => {
    const docs = this.allDocuments();
    const years = new Set<string>();
    docs.forEach((d) => {
      const year = d.uploadedAt.substring(0, 4);
      years.add(year);
    });
    return Array.from(years).sort().reverse();
  });

  readonly typeOptions = ['general_ledger', 'trial_balance', 'tax_return', 'financial_statement'];
  readonly statusOptions = ['pending', 'processing', 'validated', 'rejected'];

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [{ label: 'Documents', icon: '📁' }];

    if (this.libraryMode() === 'engagement') {
      const eng = this.selectedEngagement();
      if (eng) {
        items.push({
          label: eng.entity,
          icon: eng.countryFlag,
          path: eng.id,
        });
      }
    }

    return items;
  });

  // Filtered documents based on mode
  filteredDocuments = computed(() => {
    const mode = this.libraryMode();
    let docs = this.allDocuments();

    if (mode === 'engagement') {
      // Engagement mode: show only docs for selected engagement
      const engId = this.selectedEngagementId();
      if (engId) {
        docs = docs.filter((d) => d.engagementIds.includes(engId));
      }
      // Also apply basic filters
      const f = this.filters();
      if (f.search) {
        const search = f.search.toLowerCase();
        docs = docs.filter((d) => d.name.toLowerCase().includes(search));
      }
      if (f.type) {
        docs = docs.filter((d) => d.type === f.type);
      }
      if (f.status) {
        docs = docs.filter((d) => d.status === f.status);
      }
    } else {
      // Global mode: apply global filters
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
        docs = docs.filter((d) => {
          return d.engagementIds.some((engId) => {
            const eng = this.engagements().find((e) => e.id === engId);
            return eng?.entity === gf.entity;
          });
        });
      }

      // Filter by year
      if (gf.year) {
        docs = docs.filter((d) => d.uploadedAt.startsWith(gf.year));
      }

      // Filter by type
      if (gf.type) {
        docs = docs.filter((d) => d.type === gf.type);
      }

      // Filter by status
      if (gf.status) {
        docs = docs.filter((d) => d.status === gf.status);
      }
    }

    return docs;
  });

  ngOnInit(): void {
    // Check for engagement query param
    this.route.queryParams.subscribe((params) => {
      const engagementId = params['engagement'];
      if (engagementId) {
        this.selectedEngagementId.set(engagementId);
        this.libraryMode.set('engagement');
      }
    });
  }

  // Mode toggle
  setLibraryMode(mode: LibraryMode): void {
    this.libraryMode.set(mode);
    if (mode === 'global') {
      this.selectedEngagementId.set(null);
    }
  }

  onEngagementSelect(engagementId: string): void {
    this.selectedEngagementId.set(engagementId);
    this.libraryMode.set('engagement');
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

  onFiltersChange(filters: DocumentFilters): void {
    this.filters.set(filters);
  }

  onTreeNodeSelect(node: TreeNode): void {
    if (node.type === 'library') {
      this.selectedEngagementId.set(null);
    } else if (node.type === 'category') {
      this.selectedEngagementId.set(null);
    } else if (node.type === 'doctype') {
      this.selectedEngagementId.set(null);
    } else if (node.type === 'document' && node.documentId) {
      this.selectedEngagementId.set(null);
    }
  }

  onBreadcrumbNavigate(item: BreadcrumbItem): void {
    if (!item.path) {
      this.selectedEngagementId.set(null);
    }
  }

  onBreadcrumbHome(): void {
    this.selectedEngagementId.set(null);
    this.libraryMode.set('global');
  }

  onDocumentClick(doc: Document): void {
    // TODO: Implement document preview/detail modal
  }

  onDownload(doc: Document): void {
    // TODO: Implement document download via API
  }

  onPreview(doc: Document): void {
    this.previewDocument.set(doc);
  }

  closePreview(): void {
    this.previewDocument.set(null);
  }

  onAskEve(doc: Document): void {
    // TODO: Navigate to Eve with document context
  }

  // Upload zone methods
  toggleUploadZone(): void {
    this.showUploadZone.update((v) => !v);
  }

  onFilesSelected(files: FilePreview[]): void {
    // Files selected - could be used for analytics
  }

  onUploadStart(files: FilePreview[]): void {
    this.isUploading.set(true);
    this.toast.info(`Téléchargement de ${files.length} fichier(s)...`);
  }

  onUploadSuccess(result: UploadResult): void {
    const response = result.response as Record<string, unknown> | undefined;
    const docType = response?.['type'] as string | undefined;
    const typeLabel = docType ? this.getDocumentTypeLabel(docType) : null;

    if (typeLabel) {
      this.toast.success(`${result.file.name} classé en "${typeLabel}"`);
    } else {
      this.toast.success(`${result.file.name} téléchargé avec succès`);
    }

    if (response && this.selectedEngagementId()) {
      const newDoc: Document = {
        id: response['id'] as string,
        name: response['name'] as string,
        type: (docType ?? 'general_ledger') as Document['type'],
        engagementIds: [this.selectedEngagementId()!],
        uploadedAt: new Date().toISOString(),
        status: (response['status'] as Document['status']) ?? 'pending',
        size: (response['file_size'] as number) ?? result.file.size,
      };
      this.mockData.addDocument(newDoc);

      const engagementUpdate = response['engagement_update'] as Record<string, unknown> | undefined;
      if (engagementUpdate) {
        this.mockData.updateEngagementFromUpload(
          this.selectedEngagementId()!,
          engagementUpdate['status'] as string,
          engagementUpdate['completion_percent'] as number,
          engagementUpdate['risk_level'] as string
        );
      }
    }
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
      processing: 'En traitement',
      validated: 'Validé',
      rejected: 'Rejeté',
    };
    return labels[status] || status;
  }

  onUploadError(result: UploadResult): void {
    this.toast.error(`Échec: ${result.file.name} - ${result.error}`);
  }

  onUploadComplete(results: UploadResult[]): void {
    this.isUploading.set(false);
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    if (failed === 0) {
      this.toast.success(`${successful} fichier(s) téléchargé(s) avec succès`);
      this.showUploadZone.set(false);
    } else if (successful === 0) {
      this.toast.error(`Tous les téléchargements ont échoué`);
    } else {
      this.toast.warning(`${successful} réussi(s), ${failed} échoué(s)`);
    }
  }

  async triggerUpload(): Promise<void> {
    if (!this.uploadZone || !this.selectedEngagementId()) return;

    await this.uploadZone.startUpload((file: File, engagementId: string) =>
      this.documentApi.uploadDocument(file, engagementId).toPromise()
    );
  }
}
