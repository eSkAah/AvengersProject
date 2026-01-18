import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

// =============================================================================
// Types
// =============================================================================

export interface FinancialMetrics {
  total_assets: number;
  total_liabilities: number;
  equity: number;
  revenue: number;
  expenses: number;
}

export interface VariancePercent {
  total_assets: number;
  total_liabilities: number;
  equity: number;
  revenue: number;
  expenses: number;
}

export interface EngagementStats {
  engagement_id: string;
  entity_name: string;
  current_year: FinancialMetrics;
  previous_year: FinancialMetrics | null;
  variance_percent: VariancePercent | null;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface AssetsChartResponse {
  engagement_id: string;
  chart_type: string;
  data: ChartData;
  source_document: string | null;
}

export interface ComparisonDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor?: string;
}

export interface ComparisonChartResponse {
  engagement_id: string;
  chart_type: string;
  labels: string[];
  current_year: ComparisonDataset;
  previous_year: ComparisonDataset | null;
  variance_percent: number[];
}

export interface BreakdownItem {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface BreakdownChartResponse {
  engagement_id: string;
  chart_type: string;
  title: string;
  total: number;
  items: BreakdownItem[];
  source_document: string | null;
}

// =============================================================================
// Service
// =============================================================================

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // Loading states
  readonly loadingStats = signal(false);
  readonly loadingCharts = signal(false);

  // Error state for user feedback
  readonly error = signal<string | null>(null);

  // Cached data
  readonly currentStats = signal<EngagementStats | null>(null);
  readonly assetsChart = signal<AssetsChartResponse | null>(null);
  readonly comparisonChart = signal<ComparisonChartResponse | null>(null);
  readonly breakdownChart = signal<BreakdownChartResponse | null>(null);

  /**
   * Get engagement statistics with YoY comparison
   */
  getEngagementStats(engagementId: string): Observable<EngagementStats> {
    this.loadingStats.set(true);
    this.error.set(null); // Clear previous errors
    return this.http
      .get<EngagementStats>(`${this.baseUrl}/engagements/${engagementId}/stats`)
      .pipe(
        tap((stats) => {
          this.currentStats.set(stats);
          this.loadingStats.set(false);
        }),
        catchError((error) => {
          console.error('Error fetching engagement stats:', error);
          this.loadingStats.set(false);
          this.error.set('Unable to load statistics. Please try again.');
          throw error;
        })
      );
  }

  /**
   * Get assets breakdown chart data
   */
  getAssetsChart(engagementId: string): Observable<AssetsChartResponse> {
    return this.http
      .get<AssetsChartResponse>(
        `${this.baseUrl}/engagements/${engagementId}/charts/assets`
      )
      .pipe(
        tap((data) => this.assetsChart.set(data)),
        catchError((error) => {
          console.error('Error fetching assets chart:', error);
          throw error;
        })
      );
  }

  /**
   * Get N vs N-1 comparison chart data
   */
  getComparisonChart(engagementId: string): Observable<ComparisonChartResponse> {
    return this.http
      .get<ComparisonChartResponse>(
        `${this.baseUrl}/engagements/${engagementId}/charts/comparison`
      )
      .pipe(
        tap((data) => this.comparisonChart.set(data)),
        catchError((error) => {
          console.error('Error fetching comparison chart:', error);
          throw error;
        })
      );
  }

  /**
   * Get breakdown pie chart data
   */
  getBreakdownChart(engagementId: string): Observable<BreakdownChartResponse> {
    return this.http
      .get<BreakdownChartResponse>(
        `${this.baseUrl}/engagements/${engagementId}/charts/breakdown`
      )
      .pipe(
        tap((data) => this.breakdownChart.set(data)),
        catchError((error) => {
          console.error('Error fetching breakdown chart:', error);
          throw error;
        })
      );
  }

  /**
   * Load all dashboard data for an engagement
   */
  loadDashboardData(engagementId: string): void {
    this.loadingCharts.set(true);
    this.error.set(null); // Clear previous errors

    // Load all data in parallel
    Promise.all([
      this.getEngagementStats(engagementId).toPromise(),
      this.getAssetsChart(engagementId).toPromise(),
      this.getComparisonChart(engagementId).toPromise(),
      this.getBreakdownChart(engagementId).toPromise(),
    ])
      .then(() => {
        this.loadingCharts.set(false);
      })
      .catch((error) => {
        console.error('Error loading dashboard data:', error);
        this.loadingCharts.set(false);
        this.error.set('Unable to load dashboard data. Please try again.');
      });
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Format currency for display
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  /**
   * Format currency with full precision
   */
  formatCurrencyFull(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Format percentage with sign
   */
  formatVariance(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }
}
