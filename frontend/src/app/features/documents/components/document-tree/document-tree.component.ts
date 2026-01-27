import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  Document,
  DocumentLibrary,
  DocumentCategory,
  DocumentType,
  ServiceType,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_ICONS,
  DOCUMENT_TYPE_TO_SERVICE,
} from '../../../../core';
import { SearchBarComponent } from '../../../../shared';

export interface TreeNode {
  id: string;
  label: string;
  icon: string;
  isEmoji?: boolean;
  type: 'library' | 'entity' | 'year' | 'service' | 'folder' | 'document' | 'custom';
  children?: TreeNode[];
  count?: number;
  documentId?: string;
  docType?: DocumentType;
  serviceType?: ServiceType;
  category?: DocumentCategory;
  entityId?: string;
  year?: number;
  // Parent context for filtering
  parentEntity?: string;
  parentYear?: number;
  parentService?: ServiceType;
  // For drag & drop
  isDropTarget?: boolean;
}

export interface CustomFolder {
  id: string;
  name: string;
  entityName: string;
  year: number;
  documentIds: string[];
}

export interface DocumentMoveEvent {
  documentId: string;
  documentName: string;
  fromService: ServiceType | null;
  toService: ServiceType;
  toCustomFolder?: string;
}

// Country flags mapping - Tristan Capital Partners entities
const ENTITY_FLAGS: Record<string, string> = {
  // CCP 5 Fund entities
  'CCP 5 Paris Office SPV': '\u{1F1EB}\u{1F1F7}',
  'CCP 5 Munich Logistics PropCo': '\u{1F1E9}\u{1F1EA}',
  'CCP 5 Amsterdam Retail BV': '\u{1F1F3}\u{1F1F1}',
  // EPISO 6 Fund entities
  'EPISO 6 Luxembourg HoldCo': '\u{1F1F1}\u{1F1FA}',
  'EPISO 6 Madrid Residential SL': '\u{1F1EA}\u{1F1F8}',
  'EPISO 6 Milan Mixed-Use Srl': '\u{1F1EE}\u{1F1F9}',
  'EPISO 6 Brussels Industrial SA': '\u{1F1E7}\u{1F1EA}',
  // Legacy names (backwards compatibility)
  'France SPV': '\u{1F1EB}\u{1F1F7}',
  'Germany PropCo': '\u{1F1E9}\u{1F1EA}',
  'Netherlands BV': '\u{1F1F3}\u{1F1F1}',
  'Belgium HoldCo': '\u{1F1E7}\u{1F1EA}',
  'Luxembourg Fund': '\u{1F1F1}\u{1F1FA}',
};

