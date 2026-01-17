import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared';

@Component({
  selector: 'app-eve',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, BreadcrumbComponent],
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
            <p>Votre assistante IA contextuelle</p>
          </div>
        </div>

        <div class="eve-chat">
          @if (initialQuestion()) {
            <div class="chat-message chat-message--user">
              <div class="chat-message__content">
                {{ initialQuestion() }}
              </div>
            </div>
            <div class="chat-message chat-message--eve">
              <div class="chat-message__avatar">
                <lucide-icon name="bot" [size]="20"></lucide-icon>
              </div>
              <div class="chat-message__content">
                <p>Bonjour, je suis Eve, votre assistante IA spécialisée dans l'audit financier.</p>
                <p>Je serais ravie de vous aider avec votre question concernant : <strong>{{ initialQuestion() }}</strong></p>
                <p class="chat-message__note">
                  <lucide-icon name="info" [size]="14"></lucide-icon>
                  Cette fonctionnalité sera disponible dans une prochaine version.
                </p>
              </div>
            </div>
          } @else {
            <div class="eve-welcome">
              <lucide-icon name="message-circle" [size]="64"></lucide-icon>
              <h2>Comment puis-je vous aider ?</h2>
              <p>Posez-moi une question sur vos données financières, documents ou engagements.</p>
            </div>
          }
        </div>

        <div class="eve-input">
          <input
            type="text"
            placeholder="Posez votre question à Eve..."
            [value]="inputValue()"
            (input)="onInputChange($event)"
            (keyup.enter)="onSend()"
          />
          <button class="eve-send" (click)="onSend()" [disabled]="!inputValue()">
            <lucide-icon name="send" [size]="20"></lucide-icon>
          </button>
        </div>
      </div>

      <button class="btn btn--outline back-btn" (click)="goBack()">
        <lucide-icon name="arrow-left" [size]="18"></lucide-icon>
        Retour
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EveComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Eve' },
  ];

  readonly initialQuestion = signal<string | null>(null);
  readonly inputValue = signal('');
  private engagementId: string | null = null;

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.initialQuestion.set(params.get('question'));
        this.engagementId = params.get('engagement');
      });
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.inputValue.set(input.value);
  }

  onSend(): void {
    const value = this.inputValue();
    if (value.trim()) {
      // Placeholder - would send to Eve API
      console.log('Sending to Eve:', value, 'Engagement:', this.engagementId);
      this.inputValue.set('');
    }
  }

  goBack(): void {
    if (this.engagementId) {
      this.router.navigate(['/engagements', this.engagementId, 'dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
