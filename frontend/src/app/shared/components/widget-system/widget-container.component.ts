// =============================================================================
// Widget Container - Wrapper with drag handle and controls
// =============================================================================

import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { LucideAngularModule, GripVertical, X, Maximize2, Minimize2 } from 'lucide-angular';

@Component({
  selector: 'app-widget-container',
  standalone: true,
  imports: [CommonModule, CdkDragHandle, LucideAngularModule],
  template: `
    <div class="widget-container" [class.widget-container--dragging]="isDragging">
      <div class="widget-header" cdkDragHandle>
        <div class="widget-header__left">
          <lucide-icon [img]="GripVertical" [size]="16" class="drag-handle"></lucide-icon>
          <span class="widget-title">{{ title() }}</span>
        </div>
        <div class="widget-header__actions">
          @if (collapsible()) {
            <button
              class="widget-action-btn"
              (click)="onToggleCollapse()"
              [attr.aria-label]="collapsed() ? 'Expand widget' : 'Collapse widget'"
            >
              <lucide-icon [img]="collapsed() ? Maximize2 : Minimize2" [size]="14"></lucide-icon>
            </button>
          }
          @if (removable()) {
            <button
              class="widget-action-btn widget-action-btn--close"
              (click)="onRemove()"
              aria-label="Remove widget"
            >
              <lucide-icon [img]="XIcon" [size]="14"></lucide-icon>
            </button>
          }
        </div>
      </div>
      @if (!collapsed()) {
        <div class="widget-content">
          <ng-content></ng-content>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .widget-container {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        overflow: hidden;
        transition:
          box-shadow 200ms ease-out,
          border-color 200ms ease-out;

        &:hover {
          border-color: #d1d5db;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        &--dragging {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border-color: #ffe600;
          z-index: 1000;
        }
      }

      .widget-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
        cursor: grab;
        user-select: none;

        &:active {
          cursor: grabbing;
        }

        &__left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        &__actions {
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0;
          transition: opacity 150ms ease-out;
        }
      }

      .widget-container:hover .widget-header__actions {
        opacity: 1;
      }

      .drag-handle {
        color: #9ca3af;
        flex-shrink: 0;
      }

      .widget-title {
        font-size: 11px;
        font-weight: 700;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .widget-action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        border-radius: 4px;
        color: #9ca3af;
        cursor: pointer;
        transition: all 150ms ease-out;

        &:hover {
          background: #e5e7eb;
          color: #6b7280;
        }

        &--close:hover {
          background: #fee2e2;
          color: #dc2626;
        }
      }

      .widget-content {
        padding: 16px;
      }
    `,
  ],
})
export class WidgetContainerComponent {
  readonly GripVertical = GripVertical;
  readonly XIcon = X;
  readonly Maximize2 = Maximize2;
  readonly Minimize2 = Minimize2;

  title = input.required<string>();
  removable = input<boolean>(true);
  collapsible = input<boolean>(false);
  collapsed = input<boolean>(false);

  remove = output<void>();
  toggleCollapse = output<void>();

  isDragging = false;

  onRemove(): void {
    this.remove.emit();
  }

  onToggleCollapse(): void {
    this.toggleCollapse.emit();
  }
}
