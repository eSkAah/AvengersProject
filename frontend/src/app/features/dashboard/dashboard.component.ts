import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MockDataService } from '../../core';
import {
  KpiCardComponent,
  ProgressBarComponent,
  BreadcrumbComponent,
  BreadcrumbItem,
} from '../../shared';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    KpiCardComponent,
    ProgressBarComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Tableau de bord' },
  ];

  // Global KPIs
  readonly totalEngagements = this.mockData.totalEngagements;
  readonly engagementsByStatus = this.mockData.engagementsByStatus;
  readonly engagementsByRisk = this.mockData.engagementsByRisk;
  readonly totalDocuments = computed(() => this.mockData.documents().length);

  // Financial totals
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

  // Engagements by country
  readonly engagementsByCountry = computed(() => {
    const engagements = this.mockData.engagements();
    const grouped: Record<string, { flag: string; count: number; revenue: number }> = {};

    engagements.forEach((e) => {
      if (!grouped[e.country]) {
        grouped[e.country] = { flag: e.countryFlag, count: 0, revenue: 0 };
      }
      grouped[e.country].count++;
      grouped[e.country].revenue += e.financialData.revenue;
    });

    return Object.entries(grouped)
      .map(([country, data]) => ({ country, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  });

  // Upcoming deadlines
  readonly upcomingDeadlines = computed(() => {
    const engagements = this.mockData.engagements();
    const today = new Date();

    return engagements
      .filter((e) => e.status !== 'completed')
      .map((e) => {
        const due = new Date(e.dueDate);
        const daysLeft = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...e, daysLeft };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5);
  });

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  goToEngagement(id: string): void {
    this.router.navigate(['/engagements', id]);
  }
}
