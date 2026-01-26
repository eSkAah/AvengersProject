import {
  Component,
  ChangeDetectionStrategy,
  Input,
  signal,
  computed,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronRight, ChevronDown, File, Folder, Calendar, Building2, Download, Eye, MessageCircle, Upload } from 'lucide-angular';
import { Document, ServiceType, DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from '../../../../core/models/document.model';
import { MOCK_DOCUMENTS } from '../../../../core/mocks/documents.mock';

export interface DocumentTreeNode {
  id: string;
  label: string;
  icon: string;
  isEmoji?: boolean;
  type: 'root' | 'entity' | 'year' | 'document';
  children?: DocumentTreeNode[];
  count?: number;
  document?: Document;
  year?: number;
  entityName?: string;
}

// Country flags mapping
const ENTITY_FLAGS: Record<string, string> = {
  'France SCI': '🇫🇷',
  'Germany GmbH': '🇩🇪',
  'Netherlands BV': '🇳🇱',
  'Belgium SA': '🇧🇪',
  'Luxembourg SARL': '🇱🇺',
  'Spain SL': '🇪🇸',
  'France-Germany': '🇫🇷🇩🇪',
  'Netherlands-Belgium': '🇳🇱🇧🇪',
  'Luxembourg-France': '🇱🇺🇫🇷',
};

@Component({
  selector: 'app-service-documents',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './service-documents.component.html',
  styleUrl: './service-documents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceDocumentsComponent {
  @Input() set serviceId(value: string | null) {
    this.serviceIdSignal.set(value as ServiceType | null);
  }

  private serviceIdSignal = signal<ServiceType | null>(null);
  expandedNodes = signal<Set<string>>(new Set(['root']));
  selectedDocument = signal<Document | null>(null);
  activeStatus = signal<string>(''); // '' means all

  // Status options for filter pills
  readonly statusOptions = ['signed_off', 'in_review', 'pending', 'private', 'unclassified'];

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  readonly icons = {
    chevronRight: ChevronRight,
    chevronDown: ChevronDown,
    file: File,
    folder: Folder,
    calendar: Calendar,
    building: Building2,
    download: Download,
    eye: Eye,
    messageCircle: MessageCircle,
    upload: Upload,
  };

  dragOverNodeId = signal<string | null>(null);
  isDraggingFile = signal<boolean>(false);

  // All documents for this service (unfiltered)
  readonly allDocuments = computed<Document[]>(() => {
    const serviceId = this.serviceIdSignal();
    if (!serviceId) return [];
    return MOCK_DOCUMENTS.filter(doc => doc.serviceType === serviceId);
  });

  // Filtered documents based on active status
  readonly documents = computed<Document[]>(() => {
    const allDocs = this.allDocuments();
    const status = this.activeStatus();
    if (!status) return allDocs;
    return allDocs.filter(doc => doc.status === status);
  });

  readonly treeData = computed<DocumentTreeNode>(() => {
    const docs = this.documents();
    return this.buildTree(docs);
  });

  readonly totalDocuments = computed(() => this.allDocuments().length);

  // Status counts (always from all documents)
  readonly statusCounts = computed(() => {
    const docs = this.allDocuments();
    return {
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

  private buildTree(documents: Document[]): DocumentTreeNode {
    // Group by entity → year
    const entityMap = new Map<string, Map<number, Document[]>>();

    for (const doc of documents) {
      if (!doc.entityName || !doc.year) continue;

      if (!entityMap.has(doc.entityName)) {
        entityMap.set(doc.entityName, new Map());
      }

      const yearMap = entityMap.get(doc.entityName)!;
      if (!yearMap.has(doc.year)) {
        yearMap.set(doc.year, []);
      }

      yearMap.get(doc.year)!.push(doc);
    }

    // Build tree nodes
    const entityNodes: DocumentTreeNode[] = [];

    for (const [entityName, yearMap] of entityMap) {
      const yearNodes: DocumentTreeNode[] = [];
      let entityTotal = 0;

      // Sort years descending
      const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

      for (const year of sortedYears) {
        const docs = yearMap.get(year)!;
        const documentNodes: DocumentTreeNode[] = docs.map(doc => ({
          id: doc.id,
          label: doc.name,
          icon: 'file',
          type: 'document' as const,
          document: doc,
          year,
          entityName,
        }));

        yearNodes.push({
          id: `year-${entityName}-${year}`,
          label: year.toString(),
          icon: 'calendar',
          type: 'year',
          year,
          entityName,
          count: docs.length,
          children: documentNodes,
        });

        entityTotal += docs.length;
      }

      const flag = ENTITY_FLAGS[entityName] || '🏢';
      entityNodes.push({
        id: `entity-${entityName}`,
        label: entityName,
        icon: flag,
        isEmoji: true,
        type: 'entity',
        entityName,
        count: entityTotal,
        children: yearNodes,
      });
    }

    // Sort entities alphabetically
    entityNodes.sort((a, b) => a.label.localeCompare(b.label));

    return {
      id: 'root',
      label: 'Documents',
      icon: 'folder',
      type: 'root',
      count: documents.length,
      children: entityNodes,
    };
  }

  isExpanded(nodeId: string): boolean {
    return this.expandedNodes().has(nodeId);
  }

  toggleExpand(nodeId: string, event: Event): void {
    event.stopPropagation();
    this.expandedNodes.update(set => {
      const newSet = new Set(set);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }

  expandAll(): void {
    const allNodeIds = this.collectAllNodeIds(this.treeData());
    this.expandedNodes.set(new Set(allNodeIds));
  }

  collapseAll(): void {
    this.expandedNodes.set(new Set(['root']));
  }

  private collectAllNodeIds(node: DocumentTreeNode): string[] {
    const ids: string[] = [node.id];
    if (node.children) {
      for (const child of node.children) {
        ids.push(...this.collectAllNodeIds(child));
      }
    }
    return ids;
  }

  hasChildren(node: DocumentTreeNode): boolean {
    return !!(node.children && node.children.length > 0);
  }

  selectDocument(doc: Document): void {
    this.selectedDocument.set(doc);
  }

  getStatusClass(status: string): string {
    return `status-badge--${status}`;
  }

  getStatusLabel(status: string): string {
    return DOCUMENT_STATUS_LABELS[status as keyof typeof DOCUMENT_STATUS_LABELS] || status;
  }

  getDocTypeLabel(type: string): string {
    return DOCUMENT_TYPE_LABELS[type as keyof typeof DOCUMENT_TYPE_LABELS] || type;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  downloadDocument(doc: Document, event: Event): void {
    event.stopPropagation();
    console.log('Download:', doc.name);
  }

  previewDocument(doc: Document, event: Event): void {
    event.stopPropagation();
    console.log('Preview:', doc.name);
  }

  askEve(doc: Document, event: Event): void {
    event.stopPropagation();
    console.log('Ask Eve about:', doc.name);
  }

  // Drag & Drop handlers
  onDragOver(event: DragEvent, nodeId: string, nodeType: string): void {
    if (nodeType === 'year' || nodeType === 'entity') {
      event.preventDefault();
      event.stopPropagation();
      this.dragOverNodeId.set(nodeId);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOverNodeId.set(null);
  }

  onDrop(event: DragEvent, node: DocumentTreeNode): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverNodeId.set(null);
    this.isDraggingFile.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileDrop(files, node);
    }
  }

  handleFileDrop(files: FileList, targetNode: DocumentTreeNode): void {
    const file = files[0];
    const entityName = targetNode.entityName || targetNode.label;
    const year = targetNode.year || new Date().getFullYear();

    console.log(`Uploading ${file.name} to ${entityName} / ${year}`);

    // Expand to show the target location
    if (targetNode.type === 'entity') {
      this.expandedNodes.update(set => {
        const newSet = new Set(set);
        newSet.add(targetNode.id);
        return newSet;
      });
    } else if (targetNode.type === 'year') {
      this.expandedNodes.update(set => {
        const newSet = new Set(set);
        newSet.add(`entity-${entityName}`);
        newSet.add(targetNode.id);
        return newSet;
      });
    }

    // In a real app, this would upload the file
    alert(`Document "${file.name}" will be uploaded to:\n\nEntity: ${entityName}\nYear: ${year}`);
  }

  // Drop zone handlers
  onDropZoneDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile.set(true);
  }

  onDropZoneDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile.set(false);
  }

  onDropZoneDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingFile.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Default to first entity if dropped on general zone
      const firstEntity = this.treeData().children?.[0];
      if (firstEntity) {
        this.handleFileDrop(files, firstEntity);
      }
    }
  }

  triggerFileInput(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const firstEntity = this.treeData().children?.[0];
      if (firstEntity) {
        this.handleFileDrop(input.files, firstEntity);
      }
      input.value = '';
    }
  }

  isDragOver(nodeId: string): boolean {
    return this.dragOverNodeId() === nodeId;
  }
}
