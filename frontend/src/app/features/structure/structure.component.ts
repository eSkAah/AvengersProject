import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  ElementRef,
  viewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MockDataService, Engagement } from '../../core';
import { BreadcrumbComponent, BreadcrumbItem, ButtonComponent } from '../../shared';

export interface EntityNode {
  id: string;
  name: string;
  type: 'holding' | 'region' | 'entity';
  country?: string;
  countryFlag?: string;
  riskLevel?: string;
  completion?: number;
  revenue?: number;
  children: EntityNode[];
  x?: number;
  y?: number;
  // Multi-engagement support
  engagements?: Engagement[];
  engagementCount?: number;
}

@Component({
  selector: 'app-structure',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, BreadcrumbComponent, ButtonComponent],
  templateUrl: './structure.component.html',
  styleUrl: './structure.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StructureComponent implements AfterViewInit {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  readonly svgContainer = viewChild<ElementRef>('svgContainer');

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Entity Structure' },
  ];

  // View state
  readonly zoom = signal(1);
  readonly panX = signal(0);
  readonly panY = signal(0);
  readonly selectedNode = signal<EntityNode | null>(null);
  readonly isDragging = signal(false);

  // Expanded state - use a signal to track which nodes are expanded
  readonly expandedNodes = signal<Set<string>>(new Set(['holding', 'region-Benelux', 'region-DACH', 'region-Western Europe', 'region-Other']));

  // Search state
  readonly searchQuery = signal('');
  readonly showSearchResults = signal(false);

  // Chart dimensions
  private readonly nodeWidth = 180;
  private readonly nodeHeight = 80;
  private readonly horizontalSpacing = 60;
  private readonly verticalSpacing = 100;

  // Build base tree structure (without positions)
  private readonly baseTree = computed<EntityNode>(() => {
    const engagements = this.mockData.engagements();

    // First, group engagements by entity name
    const entitiesByName: Record<string, Engagement[]> = {};
    engagements.forEach((eng) => {
      if (!entitiesByName[eng.entity]) {
        entitiesByName[eng.entity] = [];
      }
      entitiesByName[eng.entity].push(eng);
    });

    // Group by region
    const regions: Record<string, EntityNode> = {};

    Object.entries(entitiesByName).forEach(([entityName, entityEngagements]) => {
      const firstEng = entityEngagements[0];
      const regionName = this.getRegionName(firstEng.countryFlag);

      if (!regions[regionName]) {
        regions[regionName] = {
          id: `region-${regionName}`,
          name: regionName,
          type: 'region',
          children: [],
        };
      }

      // Calculate aggregated values for multi-engagement entities
      const highestRisk = this.getHighestRisk(entityEngagements);
      const avgCompletion = Math.round(
        entityEngagements.reduce((sum, e) => sum + e.completionPercent, 0) / entityEngagements.length
      );
      const totalRevenue = entityEngagements.reduce((sum, e) => sum + e.financialData.revenue, 0);

      regions[regionName].children.push({
        id: `entity-${entityName.replace(/\s+/g, '-')}`,
        name: entityName,
        type: 'entity',
        country: firstEng.country,
        countryFlag: firstEng.countryFlag,
        riskLevel: highestRisk,
        completion: avgCompletion,
        revenue: totalRevenue,
        children: [],
        engagements: entityEngagements,
        engagementCount: entityEngagements.length,
      });
    });

    // Create root holding node
    return {
      id: 'holding',
      name: 'Avengers Holding',
      type: 'holding',
      children: Object.values(regions).sort((a, b) => a.name.localeCompare(b.name)),
    } as EntityNode;
  });

  // Helper to get highest risk level from engagements
  private getHighestRisk(engagements: Engagement[]): string {
    const riskPriority: Record<string, number> = { high: 3, medium: 2, low: 1 };
    let highest = 'low';
    let highestPriority = 0;

    engagements.forEach((eng) => {
      const priority = riskPriority[eng.riskLevel] || 0;
      if (priority > highestPriority) {
        highestPriority = priority;
        highest = eng.riskLevel;
      }
    });

    return highest;
  }

  // Computed tree with positions (depends on expanded state)
  readonly entityTree = computed<EntityNode>(() => {
    const tree = this.cloneTree(this.baseTree());
    const expanded = this.expandedNodes();

    // Mark expanded state
    this.markExpanded(tree, expanded);

    // Calculate positions
    this.calculateNodePositions(tree);

    return tree;
  });

  // All entities for search
  readonly allEntities = computed(() => {
    const entities: EntityNode[] = [];
    this.collectAllEntities(this.baseTree(), entities);
    return entities.filter(e => e.type === 'entity');
  });

  // Search results
  readonly searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return [];

    return this.allEntities()
      .filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.country?.toLowerCase().includes(query) ||
        e.countryFlag?.includes(query)
      )
      .slice(0, 10);
  });

  // Computed flat list for rendering
  readonly visibleNodes = computed(() => {
    const nodes: EntityNode[] = [];
    const expanded = this.expandedNodes();
    this.collectVisibleNodes(this.entityTree(), nodes, expanded);
    return nodes;
  });

  // Computed connections
  readonly connections = computed(() => {
    const links: { from: EntityNode; to: EntityNode }[] = [];
    const expanded = this.expandedNodes();
    this.collectConnections(this.entityTree(), links, expanded);
    return links;
  });

  // Chart dimensions
  readonly chartWidth = computed(() => {
    const nodes = this.visibleNodes();
    if (nodes.length === 0) return 800;
    const maxX = Math.max(...nodes.map((n) => (n.x || 0) + this.nodeWidth));
    return Math.max(800, maxX + 100);
  });

  readonly chartHeight = computed(() => {
    const nodes = this.visibleNodes();
    if (nodes.length === 0) return 600;
    const maxY = Math.max(...nodes.map((n) => (n.y || 0) + this.nodeHeight));
    return Math.max(600, maxY + 100);
  });

  ngAfterViewInit(): void {
    // Center the view initially
    setTimeout(() => {
      this.centerView();
    }, 100);
  }

  private cloneTree(node: EntityNode): EntityNode {
    return {
      ...node,
      engagements: node.engagements ? [...node.engagements] : undefined,
      children: node.children.map(child => this.cloneTree(child)),
    };
  }

  private markExpanded(node: EntityNode, expanded: Set<string>): void {
    (node as EntityNode & { expanded: boolean }).expanded = expanded.has(node.id);
    node.children.forEach(child => this.markExpanded(child, expanded));
  }

  private collectAllEntities(node: EntityNode, result: EntityNode[]): void {
    result.push(node);
    node.children.forEach(child => this.collectAllEntities(child, result));
  }

  private getRegionName(flag: string): string {
    const regions: Record<string, string> = {
      '🇫🇷': 'Western Europe',
      '🇩🇪': 'DACH',
      '🇳🇱': 'Benelux',
      '🇧🇪': 'Benelux',
      '🇱🇺': 'Benelux',
    };
    return regions[flag] || 'Other';
  }

  private calculateNodePositions(root: EntityNode): void {
    const startY = 50;
    const expanded = this.expandedNodes();

    // First, calculate the total width of the tree
    const totalTreeWidth = this.calculateSubtreeWidth(root, expanded);
    const treePixelWidth = totalTreeWidth * (this.nodeWidth + this.horizontalSpacing);

    // Position root node centered
    root.x = Math.max(50, treePixelWidth / 2 - this.nodeWidth / 2);
    root.y = startY;

    // Recursively position children
    this.positionChildren(root, expanded);
  }

  private positionChildren(node: EntityNode, expanded: Set<string>): void {
    if (!expanded.has(node.id) || node.children.length === 0) {
      return;
    }

    let totalWidth = 0;
    const childWidths: number[] = [];

    // First pass: calculate widths
    node.children.forEach((child) => {
      const width = this.calculateSubtreeWidth(child, expanded);
      childWidths.push(width);
      totalWidth += width;
    });

    // Second pass: position children
    let currentX = (node.x || 0) + this.nodeWidth / 2 - (totalWidth * (this.nodeWidth + this.horizontalSpacing)) / 2;

    node.children.forEach((child, index) => {
      const childWidth = childWidths[index];
      child.x = currentX + (childWidth * (this.nodeWidth + this.horizontalSpacing)) / 2 - this.nodeWidth / 2;
      child.y = (node.y || 0) + this.nodeHeight + this.verticalSpacing;

      this.positionChildren(child, expanded);

      currentX += childWidth * (this.nodeWidth + this.horizontalSpacing);
    });
  }

  private calculateSubtreeWidth(node: EntityNode, expanded: Set<string>): number {
    if (!expanded.has(node.id) || node.children.length === 0) {
      return 1;
    }
    return node.children.reduce((sum, child) => sum + this.calculateSubtreeWidth(child, expanded), 0);
  }

  private collectVisibleNodes(node: EntityNode, result: EntityNode[], expanded: Set<string>): void {
    result.push(node);
    if (expanded.has(node.id) && node.children) {
      node.children.forEach((child) => this.collectVisibleNodes(child, result, expanded));
    }
  }

  private collectConnections(node: EntityNode, result: { from: EntityNode; to: EntityNode }[], expanded: Set<string>): void {
    if (expanded.has(node.id) && node.children) {
      node.children.forEach((child) => {
        result.push({ from: node, to: child });
        this.collectConnections(child, result, expanded);
      });
    }
  }

  // Check if node is expanded
  isExpanded(nodeId: string): boolean {
    return this.expandedNodes().has(nodeId);
  }

  // Pan & Zoom handlers
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.3, Math.min(2, this.zoom() + delta));
    this.zoom.set(newZoom);
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      this.isDragging.set(true);
    }
  }

  onMouseMove(event: MouseEvent): void {
    if (this.isDragging()) {
      this.panX.update((x) => x + event.movementX);
      this.panY.update((y) => y + event.movementY);
    }
  }

  onMouseUp(): void {
    this.isDragging.set(false);
  }

  onMouseLeave(): void {
    this.isDragging.set(false);
  }

  // Controls
  zoomIn(): void {
    this.zoom.update((z) => Math.min(2, z + 0.2));
  }

  zoomOut(): void {
    this.zoom.update((z) => Math.max(0.3, z - 0.2));
  }

  resetView(): void {
    this.zoom.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

  centerView(): void {
    const container = this.svgContainer()?.nativeElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      this.panX.set((rect.width - this.chartWidth() * this.zoom()) / 2);
      this.panY.set(20);
    }
  }

  fitToScreen(): void {
    const container = this.svgContainer()?.nativeElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      const scaleX = (rect.width - 40) / this.chartWidth();
      const scaleY = (rect.height - 40) / this.chartHeight();
      this.zoom.set(Math.min(scaleX, scaleY, 1));
      this.centerView();
    }
  }

  // Node interaction
  selectNode(node: EntityNode): void {
    this.selectedNode.set(node);
  }

  toggleNode(node: EntityNode, event: Event): void {
    event.stopPropagation();
    this.expandedNodes.update(set => {
      const newSet = new Set(set);
      if (newSet.has(node.id)) {
        newSet.delete(node.id);
      } else {
        newSet.add(node.id);
      }
      return newSet;
    });
  }

  // Expand all nodes
  expandAll(): void {
    const allIds = new Set<string>();
    this.collectAllIds(this.baseTree(), allIds);
    this.expandedNodes.set(allIds);
  }

  // Collapse all except root
  collapseAll(): void {
    this.expandedNodes.set(new Set(['holding']));
  }

  private collectAllIds(node: EntityNode, ids: Set<string>): void {
    ids.add(node.id);
    node.children.forEach(child => this.collectAllIds(child, ids));
  }

  navigateToEntity(node: EntityNode): void {
    if (node.type === 'entity' && node.engagements?.length === 1) {
      // Single engagement: navigate directly
      this.router.navigate(['/app/engagements', node.engagements[0].id]);
    }
    // Multiple engagements: user selects from details panel
  }

  navigateToEngagement(engagement: Engagement): void {
    this.router.navigate(['/app/engagements', engagement.id]);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      waiting: 'Pending',
      received: 'Received',
      processing: 'In Progress',
      completed: 'Completed',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  // Search functionality
  onSearchInput(query: string): void {
    this.searchQuery.set(query);
    this.showSearchResults.set(query.length > 0);
  }

  onSearchFocus(): void {
    if (this.searchQuery().length > 0) {
      this.showSearchResults.set(true);
    }
  }

  onSearchBlur(): void {
    // Delay to allow click on result
    setTimeout(() => {
      this.showSearchResults.set(false);
    }, 200);
  }

  selectSearchResult(entity: EntityNode): void {
    this.searchQuery.set('');
    this.showSearchResults.set(false);

    // Expand path to entity
    this.expandPathToEntity(entity.id);

    // Wait for tree to re-render, then center on entity
    setTimeout(() => {
      this.centerOnEntity(entity.id);
      this.selectedNode.set(entity);
    }, 100);
  }

  private expandPathToEntity(entityId: string): void {
    // Find path from root to entity
    const path = this.findPathToEntity(this.baseTree(), entityId, []);
    if (path) {
      this.expandedNodes.update(set => {
        const newSet = new Set(set);
        path.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  }

  private findPathToEntity(node: EntityNode, targetId: string, currentPath: string[]): string[] | null {
    const newPath = [...currentPath, node.id];

    if (node.id === targetId) {
      return newPath;
    }

    for (const child of node.children) {
      const result = this.findPathToEntity(child, targetId, newPath);
      if (result) {
        return result;
      }
    }

    return null;
  }

  private centerOnEntity(entityId: string): void {
    const node = this.visibleNodes().find(n => n.id === entityId);
    if (!node || node.x === undefined || node.y === undefined) return;

    const container = this.svgContainer()?.nativeElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const zoom = this.zoom();

    // Calculate pan to center the node
    const nodeCenter = {
      x: node.x + this.nodeWidth / 2,
      y: node.y + this.nodeHeight / 2,
    };

    this.panX.set(rect.width / 2 - nodeCenter.x * zoom);
    this.panY.set(rect.height / 2 - nodeCenter.y * zoom);
  }

  // Helpers
  getNodePath(from: EntityNode, to: EntityNode): string {
    const startX = (from.x || 0) + this.nodeWidth / 2;
    const startY = (from.y || 0) + this.nodeHeight;
    const endX = (to.x || 0) + this.nodeWidth / 2;
    const endY = to.y || 0;

    const midY = startY + (endY - startY) / 2;

    return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
  }

  getRiskClass(risk?: string): string {
    switch (risk) {
      case 'high':
        return 'node--risk-high';
      case 'medium':
        return 'node--risk-medium';
      case 'low':
        return 'node--risk-low';
      default:
        return '';
    }
  }

  formatCurrency(value?: number): string {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  getTransform(): string {
    return `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoom()})`;
  }
}
