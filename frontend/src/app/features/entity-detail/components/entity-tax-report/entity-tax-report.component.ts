// =============================================================================
// Entity Tax Report Component - With Widget System
// =============================================================================

import { Component, input, computed, output, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDropList, CdkDragDrop, CdkDragHandle } from '@angular/cdk/drag-drop';
import {
  LucideAngularModule,
  Calendar,
  Building2,
  FileText,
  Download,
  Printer,
  Check,
  X,
  Minus,
  ChevronDown,
  Shield,
  GripVertical,
} from 'lucide-angular';
import { EntityTaxReport, TaxPeriodOption } from '../../../../core/models/entity.model';
import { CurrencyEyPipe } from '../../../../shared/pipes/currency-ey.pipe';
import {
  WidgetService,
  WidgetConfig,
  WidgetMenuComponent,
  WIDGET_CATEGORIES,
} from '../../../../shared/components/widget-system';

// Widget IDs
export const TAX_REPORT_WIDGETS = {
  ESTIMATED_TAX_CHARGE: 'estimated-tax-charge',
  TAX_BASE: 'tax-base',
  ADDITIONS_DEDUCTIONS: 'additions-deductions',
  CORPORATE_INCOME_TAX: 'corporate-income-tax',
  MUNICIPAL_BUSINESS_TAX: 'municipal-business-tax',
  NET_WORTH_TAX: 'net-worth-tax',
  TAX_LOSSES: 'tax-losses',
  TAX_ATTRIBUTES: 'tax-attributes',
  FINANCING_ACTIVITY: 'financing-activity',
  HOLDING_ACTIVITY: 'holding-activity',
  INTEREST_LIMITATION: 'interest-limitation',
  ATAD: 'atad',
} as const;

@Component({
  selector: 'app-entity-tax-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CurrencyEyPipe,
    CdkDrag,
    CdkDropList,
    CdkDragHandle,
    WidgetMenuComponent,
  ],
  templateUrl: './entity-tax-report.component.html',
  styleUrl: './entity-tax-report.component.scss',
})
export class EntityTaxReportComponent implements OnInit {
  private widgetService = inject(WidgetService);

  readonly Math = Math;
  readonly WIDGETS = TAX_REPORT_WIDGETS;

  // Icons
  readonly Calendar = Calendar;
  readonly Building2 = Building2;
  readonly FileText = FileText;
  readonly Download = Download;
  readonly Printer = Printer;
  readonly Check = Check;
  readonly X = X;
  readonly Minus = Minus;
  readonly ChevronDown = ChevronDown;
  readonly Shield = Shield;
  readonly GripVertical = GripVertical;

  // Inputs
  taxReport = input<EntityTaxReport | undefined>();
  entityName = input.required<string>();
  availablePeriods = input<TaxPeriodOption[]>([]);
  selectedYear = input<number | null>(null);

  // Outputs
  yearChange = output<number>();

  // Computed
  hasReport = computed(() => !!this.taxReport());
  hasMultiplePeriods = computed(() => this.availablePeriods().length > 1);

  // Widget state
  visibleWidgets = this.widgetService.visibleWidgets;
  allWidgetStates = this.widgetService.allWidgets;

  // Available widgets configuration
  readonly availableWidgets: WidgetConfig[] = [
    {
      id: TAX_REPORT_WIDGETS.ESTIMATED_TAX_CHARGE,
      name: 'Estimated Tax Charge',
      icon: 'calculator',
      description: 'Total tax summary with breakdown',
      defaultVisible: true,
      category: WIDGET_CATEGORIES.SUMMARY,
    },
    {
      id: TAX_REPORT_WIDGETS.TAX_BASE,
      name: 'Tax Base CIT/MBT',
      icon: 'file-text',
      description: 'Profit/Loss and tax base calculations',
      defaultVisible: true,
      category: WIDGET_CATEGORIES.SUMMARY,
    },
    {
      id: TAX_REPORT_WIDGETS.ADDITIONS_DEDUCTIONS,
      name: 'Additions & Deductions',
      icon: 'plus-minus',
      description: 'Tax adjustments',
      defaultVisible: true,
      category: WIDGET_CATEGORIES.SUMMARY,
    },
    {
      id: TAX_REPORT_WIDGETS.CORPORATE_INCOME_TAX,
      name: 'Corporate Income Tax',
      icon: 'building',
      description: 'CIT calculation details',
      defaultVisible: true,
      category: WIDGET_CATEGORIES.CALCULATIONS,
    },
    {
      id: TAX_REPORT_WIDGETS.MUNICIPAL_BUSINESS_TAX,
      name: 'Municipal Business Tax',
      icon: 'landmark',
      description: 'MBT calculation details',
      defaultVisible: true,
      category: WIDGET_CATEGORIES.CALCULATIONS,
    },
    {
      id: TAX_REPORT_WIDGETS.NET_WORTH_TAX,
      name: 'Net Worth Tax',
      icon: 'wallet',
      description: 'NWT calculations',
      defaultVisible: true,
      category: WIDGET_CATEGORIES.CALCULATIONS,
    },
    {
      id: TAX_REPORT_WIDGETS.TAX_LOSSES,
      name: 'Tax Losses Carried Forward',
      icon: 'trending-down',
      description: 'Loss carryforward tracking',
      defaultVisible: true,
      category: WIDGET_CATEGORIES.CALCULATIONS,
    },
    {
      id: TAX_REPORT_WIDGETS.TAX_ATTRIBUTES,
      name: 'Tax Attributes',
      icon: 'settings',
      description: 'Currency, agreements, establishment',
      defaultVisible: true,
      category: WIDGET_CATEGORIES.COMPLIANCE,
    },
    {
      id: TAX_REPORT_WIDGETS.FINANCING_ACTIVITY,
      name: 'Financing Activity',
      icon: 'banknote',
      description: 'Intercompany & transfer pricing',
      defaultVisible: true,
      category: WIDGET_CATEGORIES.COMPLIANCE,
    },
    {
      id: TAX_REPORT_WIDGETS.HOLDING_ACTIVITY,
      name: 'Holding Activity',
      icon: 'layers',
      description: 'Participations & partnerships',
      defaultVisible: true,
      category: WIDGET_CATEGORIES.COMPLIANCE,
    },
    {
      id: TAX_REPORT_WIDGETS.INTEREST_LIMITATION,
      name: 'Interest Limitation Rules',
      icon: 'percent',
      description: 'EBC and deductibility rules',
      defaultVisible: true,
      category: WIDGET_CATEGORIES.COMPLIANCE,
    },
    {
      id: TAX_REPORT_WIDGETS.ATAD,
      name: 'ATAD',
      icon: 'shield',
      description: 'Anti-tax avoidance directives',
      defaultVisible: true,
      category: WIDGET_CATEGORIES.COMPLIANCE,
    },
  ];

