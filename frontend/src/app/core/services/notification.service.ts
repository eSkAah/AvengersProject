import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface Notification {
  id: string;
  type: 'RISK_ESCALATION' | 'DEADLINE_APPROACHING' | 'DOCUMENT_UPLOADED';
  title: string;
  message: string;
  engagement_id?: string;
  dismissed: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  async getNotifications(): Promise<Notification[]> {
    try {
      return await firstValueFrom(
        this.http.get<Notification[]>(this.apiUrl)
      );
    } catch {
      // Return mock data for demo
      return this.getMockNotifications();
    }
  }

  async dismissNotification(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch<void>(`${this.apiUrl}/${id}/dismiss`, {})
      );
    } catch {
      // Silent fail for demo
    }
  }

  async dismissAllNotifications(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.patch<void>(`${this.apiUrl}/dismiss-all`, {})
      );
    } catch {
      // Silent fail for demo
    }
  }

  private getMockNotifications(): Notification[] {
    return [
      {
        id: '1',
        type: 'RISK_ESCALATION',
        title: 'High risk alert: France SPV',
        message: 'Missing documents for deadline',
        engagement_id: 'eng-001',
        dismissed: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 min ago
      },
      {
        id: '2',
        type: 'DEADLINE_APPROACHING',
        title: 'Deadline in 7 days',
        message: 'Germany PropCo closing soon',
        engagement_id: 'eng-002',
        dismissed: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        id: '3',
        type: 'DOCUMENT_UPLOADED',
        title: 'New document uploaded',
        message: 'Tax return form received',
        engagement_id: 'eng-001',
        dismissed: false,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ];
  }
}
