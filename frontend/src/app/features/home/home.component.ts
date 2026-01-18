import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
  DocumentRequirementStatus,
  DocumentType,
  Engagement,
  MockDataService,
  STATUS_LABELS,
} from '../../core';
import { Notification } from '../../shared';
import {
  EngagementListComponent,
  KpiFilter,
  KpiHeaderComponent,
  NotificationsZoneComponent,
} from '../landing';

export interface ActionItem {
  id: string;
  type: 'upload' | 'review' | 'deadline' | 'approval';
  title: string;
  description: string;
  engagementId: string;
  engagementName: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    KpiHeaderComponent,
    EngagementListComponent,
    NotificationsZoneComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, AfterViewInit {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  private activeFilter = signal<KpiFilter>('all');
  readonly expandEngagementId = signal<string | null>(null);

  // Signal to trigger initial render - fixes OnPush change detection issue
  private readonly isInitialized = signal(false);

  readonly kpiData = computed(() => ({
    total: this.mockData.totalEngagements(),
    processing:
      this.mockData.engagementsByStatus().processing + this.mockData.engagementsByStatus().received,
    highRisk: this.mockData.engagementsByRisk().high,
    completed: this.mockData.engagementsByStatus().completed,
  }));

  // At-risk engagements: only HIGH and MEDIUM risk
  readonly atRiskEngagements = computed(() => {
    // Include isInitialized to ensure re-computation after init
    this.isInitialized();
    return this.mockData
      .engagements()
      .filter(e => e.riskLevel === 'high' || e.riskLevel === 'medium');
  });

  // Displayed risk engagements (limited to 4 for compact view)
  readonly displayedRiskEngagements = computed(() => {
    return this.atRiskEngagements().slice(0, 4);
  });

  // Status labels for display
  readonly statusLabels = STATUS_LABELS;

  // Action items derived from engagements - automatically updated when documents are uploaded
  readonly actionItems = computed<ActionItem[]>(() => {
    const engagements = this.mockData.engagements();
    const items: ActionItem[] = [];

    engagements.forEach(engagement => {
      // Missing documents action - automatically disappears when all docs uploaded
      const missingDocs = engagement.documentsRequired.length - engagement.documentsUploaded.length;
      if (missingDocs > 0 && engagement.status !== 'completed') {
        items.push({
          id: `upload-${engagement.id}`,
          type: 'upload',
          title: `Upload ${missingDocs} document(s)`,
          description: `${engagement.entity} - ${missingDocs} document(s) manquant(s)`,
          engagementId: engagement.id,
          engagementName: engagement.entity,
          priority:
            engagement.riskLevel === 'high'
              ? 'high'
              : engagement.riskLevel === 'medium'
                ? 'medium'
                : 'low',
          dueDate: engagement.dueDate,
        });
      }

      // Deadline approaching (within 7 days)
      const daysUntilDue = this.getDaysUntilDue(engagement.dueDate);
      if (daysUntilDue <= 7 && daysUntilDue > 0 && engagement.status !== 'completed') {
        items.push({
          id: `deadline-${engagement.id}`,
          type: 'deadline',
          title: `Deadline in ${daysUntilDue} day(s)`,
          description: `${engagement.entity} - Complete before ${this.formatDate(engagement.dueDate)}`,
          engagementId: engagement.id,
          engagementName: engagement.entity,
          priority: daysUntilDue <= 3 ? 'high' : 'medium',
          dueDate: engagement.dueDate,
        });
      }

      // Review needed (status is 'received')
      if (engagement.status === 'received') {
        items.push({
          id: `review-${engagement.id}`,
          type: 'review',
          title: 'Review documents',
          description: `${engagement.entity} - Documents received, pending review`,
          engagementId: engagement.id,
          engagementName: engagement.entity,
          priority: engagement.riskLevel === 'high' ? 'high' : 'medium',
        });
      }
    });

    // Sort by priority (high first) then by due date
    return items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    });
  });

  readonly notifications = this.mockData.notifications;

  // Financial summary data
  readonly financialTotals = computed(() => {
    const engagements = this.mockData.engagements();
    return {
      totalAssets: engagements.reduce((sum, e) => sum + e.financialData.assets, 0),
      totalLiabilities: engagements.reduce((sum, e) => sum + e.financialData.liabilities, 0),
      totalRevenue: engagements.reduce((sum, e) => sum + e.financialData.revenue, 0),
      avgCompletion: Math.round(
        engagements.reduce((sum, e) => sum + e.completionPercent, 0) / engagements.length
      ),
    };
  });

  ngOnInit(): void {
    // Check for expand query param (from notification deep-link)
    this.route.queryParams.subscribe(params => {
      const expandId = params['expand'];
      if (expandId) {
        this.expandEngagementId.set(expandId);
        // Clear the query param after handling
        this.router.navigate([], {
          queryParams: { expand: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  ngAfterViewInit(): void {
    // Force change detection after view init to ensure computed signals render
    // This fixes an issue with OnPush where service signals don't trigger initial render
    setTimeout(() => {
      this.isInitialized.set(true);
      this.cdr.detectChanges();
    }, 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  onFilterChange(filter: KpiFilter): void {
    this.activeFilter.set(filter);
  }

  onViewDashboard(engagement: Engagement): void {
    this.router.navigate(['/engagements', engagement.id]);
  }

  onUploadDocs(engagement: Engagement): void {
    this.router.navigate(['/documents'], {
      queryParams: { engagement: engagement.id },
    });
  }

  onAskEve(engagement: Engagement): void {
    this.router.navigate(['/eve'], {
      queryParams: { engagement: engagement.id },
    });
  }

  onViewDocsByStatus(event: {
    engagement: Engagement;
    status: DocumentRequirementStatus;
    type: DocumentType;
  }): void {
    // Navigate to documents with filters for entity, status, and type
    this.router.navigate(['/documents'], {
      queryParams: {
        engagement: event.engagement.id,
        entity: event.engagement.entity,
        status: event.status,
        type: event.type,
      },
    });
  }

  onNotificationClick(notification: Notification): void {
    if (notification.engagementId) {
      this.router.navigate(['/engagements', notification.engagementId]);
    }
  }

  // Action Center methods
  onActionClick(action: ActionItem): void {
    switch (action.type) {
      case 'upload':
        // Navigate to engagement detail page to see missing documents and upload them
        this.router.navigate(['/engagements', action.engagementId]);
        break;
      case 'review':
      case 'deadline':
        this.router.navigate(['/engagements', action.engagementId]);
        break;
      default:
        this.router.navigate(['/engagements', action.engagementId]);
    }
  }

  getActionIcon(type: ActionItem['type']): string {
    switch (type) {
      case 'upload':
        return 'upload';
      case 'review':
        return 'file-check';
      case 'deadline':
        return 'clock';
      case 'approval':
        return 'check-circle';
      default:
        return 'circle';
    }
  }

  onKpiCardClick(filter: KpiFilter): void {
    if (filter === 'all') {
      this.router.navigate(['/engagements']);
    } else if (filter === 'high-risk') {
      this.router.navigate(['/engagements'], {
        queryParams: { risk: 'high' },
      });
    } else if (filter === 'processing') {
      this.router.navigate(['/engagements'], {
        queryParams: { status: 'processing,received' },
      });
    } else if (filter === 'completed') {
      this.router.navigate(['/engagements'], {
        queryParams: { status: 'completed' },
      });
    }
  }

  onViewAllRiskEngagements(): void {
    this.router.navigate(['/engagements']);
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  }

  private getDaysUntilDue(dueDate: string): number {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  }
}
