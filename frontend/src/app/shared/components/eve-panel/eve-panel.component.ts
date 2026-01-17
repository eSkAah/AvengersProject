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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EveApiService } from '../../../core/services/eve-api.service';
import { EveMessageComponent } from '../eve-message/eve-message.component';

/** Predefined prompts for quick actions */
const QUICK_PROMPTS = [
  { label: 'Documents manquants', message: 'Quels documents manquent pour cet engagement ?' },
  { label: 'Statut engagement', message: 'Quel est le statut actuel de l\'engagement ?' },
  { label: 'Prochaines étapes', message: 'Quelles sont les prochaines étapes ?' },
  { label: 'Risques identifiés', message: 'Quels sont les risques identifiés ?' },
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
                Assistante IA contextuelle
              }
            </p>
          </div>
        </div>
        <div class="eve-panel__actions">
          @if (eveService.hasMessages()) {
            <button
              class="eve-panel__action-btn"
              (click)="clearConversation()"
              title="Effacer la conversation"
            >
              <lucide-icon name="trash-2" [size]="18"></lucide-icon>
            </button>
          }
          <button
            class="eve-panel__action-btn"
            (click)="closePanel()"
            title="Fermer"
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
            <h3>Comment puis-je vous aider ?</h3>
            <p>Posez-moi une question sur vos données, documents ou engagements.</p>

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
          placeholder="Posez votre question..."
          [disabled]="eveService.isLoading()"
          class="eve-panel__input-field"
          #inputField
        />
        <button
          class="eve-panel__send-btn"
          (click)="sendMessage()"
          [disabled]="!canSend()"
          title="Envoyer"
        >
          <lucide-icon name="send" [size]="18"></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
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

    /* Panel */
    .eve-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      max-width: 100vw;
      height: 100vh;
      background: #FFFFFF;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
      z-index: 1002;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .eve-panel--open {
      transform: translateX(0);
    }

    /* Header */
    .eve-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: linear-gradient(135deg, #2E2E38 0%, #1E1E28 100%);
      color: #FFFFFF;
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
      background: #FFE600;
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
      border-radius: 8px;
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
      background: #F5F5F5;
      color: #9CA3AF;
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
    }

    .eve-panel__welcome p {
      font-size: 14px;
      color: #6B7280;
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
      border-radius: 20px;
      background: #F5F5F5;
      color: #2E2E38;
      border: 1px solid #E5E5E5;
      font-size: 13px;
      cursor: pointer;
      transition: all 200ms ease-out;
    }

    .eve-panel__quick-prompt:hover {
      background: #FFE600;
      border-color: #FFE600;
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
      background: #F5F5F5;
      border-radius: 16px 16px 16px 4px;
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

    /* Error Message */
    .eve-panel__error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin: 0 16px 8px 16px;
      background: #FEF2F2;
      border: 1px solid #FEE2E2;
      border-radius: 8px;
      color: #DC2626;
      font-size: 13px;
    }

    .eve-panel__error span {
      flex: 1;
    }

    .eve-panel__error button {
      background: none;
      border: none;
      color: #DC2626;
      cursor: pointer;
      padding: 4px;
      display: flex;
    }

    /* Input Area */
    .eve-panel__input {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #E5E5E5;
      background: #FAFAFA;
    }

    .eve-panel__input-field {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #E5E5E5;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
      transition: all 200ms ease-out;
    }

    .eve-panel__input-field:focus {
      border-color: #FFE600;
      box-shadow: 0 0 0 3px rgba(255, 230, 0, 0.1);
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
      background: #1E1E28;
      transform: scale(1.05);
    }

    .eve-panel__send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .eve-panel {
        width: 100vw;
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
