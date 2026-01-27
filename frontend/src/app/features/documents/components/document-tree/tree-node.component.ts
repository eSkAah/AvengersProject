import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TreeNode, CustomFolder, DocumentMoveEvent } from './document-tree.component';

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, forwardRef(() => TreeNodeComponent)],
  template: `
    <div
      class="tree-node"
      [class.tree-node--selected]="isSelected"
      [class.tree-node--highlighted]="isHighlighted"
      [class.tree-node--entity]="node.type === 'entity'"
      [class.tree-node--year]="node.type === 'year'"
      [class.tree-node--service]="node.type === 'service'"
      [class.tree-node--folder]="node.type === 'folder'"
      [class.tree-node--document]="node.type === 'document'"
      [class.tree-node--custom]="node.type === 'custom'"
      [class.tree-node--empty]="node.count === 0"
      [class.tree-node--dragging]="isDragging"
      [class.tree-node--drop-target]="isDropTarget"
      [class.tree-node--can-drop]="canDrop && hasDraggedNode"
      [style.padding-left.px]="level * 16"
      [attr.data-node-id]="node.id"
      [attr.draggable]="node.type === 'document'"
      (dragstart)="onDragStart($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (dragend)="dragEnd.emit()"
    >
      <div class="tree-node__content" (click)="nodeClick.emit(node)">
        <!-- Expand/Collapse toggle -->
        <button *ngIf="hasChildren" class="tree-node__toggle" (click)="onToggle($event)">
          <lucide-icon
            [name]="isExpanded ? 'chevron-down' : 'chevron-right'"
            [size]="14"
          ></lucide-icon>
        </button>
        <span *ngIf="!hasChildren" class="tree-node__spacer"></span>

        <!-- Icon -->
        <span *ngIf="node.isEmoji" class="tree-node__icon tree-node__icon--emoji">{{
          node.icon
        }}</span>
        <lucide-icon
          *ngIf="!node.isEmoji"
          [name]="node.icon"
          class="tree-node__icon"
          [size]="16"
        ></lucide-icon>

        <!-- Label -->
        <span class="tree-node__label">{{ node.label }}</span>

        <!-- Count badge -->
        <span
          *ngIf="node.count !== undefined && node.type !== 'document'"
          class="tree-node__count"
          >{{ node.count }}</span
        >

        <!-- Add folder button for year nodes -->
        <button
          *ngIf="node.type === 'year'"
          class="tree-node__add-folder"
          (click)="onAddFolder($event)"
          title="Create custom folder"
        >
          <lucide-icon name="folder-plus" [size]="14"></lucide-icon>
        </button>

        <!-- Drag handle for documents -->
        <span *ngIf="node.type === 'document'" class="tree-node__drag-handle" title="Drag to move">
          <lucide-icon name="grip-vertical" [size]="12"></lucide-icon>
        </span>
      </div>

      <!-- Drop zone indicator -->
      <div *ngIf="canDrop && hasDraggedNode" class="tree-node__drop-zone">
        <lucide-icon name="arrow-down-to-line" [size]="12"></lucide-icon>
        Drop here
      </div>
    </div>

    <!-- Create folder input (inline) -->
    <div
      *ngIf="node.type === 'year' && isCreatingFolder"
      class="tree-node__create-folder"
      [style.padding-left.px]="(level + 1) * 16"
    >
      <lucide-icon name="folder-plus" [size]="16"></lucide-icon>
      <input
        type="text"
        class="tree-node__folder-input"
        placeholder="Folder name..."
        [ngModel]="newFolderName"
        (ngModelChange)="newFolderNameChange.emit($event)"
        (keydown.enter)="confirmFolder.emit()"
        (keydown.escape)="cancelFolder.emit()"
        autofocus
      />
      <button class="tree-node__folder-confirm" (click)="confirmFolder.emit()" title="Create">
        <lucide-icon name="check" [size]="14"></lucide-icon>
      </button>
      <button class="tree-node__folder-cancel" (click)="cancelFolder.emit()" title="Cancel">
        <lucide-icon name="x" [size]="14"></lucide-icon>
      </button>
    </div>

    <!-- Children - Recursive rendering using the same component -->
    @if (hasChildren && isExpanded) {
      <div class="tree-node__children">
        @for (child of node.children; track child.id) {
          <app-tree-node
            [node]="child"
            [level]="level + 1"
            [expandedNodes]="expandedNodes"
            [selectedNodeId]="selectedNodeId"
            [highlightedNodeId]="highlightedNodeId"
            [draggedNodeId]="draggedNodeId"
            [dropTargetId]="dropTargetId"
            [creatingFolderFor]="creatingFolderFor"
            [newFolderName]="newFolderName"
            (nodeClick)="nodeClick.emit($event)"
            (toggleExpand)="toggleExpand.emit($event)"
            (addFolder)="addFolder.emit($event)"
            (confirmFolder)="confirmFolder.emit()"
            (cancelFolder)="cancelFolder.emit()"
            (newFolderNameChange)="newFolderNameChange.emit($event)"
            (dragStart)="dragStart.emit($event)"
            (dragOver)="dragOver.emit($event)"
            (dragLeave)="dragLeave.emit($event)"
            (drop)="drop.emit($event)"
            (dragEnd)="dragEnd.emit()"
          ></app-tree-node>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class TreeNodeComponent {
  @Input() node!: TreeNode;
  @Input() level = 0;
  @Input() expandedNodes: Set<string> = new Set();
  @Input() selectedNodeId: string | null = null;
  @Input() highlightedNodeId: string | null = null;
  @Input() draggedNodeId: string | null = null;
  @Input() dropTargetId: string | null = null;
  @Input() creatingFolderFor: { entityName: string; year: number } | null = null;
  @Input() newFolderName = '';

  @Output() nodeClick = new EventEmitter<TreeNode>();
  @Output() toggleExpand = new EventEmitter<{ nodeId: string; event: Event }>();
  @Output() addFolder = new EventEmitter<{ entityName: string; year: number; event: Event }>();
  @Output() confirmFolder = new EventEmitter<void>();
  @Output() cancelFolder = new EventEmitter<void>();
  @Output() newFolderNameChange = new EventEmitter<string>();
  @Output() dragStart = new EventEmitter<{ event: DragEvent; node: TreeNode }>();
  @Output() dragOver = new EventEmitter<{ event: DragEvent; node: TreeNode }>();
  @Output() dragLeave = new EventEmitter<{ event: DragEvent; node: TreeNode }>();
  @Output() drop = new EventEmitter<{ event: DragEvent; node: TreeNode }>();
  @Output() dragEnd = new EventEmitter<void>();

  get hasChildren(): boolean {
    return !!(this.node.children && this.node.children.length > 0);
  }

  get isExpanded(): boolean {
    return this.expandedNodes.has(this.node.id);
  }

  get isSelected(): boolean {
    return this.selectedNodeId === this.node.id;
  }

  get isHighlighted(): boolean {
    return this.highlightedNodeId === this.node.id;
  }

  get isDragging(): boolean {
    return this.draggedNodeId === this.node.id;
  }

  get isDropTarget(): boolean {
    return this.dropTargetId === this.node.id;
  }

  get canDrop(): boolean {
    return this.node.type === 'service' || this.node.type === 'custom';
  }

  get hasDraggedNode(): boolean {
    return this.draggedNodeId !== null;
  }

  get isCreatingFolder(): boolean {
    return (
      this.creatingFolderFor?.entityName === this.node.parentEntity &&
      this.creatingFolderFor?.year === this.node.year
    );
  }

  trackById(index: number, node: TreeNode): string {
    return node.id;
  }

  onToggle(event: Event): void {
    event.stopPropagation();
    this.toggleExpand.emit({ nodeId: this.node.id, event });
  }

  onAddFolder(event: Event): void {
    event.stopPropagation();
    this.addFolder.emit({
      entityName: this.node.parentEntity!,
      year: this.node.year!,
      event,
    });
  }

  onDragStart(event: DragEvent): void {
    this.dragStart.emit({ event, node: this.node });
  }

  onDragOver(event: DragEvent): void {
    this.dragOver.emit({ event, node: this.node });
  }

  onDragLeave(event: DragEvent): void {
    this.dragLeave.emit({ event, node: this.node });
  }

  onDrop(event: DragEvent): void {
    this.drop.emit({ event, node: this.node });
  }
}
