import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  output,
  ViewChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ConversationMessage } from '../../../core/services/eve-api.service';
import {
  GanttChartComponent,
  GanttChartData,
  GanttItem,
} from '../gantt-chart/gantt-chart.component';

/**
 * Eve Message Bubble Component
 *
 * Displays a chat message with:
 * - User messages aligned right with EY Yellow background
 * - Eve messages aligned left with gray background and avatar
 * - Timestamp on hover
 * - Support for multi-line content
 */
@Component({
  selector: 'app-eve-message',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DatePipe, GanttChartComponent],
  template: `
    <div class="message" [class.message--user]="isUser()" [class.message--eve]="!isUser()">
      <!-- Eve Avatar (only for assistant messages) -->
      @if (!isUser()) {
        <div class="message__avatar">
          <lucide-icon name="bot" [size]="18"></lucide-icon>
        </div>
      }

      <!-- Message Content -->
      <div class="message__bubble" [class.message__bubble--wide]="isGanttMessage()">
        <div class="message__content" [innerHTML]="formattedContent()"></div>

        <!-- Gantt Chart (if applicable) -->
        @if (isGanttMessage() && ganttData()) {
          <div class="message__chart">
            <app-gantt-chart
              [data]="ganttData()"
              (barClick)="onGanttBarClick($event)"
            ></app-gantt-chart>
            <button class="message__export-btn" (click)="requestExport()">
              <lucide-icon name="download" [size]="14"></lucide-icon>
              Exporter en PNG
            </button>
          </div>
        }

        <span class="message__time">{{ message().timestamp | date: 'HH:mm' }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .message {
        display: flex;
        gap: 10px;
        max-width: 100%;
        animation: messageIn 200ms ease-out;
      }

      .message--user {
        justify-content: flex-end;
      }

      .message--eve {
        justify-content: flex-start;
      }

      .message__avatar {
        width: 32px;
        height: 32px;
        min-width: 32px;
        border-radius: 50%;
        background: #2e2e38;
        color: #ffe600;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .message__bubble {
        max-width: 85%;
        position: relative;
      }

      .message--user .message__bubble {
        background: #ffe600;
        color: #2e2e38;
        border-radius: 16px 16px 4px 16px;
        padding: 12px 16px;
      }

      .message--eve .message__bubble {
        background: #f5f5f5;
        color: #2e2e38;
        border-radius: 16px 16px 16px 4px;
        padding: 12px 16px;
      }

      .message__content {
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      .message__content :global(strong) {
        font-weight: 600;
      }

      .message__time {
        display: block;
        font-size: 11px;
        color: #9ca3af;
        margin-top: 4px;
        text-align: right;
        opacity: 0;
        transition: opacity 200ms ease-out;
      }

      .message__bubble:hover .message__time {
        opacity: 1;
      }

      .message--user .message__time {
        color: rgba(46, 46, 56, 0.6);
      }

      @keyframes messageIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Gantt Chart in Message */
      .message__bubble--wide {
        max-width: 100% !important;
        width: 100%;
      }

      .message__chart {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
      }

      .message__export-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 12px;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 500;
        color: #2e2e38;
        background: #ffffff;
        border: 1px solid #e5e5e5;
        border-radius: 6px;
        cursor: pointer;
        transition: all 200ms ease-out;
      }

      .message__export-btn:hover {
        background: #ffe600;
        border-color: #ffe600;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .message__bubble {
          max-width: 90%;
        }

        .message__avatar {
          width: 28px;
          height: 28px;
          min-width: 28px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EveMessageComponent {
  @ViewChild(GanttChartComponent) ganttChart?: GanttChartComponent;

  readonly message = input.required<ConversationMessage>();

  /** Event emitter for gantt bar clicks */
  readonly ganttBarClick = output<GanttItem>();

  /** Event emitter for export requests */
  readonly exportRequest = output<void>();

  readonly isUser = computed(() => this.message().role === 'user');

  /** Check if this message contains gantt chart data */
  readonly isGanttMessage = computed(() => this.message().response_type === 'gantt');

  /** Extract gantt data from message */
  readonly ganttData = computed<GanttChartData | null>(() => {
    if (!this.isGanttMessage() || !this.message().data) {
      return null;
    }
    return this.message().data as GanttChartData;
  });

  /** Handle gantt bar click */
  onGanttBarClick(item: GanttItem): void {
    this.ganttBarClick.emit(item);
  }

  /** Export the Gantt chart as PNG and trigger download */
  requestExport(): void {
    if (!this.ganttChart) return;

    const base64Image = this.ganttChart.exportToPng();
    if (!base64Image) return;

    // Create download link
    const link = document.createElement('a');
    link.href = base64Image;
    link.download = `planning-engagements-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Also emit event for parent component if needed
    this.exportRequest.emit();
  }

  /** Format content with line breaks and basic formatting */
  readonly formattedContent = computed(() => {
    let content = this.message().content;

    // Escape HTML to prevent XSS
    content = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Convert line breaks to <br>
    content = content.replace(/\n/g, '<br>');

    // Basic markdown-like formatting
    // Bold: **text** or __text__
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/__(.*?)__/g, '<strong>$1</strong>');

    return content;
  });
}
