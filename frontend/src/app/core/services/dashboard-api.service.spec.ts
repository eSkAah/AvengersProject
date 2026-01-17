import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { DashboardApiService, EngagementStats } from './dashboard-api.service';
import { environment } from '../../../environments/environment';

describe('DashboardApiService', () => {
  let service: DashboardApiService;
  let httpMock: HttpTestingController;

  const mockStats: EngagementStats = {
    engagement_id: 'test-123',
    entity_name: 'Test Entity',
    current_year: {
      total_assets: 1000000,
      total_liabilities: 500000,
      equity: 500000,
      revenue: 200000,
      expenses: 150000,
    },
    previous_year: {
      total_assets: 900000,
      total_liabilities: 450000,
      equity: 450000,
      revenue: 180000,
      expenses: 140000,
    },
    variance_percent: {
      total_assets: 11.11,
      total_liabilities: 11.11,
      equity: 11.11,
      revenue: 11.11,
      expenses: 7.14,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardApiService],
    });

    service = TestBed.inject(DashboardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getEngagementStats', () => {
    it('should fetch engagement stats and update signals', () => {
      service.getEngagementStats('test-123').subscribe((stats) => {
        expect(stats).toEqual(mockStats);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/engagements/test-123/stats`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);

      expect(service.currentStats()).toEqual(mockStats);
      expect(service.loadingStats()).toBe(false);
    });

    it('should set loading state to true before request', () => {
      service.getEngagementStats('test-123').subscribe();
      expect(service.loadingStats()).toBe(true);

      const req = httpMock.expectOne(
        `${environment.apiUrl}/engagements/test-123/stats`
      );
      req.flush(mockStats);
    });

    it('should set error on failure', () => {
      service.getEngagementStats('test-123').subscribe({
        error: () => {
          expect(service.error()).toBeTruthy();
          expect(service.loadingStats()).toBe(false);
        },
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/engagements/test-123/stats`
      );
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should clear previous error before new request', () => {
      service['error'].set('Previous error');
      service.getEngagementStats('test-123').subscribe();

      expect(service.error()).toBeNull();

      const req = httpMock.expectOne(
        `${environment.apiUrl}/engagements/test-123/stats`
      );
      req.flush(mockStats);
    });
  });

  describe('getAssetsChart', () => {
    const mockAssetsChart = {
      engagement_id: 'test-123',
      chart_type: 'bar',
      data: {
        labels: ['Immobilisations', 'Actifs circulants', 'Trésorerie'],
        datasets: [
          {
            label: 'Répartition des Actifs',
            data: [520000, 320000, 160000],
            backgroundColor: ['#FFE600', '#6B7280', '#2E2E38'],
          },
        ],
      },
      source_document: 'Grand_Livre_FR_2025.xlsx',
    };

    it('should fetch assets chart and update signal', () => {
      service.getAssetsChart('test-123').subscribe((data) => {
        expect(data).toEqual(mockAssetsChart);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/engagements/test-123/charts/assets`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockAssetsChart);

      expect(service.assetsChart()).toEqual(mockAssetsChart);
    });
  });

  describe('getComparisonChart', () => {
    const mockComparisonChart = {
      engagement_id: 'test-123',
      chart_type: 'bar',
      labels: ['Total Assets', 'Liabilities', 'Revenue', 'Expenses'],
      current_year: {
        label: '2026',
        data: [1000000, 500000, 200000, 150000],
        backgroundColor: '#FFE600',
      },
      previous_year: {
        label: '2025',
        data: [900000, 450000, 180000, 140000],
        backgroundColor: '#E5E5E5',
      },
      variance_percent: [11.11, 11.11, 11.11, 7.14],
    };

    it('should fetch comparison chart and update signal', () => {
      service.getComparisonChart('test-123').subscribe((data) => {
        expect(data).toEqual(mockComparisonChart);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/engagements/test-123/charts/comparison`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockComparisonChart);

      expect(service.comparisonChart()).toEqual(mockComparisonChart);
    });
  });

  describe('getBreakdownChart', () => {
    const mockBreakdownChart = {
      engagement_id: 'test-123',
      chart_type: 'pie',
      title: 'Répartition des Actifs',
      total: 1000000,
      items: [
        { label: 'Immobilisations corporelles', value: 350000, percentage: 35, color: '#FFE600' },
        { label: 'Trésorerie', value: 160000, percentage: 16, color: '#10B981' },
      ],
      source_document: 'Grand_Livre_FR_2025.xlsx',
    };

    it('should fetch breakdown chart and update signal', () => {
      service.getBreakdownChart('test-123').subscribe((data) => {
        expect(data).toEqual(mockBreakdownChart);
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/engagements/test-123/charts/breakdown`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockBreakdownChart);

      expect(service.breakdownChart()).toEqual(mockBreakdownChart);
    });
  });

  describe('clearError', () => {
    it('should clear the error signal', () => {
      service['error'].set('Some error');
      expect(service.error()).toBe('Some error');

      service.clearError();
      expect(service.error()).toBeNull();
    });
  });

  describe('formatCurrency', () => {
    it('should format large numbers with compact notation', () => {
      const result = service.formatCurrency(1000000);
      expect(result).toContain('M');
    });

    it('should format small numbers', () => {
      const result = service.formatCurrency(1000);
      expect(result).toBeTruthy();
    });
  });

  describe('formatCurrencyFull', () => {
    it('should format currency without compact notation', () => {
      const result = service.formatCurrencyFull(1000000);
      expect(result).toBeTruthy();
      expect(result).not.toContain('M');
    });
  });

  describe('formatVariance', () => {
    it('should format positive variance with plus sign', () => {
      expect(service.formatVariance(11.5)).toBe('+11.5%');
    });

    it('should format negative variance', () => {
      expect(service.formatVariance(-5.2)).toBe('-5.2%');
    });

    it('should format zero variance with plus sign', () => {
      expect(service.formatVariance(0)).toBe('+0.0%');
    });
  });
});
