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
  HostListener,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  TrendingUp,
  TrendingDown,
  Building2,
  Filter,
  Download,
  ChevronDown,
  Maximize2,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-angular';
import { Chart, registerables } from 'chart.js';
import { CurrencyEyPipe } from '../../../../shared/pipes/currency-ey.pipe';
import { CitApprovalModalComponent } from '../../../../shared/components/cit-approval-modal/cit-approval-modal.component';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import {
  CHART_INIT_DELAY_SLOW_MS,
  CHART_INIT_DELAY_MEDIUM_MS,
  ANIMATION_DURATION_MS,
} from '../../../../core/constants';

Chart.register(...registerables);

export type InsightSection = 'overview' | 'entities' | 'multicountry';
export type EntityViewMode = 'cards' | 'table';

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
  // CTR Review Dashboard columns
  fund?: string;
  currency?: 'EUR' | 'GBP' | 'USD';
  taxMemo?: string;
  ipMemo?: string;
  taxConso?: string;
  commercialResult?: number;
  taxBalanceSheetResult?: number;
  netWorthTax?: number;
  saInv?: number;
  totalTaxLosses?: number;
  ftaYear?: number;
  recapture?: number;
  sbaMemo?: string;
  taxableResultBeforeTLCF?: number;
  taxableResultAfterTLCF?: number;
  participationIncome?: number;
  qsfuParts?: number;
  // CIT Upload status - determines if approval is possible
  citStatus: 'completed' | 'in-progress';
  // Approval state
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalComment?: string;
  approvedAt?: string;
}

export interface FilterOptions {
  accountName: string;
  fund: string;
  entity: string;
  year: string;
  country: string;
  subFund: string;
}

