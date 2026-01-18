import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  DestroyRef,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { BreadcrumbComponent, BreadcrumbItem, EveMessageComponent } from '../../shared';
import { EveApiService } from '../../core/services/eve-api.service';

@Component({
  selector: 'app-eve',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BreadcrumbComponent, EveMessageComponent],
  template: `
    <div class="eve-page">
      <app-breadcrumb [items]="breadcrumbs"></app-breadcrumb>

      <div class="eve-container">
        <div class="eve-header">
          <div class="eve-avatar">
            <lucide-icon name="bot" [size]="48"></lucide-icon>
          </div>
          <div class="eve-info">
            <h1>Eve</h1>
            <p>
              @if (eveService.currentEngagementName()) {
                {{ eveService.currentEngagementName() }}
              } @else {
                Your AI contextual assistant
              }
            </p>
          </div>
          <div class="eve-context-badge" [class.eve-context-badge--engagement]="eveService.contextMode() === 'engagement'">
            <lucide-icon [name]="eveService.contextMode() === 'engagement' ? 'briefcase' : 'globe'" [size]="14"></lucide-icon>
            <span>{{ eveService.contextMode() === 'engagement' ? 'Engagement' : 'Global' }}</span>
          </div>
        </div>

        @if (eveService.lastContextSwitch()) {
          <div class="eve-context-switch">
            <lucide-icon name="arrow-right-left" [size]="14"></lucide-icon>
            <span>Context switched to {{ eveService.lastContextSwitch()?.engagement }}</span>
            <button (click)="eveService.clearContextSwitch()">
              <lucide-icon name="x" [size]="12"></lucide-icon>
            </button>
          </div>
        }

        <div class="eve-chat" #messagesContainer>
          @if (!eveService.hasMessages()) {
            <div class="eve-welcome">
              <lucide-icon name="message-circle" [size]="64"></lucide-icon>
              <h2>How can I help you?</h2>
              <p>Ask me a question about your financial data, documents, or engagements.</p>
            </div>
          } @else {
            @for (message of eveService.messages(); track message.timestamp) {
              <app-eve-message [message]="message"></app-eve-message>
            }

            @if (eveService.isLoading()) {
              <div class="loading-indicator">
                <div class="loading-avatar">
                  <lucide-icon name="bot" [size]="18"></lucide-icon>
                </div>
                <div class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            }
          }
        </div>

        @if (eveService.error()) {
          <div class="eve-error">
            <lucide-icon name="alert-circle" [size]="16"></lucide-icon>
            <span>{{ eveService.error() }}</span>
            <button (click)="eveService.clearError()">
              <lucide-icon name="x" [size]="14"></lucide-icon>
            </button>
          </div>
        }

        <div class="eve-input">
          <input
            type="text"
            placeholder="Ask Eve your question..."
            [value]="inputValue()"
            (input)="onInputChange($event)"
            (keyup.enter)="onSend()"
            [disabled]="eveService.isLoading()"
            #inputField
          />
          <button class="eve-send" (click)="onSend()" [disabled]="!inputValue() || eveService.isLoading()">
            <lucide-icon name="send" [size]="20"></lucide-icon>
          </button>
        </div>
      </div>

      <button class="btn btn--outline back-btn" (click)="goBack()">
        <lucide-icon name="arrow-left" [size]="18"></lucide-icon>
        Back
      </button>
    </div>
  `,
  styles: [`
    .eve-page {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
      min-height: calc(100vh - 48px);
      display: flex;
      flex-direction: column;
    }

    .eve-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #FFFFFF;
      border: 1px solid #E5E5E5;
      border-radius: 16px;
      overflow: hidden;
      margin: 16px 0;
    }

    .eve-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      background: linear-gradient(135deg, #2E2E38 0%, #1E1E28 100%);
      color: #FFFFFF;
    }

    .eve-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #FFE600;
      color: #2E2E38;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .eve-info h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }

    .eve-info p {
      font-size: 14px;
      opacity: 0.8;
      margin: 0;
    }

    .eve-chat {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .eve-welcome {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #6B7280;
    }

    .eve-welcome lucide-icon {
      color: #D4D4D4;
      margin-bottom: 16px;
    }

    .eve-welcome h2 {
      font-size: 20px;
      font-weight: 600;
      color: #2E2E38;
      margin: 0 0 8px 0;
    }

    .eve-welcome p {
      font-size: 14px;
      margin: 0;
    }

    .chat-message {
      display: flex;
      gap: 12px;
    }

    .chat-message--user {
      justify-content: flex-end;
    }

    .chat-message--user .chat-message__content {
      background: #FFE600;
      color: #2E2E38;
      border-radius: 16px 16px 4px 16px;
      padding: 12px 16px;
      max-width: 80%;
    }

    .chat-message--eve {
      align-items: flex-start;
    }

    .chat-message__avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #2E2E38;
      color: #FFE600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .chat-message--eve .chat-message__content {
      background: #F5F5F5;
      border-radius: 16px 16px 16px 4px;
      padding: 16px;
      max-width: 80%;
    }

    .chat-message--eve .chat-message__content p {
      margin: 0 0 12px 0;
    }

    .chat-message--eve .chat-message__content p:last-child {
      margin-bottom: 0;
    }

    .chat-message__note {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #9CA3AF;
      padding: 8px 12px;
      background: #FFFFFF;
      border-radius: 8px;
      margin-top: 12px !important;
    }

    .eve-input {
      display: flex;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #E5E5E5;
      background: #FAFAFA;
    }

    .eve-input input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #E5E5E5;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 200ms ease-out;
    }

    .eve-input input:focus {
      border-color: #FFE600;
    }

    .eve-send {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      background: #2E2E38;
      color: #FFFFFF;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 200ms ease-out;
    }

    .eve-send:hover:not(:disabled) {
      background: #1E1E28;
    }

    .eve-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .back-btn {
      align-self: flex-start;
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

    .loading-indicator {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }

    .loading-avatar {
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

    .loading-dots {
      display: flex;
      gap: 6px;
      padding: 16px;
      background: #F5F5F5;
      border-radius: 16px 16px 16px 4px;
    }

    .loading-dots span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #9CA3AF;
      animation: loadingDot 1.4s infinite ease-in-out;
    }

    .loading-dots span:nth-child(1) { animation-delay: 0s; }
    .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes loadingDot {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    .eve-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin: 0 24px 8px 24px;
      background: #FEF2F2;
      border: 1px solid #FEE2E2;
      border-radius: 8px;
      color: #DC2626;
      font-size: 13px;
    }

    .eve-error span { flex: 1; }

    .eve-error button {
      background: none;
      border: none;
      color: #DC2626;
      cursor: pointer;
      padding: 4px;
      display: flex;
    }

    .eve-context-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.15);
      font-size: 12px;
      font-weight: 500;
      margin-left: auto;
    }

    .eve-context-badge--engagement {
      background: #FFE600;
      color: #2E2E38;
    }

    .eve-context-switch {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(90deg, rgba(255, 230, 0, 0.15) 0%, rgba(255, 230, 0, 0.05) 100%);
      border-left: 3px solid #FFE600;
      font-size: 13px;
      color: #2E2E38;
    }

    .eve-context-switch span { flex: 1; }

    .eve-context-switch button {
      background: none;
      border: none;
      color: #6B7280;
      cursor: pointer;
      padding: 4px;
      display: flex;
      border-radius: 4px;
    }

    .eve-context-switch button:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EveComponent implements OnInit, AfterViewChecked {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly eveService = inject(EveApiService);

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('inputField') inputField!: ElementRef<HTMLInputElement>;

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Eve' },
  ];

  readonly inputValue = signal('');
  private engagementId: string | null = null;
  private shouldScrollToBottom = false;

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const question = params.get('question');
        this.engagementId = params.get('engagement');

        // Set engagement context
        if (this.engagementId) {
          this.eveService.setEngagementContext(this.engagementId);
        }

        // Send initial question if provided
        if (question) {
          this.sendMessage(question);
        }
      });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.inputValue.set(input.value);
  }

  onSend(): void {
    const value = this.inputValue();
    if (value.trim() && !this.eveService.isLoading()) {
      this.sendMessage(value);
      this.inputValue.set('');
    }
  }

  private sendMessage(message: string): void {
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

  goBack(): void {
    if (this.engagementId) {
      this.router.navigate(['/app/engagements', this.engagementId]);
    } else {
      this.router.navigate(['/app']);
    }
  }
}
