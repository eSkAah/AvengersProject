import {
  Component,
  ChangeDetectionStrategy,
  Input,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, TrendingUp, TrendingDown, Building2, Filter, Download, ChevronDown } from 'lucide-angular';
import { ServiceType } from '../../../../core/models/document.model';

export type InsightView = 'summary' | 'data';

export interface KpiCard {
  label: string;
  value: number;
  formatted: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray';
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

export interface FilterOptions {
  accountName: string;
  fund: string;
  entity: string;
  year: string;
}

@Component({
  selector: 'app-service-insights',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './service-insights.component.html',
  styleUrl: './service-insights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceInsightsComponent {
  @Input() serviceId: string | null = null;

  readonly icons = {
    trendingUp: TrendingUp,
    trendingDown: TrendingDown,
    building: Building2,
    filter: Filter,
    download: Download,
    chevronDown: ChevronDown,
  };

  activeView = signal<InsightView>('summary');
  selectedEntityId = signal<string | null>(null);

  filters = signal<FilterOptions>({
    accountName: 'all',
    fund: 'all',
    entity: 'all',
    year: '2025',
  });

  // KPI Data
  readonly kpis = computed<KpiCard[]>(() => [
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

  // Entity Tax Data (Multicountry)
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
  readonly entityOptions = computed(() => {
    const entities = this.taxData().map(d => d.entity);
    return ['all', ...new Set(entities)];
  });
  readonly yearOptions = ['all', '2025', '2024', '2023'];

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
}
