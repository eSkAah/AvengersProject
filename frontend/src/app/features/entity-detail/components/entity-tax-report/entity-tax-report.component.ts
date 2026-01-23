import { Component, input, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { LucideAngularModule, Calendar, Building2, FileText, Download, Printer, Check, X, Minus } from 'lucide-angular';
import { EntityTaxReport } from '../../../../core/models/entity.model';

@Component({
  selector: 'app-entity-tax-report',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DecimalPipe],
  templateUrl: './entity-tax-report.component.html',
  styleUrl: './entity-tax-report.component.scss',
})
export class EntityTaxReportComponent {
  readonly Math = Math; // Expose Math to template
  // Icons
  readonly Calendar = Calendar;
  readonly Building2 = Building2;
  readonly FileText = FileText;
  readonly Download = Download;
  readonly Printer = Printer;
  readonly Check = Check;
  readonly X = X;
  readonly Minus = Minus;

  taxReport = input<EntityTaxReport | undefined>();
  entityName = input.required<string>();

  hasReport = computed(() => !!this.taxReport());

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
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
