// =============================================================================
// Widget Grid - Drag & Drop container for widgets
// =============================================================================

import {
  Component,
  input,
  output,
  ContentChildren,
  QueryList,
  AfterContentInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-widget-grid',
  standalone: true,
  imports: [CommonModule, CdkDropList],
  template: `
    <div
      class="widget-grid"
      [class]="'widget-grid--cols-' + columns()"
      cdkDropList
      cdkDropListOrientation="mixed"
      [cdkDropListData]="items()"
      (cdkDropListDropped)="onDrop($event)"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .widget-grid {
        display: grid;
        gap: 20px;
        min-height: 100px;

        &--cols-1 {
          grid-template-columns: 1fr;
        }

        &--cols-2 {
          grid-template-columns: repeat(2, 1fr);
        }

        &--cols-3 {
          grid-template-columns: repeat(3, 1fr);
        }

        &--cols-4 {
          grid-template-columns: repeat(4, 1fr);
        }

        &--cols-5 {
          grid-template-columns: repeat(5, 1fr);
        }
      }

      :host ::ng-deep {
        .cdk-drag-preview {
          box-sizing: border-box;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          background: white;
          border: 2px solid #ffe600;
        }

        .cdk-drag-placeholder {
          opacity: 0.4;
          background: #f3f4f6;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
        }

        .cdk-drag-animating {
          transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
        }

        .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
          transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
        }
      }

      @media (max-width: 1200px) {
        .widget-grid {
          &--cols-3,
          &--cols-4,
          &--cols-5 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      }

      @media (max-width: 768px) {
        .widget-grid {
          &--cols-2,
          &--cols-3,
          &--cols-4,
          &--cols-5 {
            grid-template-columns: 1fr;
          }
        }
      }
    `,
  ],
})
export class WidgetGridComponent {
  columns = input<number>(3);
  items = input<unknown[]>([]);

  reorder = output<{ previousIndex: number; currentIndex: number }>();

  onDrop(event: CdkDragDrop<unknown[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      this.reorder.emit({
        previousIndex: event.previousIndex,
        currentIndex: event.currentIndex,
      });
    }
  }
}
