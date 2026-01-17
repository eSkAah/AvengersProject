import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ConversationMessage } from '../../../core/services/eve-api.service';

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
  imports: [CommonModule, LucideAngularModule, DatePipe],
  template: `
    <div
      class="message"
      [class.message--user]="isUser()"
      [class.message--eve]="!isUser()"
    >
      <!-- Eve Avatar (only for assistant messages) -->
      @if (!isUser()) {
        <div class="message__avatar">
          <lucide-icon name="bot" [size]="18"></lucide-icon>
        </div>
      }

      <!-- Message Content -->
      <div class="message__bubble">
        <div class="message__content" [innerHTML]="formattedContent()"></div>
        <span class="message__time">{{ message().timestamp | date:'HH:mm' }}</span>
      </div>
    </div>
  `,
  styles: [`
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
      background: #2E2E38;
      color: #FFE600;
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
      background: #FFE600;
      color: #2E2E38;
      border-radius: 16px 16px 4px 16px;
      padding: 12px 16px;
    }

    .message--eve .message__bubble {
      background: #F5F5F5;
      color: #2E2E38;
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
      color: #9CA3AF;
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EveMessageComponent {
  readonly message = input.required<ConversationMessage>();

  readonly isUser = computed(() => this.message().role === 'user');

  /** Format content with line breaks and basic formatting */
  readonly formattedContent = computed(() => {
    let content = this.message().content;

    // Escape HTML to prevent XSS
    content = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Convert line breaks to <br>
    content = content.replace(/\n/g, '<br>');

    // Basic markdown-like formatting
    // Bold: **text** or __text__
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    content = content.replace(/__(.*?)__/g, '<strong>$1</strong>');

    return content;
  });
}
