import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import {
  Document,
  DocumentLibrary,
  DocumentCategory,
  DocumentType,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
} from '../../../../core';
import { SearchBarComponent } from '../../../../shared';

export interface TreeNode {
  id: string;
  label: string;
  icon: string;
  isEmoji?: boolean;
  type: 'library' | 'entity' | 'year' | 'doctype' | 'document';
  children?: TreeNode[];
  count?: number;
  documentId?: string;
  docType?: DocumentType;
  category?: DocumentCategory;
  entityId?: string;
  year?: number;
  // Parent context for filtering
  parentEntity?: string;
  parentYear?: number;
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
  @Input() set library(value: DocumentLibrary | null) {
    this.librarySignal.set(value);
  }

  @Input() set documents(value: Document[]) {
    this.documentsSignal.set(value);
  }

  @Output() nodeSelect = new EventEmitter<TreeNode>();
  @Output() documentSelect = new EventEmitter<Document>();

  private librarySignal = signal<DocumentLibrary | null>(null);
  private documentsSignal = signal<Document[]>([]);

  expandedNodes = signal<Set<string>>(new Set(['root']));
  selectedNodeId = signal<string | null>(null);
  highlightedNodeId = signal<string | null>(null);

  // Search state
  searchQuery = signal<string>('');

  private typeIcons: Record<string, string> = {
    general_ledger: 'book-open',
    trial_balance: 'bar-chart-3',
    bank_statement: 'landmark',
    tax_return: 'clipboard-list',
    financial_statement: 'file-text',
  };

  treeData = computed<TreeNode>(() => {
    const library = this.librarySignal();

    // If we have a library from the API, use it (legacy mode)
    if (library) {
      return this.buildTreeFromLibrary(library);
    }

    // Build from documents list using new Entity → Year → Type hierarchy
    const documents = this.documentsSignal();
    return this.buildTreeFromDocuments(documents);
  });

  /**
   * Filtered tree data based on search query
   * Returns null if no matches found
   */
  filteredTreeData = computed<TreeNode | null>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tree = this.treeData();

    if (!query) {
      return tree;
    }

