import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, X, ChevronRight, Calendar, TrendingUp, Building2 } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { TreeNode, PrimeTemplate } from 'primeng/api';
import { OrganizationChart } from 'primeng/organizationchart';
import { MockDataService, Engagement } from '../../core';
import { BreadcrumbComponent, BreadcrumbItem, RiskBadgeComponent, BadgeComponent } from '../../shared';

// Extended TreeNode with custom data
export interface EntityTreeNode extends TreeNode<EntityData> {
  children?: EntityTreeNode[];
}

export interface EntityData {
  id: string;
  name: string;
  nodeType: 'holding' | 'region' | 'entity';
  country?: string;
  countryFlag?: string;
  riskLevel?: string;
  completion?: number;
  revenue?: number;
  engagements?: Engagement[];
  engagementCount?: number;
}

@Component({
  selector: 'app-structure',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    OrganizationChart,
    PrimeTemplate,
    BreadcrumbComponent,
    RiskBadgeComponent,
    BadgeComponent,
  ],
  templateUrl: './structure.component.html',
  styleUrl: './structure.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('drawerSlide', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 })),
      ]),
    ]),
    trigger('overlayFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class StructureComponent {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  // Icons
  readonly icons = {
    x: X,
    chevronRight: ChevronRight,
    calendar: Calendar,
    trendingUp: TrendingUp,
    building: Building2,
  };

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Entity Structure' },
  ];

  // Selected node for drawer
  readonly selectedNode = signal<EntityTreeNode | null>(null);
  readonly drawerOpen = signal(false);

  // Search state
  readonly searchQuery = signal('');
  readonly showSearchResults = signal(false);

  // Selection for org chart (non-signal for PrimeNG compatibility)
  selection: EntityTreeNode | null = null;

  // Build PrimeNG TreeNode structure
  readonly orgChartData = computed<EntityTreeNode[]>(() => {
    const engagements = this.mockData.engagements();

    // Group engagements by entity name
    const entitiesByName: Record<string, Engagement[]> = {};
    engagements.forEach((eng) => {
      if (!entitiesByName[eng.entity]) {
        entitiesByName[eng.entity] = [];
      }
      entitiesByName[eng.entity].push(eng);
    });

    // Group by region
    const regions: Record<string, EntityTreeNode> = {};

    Object.entries(entitiesByName).forEach(([entityName, entityEngagements]) => {
      const firstEng = entityEngagements[0];
      const regionName = this.getRegionName(firstEng.countryFlag);

      if (!regions[regionName]) {
        regions[regionName] = {
          expanded: true,
          type: 'region',
          styleClass: 'node-region',
          data: {
            id: `region-${regionName}`,
            name: regionName,
            nodeType: 'region',
          },
          children: [],
        };
      }

      // Calculate aggregated values
      const highestRisk = this.getHighestRisk(entityEngagements);
      const avgCompletion = Math.round(
        entityEngagements.reduce((sum, e) => sum + e.completionPercent, 0) / entityEngagements.length
      );
      const totalRevenue = entityEngagements.reduce((sum, e) => sum + e.financialData.revenue, 0);

      const riskClass = highestRisk === 'high' ? 'node-risk-high' : highestRisk === 'medium' ? 'node-risk-medium' : 'node-risk-low';

      regions[regionName].children!.push({
        type: 'entity',
        styleClass: `node-entity ${riskClass}`,
        data: {
          id: `entity-${entityName.replace(/\s+/g, '-')}`,
          name: entityName,
          nodeType: 'entity',
          country: firstEng.country,
          countryFlag: firstEng.countryFlag,
          riskLevel: highestRisk,
          completion: avgCompletion,
          revenue: totalRevenue,
          engagements: entityEngagements,
          engagementCount: entityEngagements.length,
        },
        children: [],
      });
    });

    // Create root holding node
    const holdingNode: EntityTreeNode = {
      expanded: true,
      type: 'holding',
      styleClass: 'node-holding',
      data: {
        id: 'holding',
        name: 'Avengers Holding',
        nodeType: 'holding',
      },
      children: Object.values(regions).sort((a, b) =>
        (a.data?.name || '').localeCompare(b.data?.name || '')
      ),
    };

    return [holdingNode];
  });

  // All entities for search
  readonly allEntities = computed(() => {
    const entities: EntityData[] = [];
    const collectEntities = (nodes: EntityTreeNode[]) => {
      nodes.forEach((node) => {
        if (node.data?.nodeType === 'entity') {
          entities.push(node.data);
        }
        if (node.children) {
          collectEntities(node.children);
        }
      });
    };
    collectEntities(this.orgChartData());
    return entities;
  });

  // Search results
  readonly searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return [];

    return this.allEntities()
      .filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.country?.toLowerCase().includes(query) ||
          e.countryFlag?.includes(query)
      )
      .slice(0, 10);
  });

  // Helper to get highest risk level
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

  // Node selection handler
  onNodeSelect(event: { node: EntityTreeNode }): void {
    const node = event.node;
    this.selectedNode.set(node);
    if (node.data?.nodeType === 'entity') {
      this.drawerOpen.set(true);
    }
  }

  // Close drawer
  closeDrawer(): void {
    this.drawerOpen.set(false);
    setTimeout(() => {
      if (!this.drawerOpen()) {
        this.selectedNode.set(null);
        this.selection = null;
      }
    }, 250);
  }

  onOverlayClick(): void {
    this.closeDrawer();
  }

  // Navigation
  navigateToEngagement(engagement: Engagement): void {
    this.router.navigate(['/app/engagements', engagement.id]);
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
    setTimeout(() => {
      this.showSearchResults.set(false);
    }, 200);
  }

  selectSearchResult(entity: EntityData): void {
    this.searchQuery.set('');
    this.showSearchResults.set(false);

    // Find the node and select it
    const findNode = (nodes: EntityTreeNode[]): EntityTreeNode | null => {
      for (const node of nodes) {
        if (node.data?.id === entity.id) {
          return node;
        }
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const node = findNode(this.orgChartData());
    if (node) {
      this.selection = node;
      this.onNodeSelect({ node });
    }
  }

  // Status helpers
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      waiting: 'Pending',
      received: 'Received',
      processing: 'In Progress',
      completed: 'Completed',
    };
    return labels[status] || status;
  }

  getStatusVariant(status: string): 'info' | 'warning' | 'success' | 'error' {
    const variants: Record<string, 'info' | 'warning' | 'success' | 'error'> = {
      waiting: 'warning',
      received: 'info',
      processing: 'info',
      completed: 'success',
    };
    return variants[status] || 'info';
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
}
