import { Injectable, signal, computed } from '@angular/core';
import { Engagement, Document, EngagementStatus, RiskLevel } from '../models';
import { MOCK_ENGAGEMENTS } from '../mocks/engagements.mock';
import { MOCK_DOCUMENTS } from '../mocks/documents.mock';
import { Notification, NotificationType } from '../../shared/components/notification-item/notification-item.component';

@Injectable({
  providedIn: 'root',
})
export class MockDataService {
  private engagementsSignal = signal<Engagement[]>(MOCK_ENGAGEMENTS);
  private documentsSignal = signal<Document[]>(MOCK_DOCUMENTS);

  readonly engagements = this.engagementsSignal.asReadonly();
  readonly documents = this.documentsSignal.asReadonly();

  readonly totalEngagements = computed(() => this.engagementsSignal().length);

  readonly engagementsByStatus = computed(() => {
    const engagements = this.engagementsSignal();
    return {
      waiting: engagements.filter((e) => e.status === 'waiting').length,
      received: engagements.filter((e) => e.status === 'received').length,
      processing: engagements.filter((e) => e.status === 'processing').length,
      completed: engagements.filter((e) => e.status === 'completed').length,
    };
  });

  readonly engagementsByRisk = computed(() => {
    const engagements = this.engagementsSignal();
    return {
      high: engagements.filter((e) => e.riskLevel === 'high').length,
      medium: engagements.filter((e) => e.riskLevel === 'medium').length,
      low: engagements.filter((e) => e.riskLevel === 'low').length,
    };
  });

  readonly totalDocuments = computed(() => this.documentsSignal().length);

  getEngagementById(id: string): Engagement | undefined {
    return this.engagementsSignal().find((e) => e.id === id);
  }

  getDocumentById(id: string): Document | undefined {
    return this.documentsSignal().find((d) => d.id === id);
  }

  getDocumentsByEngagement(engagementId: string): Document[] {
    return this.documentsSignal().filter((d) => d.engagementId === engagementId);
  }

  filterEngagements(filters: {
    status?: EngagementStatus;
    riskLevel?: RiskLevel;
    country?: string;
  }): Engagement[] {
    return this.engagementsSignal().filter((e) => {
      if (filters.status && e.status !== filters.status) return false;
      if (filters.riskLevel && e.riskLevel !== filters.riskLevel) return false;
      if (filters.country && e.country !== filters.country) return false;
      return true;
    });
  }

  // Simulation methods for demo
  updateEngagementStatus(id: string, status: EngagementStatus): void {
    this.engagementsSignal.update((engagements) =>
      engagements.map((e) => (e.id === id ? { ...e, status } : e))
    );
  }

  addDocument(document: Document): void {
    this.documentsSignal.update((documents) => [...documents, document]);

    // Update engagement's documentsUploaded
    this.engagementsSignal.update((engagements) =>
      engagements.map((e) =>
        e.id === document.engagementId
          ? { ...e, documentsUploaded: [...e.documentsUploaded, document.id] }
          : e
      )
    );
  }

  // KPIs for dashboard
  readonly kpis = computed(() => {
    const engagements = this.engagementsSignal();
    const totalAssets = engagements.reduce((sum, e) => sum + e.financialData.assets, 0);
    const totalLiabilities = engagements.reduce((sum, e) => sum + e.financialData.liabilities, 0);
    const totalRevenue = engagements.reduce((sum, e) => sum + e.financialData.revenue, 0);
    const avgCompletion = engagements.reduce((sum, e) => sum + e.completionPercent, 0) / engagements.length;

    return {
      totalAssets,
      totalLiabilities,
      totalRevenue,
      avgCompletion: Math.round(avgCompletion),
      netAssets: totalAssets - totalLiabilities,
    };
  });

  // Notifications generated from engagement statuses
  readonly notifications = computed<Notification[]>(() => {
    const engagements = this.engagementsSignal();
    const notifications: Notification[] = [];

    engagements.forEach((engagement) => {
      // High risk + waiting = urgent notification
      if (engagement.riskLevel === 'high' && engagement.status === 'waiting') {
        notifications.push({
          id: `notif-urgent-${engagement.id}`,
          type: 'urgent',
          message: `Documents requis pour ${engagement.entity} - Deadline: ${this.formatDate(engagement.dueDate)}`,
          engagementId: engagement.id,
          timestamp: new Date(),
        });
      }

      // Missing documents = warning notification
      const missingDocs = engagement.documentsRequired.length - engagement.documentsUploaded.length;
      if (missingDocs > 0 && engagement.status !== 'completed') {
        notifications.push({
          id: `notif-docs-${engagement.id}`,
          type: 'warning',
          message: `${missingDocs} document(s) manquant(s) pour ${engagement.entity}`,
          engagementId: engagement.id,
          timestamp: new Date(),
        });
      }

      // Negative YoY = info notification
      if (engagement.financialData.yoyChange < 0) {
        notifications.push({
          id: `notif-yoy-${engagement.id}`,
          type: 'info',
          message: `Attention: Baisse de ${Math.abs(engagement.financialData.yoyChange)}% pour ${engagement.entity}`,
          engagementId: engagement.id,
          timestamp: new Date(),
        });
      }
    });

    return notifications;
  });

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });
  }
}
