import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
} from '../../shared';
import {
  DocumentTreeComponent,
  TreeNode,
} from './components/document-tree/document-tree.component';
import { DocumentFiltersComponent, DocumentFilters } from './components/document-filters/document-filters.component';
import { DocumentGridComponent } from './components/document-grid/document-grid.component';
import { DocumentListComponent } from './components/document-list/document-list.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    ViewToggleComponent,
    DocumentTreeComponent,
    DocumentFiltersComponent,
    DocumentGridComponent,
    DocumentListComponent,
    UploadZoneComponent,
    ButtonComponent,
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsComponent {
  @ViewChild(UploadZoneComponent) uploadZone!: UploadZoneComponent;

  private readonly mockData = inject(MockDataService);
  private readonly documentApi = inject(DocumentApiService);
  private readonly toast = inject(ToastService);

  readonly engagements = this.mockData.engagements;
  readonly allDocuments = this.mockData.documents;

  showUploadZone = signal(false);
  isUploading = signal(false);

  viewMode = signal<ViewMode>('grid');
  selectedEngagementId = signal<string | null>(null);
  filters = signal<DocumentFilters>({
    search: '',
    type: null,
    status: null,
    engagementId: null,
  });

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [{ label: 'Documents', icon: '📁' }];

    const engId = this.selectedEngagementId();
    if (engId) {
      const eng = this.engagements().find((e) => e.id === engId);
      if (eng) {
        items.push({
          label: eng.entity,
          icon: eng.countryFlag,
          path: engId,
        });
      }
    }

    return items;
  });

  filteredDocuments = computed(() => {
    let docs = this.allDocuments();
    const f = this.filters();
    const selectedEng = this.selectedEngagementId();

    // Filter by tree selection
    if (selectedEng) {
      docs = docs.filter((d) => d.engagementIds.includes(selectedEng));
    }

    // Filter by engagement dropdown (overrides tree if set)
    if (f.engagementId) {
      docs = docs.filter((d) => d.engagementIds.includes(f.engagementId!));
    }

    // Filter by search
    if (f.search) {
      const search = f.search.toLowerCase();
      docs = docs.filter((d) => d.name.toLowerCase().includes(search));
    }

    // Filter by type
    if (f.type) {
      docs = docs.filter((d) => d.type === f.type);
    }

    // Filter by status
    if (f.status) {
      docs = docs.filter((d) => d.status === f.status);
    }

    return docs;
  });

  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  onFiltersChange(filters: DocumentFilters): void {
    this.filters.set(filters);
  }

  onTreeNodeSelect(node: TreeNode): void {
    if (node.type === 'library') {
      // Root library node - show all documents
      this.selectedEngagementId.set(null);
    } else if (node.type === 'category') {
      // Category node - could filter by category in the future
      this.selectedEngagementId.set(null);
    } else if (node.type === 'doctype') {
      // Document type node - could filter by type in the future
      this.selectedEngagementId.set(null);
    } else if (node.type === 'document' && node.documentId) {
      // Individual document - no engagement filter needed
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
  }

  onDocumentClick(doc: Document): void {
    // TODO: Implement document preview/detail modal
  }

  onDownload(doc: Document): void {
    // TODO: Implement document download via API
  }

  onPreview(doc: Document): void {
    // TODO: Implement document preview
  }

  onAskEve(doc: Document): void {
    // TODO: Navigate to Eve with document context
  }

  // Upload zone methods
  toggleUploadZone(): void {
    this.showUploadZone.update(v => !v);
  }

  onFilesSelected(files: FilePreview[]): void {
    // Files selected - could be used for analytics
  }

  onUploadStart(files: FilePreview[]): void {
    this.isUploading.set(true);
    this.toast.info(`Téléchargement de ${files.length} fichier(s)...`);
  }

  onUploadSuccess(result: UploadResult): void {
    // Build success message with classification result
    const response = result.response as Record<string, unknown> | undefined;
    const docType = response?.['type'] as string | undefined;
    const typeLabel = docType ? this.getDocumentTypeLabel(docType) : null;

    if (typeLabel) {
      this.toast.success(`${result.file.name} classé en "${typeLabel}"`);
    } else {
      this.toast.success(`${result.file.name} téléchargé avec succès`);
    }

    // Add document to local mock data for immediate UI update
    if (response && this.selectedEngagementId()) {
      const newDoc: Document = {
        id: response['id'] as string,
        name: response['name'] as string,
        type: (docType ?? 'general_ledger') as Document['type'],
        engagementIds: [this.selectedEngagementId()!],
        uploadedAt: new Date().toISOString(),
        status: response['status'] as Document['status'] ?? 'pending',
        size: response['file_size'] as number ?? result.file.size,
      };
      this.mockData.addDocument(newDoc);

      // Update engagement status from response
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

  private getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      general_ledger: 'Grand Livre',
      trial_balance: 'Balance Générale',
      tax_return: 'Déclaration Fiscale',
      financial_statement: 'États Financiers',
    };
    return labels[type] || type;
  }

  onUploadError(result: UploadResult): void {
    this.toast.error(`Échec: ${result.file.name} - ${result.error}`);
  }

  onUploadComplete(results: UploadResult[]): void {
    this.isUploading.set(false);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

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

    await this.uploadZone.startUpload(
      (file: File, engagementId: string) =>
        this.documentApi.uploadDocument(file, engagementId).toPromise()
    );
  }
}
