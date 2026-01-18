import { Component, ChangeDetectionStrategy, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MockDataService, Engagement } from '../../core';
import { Notification } from '../../shared';
import {
  KpiHeaderComponent,
  KpiFilter,
  EngagementListComponent,
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
export class HomeComponent implements OnInit {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  private activeFilter = signal<KpiFilter>('all');
  private completedActionIds = signal<Set<string>>(new Set());

  readonly kpiData = computed(() => ({
    total: this.mockData.totalEngagements(),
    processing: this.mockData.engagementsByStatus().processing + this.mockData.engagementsByStatus().received,
    highRisk: this.mockData.engagementsByRisk().high,
    completed: this.mockData.engagementsByStatus().completed,
  }));

  // At-risk engagements: only HIGH and MEDIUM risk
  readonly atRiskEngagements = computed(() => {
    return this.mockData.engagements().filter(
      (e) => e.riskLevel === 'high' || e.riskLevel === 'medium'
    );
  });

  // Action items derived from engagements
  readonly actionItems = computed<ActionItem[]>(() => {
    const engagements = this.mockData.engagements();
    const completedIds = this.completedActionIds();
    const items: ActionItem[] = [];

    engagements.forEach((engagement) => {
      // Missing documents action
      const missingDocs = engagement.documentsRequired.length - engagement.documentsUploaded.length;
      if (missingDocs > 0 && engagement.status !== 'completed') {
        const actionId = `upload-${engagement.id}`;
        if (!completedIds.has(actionId)) {
          items.push({
            id: actionId,
            type: 'upload',
            title: `Upload ${missingDocs} document(s)`,
            description: `${engagement.entity} - ${missingDocs} document(s) manquant(s)`,
            engagementId: engagement.id,
            engagementName: engagement.entity,
            priority: engagement.riskLevel === 'high' ? 'high' : engagement.riskLevel === 'medium' ? 'medium' : 'low',
            dueDate: engagement.dueDate,
          });
        }
      }

      // Deadline approaching (within 7 days)
      const daysUntilDue = this.getDaysUntilDue(engagement.dueDate);
      if (daysUntilDue <= 7 && daysUntilDue > 0 && engagement.status !== 'completed') {
        const actionId = `deadline-${engagement.id}`;
        if (!completedIds.has(actionId)) {
          items.push({
            id: actionId,
            type: 'deadline',
            title: `Deadline in ${daysUntilDue} day(s)`,
            description: `${engagement.entity} - Complete before ${this.formatDate(engagement.dueDate)}`,
            engagementId: engagement.id,
            engagementName: engagement.entity,
            priority: daysUntilDue <= 3 ? 'high' : 'medium',
            dueDate: engagement.dueDate,
          });
        }
      }

      // Review needed (status is 'received')
      if (engagement.status === 'received') {
        const actionId = `review-${engagement.id}`;
        if (!completedIds.has(actionId)) {
          items.push({
            id: actionId,
            type: 'review',
            title: 'Review documents',
            description: `${engagement.entity} - Documents received, pending review`,
            engagementId: engagement.id,
            engagementName: engagement.entity,
            priority: engagement.riskLevel === 'high' ? 'high' : 'medium',
          });
        }
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
    // Load completed actions from session storage
    this.loadCompletedActions();
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
    this.router.navigate(['/engagements', engagement.id, 'dashboard']);
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

  onNotificationClick(notification: Notification): void {
    if (notification.engagementId) {
      this.router.navigate(['/engagements', notification.engagementId]);
    }
  }

  // Action Center methods
  onActionClick(action: ActionItem): void {
    switch (action.type) {
      case 'upload':
        this.router.navigate(['/documents'], {
          queryParams: { engagement: action.engagementId },
        });
        break;
      case 'review':
      case 'deadline':
        this.router.navigate(['/engagements', action.engagementId, 'dashboard']);
        break;
      default:
        this.router.navigate(['/engagements', action.engagementId]);
    }
  }

  markActionComplete(action: ActionItem, event: Event): void {
    event.stopPropagation();
    this.completedActionIds.update((ids) => {
      const newIds = new Set(ids);
      newIds.add(action.id);
      return newIds;
    });
    this.saveCompletedActions();
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
      // Navigate to engagements with high-risk pre-filter
      this.router.navigate(['/engagements']);
    } else {
      this.router.navigate(['/engagements']);
    }
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

  private saveCompletedActions(): void {
    try {
      const ids = Array.from(this.completedActionIds());
      sessionStorage.setItem('avengers_completed_actions', JSON.stringify(ids));
    } catch {
      // Session storage not available
    }
  }

  private loadCompletedActions(): void {
    try {
      const saved = sessionStorage.getItem('avengers_completed_actions');
      if (saved) {
        const ids = JSON.parse(saved) as string[];
        this.completedActionIds.set(new Set(ids));
      }
    } catch {
      // Session storage not available
    }
  }
}
