import { Component, input, signal, computed, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Upload, FolderOpen, FileText, Search } from 'lucide-angular';
import { MockDataService, Document, DocumentType } from '../../../../core';
import {
  UploadZoneComponent,
  FilePreview,
  ToastService,
  DocumentPreviewModalComponent,
} from '../../../../shared';
import { DocumentTreeComponent, TreeNode } from '../../../documents/components/document-tree/document-tree.component';
import { MOCK_ENTITY_DETAILS } from '../../../../core/mocks/entity-detail.mock';

@Component({
  selector: 'app-entity-documents',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DocumentTreeComponent,
    UploadZoneComponent,
    DocumentPreviewModalComponent,
  ],
  templateUrl: './entity-documents.component.html',
  styleUrl: './entity-documents.component.scss',
})
export class EntityDocumentsComponent implements OnInit {
  @ViewChild(DocumentTreeComponent) documentTree!: DocumentTreeComponent;

  private readonly mockData = inject(MockDataService);
  private readonly toast = inject(ToastService);

  // Icons
  readonly Upload = Upload;
  readonly FolderOpen = FolderOpen;
  readonly FileText = FileText;
  readonly Search = Search;

  // Inputs
  entityId = input.required<string>();
  entityName = input.required<string>();

  // State
  isUploadMode = signal(false);
  isUploading = signal(false);
  previewDocument = signal<Document | null>(null);
  searchQuery = signal('');
  activeStatus = signal<string>(''); // '' means all

  // Status options for filter pills
  readonly statusOptions = ['signed_off', 'in_review', 'pending', 'private', 'unclassified'];

  // Get entity details to find the proper entity name for filtering
  entityDisplayName = computed(() => {
    const detail = MOCK_ENTITY_DETAILS[this.entityId()];
    return detail?.name || this.entityName();
  });

  // Filter documents for this entity - strict matching by engagementId or entityName
  entityDocuments = computed(() => {
    const allDocs = this.mockData.documents();
    const entityId = this.entityId();
    const entityDetail = MOCK_ENTITY_DETAILS[entityId];
    const entityNameToMatch = entityDetail?.name || this.entityName();

    // Filter documents that directly belong to this entity
    return allDocs.filter(doc =>
      doc.engagementIds.includes(entityId) ||
      doc.entityName === entityNameToMatch
    );
  });

  // Filtered by search and status
  filteredDocuments = computed(() => {
    let docs = this.entityDocuments();
    const query = this.searchQuery().toLowerCase();
    const status = this.activeStatus();

    // Apply status filter
    if (status) {
      docs = docs.filter(doc => doc.status === status);
    }

    // Apply search filter
    if (query) {
      docs = docs.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.type.toLowerCase().includes(query)
      );
    }

    return docs;
  });

  // Document stats (always from all entity documents)
  documentStats = computed(() => {
    const docs = this.entityDocuments();
    return {
      total: docs.length,
      signed_off: docs.filter(d => d.status === 'signed_off').length,
      in_review: docs.filter(d => d.status === 'in_review').length,
      pending: docs.filter(d => d.status === 'pending').length,
      private: docs.filter(d => d.status === 'private').length,
      unclassified: docs.filter(d => d.status === 'unclassified').length,
    };
  });

  // Filter by status
  onStatusFilter(status: string): void {
    this.activeStatus.set(status);
  }

  // Get status label
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      signed_off: 'Signed Off',
      in_review: 'In Review',
      pending: 'Pending',
      private: 'Private (EY)',
      unclassified: 'Unclassified',
    };
    return labels[status] || status;
  }

  ngOnInit(): void {
    // Expand tree to show entity content on load
    setTimeout(() => {
      if (this.documentTree) {
        const entityNodeId = `entity-${this.entityDisplayName()}`;
        this.documentTree.expandedNodes.update(set => {
          const newSet = new Set(set);
          newSet.add('root');
          newSet.add(entityNodeId);
          return newSet;
        });
      }
    }, 100);
  }

  toggleUploadMode(): void {
    this.isUploadMode.update(v => !v);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  onTreeNodeSelect(node: TreeNode): void {
    // If it's a document node, open preview
    if (node.type === 'document' && node.documentId) {
      const doc = this.entityDocuments().find(d => d.id === node.documentId);
      if (doc) {
        this.previewDocument.set(doc);
      }
    }
  }

  onFilesSelected(files: FilePreview[]): void {
    this.processFiles(files);
  }

  private async processFiles(files: FilePreview[]): Promise<void> {
    this.isUploading.set(true);

    for (const file of files) {
      try {
        // Detect document type from filename
        const docType = this.detectDocumentType(file.name);

        // Simulate upload delay
        await this.delay(800);

        // Create new document
        const newDoc: Document = {
          id: crypto.randomUUID(),
          name: file.name,
          type: docType,
          engagementIds: [this.entityId()],
          uploadedAt: new Date().toISOString(),
          status: 'analyzing',
          size: file.size,
          year: new Date().getFullYear(),
          entityId: this.entityId(),
          entityName: this.entityDisplayName(),
        };

        this.mockData.addDocument(newDoc);

        // Highlight in tree
        if (this.documentTree) {
          this.documentTree.expandAndHighlight(
            this.entityDisplayName(),
            newDoc.year,
            docType
          );
        }

        this.toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        this.toast.error(`Failed to upload ${file.name}`);
      }
    }

    this.isUploading.set(false);
    this.isUploadMode.set(false);
  }

  private detectDocumentType(filename: string): DocumentType {
    const lowerName = filename.toLowerCase();

    if (lowerName.includes('ledger') || lowerName.includes('grand_livre')) {
      return 'general_ledger';
    }
    if (lowerName.includes('balance') || lowerName.includes('trial')) {
      return 'trial_balance';
    }
    if (lowerName.includes('bank') || lowerName.includes('statement')) {
      return 'bank_statement';
    }
    if (lowerName.includes('tax') || lowerName.includes('fiscal')) {
      return 'tax_return';
    }
    if (lowerName.includes('financial')) {
      return 'financial_statement';
    }

    return 'general_ledger'; // Default
  }

  closePreview(): void {
    this.previewDocument.set(null);
  }

  onDownload(doc: Document): void {
    this.toast.info(`Downloading ${doc.name}...`);
  }

  onAskEve(doc: Document): void {
    this.toast.info(`Ask Eve about ${doc.name}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
