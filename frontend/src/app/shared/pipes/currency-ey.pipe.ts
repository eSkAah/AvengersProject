import { Pipe, PipeTransform } from '@angular/core';

/**
 * CurrencyEyPipe - Formats numbers in EY style with € symbol
 *
 * Usage:
 *   {{ value | currencyEy }}           → "1,234.56 €"
 *   {{ value | currencyEy:'compact' }} → "356.91M €"
 *
 * Format: UK style (comma thousand separator, dot decimal, € suffix)
 */
@Pipe({
  name: 'currencyEy',
  standalone: true,
})
export class CurrencyEyPipe implements PipeTransform {
  transform(value: number | null | undefined, mode: 'full' | 'compact' = 'full'): string {
    if (value === null || value === undefined) {
      return '-';
    }

    if (value === 0) {
      return mode === 'compact' ? '0 €' : '0.00 €';
    }

    const isNegative = value < 0;
    const absValue = Math.abs(value);

    let formatted: string;

    if (mode === 'compact') {
      formatted = this.formatCompact(absValue);
    } else {
      formatted = this.formatFull(absValue);
    }

    // Apply negative formatting
    if (isNegative) {
      // Full mode: parentheses for negatives (accounting style)
      // Compact mode: minus prefix
      return mode === 'full' ? `(${formatted}) €` : `-${formatted} €`;
    }

    return `${formatted} €`;
  }

  private formatFull(value: number): string {
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatCompact(value: number): string {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(2) + 'B';
    } else if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(2) + 'M';
    } else if (value >= 1_000) {
      return (value / 1_000).toFixed(2) + 'K';
    }
    return value.toFixed(2);
  }
}
