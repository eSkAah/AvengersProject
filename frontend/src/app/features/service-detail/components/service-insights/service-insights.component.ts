import {
  Component,
  ChangeDetectionStrategy,
  Input,
  signal,
  computed,
  AfterViewInit,
  ViewChild,
  ElementRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, TrendingUp, TrendingDown, Building2, Filter, Download, ChevronDown } from 'lucide-angular';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export type InsightView = 'summary' | 'data';
export type InsightTab = 'dashboard' | 'multicountry';

export interface KpiCard {
  label: string;
  value: number;
  formatted: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray' | 'yellow';
}

export interface EntityTaxData {
  id: string;
  entity: string;
  year: number;
  currency: 'EUR' | 'GBP' | 'USD';
  taxConso: string;
  commercialResult: number;
  taxBalanceSheetResult: number;
  taxableResultBeforeTLCF: number;
  taxableResultAfterTLCF: number;
  participationIncome: number;
}

export interface MultiCountryData {
  id: string;
  entity: string;
  subFund: string;
  year: number;
  taxBase: number;
  taxDeductibleDepreciationPY: number;
  taxDeductibleDepreciationCY: number;
  taxLossCarryForward: number;
  interestExpenseFromStatutory: number;
  statutoryProfit: number;
  participationExemption: number;
  internationalAllocation: number;
  debtToEquityRatio: number;
  dividendOrCapital: number;
}

export interface FilterOptions {
  accountName: string;
  fund: string;
  entity: string;
  year: string;
  jurisdiction: string;
  subFund: string;
}

