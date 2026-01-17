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
import { Engagement, Document } from '../../../../core';

export interface TreeNode {
  id: string;
  label: string;
  icon: string;
  type: 'client' | 'engagement' | 'document';
  children?: TreeNode[];
  count?: number;
  engagementId?: string;
}

@Component({
  selector: 'app-document-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-tree.component.html',
  styleUrl: './document-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentTreeComponent {
  @Input() set engagements(value: Engagement[]) {
    this.engagementsSignal.set(value);
  }

  @Input() set documents(value: Document[]) {
    this.documentsSignal.set(value);
  }

  @Output() nodeSelect = new EventEmitter<TreeNode>();

  private engagementsSignal = signal<Engagement[]>([]);
  private documentsSignal = signal<Document[]>([]);

  expandedNodes = signal<Set<string>>(new Set(['root']));
  selectedNodeId = signal<string | null>(null);

  treeData = computed<TreeNode>(() => {
    const engagements = this.engagementsSignal();
    const documents = this.documentsSignal();

    const engagementNodes: TreeNode[] = engagements.map((eng) => {
      const engDocs = documents.filter((d) => d.engagementId === eng.id);

      return {
        id: eng.id,
        label: eng.entity,
        icon: eng.countryFlag,
        type: 'engagement' as const,
        count: engDocs.length,
        engagementId: eng.id,
        children: engDocs.map((doc) => ({
          id: doc.id,
          label: doc.name,
          icon: this.getDocIcon(doc.type),
          type: 'document' as const,
          engagementId: eng.id,
        })),
      };
    });

    return {
      id: 'root',
      label: 'Real Estate Fund Global',
      icon: '🏢',
      type: 'client',
      count: documents.length,
      children: engagementNodes,
    };
  });

  private getDocIcon(type: string): string {
    const icons: Record<string, string> = {
      general_ledger: '📗',
      trial_balance: '📊',
      bank_statement: '🏦',
      tax_return: '📋',
    };
    return icons[type] || '📄';
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
