import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  DestroyRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EveApiService } from '../../../core/services/eve-api.service';
import { EveMessageComponent } from '../eve-message/eve-message.component';

/** Predefined prompts for quick actions */
const QUICK_PROMPTS = [
  { label: 'Missing documents', message: 'What documents are missing for this engagement?' },
  { label: 'Engagement status', message: 'What is the current status of this engagement?' },
  { label: 'Next steps', message: 'What are the next steps?' },
  { label: 'Identified risks', message: 'What are the identified risks?' },
];

/**
 * Eve Chat Panel Component
 *
 * A sliding panel from the right that provides:
 * - Chat header with Eve info and context
 * - Scrollable message area
 * - Quick action prompts
 * - Input field with send button
 * - Loading state indicator
 */
@Component({
  selector: 'app-eve-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EveMessageComponent],
  template: `
    <!-- Backdrop -->
    @if (eveService.isPanelOpen()) {
      <div
        class="eve-backdrop"
        (click)="closePanel()"
      ></div>
    }

    <!-- Panel -->
    <div
      class="eve-panel"
      [class.eve-panel--open]="eveService.isPanelOpen()"
      role="dialog"
      aria-labelledby="eve-panel-title"
      [attr.aria-hidden]="!eveService.isPanelOpen()"
    >
      <!-- Header -->
      <div class="eve-panel__header">
        <div class="eve-panel__header-content">
          <div class="eve-panel__avatar">
            <lucide-icon name="bot" [size]="24"></lucide-icon>
          </div>
          <div class="eve-panel__info">
            <h2 id="eve-panel-title" class="eve-panel__title">Eve</h2>
            <p class="eve-panel__subtitle">
              @if (eveService.currentEngagementName()) {
                {{ eveService.currentEngagementName() }}
              } @else {
                AI Contextual Assistant
              }
            </p>
          </div>
        </div>
        <div class="eve-panel__actions">
          @if (eveService.hasMessages()) {
            <button
              class="eve-panel__action-btn"
              (click)="clearConversation()"
              title="Clear conversation"
            >
              <lucide-icon name="trash-2" [size]="18"></lucide-icon>
            </button>
          }
          <button
            class="eve-panel__action-btn"
            (click)="closePanel()"
            title="Close"
          >
            <lucide-icon name="x" [size]="20"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="eve-panel__messages" #messagesContainer>
        @if (!eveService.hasMessages()) {
          <!-- Welcome State -->
          <div class="eve-panel__welcome">
            <div class="eve-panel__welcome-icon">
              <lucide-icon name="message-circle" [size]="48"></lucide-icon>
            </div>
            <h3>How can I help you?</h3>
            <p>Ask me a question about your data, documents, or engagements.</p>

            <!-- Quick Prompts -->
            <div class="eve-panel__quick-prompts">
              @for (prompt of quickPrompts; track prompt.label) {
                <button
                  class="eve-panel__quick-prompt"
                  (click)="sendQuickPrompt(prompt.message)"
                >
                  {{ prompt.label }}
                </button>
              }
            </div>
          </div>
        } @else {
          <!-- Message List -->
          @for (message of eveService.messages(); track message.timestamp) {
            <app-eve-message [message]="message"></app-eve-message>
          }

          <!-- Loading Indicator -->
          @if (eveService.isLoading()) {
            <div class="eve-panel__loading">
              <div class="eve-panel__loading-avatar">
                <lucide-icon name="bot" [size]="18"></lucide-icon>
              </div>
              <div class="eve-panel__loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          }
        }
      </div>

      <!-- Error Message -->
      @if (eveService.error()) {
        <div class="eve-panel__error">
          <lucide-icon name="alert-circle" [size]="16"></lucide-icon>
          <span>{{ eveService.error() }}</span>
          <button (click)="eveService.clearError()">
            <lucide-icon name="x" [size]="14"></lucide-icon>
          </button>
        </div>
      }

      <!-- Input Area -->
      <div class="eve-panel__input">
        <input
          type="text"
          [(ngModel)]="inputMessage"
          (keyup.enter)="sendMessage()"
          placeholder="Ask your question..."
          [disabled]="eveService.isLoading()"
          class="eve-panel__input-field"
          #inputField
        />
        <button
          class="eve-panel__send-btn"
          (click)="sendMessage()"
          [disabled]="!canSend()"
          title="Send"
        >
          <lucide-icon name="send" [size]="18"></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* ==========================================================================
       Eve Panel Component - EY Design System
       ==========================================================================
       Slide panel styling per UX spec
       Width: 400px, Border-radius: 16px 0 0 16px
       Shadow: shadow-modal (0 8px 32px)
       Transitions: 300ms ease-out
    */

    /* Backdrop */
    .eve-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 1001;
      animation: fadeIn 200ms ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Panel - Per EY spec: 400px width, 16px radius on left side */
    .eve-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 400px;
      max-width: 100vw;
      background: #FFFFFF;
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.16); /* shadow-modal */
      border-radius: 16px 0 0 16px; /* EY spec: radius-2xl on left corners */
      z-index: 1002;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 300ms ease-out;
    }

    .eve-panel--open {
      transform: translateX(0);
    }

    /* Header - Dark gradient with EY Yellow avatar */
    .eve-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: linear-gradient(135deg, #2E2E38 0%, #1A1A2E 100%);
      color: #FFFFFF;
      border-radius: 16px 0 0 0; /* Match panel radius */
    }

    .eve-panel__header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .eve-panel__avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #FFE600; /* ey-yellow */
      color: #2E2E38;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .eve-panel__info {
      display: flex;
      flex-direction: column;
    }

    .eve-panel__title {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .eve-panel__subtitle {
      font-size: 12px;
      opacity: 0.8;
      margin: 2px 0 0 0;
    }

    .eve-panel__actions {
      display: flex;
      gap: 8px;
    }

    .eve-panel__action-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px; /* radius-lg */
      background: rgba(255, 255, 255, 0.1);
      color: #FFFFFF;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 200ms ease-out;
    }

    .eve-panel__action-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Messages Area */
    .eve-panel__messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #FAFAFA; /* neutral-50 */
    }

    /* Welcome State */
    .eve-panel__welcome {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px;
    }

    .eve-panel__welcome-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #F5F5F5; /* neutral-100 */
      color: #9CA3AF; /* neutral-400 */
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .eve-panel__welcome h3 {
      font-size: 18px;
      font-weight: 600;
      color: #2E2E38;
      margin: 0 0 8px 0;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .eve-panel__welcome p {
      font-size: 14px;
      color: #6B7280; /* neutral-500 */
      margin: 0 0 24px 0;
    }

    /* Quick Prompts */
    .eve-panel__quick-prompts {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }

    .eve-panel__quick-prompt {
      padding: 8px 16px;
      border-radius: 9999px; /* full radius for pills */
      background: #FFFFFF;
      color: #2E2E38;
      border: 1px solid #E5E5E5;
      font-size: 13px;
      font-family: 'Inter', system-ui, sans-serif;
      font-weight: 500;
      cursor: pointer;
      transition: all 200ms ease-out;
    }

    .eve-panel__quick-prompt:hover {
      background: #FFE600;
      border-color: #FFE600;
      transform: scale(1.02);
    }

    /* Loading Indicator */
    .eve-panel__loading {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .eve-panel__loading-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #2E2E38;
      color: #FFE600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .eve-panel__loading-dots {
      display: flex;
      gap: 6px;
      padding: 16px;
      background: #FFFFFF;
      border-radius: 12px 12px 12px 4px; /* chat bubble radius */
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06); /* shadow-card */
    }

    .eve-panel__loading-dots span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #9CA3AF;
      animation: loadingDot 1.4s infinite ease-in-out;
    }

    .eve-panel__loading-dots span:nth-child(1) {
      animation-delay: 0s;
    }

    .eve-panel__loading-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .eve-panel__loading-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes loadingDot {
      0%, 80%, 100% {
        transform: scale(0.6);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Error Message - Using EY error colors */
    .eve-panel__error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin: 0 16px 8px 16px;
      background: #FEE2E2; /* error-light */
      border: 1px solid #FECACA;
      border-radius: 8px; /* radius-lg */
      color: #B91C1C; /* error-dark */
      font-size: 13px;
    }

    .eve-panel__error span {
      flex: 1;
    }

    .eve-panel__error button {
      background: none;
      border: none;
      color: #B91C1C;
      cursor: pointer;
      padding: 4px;
      display: flex;
      border-radius: 4px;
      transition: background 200ms ease-out;
    }

    .eve-panel__error button:hover {
      background: rgba(185, 28, 28, 0.1);
    }

    /* Input Area */
    .eve-panel__input {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #E5E5E5;
      background: #FFFFFF;
    }

    .eve-panel__input-field {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #E5E5E5;
      border-radius: 24px;
      font-size: 14px;
      font-family: 'Inter', system-ui, sans-serif;
      color: #2E2E38;
      outline: none;
      transition: all 200ms ease-out;
    }

    .eve-panel__input-field::placeholder {
      color: #A3A3A3; /* neutral-400 */
    }

    .eve-panel__input-field:focus {
      border-color: #FFE600;
      box-shadow: 0 0 0 3px #FFF9CC; /* ey-yellow-light focus ring */
    }

    .eve-panel__input-field:disabled {
      background: #F5F5F5;
      cursor: not-allowed;
    }

    .eve-panel__send-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #2E2E38;
      color: #FFFFFF;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 200ms ease-out;
    }

    .eve-panel__send-btn:hover:not(:disabled) {
      background: #1A1A2E;
      transform: scale(1.05);
    }

    .eve-panel__send-btn:active:not(:disabled) {
      transform: scale(0.95);
    }

    .eve-panel__send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .eve-panel {
        width: 100vw;
        border-radius: 0;
      }

      .eve-panel__header {
        border-radius: 0;
      }

      .eve-panel__quick-prompts {
        flex-direction: column;
      }

      .eve-panel__quick-prompt {
        width: 100%;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvePanelComponent implements AfterViewChecked {
  protected readonly eveService = inject(EveApiService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('inputField') inputField!: ElementRef<HTMLInputElement>;

  protected inputMessage = '';
  protected readonly quickPrompts = QUICK_PROMPTS;

  private shouldScrollToBottom = false;

  readonly canSend = computed(
    () => this.inputMessage.trim().length > 0 && !this.eveService.isLoading()
  );

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.eveService.isPanelOpen()) {
      this.closePanel();
    }
  }

  closePanel(): void {
    this.eveService.closePanel();
  }

  sendMessage(): void {
    const message = this.inputMessage.trim();
    if (!message || this.eveService.isLoading()) return;

    this.inputMessage = '';
    this.shouldScrollToBottom = true;

    this.eveService
      .sendMessage(message)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.shouldScrollToBottom = true;
          this.focusInput();
        },
        error: () => {
          this.focusInput();
        },
      });
  }

  sendQuickPrompt(message: string): void {
    this.inputMessage = message;
    this.sendMessage();
  }

  clearConversation(): void {
    this.eveService
      .clearConversation()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  private focusInput(): void {
    if (this.inputField?.nativeElement) {
      this.inputField.nativeElement.focus();
    }
  }
}
