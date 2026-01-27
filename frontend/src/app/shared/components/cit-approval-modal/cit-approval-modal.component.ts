import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  HostListener,
  OnInit,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  Maximize2,
  Eye,
  Check,
  Building2,
} from 'lucide-angular';
import { CurrencyEyPipe } from '../../pipes/currency-ey.pipe';

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
  citStatus?: 'completed' | 'in-progress';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalComment?: string;
  approvedAt?: string;
}

@Component({
  selector: 'app-cit-approval-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CurrencyEyPipe],
  template: `
    <div class="modal-overlay" (click)="onBackdropClick($event)">
      <div class="modal-content" [class.modal-content--fullscreen]="mode === 'table-expand'">
        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title">
            <lucide-icon
              [img]="mode === 'table-expand' ? icons.maximize2 : icons.fileText"
              [size]="20"
            ></lucide-icon>
            <div class="modal-title-text">
              <h3>
                {{ mode === 'table-expand' ? 'Multicountry Analysis' : 'CIT Document Review' }}
              </h3>
              @if (entity && mode !== 'table-expand') {
                <span class="modal-subtitle">{{ entity.entity }} - {{ entity.year }}</span>
              }
            </div>
          </div>
          <button class="close-btn" (click)="close.emit()">
            <lucide-icon [img]="icons.x" [size]="20"></lucide-icon>
          </button>
        </div>

        <!-- Full-screen table mode -->
        @if (mode === 'table-expand') {
          <div class="modal-body modal-body--table">
            <div class="fullscreen-table-wrapper">
              <table class="fullscreen-table">
                <thead>
                  <tr>
                    <th class="sticky-col">Entity</th>
                    <th>Fund</th>
                    <th>Year</th>
                    <th>Currency</th>
                    <th>Tax Memo</th>
                    <th>IP Memo</th>
                    <th>Tax Conso</th>
                    <th class="num">Commercial Result</th>
                    <th class="num">Tax Balance Sheet</th>
                    <th class="num">Net Worth Tax</th>
                    <th class="num">SA INV</th>
                    <th class="num">Total Tax Losses</th>
                    <th>FTA Year</th>
                    <th class="num">Recapture</th>
                    <th>SBA Memo</th>
                    <th class="num">Taxable Before TLCF</th>
                    <th class="num">Taxable After TLCF</th>
                    <th class="num">Participation Income</th>
                    <th class="num">QSFU Parts</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of allEntities; track row.id) {
                    <tr
                      [class.row--selected]="entity?.id === row.id"
                      (click)="selectEntityForPreview(row)"
                    >
                      <td class="sticky-col">
                        <span class="entity-name">{{ row.entity }}</span>
                      </td>
                      <td>{{ row.fund || '-' }}</td>
                      <td>{{ row.year }}</td>
                      <td>
                        <span class="currency-badge">{{ row.currency || 'EUR' }}</span>
                      </td>
                      <td>
                        <span
                          class="memo-badge"
                          [class]="'memo-badge--' + getMemoClass(row.taxMemo)"
                          >{{ row.taxMemo || '-' }}</span
                        >
                      </td>
                      <td>
                        <span
                          class="memo-badge"
                          [class]="'memo-badge--' + getMemoClass(row.ipMemo)"
                          >{{ row.ipMemo || '-' }}</span
                        >
                      </td>
                      <td>{{ row.taxConso || '-' }}</td>
                      <td class="num" [class.negative]="(row.commercialResult || 0) < 0">
                        {{ row.commercialResult | currencyEy: 'compact' }}
                      </td>
                      <td class="num">{{ row.taxBalanceSheetResult | currencyEy: 'compact' }}</td>
                      <td class="num">{{ row.netWorthTax | currencyEy: 'compact' }}</td>
                      <td class="num">{{ row.saInv | currencyEy: 'compact' }}</td>
                      <td class="num" [class.negative]="(row.totalTaxLosses || 0) < 0">
                        {{ row.totalTaxLosses | currencyEy: 'compact' }}
                      </td>
                      <td>{{ row.ftaYear || '-' }}</td>
                      <td class="num">{{ row.recapture | currencyEy: 'compact' }}</td>
                      <td>
                        <span
                          class="memo-badge"
                          [class]="'memo-badge--' + getMemoClass(row.sbaMemo)"
                          >{{ row.sbaMemo || '-' }}</span
                        >
                      </td>
                      <td class="num" [class.negative]="(row.taxableResultBeforeTLCF || 0) < 0">
                        {{ row.taxableResultBeforeTLCF | currencyEy: 'compact' }}
                      </td>
                      <td class="num">{{ row.taxableResultAfterTLCF | currencyEy: 'compact' }}</td>
                      <td class="num">{{ row.participationIncome | currencyEy: 'compact' }}</td>
                      <td class="num">{{ row.qsfuParts || 0 }}</td>
                      <td>
                        <span
                          class="status-badge"
                          [class]="'status-badge--' + (row.approvalStatus || 'pending')"
                        >
                          {{ row.approvalStatus || 'pending' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        } @else if (mode === 'bulk-approval') {
          <!-- Bulk approval mode -->
          <div class="modal-body modal-body--preview">
            <!-- Left: PDF Document Preview -->
            <div class="preview-panel">
              <div class="pdf-header">
                <h4>CIT Document Preview</h4>
                <span class="pdf-entity-info"
                  >{{ currentEntity()?.entity }} - FY {{ currentEntity()?.year }}</span
                >
              </div>
              <div class="pdf-container">
                <iframe
                  src="/assets/documents/CIT-form.pdf"
                  class="pdf-viewer"
                  title="CIT Document"
                ></iframe>
              </div>
              @if (allEntities.length > 1) {
                <div class="bulk-entities-list">
                  <span class="bulk-entities-label"
                    >Select entity to preview ({{ allEntities.length }} total)</span
                  >
                  <div class="bulk-entities-chips">
                    @for (e of allEntities; track e.id) {
                      <button
                        type="button"
                        class="bulk-entity-chip"
                        [class.bulk-entity-chip--active]="currentEntity()?.id === e.id"
                        (click)="selectEntityForPreview(e)"
                      >
                        {{ e.entity }}
                      </button>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Right: Approval Panel -->
            <div class="approval-panel">
              <div class="approval-panel__header">
                <lucide-icon [img]="icons.messageSquare" [size]="18"></lucide-icon>
                <h4>Bulk Approval ({{ allEntities.length }} entities)</h4>
              </div>

              <!-- Entity List -->
              <div class="bulk-approval-entities">
                @for (e of allEntities; track e.id) {
                  <div class="bulk-entity-row">
                    <span class="bulk-entity-name">{{ e.entity }}</span>
                    <span class="status-badge status-badge--pending">{{
                      e.approvalStatus || 'pending'
                    }}</span>
                  </div>
                }
              </div>

              <!-- Comment Input -->
              <div class="comment-section">
                <label class="comment-label">Add Comment (applies to all)</label>
                <textarea
                  class="comment-input"
                  placeholder="Enter any comments or notes..."
                  [(ngModel)]="commentValue"
                  rows="4"
                ></textarea>
              </div>

              <!-- Action Buttons -->
              <div class="approval-actions">
                <button
                  class="action-btn action-btn--approve"
                  [disabled]="isProcessing()"
                  (click)="onBulkApprove()"
                >
                  @if (isProcessing()) {
                    <lucide-icon [img]="icons.loader2" [size]="18" class="spin"></lucide-icon>
                  } @else {
                    <lucide-icon [img]="icons.checkCircle" [size]="18"></lucide-icon>
                  }
                  Approve All ({{ allEntities.length }})
                </button>
              </div>
            </div>
          </div>
        } @else {
          <!-- Document preview mode (single entity) -->
          <div class="modal-body modal-body--preview">
            <!-- Left: PDF Document Preview -->
            <div class="preview-panel">
              <div class="pdf-header">
                <h4>CIT Document</h4>
                <span class="pdf-entity-info">{{ entity?.entity }} - FY {{ entity?.year }}</span>
              </div>
              <div class="pdf-container">
                <iframe
                  src="/assets/documents/CIT-form.pdf"
                  class="pdf-viewer"
                  title="CIT Document"
                ></iframe>
              </div>
            </div>

            <!-- Right: Approval Panel -->
            <div class="approval-panel">
              <div class="approval-panel__header">
                <lucide-icon [img]="icons.messageSquare" [size]="18"></lucide-icon>
                <h4>Review & Approval</h4>
              </div>

              <!-- Current Status -->
              <div class="approval-status">
                <span class="approval-status__label">Current Status</span>
                <span
                  class="status-badge status-badge--large"
                  [class]="'status-badge--' + (entity?.approvalStatus || 'pending')"
                >
                  {{ entity?.approvalStatus || 'pending' }}
                </span>
                @if (entity?.approvalComment) {
                  <p class="approval-status__comment">{{ entity?.approvalComment }}</p>
                }
              </div>

              <!-- Comment Input -->
              <div class="comment-section">
                <label class="comment-label">Add Comment</label>
                <textarea
                  class="comment-input"
                  placeholder="Enter any comments or notes..."
                  [(ngModel)]="commentValue"
                  rows="4"
                ></textarea>
              </div>

              <!-- Action Buttons -->
              <div class="approval-actions">
                <button
                  class="action-btn action-btn--approve"
                  [disabled]="isProcessing()"
                  (click)="onApprove()"
                >
                  @if (isProcessing()) {
                    <lucide-icon [img]="icons.loader2" [size]="18" class="spin"></lucide-icon>
                  } @else {
                    <lucide-icon [img]="icons.checkCircle" [size]="18"></lucide-icon>
                  }
                  Approve
                </button>
                <button
                  class="action-btn action-btn--reject"
                  [disabled]="isProcessing()"
                  (click)="onReject()"
                >
                  <lucide-icon [img]="icons.xCircle" [size]="18"></lucide-icon>
                  Reject
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      @use 'sass:color';

      // =============================================================================
      // DESIGN TOKENS
      // =============================================================================
      $ey-yellow: #ffe600;
      $ey-yellow-hover: #ffd000;
      $ey-yellow-light: rgba(255, 230, 0, 0.08);
      $ey-dark: #2e2e38;
      $ey-black: #1a1a1f;

      $surface-primary: #ffffff;
      $surface-secondary: #f8f9fa;
      $surface-tertiary: #f1f3f5;

      $border-light: rgba(0, 0, 0, 0.06);
      $border-medium: rgba(0, 0, 0, 0.1);

      $text-primary: #1a1a1f;
      $text-secondary: #5f6368;
      $text-tertiary: #9aa0a6;

      $success: #10b981;
      $error: #dc2626;

      $radius-sm: 8px;
      $radius-md: 12px;
      $radius-lg: 16px;

      $transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);

      // =============================================================================
      // MODAL OVERLAY
      // =============================================================================
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 200ms ease-out;
        padding: 24px;
      }

      .modal-content {
        background: $surface-primary;
        border-radius: $radius-lg;
        width: 100%;
        max-width: 1100px;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
        animation: slideUp 300ms ease-out;

        &--fullscreen {
          max-width: 98vw;
          max-height: 95vh;
        }
      }

      // =============================================================================
      // MODAL HEADER
      // =============================================================================
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid $border-light;
        background: $surface-primary;
      }

      .modal-title {
        display: flex;
        align-items: center;
        gap: 14px;

        lucide-icon {
          color: $ey-yellow;
        }
      }

      .modal-title-text {
        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: $text-primary;
          line-height: 1.3;
        }

        .modal-subtitle {
          font-size: 13px;
          color: $text-secondary;
        }
      }

      .close-btn {
        background: none;
        border: none;
        padding: 10px;
        cursor: pointer;
        color: $text-tertiary;
        border-radius: $radius-sm;
        transition: all $transition-fast;

        &:hover {
          background: $surface-secondary;
          color: $text-primary;
        }
      }

      // =============================================================================
      // MODAL BODY
      // =============================================================================
      .modal-body {
        flex: 1;
        overflow: hidden;

        &--preview {
          display: grid;
          grid-template-columns: 1fr 340px;
        }

        &--table {
          overflow: auto;
          padding: 0;
        }
      }

      // =============================================================================
      // FULLSCREEN TABLE
      // =============================================================================
      .fullscreen-table-wrapper {
        overflow: auto;
        max-height: calc(95vh - 80px);
      }

      .fullscreen-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        white-space: nowrap;

        th,
        td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid $border-light;
        }

        th {
          background: $ey-dark;
          color: white;
          font-weight: 600;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: sticky;
          top: 0;
          z-index: 10;

          &.num {
            text-align: right;
          }
        }

        td {
          background: $surface-primary;
          color: $text-primary;

          &.num {
            text-align: right;
            font-variant-numeric: tabular-nums;
            font-weight: 600;
          }
        }

        .sticky-col {
          position: sticky;
          left: 0;
          z-index: 5;
          background: inherit;
          min-width: 180px;
          box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
        }

        th.sticky-col {
          z-index: 15;
          background: $ey-dark;
        }

        tr:hover td {
          background: $surface-secondary;
        }

        tr.row--selected td {
          background: $ey-yellow-light;
        }
      }

      .entity-name {
        font-weight: 600;
        color: $text-primary;
      }

      .currency-badge {
        display: inline-block;
        padding: 2px 8px;
        background: $surface-tertiary;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        color: $text-secondary;
      }

      .memo-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 500;

        &--completed {
          background: rgba($success, 0.1);
          color: $success;
        }

        &--pending,
        &--in-progress {
          background: rgba(#f59e0b, 0.1);
          color: #d97706;
        }

        &--na {
          background: $surface-tertiary;
          color: $text-tertiary;
        }

        &--default {
          background: $surface-tertiary;
          color: $text-secondary;
        }
      }

      .status-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: capitalize;

        &--pending {
          background: rgba(#f59e0b, 0.1);
          color: #d97706;
        }

        &--approved {
          background: rgba($success, 0.1);
          color: $success;
        }

        &--rejected {
          background: rgba($error, 0.1);
          color: $error;
        }

        &--large {
          padding: 8px 16px;
          font-size: 12px;
        }
      }

      // =============================================================================
      // PREVIEW PANEL
      // =============================================================================
      .preview-panel {
        background: $surface-secondary;
        padding: 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .view-toggle {
        display: inline-flex;
        background: $surface-primary;
        border-radius: $radius-sm;
        padding: 4px;
        border: 1px solid $border-light;

        &__btn {
          padding: 10px 20px;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: $text-secondary;
          cursor: pointer;
          transition: all $transition-fast;

          &:hover {
            color: $text-primary;
          }

          &--active {
            background: $ey-yellow;
            color: $ey-dark;
          }
        }
      }

      // =============================================================================
      // EY REPORT VIEW
      // =============================================================================
      .ey-report {
        background: $surface-primary;
        border-radius: $radius-md;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

        &__header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: $ey-dark;
          color: white;
        }

        .ey-logo {
          width: 48px;
          height: 48px;
          background: $ey-yellow;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;

          &__text {
            font-size: 20px;
            font-weight: 800;
            color: $ey-dark;
          }
        }

        &__title {
          h4 {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 700;
          }

          p {
            margin: 0;
            font-size: 13px;
            opacity: 0.8;
          }
        }

        &__kpis {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding: 24px;
          background: $surface-secondary;
        }

        &__section {
          padding: 20px 24px;
          border-top: 1px solid $border-light;

          h5 {
            margin: 0 0 16px 0;
            font-size: 12px;
            font-weight: 700;
            color: $text-tertiary;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }
        }

        &__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        &__item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: $surface-secondary;
          border-radius: $radius-sm;

          &-label {
            font-size: 13px;
            color: $text-secondary;
          }

          &-value {
            font-size: 14px;
            font-weight: 600;
            color: $text-primary;
            font-variant-numeric: tabular-nums;
          }
        }
      }

      .ey-kpi {
        padding: 16px;
        background: $surface-primary;
        border-radius: $radius-sm;
        text-align: center;

        &--primary {
          background: $ey-yellow-light;
          border: 1px solid rgba($ey-yellow, 0.3);
        }

        &__label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: $text-tertiary;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        &__value {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: $text-primary;
          font-variant-numeric: tabular-nums;
        }
      }

      // =============================================================================
      // OFFICIAL FORM VIEW
      // =============================================================================
      .official-form {
        background: $surface-primary;
        border-radius: $radius-md;
        overflow: hidden;
        border: 2px solid $border-medium;

        &__header {
          padding: 20px 24px;
          background: $surface-tertiary;
          border-bottom: 2px solid $border-medium;
        }

        &__title {
          margin-bottom: 16px;

          .official-form__form-number {
            font-size: 11px;
            font-weight: 700;
            color: $text-tertiary;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          h4 {
            margin: 4px 0 0 0;
            font-size: 18px;
            font-weight: 700;
            color: $text-primary;
          }
        }

        &__meta {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        &__field {
          &-label {
            display: block;
            font-size: 10px;
            font-weight: 600;
            color: $text-tertiary;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          &-value {
            font-size: 14px;
            font-weight: 600;
            color: $text-primary;
            font-family: 'Courier New', monospace;
          }
        }

        &__section {
          padding: 16px 24px;
          border-bottom: 1px solid $border-light;

          &:last-child {
            border-bottom: none;
          }
        }

        &__section-title {
          font-size: 12px;
          font-weight: 700;
          color: $ey-dark;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid $border-light;
        }

        &__row {
          display: grid;
          grid-template-columns: 40px 1fr auto;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px dotted $border-light;

          &:last-child {
            border-bottom: none;
          }

          &--total {
            background: $surface-secondary;
            margin: 8px -24px -16px -24px;
            padding: 12px 24px;
            border-bottom: none;
          }
        }

        &__line-number {
          font-size: 11px;
          font-weight: 600;
          color: $text-tertiary;
          font-family: 'Courier New', monospace;
        }

        &__line-label {
          font-size: 13px;
          color: $text-secondary;
        }

        &__line-value {
          font-size: 13px;
          font-weight: 600;
          color: $text-primary;
          font-variant-numeric: tabular-nums;
          font-family: 'Courier New', monospace;
          text-align: right;
        }
      }

      // =============================================================================
      // APPROVAL PANEL
      // =============================================================================
      .approval-panel {
        background: $surface-primary;
        padding: 24px;
        border-left: 1px solid $border-light;
        display: flex;
        flex-direction: column;
        gap: 20px;

        &__header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 16px;
          border-bottom: 1px solid $border-light;

          lucide-icon {
            color: $text-tertiary;
          }

          h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
            color: $text-primary;
          }
        }
      }

      .approval-status {
        padding: 16px;
        background: $surface-secondary;
        border-radius: $radius-sm;

        &__label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: $text-tertiary;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }

        &__comment {
          margin: 12px 0 0 0;
          font-size: 12px;
          color: $text-secondary;
          font-style: italic;
        }
      }

      .comment-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .comment-label {
        font-size: 12px;
        font-weight: 600;
        color: $text-secondary;
      }

      .comment-input {
        flex: 1;
        min-height: 100px;
        padding: 14px;
        border: 1px solid $border-light;
        border-radius: $radius-sm;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        color: $text-primary;
        transition: all $transition-fast;

        &:focus {
          outline: none;
          border-color: $ey-yellow;
          box-shadow: 0 0 0 3px $ey-yellow-light;
        }

        &::placeholder {
          color: $text-tertiary;
        }
      }

      .approval-actions {
        display: flex;
        gap: 12px;
      }

      .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 20px;
        border: none;
        border-radius: $radius-sm;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all $transition-fast;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        &--approve {
          background: $success;
          color: white;

          &:hover:not(:disabled) {
            background: color.adjust($success, $lightness: -5%);
            transform: translateY(-1px);
          }
        }

        &--reject {
          background: transparent;
          color: $error;
          border: 2px solid $error;

          &:hover:not(:disabled) {
            background: rgba($error, 0.05);
          }
        }
      }

      .close-action-btn {
        padding: 12px;
        background: transparent;
        border: 1px solid $border-light;
        border-radius: $radius-sm;
        font-size: 13px;
        font-weight: 500;
        color: $text-secondary;
        cursor: pointer;
        transition: all $transition-fast;

        &:hover {
          background: $surface-secondary;
          color: $text-primary;
        }
      }

      // =============================================================================
      // PDF VIEWER
      // =============================================================================
      .pdf-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: $text-primary;
        }
      }

      .pdf-entity-info {
        font-size: 13px;
        color: $text-secondary;
        font-weight: 500;
      }

      .pdf-container {
        flex: 1;
        min-height: 400px;
        background: $surface-tertiary;
        border-radius: $radius-md;
        overflow: hidden;
      }

      .pdf-viewer {
        width: 100%;
        height: 100%;
        min-height: 450px;
        border: none;
        background: white;
      }

      // =============================================================================
      // BULK APPROVAL STYLES
      // =============================================================================
      .bulk-entities-list {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid $border-light;
      }

      .bulk-entities-label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: $text-tertiary;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
      }

      .bulk-entities-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .bulk-entity-chip {
        display: inline-block;
        padding: 8px 14px;
        background: $surface-tertiary;
        border: 2px solid transparent;
        border-radius: $radius-sm;
        font-size: 12px;
        font-weight: 600;
        color: $text-secondary;
        cursor: pointer;
        transition: all $transition-fast;

        &:hover {
          background: $surface-secondary;
          color: $text-primary;
          border-color: $border-medium;
        }

        &--active {
          background: $ey-yellow;
          color: $ey-dark;
          border-color: $ey-yellow;
        }
      }

      .bulk-approval-entities {
        max-height: 150px;
        overflow-y: auto;
        margin-bottom: 16px;
        padding: 12px;
        background: $surface-secondary;
        border-radius: $radius-sm;
      }

      .bulk-entity-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid $border-light;

        &:last-child {
          border-bottom: none;
        }
      }

      .bulk-entity-name {
        font-size: 13px;
        font-weight: 600;
        color: $text-primary;
      }

      // =============================================================================
      // UTILITIES
      // =============================================================================
      .negative {
        color: $error !important;
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      // =============================================================================
      // RESPONSIVE
      // =============================================================================
      @media (max-width: 900px) {
        .modal-body--preview {
          grid-template-columns: 1fr;
        }

        .preview-panel {
          max-height: 50vh;
        }

        .approval-panel {
          border-left: none;
          border-top: 1px solid $border-light;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CitApprovalModalComponent implements OnInit, OnChanges {
  @Input() entity: MultiCountryData | null = null;
  @Input() allEntities: MultiCountryData[] = [];
  @Input() mode: 'preview' | 'table-expand' | 'bulk-approval' = 'preview';

  @Output() close = new EventEmitter<void>();
  @Output() approve = new EventEmitter<{ entityId: string; comment: string }>();
  @Output() reject = new EventEmitter<{ entityId: string; comment: string }>();
  @Output() bulkApprove = new EventEmitter<{ entityIds: string[]; comment: string }>();

  readonly icons = {
    x: X,
    fileText: FileText,
    checkCircle: CheckCircle,
    xCircle: XCircle,
    messageSquare: MessageSquare,
    loader2: Loader2,
    maximize2: Maximize2,
    eye: Eye,
    check: Check,
    building2: Building2,
  };

  readonly documentViewMode = signal<'ey-report' | 'official-form'>('ey-report');
  readonly isProcessing = signal(false);
  commentValue = '';

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  readonly selectedEntityInternal = signal<MultiCountryData | null>(null);

  // Current entity to display (uses internal selection or falls back to input)
  readonly currentEntity = computed(() => {
    return this.selectedEntityInternal() || this.entity;
  });

  selectEntityForPreview(entity: MultiCountryData): void {
    this.selectedEntityInternal.set(entity);
  }

  ngOnInit(): void {
    if (this.entity) {
      this.selectedEntityInternal.set(this.entity);
    }
  }

  ngOnChanges(): void {
    if (this.entity && !this.selectedEntityInternal()) {
      this.selectedEntityInternal.set(this.entity);
    }
  }

  onApprove(): void {
    if (!this.entity) return;
    this.isProcessing.set(true);

    setTimeout(() => {
      this.approve.emit({
        entityId: this.entity!.id,
        comment: this.commentValue,
      });
      this.isProcessing.set(false);
    }, 1000);
  }

  onReject(): void {
    if (!this.entity) return;
    this.isProcessing.set(true);

    setTimeout(() => {
      this.reject.emit({
        entityId: this.entity!.id,
        comment: this.commentValue,
      });
      this.isProcessing.set(false);
    }, 1000);
  }

  onBulkApprove(): void {
    if (this.allEntities.length === 0) return;
    this.isProcessing.set(true);

    setTimeout(() => {
      this.bulkApprove.emit({
        entityIds: this.allEntities.map(e => e.id),
        comment: this.commentValue,
      });
      this.isProcessing.set(false);
    }, 1000);
  }

  getMemoClass(memo: string | undefined): string {
    if (!memo) return 'default';
    const lower = memo.toLowerCase();
    if (lower === 'completed' || lower === 'approved' || lower === 'reviewed') return 'completed';
    if (lower === 'pending' || lower === 'in progress' || lower === 'under review')
      return 'pending';
    if (lower === 'n/a') return 'na';
    return 'default';
  }
}
