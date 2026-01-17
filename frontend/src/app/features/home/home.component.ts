import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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

  onFilterChange(filter: KpiFilter): void {
    this.activeFilter.set(filter);
  }

  onViewDashboard(engagement: Engagement): void {
    console.log('View dashboard for:', engagement.entity);
    // TODO: Navigate to dashboard
    // this.router.navigate(['/dashboard', engagement.id]);
  }

  onUploadDocs(engagement: Engagement): void {
    console.log('Upload docs for:', engagement.entity);
    // TODO: Navigate to documents
    // this.router.navigate(['/documents'], { queryParams: { engagement: engagement.id } });
  }

  onAskEve(engagement: Engagement): void {
    console.log('Ask Eve about:', engagement.entity);
    // TODO: Open Eve chatbot
  }

  onNotificationClick(notification: Notification): void {
    if (notification.engagementId) {
      console.log('Navigate to engagement:', notification.engagementId);
      // TODO: Navigate or expand engagement
    }
  }
}