@Component({
  selector: 'app-service-insights',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './service-insights.component.html',
  styleUrl: './service-insights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceInsightsComponent implements AfterViewInit {
  @Input() serviceId: string | null = null;

  @ViewChild('taxBaseChart') taxBaseChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('corporateTaxChart') corporateTaxChartRef!: ElementRef<HTMLCanvasElement>;

  private taxBaseChart: Chart | null = null;
  private corporateTaxChart: Chart | null = null;

  readonly icons = {
    trendingUp: TrendingUp,
    trendingDown: TrendingDown,
    building: Building2,
    filter: Filter,
    download: Download,
    chevronDown: ChevronDown,
  };

  activeTab = signal<InsightTab>('dashboard');
  activeView = signal<InsightView>('summary');
  selectedEntityId = signal<string | null>(null);

  filters = signal<FilterOptions>({
    accountName: 'all',
    fund: 'all',
    entity: 'all',
    year: 'all',
    jurisdiction: 'all',
    subFund: 'all',
  });

  constructor() {
    // Effect to update charts when tab changes
    effect(() => {
      if (this.activeTab() === 'multicountry') {
        setTimeout(() => this.initCharts(), 100);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.activeTab() === 'multicountry') {
      this.initCharts();
    }
  }

  // Dashboard KPI Data
  readonly dashboardKpis = computed<KpiCard[]>(() => [
    {
      label: 'Commercial Result',
      value: -127620000,
      formatted: '-127.62M',
      trend: 'down',
      trendValue: '-12.3%',
      color: 'red',
    },
    {
      label: 'Corporate Taxes',
      value: 164050,
      formatted: '164.05K',
      trend: 'up',
      trendValue: '+8.2%',
      color: 'blue',
    },
    {
      label: 'Net Wealth Tax',
      value: 44941,
      formatted: '44.94K',
      trend: 'neutral',
      color: 'purple',
    },
    {
      label: 'Total Tax Losses',
      value: 356910000,
      formatted: '356.91M',
      trend: 'up',
      trendValue: '+5.1%',
      color: 'orange',
    },
    {
      label: 'Total Recapture',
      value: 558980000,
      formatted: '558.98M',
      trend: 'down',
      trendValue: '-3.4%',
      color: 'green',
    },
    {
      label: 'Taxable Result',
      value: 66790000,
      formatted: '66.79M',
      trend: 'up',
      trendValue: '+15.7%',
      color: 'gray',
    },
  ]);

  // Multicountry KPIs
  readonly multicountryKpis = computed<KpiCard[]>(() => [
    {
      label: 'Tax Loss Carry Forward',
      value: -796090000,
      formatted: '-796.09M',
      color: 'red',
    },
    {
      label: 'Tax Base',
      value: 136700000,
      formatted: '136.7M',
      color: 'yellow',
    },
    {
      label: 'Statutory Profit',
      value: -179830000,
      formatted: '-179.83M',
      color: 'gray',
    },
    {
      label: 'International Allocation',
      value: -135830000,
      formatted: '-135.83M',
      color: 'blue',
    },
  ]);

  // Use computed to switch between KPIs based on active tab
  readonly kpis = computed(() =>
    this.activeTab() === 'multicountry' ? this.multicountryKpis() : this.dashboardKpis()
  );

  // Entity Tax Data (Dashboard)
  readonly taxData = signal<EntityTaxData[]>([
    {
      id: '1',
      entity: 'Demo 100 London Street Real Estate',
      year: 2025,
      currency: 'GBP',
      taxConso: 'Consolidated Company',
      commercialResult: -171713.26,
      taxBalanceSheetResult: 0,
      taxableResultBeforeTLCF: -166813.00,
      taxableResultAfterTLCF: 0,
      participationIncome: 0,
    },
    {
      id: '2',
      entity: 'Demo 200 London Street Real Estate',
      year: 2025,
      currency: 'EUR',
      taxConso: 'Consolidated Company',
      commercialResult: 0,
      taxBalanceSheetResult: 17045712.22,
      taxableResultBeforeTLCF: -3952782.00,
      taxableResultAfterTLCF: 0,
      participationIncome: 21001309.02,
    },
    {
      id: '3',
      entity: 'Demo German Real Estate Holding S.à r.l.',
      year: 2025,
      currency: 'GBP',
      taxConso: 'Consolidating parent',
      commercialResult: -66201639.71,
      taxBalanceSheetResult: 0,
      taxableResultBeforeTLCF: -66211254.00,
      taxableResultAfterTLCF: 66357949.66,
      participationIncome: 0,
    },
    {
      id: '4',
      entity: 'Demo Joint Venture S.à r.l.',
      year: 2025,
      currency: 'GBP',
      taxConso: 'Consolidated Company',
      commercialResult: -41192.53,
      taxBalanceSheetResult: 0,
      taxableResultBeforeTLCF: -41189.00,
      taxableResultAfterTLCF: 0,
      participationIncome: 0,
    },
    {
      id: '5',
      entity: 'Demo Lux Holding Real Estate S.à r.l.',
      year: 2025,
      currency: 'GBP',
      taxConso: 'Consolidated Company',
      commercialResult: 0,
      taxBalanceSheetResult: 63173680.92,
      taxableResultBeforeTLCF: 66131562.00,
      taxableResultAfterTLCF: 66131561.61,
      participationIncome: 0,
    },
    {
      id: '6',
      entity: 'Demo UK Real Estate Holding S.à r.l.',
      year: 2025,
      currency: 'EUR',
      taxConso: 'Consolidating parent',
      commercialResult: 4172349.71,
      taxBalanceSheetResult: 0,
      taxableResultBeforeTLCF: 4189165.00,
      taxableResultAfterTLCF: 0,
      participationIncome: 0,
    },
  ]);

  // Multicountry Data
  readonly multiCountryData = signal<MultiCountryData[]>([
    {
      id: '1',
      entity: 'Entity 101 S.à r.l.',
      subFund: '2020',
      year: 2020,
      taxBase: 23893906.62,
      taxDeductibleDepreciationPY: 1439460.00,
      taxDeductibleDepreciationCY: 1115400.00,
      taxLossCarryForward: -68591457.27,
      interestExpenseFromStatutory: 3784908.00,
      statutoryProfit: -18189134.78,
      participationExemption: 41807576.00,
      internationalAllocation: 0.00,
      debtToEquityRatio: 0.00,
      dividendOrCapital: 0.21,
    },
    {
      id: '2',
      entity: 'Entity 101 S.à r.l.',
      subFund: '2021',
      year: 2021,
      taxBase: 18907401.23,
      taxDeductibleDepreciationPY: 0,
      taxDeductibleDepreciationCY: 0,
      taxLossCarryForward: -48533406.72,
      interestExpenseFromStatutory: 0,
      statutoryProfit: -13056276.61,
      participationExemption: 29586250.00,
      internationalAllocation: 0.00,
      debtToEquityRatio: 0.00,
      dividendOrCapital: 0.00,
    },
    {
      id: '3',
      entity: 'Entity 102 S.à r.l.',
      subFund: '2020',
      year: 2020,
      taxBase: 12437542.00,
      taxDeductibleDepreciationPY: 0,
      taxDeductibleDepreciationCY: -450000.00,
      taxLossCarryForward: 0,
      interestExpenseFromStatutory: 0,
      statutoryProfit: 12579362.00,
      participationExemption: 0.00,
      internationalAllocation: 0.05,
      debtToEquityRatio: 0.00,
      dividendOrCapital: 0.00,
    },
    {
      id: '4',
      entity: 'Entity 103 S.à r.l.',
      subFund: '2021',
      year: 2021,
      taxBase: 33006.00,
      taxDeductibleDepreciationPY: 0,
      taxDeductibleDepreciationCY: -254697.00,
      taxLossCarryForward: 0,
      interestExpenseFromStatutory: 0,
      statutoryProfit: -4344.00,
      participationExemption: 0.00,
      internationalAllocation: 0.00,
      debtToEquityRatio: 0.00,
      dividendOrCapital: 0.00,
    },
    {
      id: '5',
      entity: 'Entity 103',
      subFund: '2021',
      year: 2021,
      taxBase: 41957.47,
      taxDeductibleDepreciationPY: 0,
      taxDeductibleDepreciationCY: 0,
      taxLossCarryForward: 0.00,
      interestExpenseFromStatutory: 0,
      statutoryProfit: -8302274.00,
      participationExemption: 0.00,
      internationalAllocation: 0.00,
      debtToEquityRatio: 0.00,
      dividendOrCapital: 0.00,
    },
    {
      id: '6',
      entity: 'Entity 104 SAS',
      subFund: '2021',
      year: 2021,
      taxBase: 47534.51,
      taxDeductibleDepreciationPY: 1800000.00,
      taxDeductibleDepreciationCY: 1602000.00,
      taxLossCarryForward: 71128.57,
      interestExpenseFromStatutory: 4500000.00,
      statutoryProfit: -1391707.10,
      participationExemption: 0.00,
      internationalAllocation: -1214182.51,
      debtToEquityRatio: 17.32,
      dividendOrCapital: 10000000.00,
    },
  ]);

  // Filtered data
  readonly filteredData = computed(() => {
    const data = this.taxData();
    const f = this.filters();

    return data.filter(row => {
      if (f.entity !== 'all' && !row.entity.toLowerCase().includes(f.entity.toLowerCase())) {
        return false;
      }
      if (f.year !== 'all' && row.year.toString() !== f.year) {
        return false;
      }
      return true;
    });
  });

  // Filtered multicountry data
  readonly filteredMultiCountryData = computed(() => {
    const data = this.multiCountryData();
    const f = this.filters();

    return data.filter(row => {
      if (f.entity !== 'all' && !row.entity.toLowerCase().includes(f.entity.toLowerCase())) {
        return false;
      }
      if (f.year !== 'all' && row.year.toString() !== f.year) {
        return false;
      }
      if (f.subFund !== 'all' && row.subFund !== f.subFund) {
        return false;
      }
      return true;
    });
  });

  // Multicountry totals
  readonly multiCountryTotals = computed(() => {
    const data = this.filteredMultiCountryData();
    return {
      taxBase: data.reduce((sum, row) => sum + row.taxBase, 0),
      taxDeductibleDepreciationPY: data.reduce((sum, row) => sum + row.taxDeductibleDepreciationPY, 0),
      taxDeductibleDepreciationCY: data.reduce((sum, row) => sum + row.taxDeductibleDepreciationCY, 0),
      taxLossCarryForward: data.reduce((sum, row) => sum + row.taxLossCarryForward, 0),
      interestExpenseFromStatutory: data.reduce((sum, row) => sum + row.interestExpenseFromStatutory, 0),
      statutoryProfit: data.reduce((sum, row) => sum + row.statutoryProfit, 0),
      participationExemption: data.reduce((sum, row) => sum + row.participationExemption, 0),
      internationalAllocation: data.reduce((sum, row) => sum + row.internationalAllocation, 0),
      debtToEquityRatio: data.reduce((sum, row) => sum + row.debtToEquityRatio, 0),
      dividendOrCapital: data.reduce((sum, row) => sum + row.dividendOrCapital, 0),
    };
  });

  // Totals
  readonly totals = computed(() => {
    const data = this.filteredData();
    return {
      commercialResult: data.reduce((sum, row) => sum + row.commercialResult, 0),
      taxBalanceSheetResult: data.reduce((sum, row) => sum + row.taxBalanceSheetResult, 0),
      taxableResultBeforeTLCF: data.reduce((sum, row) => sum + row.taxableResultBeforeTLCF, 0),
      taxableResultAfterTLCF: data.reduce((sum, row) => sum + row.taxableResultAfterTLCF, 0),
      participationIncome: data.reduce((sum, row) => sum + row.participationIncome, 0),
    };
  });

  // Available filter options
  readonly accountOptions = ['all', 'Demo Account', 'Main Account'];
  readonly fundOptions = ['all', 'Fund A', 'Fund B', 'Fund C'];
  readonly jurisdictionOptions = ['all', 'Luxembourg', 'Germany', 'France', 'UK'];
  readonly subFundOptions = ['all', '2020', '2021', '2022'];
  readonly entityOptions = computed(() => {
    const entities = this.taxData().map(d => d.entity);
    return ['all', ...new Set(entities)];
  });
  readonly multiCountryEntityOptions = computed(() => {
    const entities = this.multiCountryData().map(d => d.entity);
    return ['all', ...new Set(entities)];
  });
  readonly yearOptions = ['all', '2025', '2024', '2023', '2022', '2021', '2020'];

  setTab(tab: InsightTab): void {
    this.activeTab.set(tab);
  }

  setView(view: InsightView): void {
    this.activeView.set(view);
  }

  selectEntity(id: string): void {
    this.selectedEntityId.set(this.selectedEntityId() === id ? null : id);
  }

  updateFilter(key: keyof FilterOptions, value: string): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  formatCurrency(value: number): string {
    if (value === 0) return '0.00';

    const absValue = Math.abs(value);
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absValue);

    return value < 0 ? `(${formatted})` : formatted;
  }

  formatCompact(value: number): string {
    if (value === 0) return '0';

    const absValue = Math.abs(value);
    let formatted: string;

    if (absValue >= 1000000) {
      formatted = (absValue / 1000000).toFixed(1) + 'M';
    } else if (absValue >= 1000) {
      formatted = (absValue / 1000).toFixed(1) + 'K';
    } else {
      formatted = absValue.toFixed(0);
    }

    return value < 0 ? `-${formatted}` : formatted;
  }

  getCurrencyFlag(currency: string): string {
    const flags: Record<string, string> = {
      EUR: '🇪🇺',
      GBP: '🇬🇧',
      USD: '🇺🇸',
    };
    return flags[currency] || '💱';
  }

  exportData(): void {
    console.log('Exporting data...', this.filteredData());
    alert('Export functionality - CSV download would trigger here');
  }

  private initCharts(): void {
    this.initTaxBaseChart();
    this.initCorporateTaxChart();
  }

  private initTaxBaseChart(): void {
    if (!this.taxBaseChartRef?.nativeElement) return;

    if (this.taxBaseChart) {
      this.taxBaseChart.destroy();
    }

    const ctx = this.taxBaseChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.taxBaseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['2020', '2021', '2022'],
        datasets: [
          {
            label: 'Statutory Profit',
            data: [97000000, 67000000, 21000000],
            backgroundColor: '#6B7280',
            borderRadius: 4,
            barPercentage: 0.6,
          },
          {
            label: 'Tax Base',
            data: [-121000000, -83000000, -27000000],
            backgroundColor: '#EAB308',
            borderRadius: 4,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { size: 11, family: "'Inter', sans-serif" },
            },
          },
          tooltip: {
            backgroundColor: '#1f2937',
            titleFont: { size: 12, family: "'Inter', sans-serif" },
            bodyFont: { size: 11, family: "'Inter', sans-serif" },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `${context.dataset.label}: ${this.formatCompact(value)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 11, family: "'Inter', sans-serif" },
              color: '#6B7280',
            },
          },
          y: {
            grid: { color: '#f3f4f6' },
            ticks: {
              font: { size: 10, family: "'Inter', sans-serif" },
              color: '#6B7280',
              callback: (value) => this.formatCompact(value as number),
            },
          },
        },
      },
    });
  }

  private initCorporateTaxChart(): void {
    if (!this.corporateTaxChartRef?.nativeElement) return;

    if (this.corporateTaxChart) {
      this.corporateTaxChart.destroy();
    }

    const ctx = this.corporateTaxChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.corporateTaxChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['2020', '2021', '2022'],
        datasets: [
          {
            label: 'Total Tax Provision',
            data: [-40000000, 3000000, 2000000],
            backgroundColor: '#EAB308',
            borderRadius: 4,
            barPercentage: 0.6,
          },
          {
            label: 'Estimated Total Tax Amount Due',
            data: [0, 0, 0],
            backgroundColor: '#6B7280',
            borderRadius: 4,
            barPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { size: 11, family: "'Inter', sans-serif" },
            },
          },
          tooltip: {
            backgroundColor: '#1f2937',
            titleFont: { size: 12, family: "'Inter', sans-serif" },
            bodyFont: { size: 11, family: "'Inter', sans-serif" },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                return `${context.dataset.label}: ${this.formatCompact(value)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 11, family: "'Inter', sans-serif" },
              color: '#6B7280',
            },
          },
          y: {
            grid: { color: '#f3f4f6' },
            ticks: {
              font: { size: 10, family: "'Inter', sans-serif" },
              color: '#6B7280',
              callback: (value) => this.formatCompact(value as number),
            },
          },
        },
      },
    });
  }
}