@Component({
  selector: 'app-document-tree',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SearchBarComponent],
  templateUrl: './document-tree.component.html',
  styleUrl: './document-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentTreeComponent {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() set library(value: DocumentLibrary | null) {
    this.librarySignal.set(value);
    this.cdr.markForCheck();
  }

  @Input() set documents(value: Document[]) {
    this.documentsSignal.set(value);
    // Force change detection to ensure tree updates properly with OnPush
    this.cdr.markForCheck();
  }

  @Output() nodeSelect = new EventEmitter<TreeNode>();
  @Output() documentSelect = new EventEmitter<Document>();
  @Output() documentMoved = new EventEmitter<DocumentMoveEvent>();
  @Output() folderCreated = new EventEmitter<CustomFolder>();

  private librarySignal = signal<DocumentLibrary | null>(null);
  private documentsSignal = signal<Document[]>([]);

  expandedNodes = signal<Set<string>>(new Set());
  selectedNodeId = signal<string | null>(null);
  highlightedNodeId = signal<string | null>(null);

  // Search state
  searchQuery = signal<string>('');

  // Drag & Drop state
  draggedNode = signal<TreeNode | null>(null);
  dropTargetId = signal<string | null>(null);

  // Custom folders state
  customFolders = signal<CustomFolder[]>([]);

  // Creating folder state
  creatingFolderFor = signal<{ entityName: string; year: number } | null>(null);
  newFolderName = signal<string>('');

  private typeIcons: Record<string, string> = {
    general_ledger: 'book-open',
    trial_balance: 'bar-chart-3',
    bank_statement: 'landmark',
    tax_return: 'clipboard-list',
    financial_statement: 'file-text',
  };

  /**
   * Build tree data - returns entity nodes directly (no root wrapper)
   */
  treeData = computed<TreeNode[]>(() => {
    const documents = this.documentsSignal();
    return this.buildTreeFromDocuments(documents);
  });

  /**
   * Filtered tree data based on search query
   */
  filteredTreeData = computed<TreeNode[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tree = this.treeData();

    if (!query) {
      return tree;
    }

    return tree
      .map(node => this.filterTreeNode(node, query))
      .filter((node): node is TreeNode => node !== null);
  });

  /**
   * Whether the search has results
   */
  hasSearchResults = computed<boolean>(() => {
    return this.filteredTreeData().length > 0;
  });

  /**
   * When searching, auto-expand all nodes in the filtered tree
   */
  searchExpandedNodes = computed<Set<string>>(() => {
    const query = this.searchQuery().trim();
    if (!query) {
      return new Set<string>();
    }

    const filtered = this.filteredTreeData();
    const nodeIds = new Set<string>();

    for (const node of filtered) {
      this.collectAllNodeIds(node, nodeIds);
    }

    return nodeIds;
  });

  /**
   * Effective expanded nodes - combines manual expansion and search auto-expansion
   * This is the reactive signal that should be used in the template
   */
  effectiveExpandedNodes = computed<Set<string>>(() => {
    const query = this.searchQuery().trim();
    if (query) {
      return this.searchExpandedNodes();
    }
    return this.expandedNodes();
  });

  /**
   * Get service from document type
   */
  private getServiceForDocument(doc: Document): ServiceType {
    // If document has explicit serviceType, use it
    if (doc.serviceType) {
      return doc.serviceType;
    }

    // If document is unclassified, put in Others
    if (doc.status === 'unclassified') {
      return 'others';
    }

    // Map document type to service
    return DOCUMENT_TYPE_TO_SERVICE[doc.type] || 'others';
  }

  // All services to display (always visible, even if empty)
  private readonly ALL_SERVICES: ServiceType[] = [
    'cit',
    'vat',
    'assessment',
    'transfer-pricing',
    'others',
  ];

  /**
   * New tree builder: Entity → Year → Service hierarchy (no root node)
   * All 4 main services + Others are always shown, even if empty
   */
  private buildTreeFromDocuments(documents: Document[]): TreeNode[] {
    // Group documents by entity → year → service
    const entityMap = new Map<string, Map<number, Map<ServiceType, Document[]>>>();

    // First, collect all unique entity-year combinations
    const entityYears = new Map<string, Set<number>>();

    for (const doc of documents) {
      if (!doc.entityName || !doc.year) continue;

      const entityName = doc.entityName;
      const year = doc.year;
      const service = this.getServiceForDocument(doc);

      // Track entity-year combinations
      if (!entityYears.has(entityName)) {
        entityYears.set(entityName, new Set());
      }
      entityYears.get(entityName)!.add(year);

      if (!entityMap.has(entityName)) {
        entityMap.set(entityName, new Map());
      }

      const yearMap = entityMap.get(entityName)!;
      if (!yearMap.has(year)) {
        yearMap.set(year, new Map());
      }

      const serviceMap = yearMap.get(year)!;
      if (!serviceMap.has(service)) {
        serviceMap.set(service, []);
      }

      serviceMap.get(service)!.push(doc);
    }

    // Build tree nodes (no root wrapper)
    const entityNodes: TreeNode[] = [];

    for (const [entityName, yearMap] of entityMap) {
      const yearNodes: TreeNode[] = [];
      let entityTotal = 0;

      // Sort years descending (most recent first)
      const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

      for (const year of sortedYears) {
        const serviceMap = yearMap.get(year)!;
        const serviceNodes: TreeNode[] = [];
        let yearTotal = 0;

        // Build ALL service nodes (even empty ones)
        // Each service has two folders: Documents and Results
        for (const service of this.ALL_SERVICES) {
          const docs = serviceMap.get(service) || [];

          // Create document nodes for the Documents folder
          const documentNodes: TreeNode[] = docs.map(doc => ({
            id: doc.id,
            label: doc.name,
            icon: 'file-text',
            isEmoji: false,
            type: 'document' as const,
            documentId: doc.id,
            docType: doc.type,
            serviceType: service,
            entityId: doc.entityId,
            year: doc.year,
            parentEntity: entityName,
            parentYear: year,
            parentService: service,
          }));

          // Create the two folders: Documents and Results
          const serviceFolders: TreeNode[] = [
            {
              id: `folder-${entityName}-${year}-${service}-documents`,
              label: 'Documents',
              icon: 'folder',
              isEmoji: false,
              type: 'folder',
              serviceType: service,
              entityId: entityName,
              year,
              count: docs.length,
              parentEntity: entityName,
              parentYear: year,
              parentService: service,
              children: documentNodes,
            },
            {
              id: `folder-${entityName}-${year}-${service}-results`,
              label: 'Results',
              icon: 'folder-output',
              isEmoji: false,
              type: 'folder',
              serviceType: service,
              entityId: entityName,
              year,
              count: 0, // Results folder starts empty
              parentEntity: entityName,
              parentYear: year,
              parentService: service,
              children: [],
            },
          ];

          serviceNodes.push({
            id: `service-${entityName}-${year}-${service}`,
            label: SERVICE_TYPE_LABELS[service],
            icon: SERVICE_TYPE_ICONS[service],
            isEmoji: false,
            type: 'service',
            serviceType: service,
            entityId: docs[0]?.entityId || entityName,
            year,
            count: docs.length,
            parentEntity: entityName,
            parentYear: year,
            children: serviceFolders,
          });
          yearTotal += docs.length;
        }

        // Add custom folders for this year
        const customFoldersForYear = this.customFolders().filter(
          f => f.entityName === entityName && f.year === year
        );
        for (const folder of customFoldersForYear) {
          const folderDocs = documents.filter(d => folder.documentIds.includes(d.id));
          serviceNodes.push({
            id: `custom-${folder.id}`,
            label: folder.name,
            icon: 'folder',
            isEmoji: false,
            type: 'custom',
            entityId: entityName,
            year,
            count: folderDocs.length,
            parentEntity: entityName,
            parentYear: year,
            children: folderDocs.map(doc => ({
              id: doc.id,
              label: doc.name,
              icon: this.typeIcons[doc.type] || 'file-text',
              isEmoji: false,
              type: 'document' as const,
              documentId: doc.id,
              docType: doc.type,
              entityId: doc.entityId,
              year: doc.year,
              parentEntity: entityName,
              parentYear: year,
            })),
          });
        }

        yearNodes.push({
          id: `year-${entityName}-${year}`,
          label: year.toString(),
          icon: 'calendar',
          isEmoji: false,
          type: 'year',
          year,
          entityId: entityName,
          count: yearTotal,
          parentEntity: entityName,
          children: serviceNodes,
        });

        entityTotal += yearTotal;
      }

      const flag = ENTITY_FLAGS[entityName] || '🏢';
      entityNodes.push({
        id: `entity-${entityName}`,
        label: entityName,
        icon: flag,
        isEmoji: true,
        type: 'entity',
        entityId: entityName,
        count: entityTotal,
        children: yearNodes,
      });
    }

    return entityNodes;
  }

  /**
   * Recursively filter tree nodes based on search query
   */
  private filterTreeNode(node: TreeNode, query: string): TreeNode | null {
    const labelMatches = node.label.toLowerCase().includes(query);

    // If node has no children, return it only if label matches
    if (!node.children || node.children.length === 0) {
      return labelMatches ? { ...node } : null;
    }

    // Recursively filter children
    const filteredChildren = node.children
      .map(child => this.filterTreeNode(child, query))
      .filter((child): child is TreeNode => child !== null);

    // If label matches, include all children (show full subtree)
    if (labelMatches) {
      return { ...node, children: node.children };
    }

    // If any children matched, return node with filtered children
    if (filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }

    // No match
    return null;
  }

  /**
   * Collect all node IDs from a tree (for auto-expansion during search)
   */
  private collectAllNodeIds(node: TreeNode, ids: Set<string>): void {
    ids.add(node.id);
    if (node.children) {
      for (const child of node.children) {
        this.collectAllNodeIds(child, ids);
      }
    }
  }

  /**
   * Handle search query change
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  isExpanded(nodeId: string): boolean {
    return this.effectiveExpandedNodes().has(nodeId);
  }

  isSelected(nodeId: string): boolean {
    return this.selectedNodeId() === nodeId;
  }

  isHighlighted(nodeId: string): boolean {
    return this.highlightedNodeId() === nodeId;
  }

  isDropTarget(nodeId: string): boolean {
    return this.dropTargetId() === nodeId;
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
    // Force synchronous change detection to ensure children render properly with OnPush
    this.cdr.detectChanges();
  }

  // Event handlers for TreeNodeComponent
  onToggleExpand(event: { nodeId: string; event: Event }): void {
    this.toggleExpand(event.nodeId, event.event);
  }

  onAddFolder(event: { entityName: string; year: number; event: Event }): void {
    this.startCreatingFolder(event.entityName, event.year, event.event);
  }

  onTreeDragStart(event: { event: DragEvent; node: TreeNode }): void {
    this.onDragStart(event.event, event.node);
  }

  onTreeDragOver(event: { event: DragEvent; node: TreeNode }): void {
    this.onDragOver(event.event, event.node);
  }

  onTreeDragLeave(event: { event: DragEvent; node: TreeNode }): void {
    this.onDragLeave(event.event, event.node);
  }

  onTreeDrop(event: { event: DragEvent; node: TreeNode }): void {
    this.onDrop(event.event, event.node);
  }

  selectNode(node: TreeNode): void {
    this.selectedNodeId.set(node.id);
    this.nodeSelect.emit(node);
  }

  hasChildren(node: TreeNode): boolean {
    return !!(node.children && node.children.length > 0);
  }

  trackByNodeId(index: number, node: TreeNode): string {
    return node.id;
  }

  // ============ Drag & Drop Methods ============

  onDragStart(event: DragEvent, node: TreeNode): void {
    if (node.type !== 'document') {
      event.preventDefault();
      return;
    }

    this.draggedNode.set(node);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', node.id);
    }
  }

  onDragOver(event: DragEvent, node: TreeNode): void {
    // Only allow drop on service or custom folder nodes
    if (node.type !== 'service' && node.type !== 'custom') {
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    this.dropTargetId.set(node.id);
  }

  onDragLeave(event: DragEvent, node: TreeNode): void {
    if (this.dropTargetId() === node.id) {
      this.dropTargetId.set(null);
    }
  }

  onDrop(event: DragEvent, targetNode: TreeNode): void {
    event.preventDefault();

    const draggedNode = this.draggedNode();
    if (!draggedNode || draggedNode.type !== 'document') {
      this.resetDragState();
      return;
    }

    // Only allow drop on service or custom folder nodes
    if (targetNode.type !== 'service' && targetNode.type !== 'custom') {
      this.resetDragState();
      return;
    }

    // Don't allow drop on same service
    if (
      draggedNode.serviceType === targetNode.serviceType &&
      draggedNode.parentEntity === targetNode.parentEntity &&
      draggedNode.parentYear === targetNode.parentYear
    ) {
      this.resetDragState();
      return;
    }

    // Emit move event
    this.documentMoved.emit({
      documentId: draggedNode.documentId!,
      documentName: draggedNode.label,
      fromService: draggedNode.serviceType || null,
      toService: targetNode.serviceType || 'others',
      toCustomFolder: targetNode.type === 'custom' ? targetNode.id : undefined,
    });

    this.resetDragState();
  }

  onDragEnd(): void {
    this.resetDragState();
  }

  private resetDragState(): void {
    this.draggedNode.set(null);
    this.dropTargetId.set(null);
  }

  isDragging(nodeId: string): boolean {
    const dragged = this.draggedNode();
    return dragged?.id === nodeId;
  }

  canDrop(node: TreeNode): boolean {
    return node.type === 'service' || node.type === 'custom';
  }

  // ============ Custom Folder Methods ============

  startCreatingFolder(entityName: string, year: number, event: Event): void {
    event.stopPropagation();
    this.creatingFolderFor.set({ entityName, year });
    this.newFolderName.set('');
  }

  cancelCreatingFolder(): void {
    this.creatingFolderFor.set(null);
    this.newFolderName.set('');
  }

  confirmCreateFolder(): void {
    const creating = this.creatingFolderFor();
    const name = this.newFolderName().trim();

    if (!creating || !name) {
      this.cancelCreatingFolder();
      return;
    }

    const newFolder: CustomFolder = {
      id: crypto.randomUUID(),
      name,
      entityName: creating.entityName,
      year: creating.year,
      documentIds: [],
    };

    this.customFolders.update(folders => [...folders, newFolder]);
    this.folderCreated.emit(newFolder);
    this.cancelCreatingFolder();
  }

  isCreatingFolderFor(entityName: string, year: number): boolean {
    const creating = this.creatingFolderFor();
    return creating?.entityName === entityName && creating?.year === year;
  }

  // ============ Path & Expand Methods ============

  /**
   * Expands the tree to show the given path
   */
  expandToPath(path: string[]): void {
    this.expandedNodes.update(set => {
      const newSet = new Set(set);
      for (const nodeId of path) {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }

  /**
   * Builds the path to a specific document based on entity, year, and service
   */
  buildPathToDocument(entityName: string, year: number, service: ServiceType): string[] {
    return [
      `entity-${entityName}`,
      `year-${entityName}-${year}`,
      `service-${entityName}-${year}-${service}`,
    ];
  }

  /**
   * Highlights a node with animation for a duration
   */
  highlightNode(nodeId: string, duration: number = 2000): void {
    this.highlightedNodeId.set(nodeId);

    setTimeout(() => {
      if (this.highlightedNodeId() === nodeId) {
        this.highlightedNodeId.set(null);
      }
    }, duration);
  }

  /**
   * Expands to and highlights a document location
   */
  expandAndHighlight(entityName: string, year: number, docType: DocumentType): void {
    const service = DOCUMENT_TYPE_TO_SERVICE[docType] || 'others';
    const path = this.buildPathToDocument(entityName, year, service);
    this.expandToPath(path);

    setTimeout(() => {
      const targetNodeId = `service-${entityName}-${year}-${service}`;
      this.highlightNode(targetNodeId);
    }, 100);
  }

  /**
   * Find a node by its ID recursively
   */
  findNodeById(nodeId: string, nodes: TreeNode[] = this.treeData()): TreeNode | null {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node;
      }
      if (node.children) {
        const found = this.findNodeById(nodeId, node.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
}
