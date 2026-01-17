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
import { LucideAngularModule } from 'lucide-angular';
import {
  Document,
  DocumentLibrary,
  DocumentCategory,
  DocumentType,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
} from '../../../../core';

export interface TreeNode {
  id: string;
  label: string;
  icon: string;
  isEmoji?: boolean;
  type: 'library' | 'category' | 'doctype' | 'document';
  children?: TreeNode[];
  count?: number;
  documentId?: string;
  docType?: DocumentType;
  category?: DocumentCategory;
}

@Component({
  selector: 'app-document-tree',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
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

  private categoryIcons: Record<string, string> = {
    accounting: 'book-open',
    tax: 'clipboard-list',
    financial: 'landmark',
  };

  private typeIcons: Record<string, string> = {
    general_ledger: 'book-open',
    trial_balance: 'bar-chart-3',
    bank_statement: 'landmark',
    tax_return: 'clipboard-list',
    financial_statement: 'file-text',
  };

  treeData = computed<TreeNode>(() => {
    const library = this.librarySignal();

    // If we have a library from the API, use it
    if (library) {
      return this.buildTreeFromLibrary(library);
    }

    // Otherwise, build from documents list (legacy mode)
    const documents = this.documentsSignal();
    return this.buildTreeFromDocuments(documents);
  });

  private buildTreeFromLibrary(library: DocumentLibrary): TreeNode {
    const categoryNodes: TreeNode[] = library.categories.map((cat) => ({
      id: `category-${cat.category}`,
      label: cat.categoryLabel,
      icon: this.categoryIcons[cat.category] || 'folder',
      isEmoji: false,
      type: 'category' as const,
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
      label: 'Bibliothèque de Documents',
      icon: 'folder-open',
      isEmoji: false,
      type: 'library',
      count: library.totalCount,
      children: categoryNodes,
    };
  }

  private buildTreeFromDocuments(documents: Document[]): TreeNode {
    // Group documents by category and type
    const grouped = new Map<DocumentCategory, Map<DocumentType, Document[]>>();

    for (const doc of documents) {
      if (!doc.type) continue;

      const category = this.getDocumentCategory(doc.type);
      if (!category) continue;

      if (!grouped.has(category)) {
        grouped.set(category, new Map());
      }

      const categoryMap = grouped.get(category)!;
      if (!categoryMap.has(doc.type)) {
        categoryMap.set(doc.type, []);
      }

      categoryMap.get(doc.type)!.push(doc);
    }

    const categoryNodes: TreeNode[] = [];

    for (const [category, typeMap] of grouped) {
      const typeNodes: TreeNode[] = [];
      let categoryTotal = 0;

      for (const [docType, docs] of typeMap) {
        typeNodes.push({
          id: `type-${docType}`,
          label: DOCUMENT_TYPE_LABELS[docType] || docType,
          icon: this.typeIcons[docType] || 'file-text',
          isEmoji: false,
          type: 'doctype',
          docType,
          count: docs.length,
          children: docs.map((doc) => ({
            id: doc.id,
            label: doc.name,
            icon: this.typeIcons[doc.type] || 'file-text',
            isEmoji: false,
            type: 'document' as const,
            documentId: doc.id,
          })),
        });
        categoryTotal += docs.length;
      }

      categoryNodes.push({
        id: `category-${category}`,
        label: DOCUMENT_CATEGORY_LABELS[category] || category,
        icon: this.categoryIcons[category] || 'folder',
        isEmoji: false,
        type: 'category',
        category,
        count: categoryTotal,
        children: typeNodes,
      });
    }

    return {
      id: 'root',
      label: 'Bibliothèque de Documents',
      icon: 'folder-open',
      isEmoji: false,
      type: 'library',
      count: documents.length,
      children: categoryNodes,
    };
  }

  private getDocumentCategory(type: DocumentType): DocumentCategory | null {
    const mapping: Record<DocumentType, DocumentCategory> = {
      general_ledger: 'accounting',
      trial_balance: 'accounting',
      tax_return: 'tax',
      financial_statement: 'financial',
      bank_statement: 'financial',
    };
    return mapping[type] || null;
  }

  isExpanded(nodeId: string): boolean {
    return this.expandedNodes().has(nodeId);
  }

  isSelected(nodeId: string): boolean {
    return this.selectedNodeId() === nodeId;
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
}