  constructor() {
    // Reinitialize widgets when entity changes
    effect(() => {
      const name = this.entityName();
      if (name) {
        this.widgetService.initializePage(`tax-report-${name}`, this.availableWidgets);
      }
    });
  }

  ngOnInit(): void {
    // Initial widget setup handled by effect
  }

  // Widget methods
  isWidgetVisible(widgetId: string): boolean {
    const state = this.allWidgetStates().find(w => w.id === widgetId);
    return state?.visible ?? true;
  }

  onToggleWidget(widgetId: string): void {
    this.widgetService.toggleWidget(widgetId);
  }

  onHideWidget(widgetId: string): void {
    this.widgetService.hideWidget(widgetId);
  }

  onResetWidgets(): void {
    this.widgetService.resetToDefaults();
  }

  getWidgetName(widgetId: string): string {
    const config = this.availableWidgets.find(w => w.id === widgetId);
    return config?.name ?? widgetId;
  }

  // Bento Grid sizes: 'large' (2 cols), 'wide' (2 cols short), 'medium' (1 col), 'small' (1 col compact)
  getWidgetSize(widgetId: string): string {
    const sizeMap: Record<string, string> = {
      [TAX_REPORT_WIDGETS.ESTIMATED_TAX_CHARGE]: 'large',
      [TAX_REPORT_WIDGETS.NET_WORTH_TAX]: 'wide',
      [TAX_REPORT_WIDGETS.TAX_BASE]: 'medium',
      [TAX_REPORT_WIDGETS.ADDITIONS_DEDUCTIONS]: 'medium',
      [TAX_REPORT_WIDGETS.CORPORATE_INCOME_TAX]: 'medium',
      [TAX_REPORT_WIDGETS.MUNICIPAL_BUSINESS_TAX]: 'medium',
      [TAX_REPORT_WIDGETS.TAX_LOSSES]: 'medium',
      [TAX_REPORT_WIDGETS.TAX_ATTRIBUTES]: 'small',
      [TAX_REPORT_WIDGETS.FINANCING_ACTIVITY]: 'small',
      [TAX_REPORT_WIDGETS.HOLDING_ACTIVITY]: 'small',
      [TAX_REPORT_WIDGETS.INTEREST_LIMITATION]: 'small',
      [TAX_REPORT_WIDGETS.ATAD]: 'small',
    };
    return sizeMap[widgetId] ?? 'medium';
  }

  onWidgetDrop(event: CdkDragDrop<string[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      this.widgetService.reorderWidgets(event.previousIndex, event.currentIndex);
    }
  }

  // Original methods
  onYearChange(event: Event): void {
    const year = Number((event.target as HTMLSelectElement).value);
    this.yearChange.emit(year);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getBooleanIcon(value: boolean | undefined) {
    if (value === undefined) return this.Minus;
    return value ? this.Check : this.X;
  }

  getBooleanClass(value: boolean | undefined): string {
    if (value === undefined) return 'na';
    return value ? 'yes' : 'no';
  }

  formatBoolean(value: boolean | string | undefined): string {
    if (value === undefined) return 'N/A';
    if (typeof value === 'string') return value.toUpperCase();
    return value ? 'Yes' : 'No';
  }
}
