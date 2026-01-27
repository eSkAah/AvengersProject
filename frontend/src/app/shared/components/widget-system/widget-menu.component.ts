// =============================================================================
// Widget Menu - Add/Remove widgets dropdown
// =============================================================================

import { Component, input, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Plus,
  LayoutGrid,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-angular';
import { WidgetConfig, WidgetState } from './widget.models';

@Component({
  selector: 'app-widget-menu',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="widget-menu">
      <button
        class="widget-menu__trigger"
        (click)="toggleMenu($event)"
        [class.widget-menu__trigger--active]="isOpen()"
      >
        <lucide-icon [img]="Plus" [size]="18"></lucide-icon>
        <span>Widgets</span>
        <lucide-icon [img]="LayoutGrid" [size]="14" class="trigger-icon"></lucide-icon>
      </button>

      @if (isOpen()) {
        <div class="widget-menu__dropdown">
          <div class="dropdown-header">
            <span class="dropdown-title">Manage Widgets</span>
            <button class="reset-btn" (click)="onReset()">
              <lucide-icon [img]="RotateCcw" [size]="12"></lucide-icon>
              Reset
            </button>
          </div>

          <div class="dropdown-content">
            @for (widget of availableWidgets(); track widget.id) {
              @let state = getWidgetState(widget.id);
              <button
                class="widget-option"
                [class.widget-option--visible]="state?.visible"
                (click)="onToggleWidget(widget.id)"
              >
                <div class="widget-option__info">
                  <span class="widget-option__name">{{ widget.name }}</span>
                  @if (widget.description) {
                    <span class="widget-option__desc">{{ widget.description }}</span>
                  }
                </div>
                <div class="widget-option__status">
                  @if (state?.visible) {
                    <lucide-icon
                      [img]="Eye"
                      [size]="16"
                      class="status-icon status-icon--visible"
                    ></lucide-icon>
                  } @else {
                    <lucide-icon
                      [img]="EyeOff"
                      [size]="16"
                      class="status-icon status-icon--hidden"
                    ></lucide-icon>
                  }
                </div>
              </button>
            }
          </div>

          <div class="dropdown-footer">
            <span class="footer-hint">Click to show/hide widgets</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .widget-menu {
        position: relative;
        display: inline-flex;
      }

      .widget-menu__trigger {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        color: #374151;
        cursor: pointer;
        transition: all 200ms ease-out;

        &:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        &--active {
          background: #2e2e38;
          border-color: #2e2e38;
          color: white;

          .trigger-icon {
            color: #ffe600;
          }
        }
      }

      .trigger-icon {
        color: #9ca3af;
      }

      .widget-menu__dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 320px;
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        overflow: hidden;
        animation: dropdownSlide 150ms ease-out;
      }

      @keyframes dropdownSlide {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 16px;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }

      .dropdown-title {
        font-size: 12px;
        font-weight: 700;
        color: #374151;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .reset-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: transparent;
        border: none;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        transition: all 150ms ease-out;

        &:hover {
          background: #e5e7eb;
          color: #374151;
        }
      }

      .dropdown-content {
        max-height: 360px;
        overflow-y: auto;
        padding: 8px;
      }

      .widget-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 12px 14px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 8px;
        text-align: left;
        cursor: pointer;
        transition: all 150ms ease-out;

        &:hover {
          background: #f3f4f6;
        }

        &--visible {
          background: #f0fdf4;
          border-color: #bbf7d0;

          &:hover {
            background: #dcfce7;
          }
        }

        &__info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        &__name {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        &__desc {
          font-size: 11px;
          color: #9ca3af;
        }

        &__status {
          flex-shrink: 0;
          margin-left: 12px;
        }
      }

      .status-icon {
        &--visible {
          color: #059669;
        }

        &--hidden {
          color: #d1d5db;
        }
      }

      .dropdown-footer {
        padding: 10px 16px;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
      }

      .footer-hint {
        font-size: 11px;
        color: #9ca3af;
      }
    `,
  ],
})
export class WidgetMenuComponent {
  readonly Plus = Plus;
  readonly LayoutGrid = LayoutGrid;
  readonly Check = Check;
  readonly RotateCcw = RotateCcw;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  availableWidgets = input.required<WidgetConfig[]>();
  widgetStates = input.required<WidgetState[]>();

  toggleWidget = output<string>();
  resetWidgets = output<void>();

  isOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.widget-menu')) {
      this.isOpen.set(false);
    }
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update(v => !v);
  }

  getWidgetState(widgetId: string): WidgetState | undefined {
    return this.widgetStates().find(w => w.id === widgetId);
  }

  onToggleWidget(widgetId: string): void {
    this.toggleWidget.emit(widgetId);
  }

  onReset(): void {
    this.resetWidgets.emit();
    this.isOpen.set(false);
  }
}
