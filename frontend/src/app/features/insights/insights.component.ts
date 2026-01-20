import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MockDataService, Engagement } from '../../core';
import { EveApiService } from '../../core/services/eve-api.service';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
  BadgeComponent,
  BarChartComponent,
  BarChartData,
  ChartClickEvent,
  PieChartComponent,
  PieChartData,
  PieClickEvent,
} from '../../shared';

export interface InsightsFilters {
  year: string;
  entities: string[];
}

export interface GlobalKpi {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  previousValue?: number;
  change?: number;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    BreadcrumbComponent,
    BadgeComponent,
    BarChartComponent,
    PieChartComponent,
  ],
  templateUrl: './insights.component.html',
  styleUrl: './insights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsightsComponent implements OnInit {
  private readonly mockData = inject(MockDataService);
  private readonly eveService = inject(EveApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly engagements = this.mockData.engagements;

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/app' },
    { label: 'Insights' },
  ];

  // Filters
  readonly filters = signal<InsightsFilters>({
    year: '2025',
    entities: [],
  });

  readonly yearOptions = ['2025', '2024', '2023'];

  readonly entityOptions = computed(() => {
    const engagements = this.engagements();
    const entities = new Set<string>();
    engagements.forEach((e) => entities.add(e.entity));
    return Array.from(entities).sort();
  });

  // Filtered engagements based on filters
  readonly filteredEngagements = computed(() => {
    const engagements = this.engagements();
    const f = this.filters();

    return engagements.filter((e) => {
      // Filter by year (fiscal year)
      if (f.year && String(e.fiscalYear) !== f.year) return false;
      // Filter by entities if any selected
      if (f.entities.length > 0 && !f.entities.includes(e.entity)) return false;
      return true;
    });
  });

  // Global KPIs computed from filtered engagements
  readonly globalKpis = computed<GlobalKpi[]>(() => {
    const engagements = this.filteredEngagements();

    // Calculate total tax liability (from CTR results or estimate from financials)
    const totalTaxLiability = engagements.reduce((sum, e) => {
      if (e.ctrResults?.taxData?.taxLiability) {
        return sum + e.ctrResults.taxData.taxLiability;
      }
      // Estimate: 25% of revenue as placeholder
      return sum + e.financialData.revenue * 0.25;
    }, 0);

    // Average Effective Tax Rate (weighted by revenue)
    const totalRevenue = engagements.reduce((sum, e) => sum + e.financialData.revenue, 0);
    const weightedETR = engagements.reduce((sum, e) => {
      const etr = e.ctrResults?.taxData?.effectiveRate ?? 25;
      const weight = e.financialData.revenue / totalRevenue;
      return sum + etr * weight;
    }, 0);

    // CTRs Completed
    const ctrsCompleted = engagements.filter(
      (e) => e.ctrResults?.status === 'completed'
    ).length;
    const ctrsTotal = engagements.length;

    // Entities at Risk
    const entitiesAtRisk = engagements.filter((e) => e.riskLevel === 'high').length;

    return [
      {
        id: 'total_tax_liability',
        label: 'Total Tax Liability',
        value: totalTaxLiability,
        formattedValue: this.formatCurrency(totalTaxLiability),
        icon: 'receipt',
        color: 'primary' as const,
      },
      {
        id: 'avg_etr',
        label: 'Avg Effective Tax Rate',
        value: weightedETR,
        formattedValue: `${weightedETR.toFixed(1)}%`,
        icon: 'percent',
        color: 'info' as const,
      },
      {
        id: 'ctrs_completed',
        label: 'CTRs Completed',
        value: ctrsCompleted,
        formattedValue: `${ctrsCompleted}/${ctrsTotal}`,
        icon: 'file-check-2',
        color: 'success' as const,
      },
      {
        id: 'entities_at_risk',
        label: 'Entities at Risk',
        value: entitiesAtRisk,
        formattedValue: entitiesAtRisk.toString(),
        icon: 'alert-triangle',
        color: entitiesAtRisk > 0 ? ('error' as const) : ('success' as const),
      },
    ];
  });

  // Tax by Entity chart data
  readonly taxByEntityData = computed<BarChartData | null>(() => {
    const engagements = this.filteredEngagements();
    if (engagements.length === 0) return null;

    // Sort by tax amount descending
    const sorted = [...engagements].sort((a, b) => {
      const taxA = a.ctrResults?.taxData?.taxLiability ?? a.financialData.revenue * 0.25;
      const taxB = b.ctrResults?.taxData?.taxLiability ?? b.financialData.revenue * 0.25;
      return taxB - taxA;
    });

    return {
      labels: sorted.map((e) => e.entity),
      datasets: [
        {
          label: 'Tax Liability',
          data: sorted.map(
            (e) => e.ctrResults?.taxData?.taxLiability ?? e.financialData.revenue * 0.25
          ),
          backgroundColor: '#FFE600',
        },
      ],
    };
  });

  // ETR by Entity chart data
  readonly etrByEntityData = computed<BarChartData | null>(() => {
    const engagements = this.filteredEngagements();
    if (engagements.length === 0) return null;

    const etrData = engagements.map((e) => ({
      entity: e.entity,
      etr: e.ctrResults?.taxData?.effectiveRate ?? 25,
      statutory: e.ctrResults?.taxData?.statutoryRate ?? 25,
    }));

    return {
      labels: etrData.map((d) => d.entity),
      datasets: [
        {
          label: 'Effective Tax Rate',
          data: etrData.map((d) => d.etr),
          backgroundColor: etrData.map((d) =>
            d.etr > d.statutory ? '#EF4444' : '#22C55E'
          ),
        },
      ],
    };
  });

  // Tax by Jurisdiction (pie chart)
  readonly taxByJurisdictionData = computed<PieChartData | null>(() => {
    const engagements = this.filteredEngagements();
    if (engagements.length === 0) return null;

    // Group by country
    const byCountry: Record<string, { total: number; name: string }> = {};
    engagements.forEach((e) => {
      const countryName = this.getCountryName(e.country);
      const tax = e.ctrResults?.taxData?.taxLiability ?? e.financialData.revenue * 0.25;
      if (!byCountry[e.country]) {
        byCountry[e.country] = { total: 0, name: countryName };
      }
      byCountry[e.country].total += tax;
    });

    const total = Object.values(byCountry).reduce((s, c) => s + c.total, 0);
    const colors = ['#FFE600', '#2E2E38', '#3B82F6', '#10B981', '#F59E0B'];

    const items = Object.entries(byCountry).map(([code, data], i) => ({
      label: data.name,
      value: data.total,
      percentage: (data.total / total) * 100,
      color: colors[i % colors.length],
    }));

    return {
      title: 'Tax by Jurisdiction',
      total,
      items,
    };
  });

  ngOnInit(): void {
    // Set Eve context for insights
    this.eveService.setEngagementContext('global', 'Global Insights');
  }

  // Filter methods
  onYearChange(year: string): void {
    this.filters.update((f) => ({ ...f, year }));
  }

  onEntityToggle(entity: string): void {
    this.filters.update((f) => {
      const entities = f.entities.includes(entity)
        ? f.entities.filter((e) => e !== entity)
        : [...f.entities, entity];
      return { ...f, entities };
    });
  }

  clearFilters(): void {
    this.filters.set({ year: '2025', entities: [] });
  }

  hasActiveFilters(): boolean {
    const f = this.filters();
    return f.year !== '2025' || f.entities.length > 0;
  }

  // KPI click handler
  onKpiClick(kpi: GlobalKpi): void {
    this.eveService.openPanel();
    this.eveService
      .explainValue(kpi.formattedValue, kpi.label, 'global', { kpiId: kpi.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  // Chart click handlers
  onChartClick(event: ChartClickEvent, chartType: string): void {
    this.eveService.openPanel();
    this.eveService
      .explainValue(
        this.formatCurrency(event.value),
        `${event.label} - ${chartType}`,
        'global',
        { chartType, entity: event.label }
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onPieClick(event: PieClickEvent, chartType: string): void {
    this.eveService.openPanel();
    this.eveService
      .explainValue(
        this.formatCurrency(event.value),
        `${event.label} - ${chartType}`,
        'global',
        { chartType, jurisdiction: event.label }
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  // Helpers
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  getCountryName(code: string): string {
    const names: Record<string, string> = {
      FR: 'France',
      DE: 'Germany',
      NL: 'Netherlands',
      BE: 'Belgium',
      LU: 'Luxembourg',
    };
    return names[code] || code;
  }

  getKpiIconColor(color: GlobalKpi['color']): string {
    const colors: Record<string, string> = {
      primary: '#FFE600',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    };
    return colors[color] || colors['primary'];
  }
}