@Component({
  selector: 'app-service-insights',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CurrencyEyPipe,
    CitApprovalModalComponent,
  ],
  templateUrl: './service-insights.component.html',
  styleUrl: './service-insights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceInsightsComponent implements AfterViewInit, OnInit {
  private readonly toastService = inject(ToastService);

  @Input() serviceId: string | null = null;

  @ViewChild('taxBaseChart') taxBaseChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('corporateTaxChart') corporateTaxChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sectionOverview') sectionOverviewRef!: ElementRef<HTMLElement>;
  @ViewChild('sectionEntities') sectionEntitiesRef!: ElementRef<HTMLElement>;
  @ViewChild('sectionMulticountry') sectionMulticountryRef!: ElementRef<HTMLElement>;

  private taxBaseChart: Chart | null = null;
  private corporateTaxChart: Chart | null = null;

  readonly icons = {
    trendingUp: TrendingUp,
    trendingDown: TrendingDown,
    building: Building2,
    filter: Filter,
    download: Download,
    chevronDown: ChevronDown,
    maximize2: Maximize2,
    eye: Eye,
    checkCircle: CheckCircle,
    xCircle: XCircle,
  };

  // Section-based navigation (no more tabs)
  activeSection = signal<InsightSection>('overview');
  entityViewMode = signal<EntityViewMode>('table');
  selectedEntityId = signal<string | null>(null);

  filters = signal<FilterOptions>({
    accountName: 'all',
    fund: 'all',
    entity: 'all',
    year: 'all',
    country: 'all',
    subFund: 'all',
  });

  // Multicountry-specific filters (dark theme bar)
  mcFilters = signal<{
    year: string;
    country: string;
    searchEntity: string;
    subFund: string;
    citCompleted: boolean;
  }>({
    year: '',
    country: '',
    searchEntity: '', // Autocomplete search for entity
    subFund: '',
    citCompleted: false, // Filter for CIT Completed only
  });

  // Entity search autocomplete
  readonly entitySearchFocused = signal(false);

  // CIT Approval Modal state
  readonly showCitModal = signal(false);
  readonly citModalMode = signal<'preview' | 'table-expand' | 'bulk-approval'>('preview');
  readonly selectedEntityForApproval = signal<MultiCountryData | null>(null);
  readonly selectedEntitiesForBulkApproval = signal<MultiCountryData[]>([]);

  // Checkbox selection for bulk approval
  readonly selectedEntityIds = signal<Set<string>>(new Set());

  constructor() {
    // Effect to initialize charts after view is ready
    effect(() => {
      // Charts are always visible now (single page), init on load
      setTimeout(() => this.initCharts(), CHART_INIT_DELAY_SLOW_MS);
    });
  }

  ngOnInit(): void {
    // Auto-select first entity in multicountry on load
    setTimeout(() => {
      const data = this.filteredMultiCountryData();
      if (data.length > 0 && !this.selectedEntityId()) {
        this.selectedEntityId.set(data[0].id);
      }
    }, 100);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), CHART_INIT_DELAY_MEDIUM_MS);
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    this.updateActiveSectionOnScroll();
  }

  // Dashboard KPI Data
  readonly dashboardKpis = computed<KpiCard[]>(() => [
    {
      label: 'Commercial Result',
      value: -127620000,
      formatted: '-127.62M €',
      trend: 'down',
      trendValue: '-12.3%',
      color: 'red',
    },
    {
      label: 'Corporate Taxes',
      value: 164050,
      formatted: '164.05K €',
      trend: 'up',
      trendValue: '+8.2%',
      color: 'blue',
    },
    {
      label: 'Net Wealth Tax',
      value: 44941,
      formatted: '44.94K €',
      trend: 'neutral',
      color: 'purple',
    },
    {
      label: 'Total Tax Losses',
      value: 356910000,
      formatted: '356.91M €',
      trend: 'up',
      trendValue: '+5.1%',
      color: 'orange',
    },
    {
      label: 'Total Recapture',
      value: 558980000,
      formatted: '558.98M €',
      trend: 'down',
      trendValue: '-3.4%',
      color: 'green',
    },
    {
      label: 'Taxable Result',
      value: 66790000,
      formatted: '66.79M €',
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
      formatted: '-796.09M €',
      color: 'red',
    },
    {
      label: 'Tax Base',
      value: 136700000,
      formatted: '136.70M €',
      color: 'yellow',
    },
    {
      label: 'Statutory Profit',
      value: -179830000,
      formatted: '-179.83M €',
      color: 'gray',
    },
    {
      label: 'International Allocation',
      value: -135830000,
      formatted: '-135.83M €',
      color: 'blue',
    },
  ]);

  // Merged KPIs for the overview section (key metrics from both datasets)
  readonly mergedKpis = computed<KpiCard[]>(() => [
    // From Dashboard
    {
      label: 'Commercial Result',
      value: -127620000,
      formatted: '-127.62M €',
      trend: 'down' as const,
      trendValue: '-12.3%',
      color: 'red' as const,
    },
    {
      label: 'Corporate Taxes',
      value: 164050,
      formatted: '164.05K €',
      trend: 'up' as const,
      trendValue: '+8.2%',
      color: 'yellow' as const,
    },
    {
      label: 'Tax Base',
      value: 136700000,
      formatted: '136.70M €',
      color: 'yellow' as const,
    },
    {
      label: 'Statutory Profit',
      value: -179830000,
      formatted: '-179.83M €',
      color: 'gray' as const,
    },
    {
      label: 'Total Tax Losses',
      value: 356910000,
      formatted: '356.91M €',
      trend: 'up' as const,
      trendValue: '+5.1%',
      color: 'gray' as const,
    },
    {
      label: 'Taxable Result',
      value: 66790000,
      formatted: '66.79M €',
      trend: 'up' as const,
      trendValue: '+15.7%',
      color: 'gray' as const,
    },
  ]);

  // Entity Tax Data (Dashboard) - Matches the 8 CIT entities from service
  readonly taxData = signal<EntityTaxData[]>([
    {
      id: 'fr-sci',
      entity: 'CCP 5 Paris Office SPV',
      year: 2025,
      currency: 'EUR',
      taxConso: 'Consolidated Company',
      commercialResult: -171713.26,
      taxBalanceSheetResult: 0,
      taxableResultBeforeTLCF: -166813.0,
      taxableResultAfterTLCF: 0,
      participationIncome: 0,
    },
    {
      id: 'de-gmbh',
      entity: 'CCP 5 Munich Logistics PropCo',
      year: 2025,
      currency: 'EUR',
      taxConso: 'Consolidated Company',
      commercialResult: 0,
      taxBalanceSheetResult: 17045712.22,
      taxableResultBeforeTLCF: -3952782.0,
      taxableResultAfterTLCF: 0,
      participationIncome: 21001309.02,
    },
    {
      id: 'nl-bv',
      entity: 'CCP 5 Amsterdam Retail BV',
      year: 2025,
      currency: 'EUR',
      taxConso: 'Consolidated Company',
      commercialResult: -66201639.71,
      taxBalanceSheetResult: 0,
      taxableResultBeforeTLCF: -66211254.0,
      taxableResultAfterTLCF: 66357949.66,
      participationIncome: 0,
    },
    {
      id: 'lu-sarl',
      entity: 'EPISO 6 Luxembourg HoldCo',
      year: 2024,
      currency: 'EUR',
      taxConso: 'Consolidating parent',
      commercialResult: -41192.53,
      taxBalanceSheetResult: 0,
      taxableResultBeforeTLCF: -41189.0,
      taxableResultAfterTLCF: 0,
      participationIncome: 0,
    },
    {
      id: 'es-sl',
      entity: 'EPISO 6 Madrid Residential SL',
      year: 2024,
      currency: 'EUR',
      taxConso: 'Consolidated Company',
      commercialResult: 0,
      taxBalanceSheetResult: 63173680.92,
      taxableResultBeforeTLCF: 66131562.0,
      taxableResultAfterTLCF: 66131561.61,
      participationIncome: 0,
    },
    {
      id: 'fr-sci-2024',
      entity: 'CCP 5 Lyon Industrial SPV',
      year: 2024,
      currency: 'EUR',
      taxConso: 'Consolidated Company',
      commercialResult: 4172349.71,
      taxBalanceSheetResult: 0,
      taxableResultBeforeTLCF: 4189165.0,
      taxableResultAfterTLCF: 0,
      participationIncome: 0,
    },
    {
      id: 'it-srl',
      entity: 'EPISO 6 Milan Commercial SRL',
      year: 2025,
      currency: 'EUR',
      taxConso: 'Consolidated Company',
      commercialResult: -1391707.1,
      taxBalanceSheetResult: 0,
      taxableResultBeforeTLCF: 47534.51,
      taxableResultAfterTLCF: 0,
      participationIncome: 0,
    },
    {
      id: 'be-sa',
      entity: 'REIF Brussels Office SA',
      year: 2025,
      currency: 'EUR',
      taxConso: 'Consolidating parent',
      commercialResult: 12579362.0,
      taxBalanceSheetResult: 12437542.0,
      taxableResultBeforeTLCF: 12437542.0,
      taxableResultAfterTLCF: 12437542.0,
      participationIncome: 0,
    },
  ]);

  // Multicountry Data - Same 8 entities as CIT service, matching their statuses
  // citStatus based on entity status: completed/reviewing = 'completed', in-progress/not-started = 'in-progress'
  readonly multiCountryData = signal<MultiCountryData[]>([
    {
      id: 'fr-sci',
      entity: 'CCP 5 Paris Office SPV',
      subFund: 'CCP5',
      year: 2025,
      taxBase: 0,
      taxDeductibleDepreciationPY: 0,
      taxDeductibleDepreciationCY: 0,
      taxLossCarryForward: -166813.0,
      interestExpenseFromStatutory: 0,
      statutoryProfit: -171713.26,
      participationExemption: 0,
      internationalAllocation: 0,
      debtToEquityRatio: 0,
      dividendOrCapital: 0,
      fund: 'CCP 5',
      currency: 'EUR',
      taxMemo: 'In Progress',
      ipMemo: 'N/A',
      taxConso: 'Consolidated Company',
      commercialResult: -171713.26,
      taxBalanceSheetResult: 0,
      netWorthTax: 0,
      saInv: 0,
      totalTaxLosses: 166813.0,
      ftaYear: 2024,
      recapture: 0,
      sbaMemo: 'Pending',
      taxableResultBeforeTLCF: -166813.0,
      taxableResultAfterTLCF: 0,
      participationIncome: 0,
      qsfuParts: 0,
      citStatus: 'in-progress', // Entity status: in-progress
      approvalStatus: 'pending',
    },
    {
      id: 'de-gmbh',
      entity: 'CCP 5 Munich Logistics PropCo',
      subFund: 'CCP5',
      year: 2025,
      taxBase: 17045712.22,
      taxDeductibleDepreciationPY: 0,
      taxDeductibleDepreciationCY: 0,
      taxLossCarryForward: 0,
      interestExpenseFromStatutory: 0,
      statutoryProfit: 0,
      participationExemption: 21001309.02,
      internationalAllocation: 0,
      debtToEquityRatio: 0,
      dividendOrCapital: 0,
      fund: 'CCP 5',
      currency: 'EUR',
      taxMemo: 'Completed',
      ipMemo: 'Reviewed',
      taxConso: 'Consolidated Company',
      commercialResult: 0,
      taxBalanceSheetResult: 17045712.22,
      netWorthTax: 24680.0,
      saInv: 150000.0,
      totalTaxLosses: 0,
      ftaYear: 2024,
      recapture: 0,
      sbaMemo: 'Reviewed',
      taxableResultBeforeTLCF: -3952782.0,
      taxableResultAfterTLCF: 0,
      participationIncome: 21001309.02,
      qsfuParts: 0,
      citStatus: 'completed', // Entity status: reviewing - CIT ready
      approvalStatus: 'pending',
    },
    {
      id: 'nl-bv',
      entity: 'CCP 5 Amsterdam Retail BV',
      subFund: 'CCP5',
      year: 2025,
      taxBase: 66357949.66,
      taxDeductibleDepreciationPY: 1439460.0,
      taxDeductibleDepreciationCY: 1115400.0,
      taxLossCarryForward: -66211254.0,
      interestExpenseFromStatutory: 3784908.0,
      statutoryProfit: -66201639.71,
      participationExemption: 0,
      internationalAllocation: 0,
      debtToEquityRatio: 0,
      dividendOrCapital: 0.21,
      fund: 'CCP 5',
      currency: 'EUR',
      taxMemo: 'Completed',
      ipMemo: 'Approved',
      taxConso: 'Consolidated Company',
      commercialResult: -66201639.71,
      taxBalanceSheetResult: 0,
      netWorthTax: 12450.0,
      saInv: 0,
      totalTaxLosses: 66211254.0,
      ftaYear: 2024,
      recapture: 0,
      sbaMemo: 'Completed',
      taxableResultBeforeTLCF: -66211254.0,
      taxableResultAfterTLCF: 66357949.66,
      participationIncome: 0,
      qsfuParts: 1500,
      citStatus: 'completed', // Entity status: completed - CIT ready
      approvalStatus: 'approved',
      approvalComment: 'Reviewed and approved by Sophie Martin',
      approvedAt: '2026-01-21T10:30:00Z',
    },
    {
      id: 'lu-sarl',
      entity: 'EPISO 6 Luxembourg HoldCo',
      subFund: 'EPISO6',
      year: 2024,
      taxBase: 0,
      taxDeductibleDepreciationPY: 0,
      taxDeductibleDepreciationCY: 0,
      taxLossCarryForward: -41189.0,
      interestExpenseFromStatutory: 0,
      statutoryProfit: -41192.53,
      participationExemption: 0,
      internationalAllocation: 0,
      debtToEquityRatio: 0,
      dividendOrCapital: 0,
      fund: 'EPISO 6',
      currency: 'EUR',
      taxMemo: 'In Progress',
      ipMemo: 'N/A',
      taxConso: 'Consolidating parent',
      commercialResult: -41192.53,
      taxBalanceSheetResult: 0,
      netWorthTax: 0,
      saInv: 0,
      totalTaxLosses: 41189.0,
      ftaYear: 2024,
      recapture: 0,
      sbaMemo: 'Pending',
      taxableResultBeforeTLCF: -41189.0,
      taxableResultAfterTLCF: 0,
      participationIncome: 0,
      qsfuParts: 0,
      citStatus: 'in-progress', // Entity status: in-progress
      approvalStatus: 'pending',
    },
    {
      id: 'es-sl',
      entity: 'EPISO 6 Madrid Residential SL',
      subFund: 'EPISO6',
      year: 2024,
      taxBase: 66131561.61,
      taxDeductibleDepreciationPY: 1800000.0,
      taxDeductibleDepreciationCY: 1602000.0,
      taxLossCarryForward: 0,
      interestExpenseFromStatutory: 4500000.0,
      statutoryProfit: 0,
      participationExemption: 0,
      internationalAllocation: 0,
      debtToEquityRatio: 17.32,
      dividendOrCapital: 10000000.0,
      fund: 'EPISO 6',
      currency: 'EUR',
      taxMemo: 'Not Started',
      ipMemo: 'N/A',
      taxConso: 'Consolidated Company',
      commercialResult: 0,
      taxBalanceSheetResult: 63173680.92,
      netWorthTax: 8500.0,
      saInv: 250000.0,
      totalTaxLosses: 0,
      ftaYear: 2024,
      recapture: 125000.0,
      sbaMemo: 'N/A',
      taxableResultBeforeTLCF: 66131562.0,
      taxableResultAfterTLCF: 66131561.61,
      participationIncome: 0,
      qsfuParts: 0,
      citStatus: 'in-progress', // Entity status: not-started
      approvalStatus: 'pending',
    },
    {
      id: 'fr-sci-2024',
      entity: 'CCP 5 Lyon Industrial SPV',
      subFund: 'CCP5',
      year: 2024,
      taxBase: 4189165.0,
      taxDeductibleDepreciationPY: 0,
      taxDeductibleDepreciationCY: -254697.0,
      taxLossCarryForward: 0,
      interestExpenseFromStatutory: 0,
      statutoryProfit: 4172349.71,
      participationExemption: 0,
      internationalAllocation: 0,
      debtToEquityRatio: 0,
      dividendOrCapital: 0,
      fund: 'CCP 5',
      currency: 'EUR',
      taxMemo: 'Completed',
      ipMemo: 'Approved',
      taxConso: 'Consolidated Company',
      commercialResult: 4172349.71,
      taxBalanceSheetResult: 0,
      netWorthTax: 11200.0,
      saInv: 0,
      totalTaxLosses: 0,
      ftaYear: 2024,
      recapture: 0,
      sbaMemo: 'Completed',
      taxableResultBeforeTLCF: 4189165.0,
      taxableResultAfterTLCF: 0,
      participationIncome: 0,
      qsfuParts: 250,
      citStatus: 'completed', // Entity status: completed - CIT ready
      approvalStatus: 'approved',
      approvalComment: 'All documents verified',
      approvedAt: '2026-01-10T14:20:00Z',
    },
    {
      id: 'it-srl',
      entity: 'EPISO 6 Milan Commercial SRL',
      subFund: 'EPISO6',
      year: 2025,
      taxBase: 47534.51,
      taxDeductibleDepreciationPY: 0,
      taxDeductibleDepreciationCY: 0,
      taxLossCarryForward: 0,
      interestExpenseFromStatutory: 0,
      statutoryProfit: -1391707.1,
      participationExemption: 0,
      internationalAllocation: 0,
      debtToEquityRatio: 0,
      dividendOrCapital: 0,
      fund: 'EPISO 6',
      currency: 'EUR',
      taxMemo: 'In Progress',
      ipMemo: 'Pending',
      taxConso: 'Consolidated Company',
      commercialResult: -1391707.1,
      taxBalanceSheetResult: 0,
      netWorthTax: 0,
      saInv: 0,
      totalTaxLosses: 0,
      ftaYear: 2024,
      recapture: 0,
      sbaMemo: 'Pending',
      taxableResultBeforeTLCF: 47534.51,
      taxableResultAfterTLCF: 0,
      participationIncome: 0,
      qsfuParts: 0,
      citStatus: 'in-progress', // Entity status: in-progress
      approvalStatus: 'pending',
    },
    {
      id: 'be-sa',
      entity: 'REIF Brussels Office SA',
      subFund: 'REIF',
      year: 2025,
      taxBase: 12437542.0,
      taxDeductibleDepreciationPY: 0,
      taxDeductibleDepreciationCY: -450000.0,
      taxLossCarryForward: 0,
      interestExpenseFromStatutory: 0,
      statutoryProfit: 12579362.0,
      participationExemption: 0,
      internationalAllocation: 0.05,
      debtToEquityRatio: 0,
      dividendOrCapital: 0,
      fund: 'REIF',
      currency: 'EUR',
      taxMemo: 'Completed',
      ipMemo: 'Reviewed',
      taxConso: 'Consolidating parent',
      commercialResult: 12579362.0,
      taxBalanceSheetResult: 12437542.0,
      netWorthTax: 24680.0,
      saInv: 150000.0,
      totalTaxLosses: 0,
      ftaYear: 2024,
      recapture: 50000.0,
      sbaMemo: 'Reviewed',
      taxableResultBeforeTLCF: 12437542.0,
      taxableResultAfterTLCF: 12437542.0,
      participationIncome: 0,
      qsfuParts: 1500,
      citStatus: 'completed', // Entity status: reviewing - CIT ready
      approvalStatus: 'pending',
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

  // Filtered multicountry data (uses mcFilters - dark bar filters)
  readonly filteredMultiCountryData = computed(() => {
    const data = this.multiCountryData();
    const f = this.mcFilters();

    return data.filter(row => {
      // CIT Completed filter - only show entities with CIT uploaded
      if (f.citCompleted && row.citStatus !== 'completed') {
        return false;
      }
      // Year filter
      if (f.year && row.year.toString() !== f.year) {
        return false;
      }
      // Country filter (derived from entity name or jurisdiction)
      if (f.country) {
        const countryMatch = this.getCountryFromEntity(row.entity);
        if (countryMatch !== f.country) {
          return false;
        }
      }
      // Entity search filter (autocomplete)
      if (f.searchEntity && !row.entity.toLowerCase().includes(f.searchEntity.toLowerCase())) {
        return false;
      }
      // SubFund filter
      if (f.subFund && row.subFund !== f.subFund) {
        return false;
      }
      return true;
    });
  });

  // Helper to extract country from entity name
  private getCountryFromEntity(entityName: string): string {
    if (
      entityName.includes('Paris') ||
      entityName.includes('Lyon') ||
      entityName.includes('France')
    )
      return 'France';
    if (entityName.includes('Munich') || entityName.includes('Germany')) return 'Germany';
    if (entityName.includes('Amsterdam') || entityName.includes('Netherlands'))
      return 'Netherlands';
    if (entityName.includes('Luxembourg')) return 'Luxembourg';
    if (entityName.includes('Madrid') || entityName.includes('Spain')) return 'Spain';
    if (entityName.includes('Milan') || entityName.includes('Italy')) return 'Italy';
    if (entityName.includes('Brussels') || entityName.includes('Belgium')) return 'Belgium';
    return 'Other';
  }

  // Multicountry totals
  readonly multiCountryTotals = computed(() => {
    const data = this.filteredMultiCountryData();
    return {
      taxBase: data.reduce((sum, row) => sum + row.taxBase, 0),
      taxDeductibleDepreciationPY: data.reduce(
        (sum, row) => sum + row.taxDeductibleDepreciationPY,
        0
      ),
      taxDeductibleDepreciationCY: data.reduce(
        (sum, row) => sum + row.taxDeductibleDepreciationCY,
        0
      ),
      taxLossCarryForward: data.reduce((sum, row) => sum + row.taxLossCarryForward, 0),
      interestExpenseFromStatutory: data.reduce(
        (sum, row) => sum + row.interestExpenseFromStatutory,
        0
      ),
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
  readonly countryOptions = ['all', 'Luxembourg', 'Germany', 'France', 'UK'];
  readonly subFundOptions = ['all', '2020', '2021', '2022'];
  readonly entityOptions = computed(() => {
    const entities = this.taxData().map(d => d.entity);
    return ['all', ...new Set(entities)];
  });
  readonly multiCountryEntityOptions = computed(() => {
    const entities = this.multiCountryData().map(d => d.entity);
    return ['all', ...new Set(entities)];
  });
  // Combined entity options for global filter
  readonly allEntityOptions = computed(() => {
    const dashboardEntities = this.taxData().map(d => d.entity);
    const mcEntities = this.multiCountryData().map(d => d.entity);
    const all = [...dashboardEntities, ...mcEntities];
    return ['all', ...new Set(all)];
  });
  readonly yearOptions = ['all', '2025', '2024', '2023', '2022', '2021', '2020'];

  // Multicountry filter options (computed from data)
  readonly mcYearOptions = computed(() => {
    const years = new Set<number>();
    this.multiCountryData().forEach(d => years.add(d.year));
    return Array.from(years).sort((a, b) => b - a);
  });

  // Country options derived from entity names
  readonly mcCountryOptions = computed(() => {
    const countries = new Set<string>();
    this.multiCountryData().forEach(d => {
      countries.add(this.getCountryFromEntity(d.entity));
    });
    return Array.from(countries).sort();
  });

  readonly mcEntityOptions = computed(() => {
    const entities = new Set<string>();
    this.multiCountryData().forEach(d => entities.add(d.entity));
    return Array.from(entities).sort();
  });

  // Autocomplete suggestions based on search input
  readonly entityAutocompleteSuggestions = computed(() => {
    const search = this.mcFilters().searchEntity.toLowerCase();
    if (!search || search.length < 1) return [];

    return this.multiCountryData()
      .filter(d => d.entity.toLowerCase().includes(search))
      .map(d => d.entity)
      .slice(0, 5); // Limit to 5 suggestions
  });

  readonly mcSubFundOptions = computed(() => {
    const subFunds = new Set<string>();
    this.multiCountryData().forEach(d => subFunds.add(d.subFund));
    return Array.from(subFunds).sort();
  });

  readonly hasMcActiveFilters = computed(() => {
    const f = this.mcFilters();
    return (
      f.year !== '' ||
      f.country !== '' ||
      f.searchEntity !== '' ||
      f.subFund !== '' ||
      f.citCompleted
    );
  });

  // Section navigation methods
  scrollToSection(section: InsightSection): void {
    this.activeSection.set(section);
    const element = document.getElementById(`section-${section}`);
    if (element) {
      const headerOffset = 120; // Account for sticky nav
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }

  private updateActiveSectionOnScroll(): void {
    const sections: InsightSection[] = ['overview', 'entities', 'multicountry'];
    const headerOffset = 150;

    for (const section of sections.reverse()) {
      const element = document.getElementById(`section-${section}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= headerOffset) {
          this.activeSection.set(section);
          return;
        }
      }
    }
    this.activeSection.set('overview');
  }

  setEntityViewMode(mode: EntityViewMode): void {
    this.entityViewMode.set(mode);
  }

  selectEntity(id: string): void {
    this.selectedEntityId.set(id);
  }

  // Selected entity for detail panel (Multicountry)
  readonly selectedMultiCountryEntity = computed(() => {
    const id = this.selectedEntityId();
    const data = this.filteredMultiCountryData();
    if (!id && data.length > 0) {
      return data[0];
    }
    return data.find(d => d.id === id) || data[0] || null;
  });

  updateFilter(key: keyof FilterOptions, value: string): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  updateMcFilter(key: 'year' | 'country' | 'searchEntity' | 'subFund', value: string): void {
    this.mcFilters.update(f => ({ ...f, [key]: value }));
  }

  clearMcFilters(): void {
    this.mcFilters.set({
      year: '',
      country: '',
      searchEntity: '',
      subFund: '',
      citCompleted: false,
    });
    this.entitySearchFocused.set(false);
  }

  toggleCitCompletedFilter(): void {
    this.mcFilters.update(f => ({ ...f, citCompleted: !f.citCompleted }));
  }

  // Autocomplete methods
  selectEntityFromAutocomplete(entity: string): void {
    this.mcFilters.update(f => ({ ...f, searchEntity: entity }));
    this.entitySearchFocused.set(false);
  }

  onEntitySearchFocus(): void {
    this.entitySearchFocused.set(true);
  }

  onEntitySearchBlur(): void {
    // Delay to allow click on suggestion
    setTimeout(() => this.entitySearchFocused.set(false), ANIMATION_DURATION_MS);
  }

  // Used for chart tooltips (out of scope for pipe migration)
  formatCompact(value: number): string {
    if (value === 0) return '0 €';

    const absValue = Math.abs(value);
    let formatted: string;

    if (absValue >= 1000000) {
      formatted = (absValue / 1000000).toFixed(2) + 'M';
    } else if (absValue >= 1000) {
      formatted = (absValue / 1000).toFixed(2) + 'K';
    } else {
      formatted = absValue.toFixed(2);
    }

    return value < 0 ? `-${formatted} €` : `${formatted} €`;
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
    this.toastService.info('Export functionality - CSV download will be available soon');
  }

  // CIT Approval Modal methods
  openTableExpand(): void {
    this.citModalMode.set('table-expand');
    this.selectedEntityForApproval.set(this.selectedMultiCountryEntity());
    this.showCitModal.set(true);
  }

  openCitPreview(): void {
    this.citModalMode.set('preview');
    this.selectedEntityForApproval.set(this.selectedMultiCountryEntity());
    this.showCitModal.set(true);
  }

  openApprovalModal(): void {
    this.citModalMode.set('preview');
    this.selectedEntityForApproval.set(this.selectedMultiCountryEntity());
    this.showCitModal.set(true);
  }

  closeCitModal(): void {
    this.showCitModal.set(false);
    this.selectedEntityForApproval.set(null);
  }

  handleApprove(event: { entityId: string; comment: string }): void {
    // Update the entity's approval status in the data
    const data = this.multiCountryData();
    const updatedData = data.map(entity => {
      if (entity.id === event.entityId) {
        return {
          ...entity,
          approvalStatus: 'approved' as const,
          approvalComment: event.comment,
          approvedAt: new Date().toISOString(),
        };
      }
      return entity;
    });
    this.multiCountryData.set(updatedData);
    this.closeCitModal();
  }

  handleReject(event: { entityId: string; comment: string }): void {
    // Update the entity's approval status in the data
    const data = this.multiCountryData();
    const updatedData = data.map(entity => {
      if (entity.id === event.entityId) {
        return {
          ...entity,
          approvalStatus: 'rejected' as const,
          approvalComment: event.comment,
          approvedAt: new Date().toISOString(),
        };
      }
      return entity;
    });
    this.multiCountryData.set(updatedData);
    this.closeCitModal();
  }

  // Checkbox selection methods for bulk approval - ONLY CIT-ready entities can be selected
  toggleEntitySelection(entityId: string): void {
    // Find the entity to check if CIT is ready
    const entity = this.multiCountryData().find(e => e.id === entityId);
    if (!entity || entity.citStatus !== 'completed') {
      return; // Cannot select entities without CIT ready
    }

    const currentSet = new Set(this.selectedEntityIds());
    if (currentSet.has(entityId)) {
      currentSet.delete(entityId);
    } else {
      currentSet.add(entityId);
    }
    this.selectedEntityIds.set(currentSet);
  }

  isEntitySelected(entityId: string): boolean {
    return this.selectedEntityIds().has(entityId);
  }

  // Check if entity can be selected (CIT ready)
  canSelectEntity(entityId: string): boolean {
    const entity = this.multiCountryData().find(e => e.id === entityId);
    return entity?.citStatus === 'completed';
  }

  selectAllEntities(selectAll: boolean): void {
    if (selectAll) {
      // Only select CIT-ready entities
      const citReadyIds = new Set(
        this.filteredMultiCountryData()
          .filter(e => e.citStatus === 'completed')
          .map(e => e.id)
      );
      this.selectedEntityIds.set(citReadyIds);
    } else {
      this.selectedEntityIds.set(new Set());
    }
  }

  readonly selectedCount = computed(() => this.selectedEntityIds().size);

  // Count of CIT-ready entities in filtered data
  readonly citReadyCount = computed(
    () => this.filteredMultiCountryData().filter(e => e.citStatus === 'completed').length
  );

  readonly allSelected = computed(() => {
    const citReadyEntities = this.filteredMultiCountryData().filter(
      e => e.citStatus === 'completed'
    );
    return citReadyEntities.length > 0 && this.selectedEntityIds().size === citReadyEntities.length;
  });

  // Open modal for single entity view/approval
  openSingleEntityView(entity: MultiCountryData): void {
    this.citModalMode.set('preview');
    this.selectedEntityForApproval.set(entity);
    this.selectedEntitiesForBulkApproval.set([]);
    this.showCitModal.set(true);
  }

  openSingleEntityApproval(entity: MultiCountryData): void {
    this.citModalMode.set('preview');
    this.selectedEntityForApproval.set(entity);
    this.selectedEntitiesForBulkApproval.set([]);
    this.showCitModal.set(true);
  }

  // Bulk approval state
  readonly showBulkConfirmation = signal(false);
  readonly bulkApprovalCount = signal(0);

  // Open confirmation dialog for bulk approval (no modal preview)
  openBulkApprovalModal(): void {
    const selectedIds = this.selectedEntityIds();
    if (selectedIds.size === 0) {
      return; // No entities selected
    }

    // Filter only CIT-ready entities from selection
    const selectedEntities = this.filteredMultiCountryData().filter(
      e => selectedIds.has(e.id) && e.citStatus === 'completed'
    );

    if (selectedEntities.length === 0) {
      this.toastService.warning('No CIT-ready entities selected for approval.');
      return;
    }

    this.bulkApprovalCount.set(selectedEntities.length);
    this.showBulkConfirmation.set(true);
  }

  // Confirm bulk approval - directly approve all selected CIT-ready entities
  confirmBulkApproval(): void {
    const selectedIds = this.selectedEntityIds();
    const data = this.multiCountryData();

    const updatedData = data.map(entity => {
      if (selectedIds.has(entity.id) && entity.citStatus === 'completed') {
        return {
          ...entity,
          approvalStatus: 'approved' as const,
          approvalComment: 'Bulk approved',
          approvedAt: new Date().toISOString(),
        };
      }
      return entity;
    });

    this.multiCountryData.set(updatedData);
    this.selectedEntityIds.set(new Set()); // Clear selection after approval
    this.showBulkConfirmation.set(false);
  }

  // Cancel bulk approval
  cancelBulkApproval(): void {
    this.showBulkConfirmation.set(false);
  }

  // Handle bulk approval from modal (legacy - kept for compatibility)
  handleBulkApprove(event: { entityIds: string[]; comment: string }): void {
    const data = this.multiCountryData();
    const updatedData = data.map(entity => {
      if (event.entityIds.includes(entity.id)) {
        return {
          ...entity,
          approvalStatus: 'approved' as const,
          approvalComment: event.comment,
          approvedAt: new Date().toISOString(),
        };
      }
      return entity;
    });
    this.multiCountryData.set(updatedData);
    this.selectedEntityIds.set(new Set()); // Clear selection after approval
    this.closeCitModal();
  }

  // Get CSS class for memo badges
  getMemoClass(memo: string | undefined): string {
    if (!memo) return 'default';
    const lower = memo.toLowerCase();
    if (lower === 'completed' || lower === 'approved' || lower === 'reviewed') return 'completed';
    if (lower === 'pending' || lower === 'in progress' || lower === 'under review')
      return 'pending';
    if (lower === 'n/a') return 'na';
    return 'default';
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

    // EY Chart Color Palette
    const chartColors = {
      primary: '#FFE600', // EY Yellow
      secondary: '#6B7280', // Gray
      tertiary: '#2E2E38', // Dark
    };

    this.taxBaseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['2020', '2021', '2022'],
        datasets: [
          {
            label: 'Statutory Profit',
            data: [97000000, 67000000, 21000000],
            backgroundColor: chartColors.secondary,
            borderRadius: 4,
            barPercentage: 0.6,
          },
          {
            label: 'Tax Base',
            data: [-121000000, -83000000, -27000000],
            backgroundColor: chartColors.primary,
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
            display: false, // Use custom legend component per EY Design System
          },
          tooltip: {
            backgroundColor: '#2E2E38',
            titleFont: { size: 12, family: "'Inter', sans-serif" },
            bodyFont: { size: 11, family: "'Inter', sans-serif" },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: context => {
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
              callback: value => this.formatCompact(value as number),
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

    // EY Chart Color Palette
    const chartColors = {
      primary: '#FFE600', // EY Yellow
      secondary: '#6B7280', // Gray
      tertiary: '#2E2E38', // Dark
    };

    this.corporateTaxChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['2020', '2021', '2022'],
        datasets: [
          {
            label: 'Total Tax Provision',
            data: [-40000000, 3000000, 2000000],
            backgroundColor: chartColors.primary,
            borderRadius: 4,
            barPercentage: 0.6,
          },
          {
            label: 'Estimated Total Tax Amount Due',
            data: [0, 0, 0],
            backgroundColor: chartColors.secondary,
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
            display: false, // Use custom legend component per EY Design System
          },
          tooltip: {
            backgroundColor: '#2E2E38',
            titleFont: { size: 12, family: "'Inter', sans-serif" },
            bodyFont: { size: 11, family: "'Inter', sans-serif" },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: context => {
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
              callback: value => this.formatCompact(value as number),
            },
          },
        },
      },
    });
  }
}