    return this.filterTreeNode(tree, query);
  });

  /**
   * Whether the search has results
   */
  hasSearchResults = computed<boolean>(() => {
    return this.filteredTreeData() !== null;
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
    if (!filtered) {
      return new Set<string>();
    }

    const nodeIds = new Set<string>();
    this.collectAllNodeIds(filtered, nodeIds);
    return nodeIds;
  });

  /**
   * Legacy tree builder - uses category-based hierarchy
   */
  private buildTreeFromLibrary(library: DocumentLibrary): TreeNode {
    const categoryNodes: TreeNode[] = library.categories.map((cat) => ({
      id: `category-${cat.category}`,
      label: cat.categoryLabel,
      icon: this.getCategoryIcon(cat.category),
      isEmoji: false,
      type: 'doctype' as const,
      category: cat.category as DocumentCategory,
      count: cat.totalCount,
      children: cat.types.map((typeGroup) => ({
        id: `type-${typeGroup.type}`,
        label: typeGroup.typeLabel,
        icon: this.typeIcons[typeGroup.type] || 'file-text',
        isEmoji: false,
        type: 'doctype' as const,
        docType: typeGroup.type as DocumentType,
        count: typeGroup.count,
        children: typeGroup.documents.map((doc) => ({
          id: doc.id,
          label: doc.name,
          icon: this.typeIcons[doc.type] || 'file-text',
          isEmoji: false,
          type: 'document' as const,
          documentId: doc.id,
        })),
      })),
    }));

    return {
      id: 'root',
      label: 'Document Library',
      icon: 'folder-open',
      isEmoji: false,
      type: 'library',
      count: library.totalCount,
      children: categoryNodes,
    };
  }

  /**
   * New tree builder: Entity → Year → Type hierarchy
   */
  private buildTreeFromDocuments(documents: Document[]): TreeNode {
    // Group documents by entity → year → type
    const entityMap = new Map<string, Map<number, Map<DocumentType, Document[]>>>();

    for (const doc of documents) {
      if (!doc.entityName || !doc.year || !doc.type) continue;

      const entityName = doc.entityName;
      const year = doc.year;
      const docType = doc.type;

      if (!entityMap.has(entityName)) {
        entityMap.set(entityName, new Map());
      }

      const yearMap = entityMap.get(entityName)!;
      if (!yearMap.has(year)) {
        yearMap.set(year, new Map());
      }

      const typeMap = yearMap.get(year)!;
      if (!typeMap.has(docType)) {
        typeMap.set(docType, []);
      }

      typeMap.get(docType)!.push(doc);
    }

    // Build tree nodes
    const entityNodes: TreeNode[] = [];

    for (const [entityName, yearMap] of entityMap) {
      const yearNodes: TreeNode[] = [];
      let entityTotal = 0;

      // Sort years descending (most recent first)
      const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

      for (const year of sortedYears) {
        const typeMap = yearMap.get(year)!;
        const typeNodes: TreeNode[] = [];
        let yearTotal = 0;

        for (const [docType, docs] of typeMap) {
          typeNodes.push({
            id: `type-${entityName}-${year}-${docType}`,
            label: DOCUMENT_TYPE_LABELS[docType] || docType,
            icon: this.typeIcons[docType] || 'file-text',
            isEmoji: false,
            type: 'doctype',
            docType,
            entityId: docs[0]?.entityId,
            year,
            count: docs.length,
            parentEntity: entityName,
            parentYear: year,
            children: docs.map((doc) => ({
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
          yearTotal += docs.length;
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
          children: typeNodes,
        });

        entityTotal += yearTotal;
      }

      const flag = ENTITY_FLAGS[entityName] || '';
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

    return {
      id: 'root',
      label: 'Document Library',
      icon: 'folder-open',
      isEmoji: false,
      type: 'library',
      count: documents.length,
      children: entityNodes,
    };
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      accounting: 'book-open',
      tax: 'clipboard-list',
      financial: 'landmark',
    };
    return icons[category] || 'folder';
  }

  /**
   * Recursively filter tree nodes based on search query
   * Returns the node with filtered children, or null if no match
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
    // When searching, use auto-expanded nodes
    if (this.searchQuery().trim()) {
      return this.searchExpandedNodes().has(nodeId);
    }
    return this.expandedNodes().has(nodeId);
  }

  isSelected(nodeId: string): boolean {
    return this.selectedNodeId() === nodeId;
  }

  isHighlighted(nodeId: string): boolean {
    return this.highlightedNodeId() === nodeId;
  }

  toggleExpand(nodeId: string, event: Event): void {
    event.stopPropagation();
    this.expandedNodes.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }

  selectNode(node: TreeNode): void {
    this.selectedNodeId.set(node.id);
    this.nodeSelect.emit(node);
  }

  hasChildren(node: TreeNode): boolean {
    return !!(node.children && node.children.length > 0);
  }

  /**
   * Expands the tree to show the given path
   * @param path Array of node IDs representing the path from root to target
   */
  expandToPath(path: string[]): void {
    this.expandedNodes.update((set) => {
      const newSet = new Set(set);
      // Always include root
      newSet.add('root');
      // Add all path nodes
      for (const nodeId of path) {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }

  /**
   * Builds the path to a specific document based on entity, year, and type
   */
  buildPathToDocument(entityName: string, year: number, docType: DocumentType): string[] {
    return [
      'root',
      `entity-${entityName}`,
      `year-${entityName}-${year}`,
      `type-${entityName}-${year}-${docType}`,
    ];
  }

  /**
   * Highlights a node with animation for a duration
   * @param nodeId The ID of the node to highlight
   * @param duration Duration in ms (default 2000ms)
   */
  highlightNode(nodeId: string, duration: number = 2000): void {
    this.highlightedNodeId.set(nodeId);

    // Clear highlight after duration
    setTimeout(() => {
      if (this.highlightedNodeId() === nodeId) {
        this.highlightedNodeId.set(null);
      }
    }, duration);
  }

  /**
   * Expands to and highlights a document location
   * Used after upload/classification to show where document was placed
   */
  expandAndHighlight(entityName: string, year: number, docType: DocumentType): void {
    const path = this.buildPathToDocument(entityName, year, docType);
    this.expandToPath(path);

    // Small delay to allow expansion animation, then highlight
    setTimeout(() => {
      const targetNodeId = `type-${entityName}-${year}-${docType}`;
      this.highlightNode(targetNodeId);
    }, 100);
  }

  /**
   * Find a node by its ID recursively
   */
  findNodeById(nodeId: string, node: TreeNode = this.treeData()): TreeNode | null {
    if (node.id === nodeId) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeById(nodeId, child);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }
}
