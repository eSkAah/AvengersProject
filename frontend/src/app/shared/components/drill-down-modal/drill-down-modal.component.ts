import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface DrillDownData {
  title: string;
  value: number;
  sourceDocument?: string;
  details: DrillDownDetail[];
  context?: Record<string, unknown>;
}

export interface DrillDownDetail {
  label: string;
  value: number | string;
  type?: 'currency' | 'percentage' | 'text';
  highlight?: boolean;
}

@Component({
  selector: 'app-drill-down-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (isOpen()) {
      <div class="modal-overlay" (click)="onOverlayClick($event)">
        <div class="modal-container" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h2 class="modal-title">{{ data?.title }}</h2>
            <button class="modal-close" (click)="close()" aria-label="Fermer">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>

          <div class="modal-content">
            @if (data) {
              <div class="primary-value">
                <span class="primary-value__amount">{{ formatCurrency(data.value) }}</span>
                @if (data.sourceDocument) {
                  <span class="primary-value__source">
                    <lucide-icon name="file-text" [size]="14"></lucide-icon>
                    {{ data.sourceDocument }}
                  </span>
                }
              </div>

              <div class="details-grid">
                @for (detail of data.details; track detail.label) {
                  <div class="detail-item" [class.detail-item--highlight]="detail.highlight">
                    <span class="detail-item__label">{{ detail.label }}</span>
                    <span class="detail-item__value">
                      @switch (detail.type) {
                        @case ('currency') {
                          {{ formatCurrency(+detail.value) }}
                        }
                        @case ('percentage') {
                          {{ formatPercent(+detail.value) }}
                        }
                        @default {
                          {{ detail.value }}
                        }
                      }
                    </span>
                  </div>
                }
              </div>
            }
          </div>

          <div class="modal-footer">
            <button class="btn btn--outline" (click)="close()">
              Fermer
            </button>
            <button class="btn btn--primary" (click)="askEve()">
              <lucide-icon name="message-circle" [size]="18"></lucide-icon>
              Demander à Eve
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 200ms ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-container {
      background: #FFFFFF;
      border-radius: 16px;
      width: 90%;
      max-width: 520px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      animation: slideUp 200ms ease-out;
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

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #E5E5E5;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #2E2E38;
      margin: 0;
    }

    .modal-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      color: #6B7280;
      transition: all 200ms ease-out;
    }

    .modal-close:hover {
      background: #F5F5F5;
      color: #2E2E38;
    }

    .modal-content {
      padding: 24px;
      overflow-y: auto;
      max-height: calc(90vh - 140px);
    }

    .primary-value {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #F3F4F6;
    }

    .primary-value__amount {
      display: block;
      font-size: 32px;
      font-weight: 700;
      color: #2E2E38;
    }

    .primary-value__source {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #9CA3AF;
      margin-top: 8px;
    }

    .details-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #FAFAFA;
      border-radius: 8px;
    }

    .detail-item--highlight {
      background: #FFF9CC;
    }

    .detail-item__label {
      font-size: 14px;
      color: #6B7280;
    }

    .detail-item__value {
      font-size: 14px;
      font-weight: 600;
      color: #2E2E38;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #E5E5E5;
      background: #FAFAFA;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 200ms ease-out;
      border: none;
    }

    .btn--outline {
      background: #FFFFFF;
      color: #2E2E38;
      border: 1px solid #E5E5E5;
    }

    .btn--outline:hover {
      background: #F5F5F5;
      border-color: #D4D4D4;
    }

    .btn--primary {
      background: #FFE600;
      color: #2E2E38;
    }

    .btn--primary:hover {
      background: #FFD000;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrillDownModalComponent {
  @Input() data: DrillDownData | null = null;

  @Output() closeModal = new EventEmitter<void>();
  @Output() askEveClick = new EventEmitter<DrillDownData>();

  readonly isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.closeModal.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  askEve(): void {
    if (this.data) {
      this.askEveClick.emit(this.data);
    }
    this.close();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatPercent(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }
}
