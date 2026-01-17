import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
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
export class HomeComponent {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  private activeFilter = signal<KpiFilter>('all');

  readonly kpiData = computed(() => ({
    total: this.mockData.totalEngagements(),
    processing: this.mockData.engagementsByStatus().processing + this.mockData.engagementsByStatus().received,
    highRisk: this.mockData.engagementsByRisk().high,
    completed: this.mockData.engagementsByStatus().completed,
  }));

  readonly filteredEngagements = computed(() => {
    const filter = this.activeFilter();
    const engagements = this.mockData.engagements();

    switch (filter) {
      case 'processing':
        return engagements.filter((e) => e.status === 'processing' || e.status === 'received');
      case 'high-risk':
        return engagements.filter((e) => e.riskLevel === 'high');
      case 'completed':
        return engagements.filter((e) => e.status === 'completed');
      default:
        return engagements;
    }
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
    // Navigate to engagement dashboard page
    this.router.navigate(['/engagements', engagement.id, 'dashboard']);
  }

  onUploadDocs(engagement: Engagement): void {
    this.router.navigate(['/documents'], {
      queryParams: { engagement: engagement.id },
    });
  }

  onAskEve(engagement: Engagement): void {
    // Open Eve chat with engagement context
    this.router.navigate(['/eve'], {
      queryParams: { engagement: engagement.id },
    });
  }

  onNotificationClick(notification: Notification): void {
    if (notification.engagementId) {
      // Navigate to engagement detail page
      this.router.navigate(['/engagements', notification.engagementId]);
    }
  }
}
