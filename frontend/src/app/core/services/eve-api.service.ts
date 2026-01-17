import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

// =============================================================================
// Types
// =============================================================================

export interface SourceReference {
  document: string;
  page?: number;
  line?: number;
}

export interface ChatRequest {
  message: string;
  engagement_id?: string;
  context?: Record<string, unknown>;
}

export interface ChatResponse {
  message: string;
  sources?: SourceReference[];
  engagement_id?: string;
  timestamp: string;
}

export interface ExplainRequest {
  value: string;
  label: string;
  engagement_id: string;
  context?: Record<string, unknown>;
}

export interface EveBreakdownItem {
  label: string;
  value: string;
}

export interface ComparisonData {
  previous_value: string;
  variance_percent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ExplainResponse {
  explanation: string;
  breakdown?: EveBreakdownItem[];
  comparison?: ComparisonData;
  source_document?: string;
  source_line?: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationHistory {
  engagement_id: string;
  messages: ConversationMessage[];
}

// =============================================================================
// Service
// =============================================================================

@Injectable({
  providedIn: 'root',
})
export class EveApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // Panel state
  readonly isPanelOpen = signal(false);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Current engagement context
  readonly currentEngagementId = signal<string | null>(null);
  readonly currentEngagementName = signal<string | null>(null);

  // Messages
  readonly messages = signal<ConversationMessage[]>([]);

  // Computed states
  readonly hasMessages = computed(() => this.messages().length > 0);
  readonly lastMessage = computed(() => {
    const msgs = this.messages();
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  });

  // Message count for badge (unread)
  private readonly _unreadCount = signal(0);
  readonly unreadCount = this._unreadCount.asReadonly();

  /**
   * Open Eve panel
   */
  openPanel(): void {
    this.isPanelOpen.set(true);
    this._unreadCount.set(0); // Clear unread count when panel opens
  }

  /**
   * Close Eve panel
   */
  closePanel(): void {
    this.isPanelOpen.set(false);
  }

  /**
   * Toggle Eve panel
   */
  togglePanel(): void {
    if (this.isPanelOpen()) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  /**
   * Set current engagement context
   */
  setEngagementContext(engagementId: string | null, engagementName?: string): void {
    const previousId = this.currentEngagementId();
    this.currentEngagementId.set(engagementId);
    this.currentEngagementName.set(engagementName ?? null);

    // Clear messages if engagement changed
    if (previousId !== engagementId) {
      this.messages.set([]);
    }
  }

  /**
   * Send a chat message to Eve
   */
  sendMessage(message: string): Observable<ChatResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    const request: ChatRequest = {
      message,
      engagement_id: this.currentEngagementId() ?? undefined,
    };

    // Add user message immediately
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    this.messages.update((msgs) => [...msgs, userMessage]);

    return this.http.post<ChatResponse>(`${this.baseUrl}/eve/chat`, request).pipe(
      tap((response) => {
        // Add Eve's response
        const eveMessage: ConversationMessage = {
          role: 'assistant',
          content: response.message,
          timestamp: response.timestamp,
        };
        this.messages.update((msgs) => [...msgs, eveMessage]);
        this.isLoading.set(false);

        // Increment unread if panel is closed
        if (!this.isPanelOpen()) {
          this._unreadCount.update((count) => count + 1);
        }
      }),
      catchError((error) => {
        console.error('Error sending message to Eve:', error);
        this.isLoading.set(false);
        this.error.set('Impossible de contacter Eve. Veuillez réessayer.');
        return throwError(() => error);
      })
    );
  }

  /**
   * Explain a value (CMD+Click)
   */
  explainValue(
    value: string,
    label: string,
    engagementId: string,
    context?: Record<string, unknown>
  ): Observable<ExplainResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    const request: ExplainRequest = {
      value,
      label,
      engagement_id: engagementId,
      context,
    };

    // Add user's explain request as a message
    const userMessage: ConversationMessage = {
      role: 'user',
      content: `Expliquez-moi la valeur "${label}: ${value}"`,
      timestamp: new Date().toISOString(),
    };
    this.messages.update((msgs) => [...msgs, userMessage]);

    return this.http.post<ExplainResponse>(`${this.baseUrl}/eve/explain`, request).pipe(
      tap((response) => {
        // Format explanation as a message
        let formattedMessage = response.explanation;

        // Add breakdown if present
        if (response.breakdown && response.breakdown.length > 0) {
          formattedMessage += '\n\nDétail :';
          response.breakdown.forEach((item) => {
            formattedMessage += `\n- ${item.label}: ${item.value}`;
          });
        }

        // Add comparison if present
        if (response.comparison) {
          const trend =
            response.comparison.trend === 'up'
              ? 'en hausse'
              : response.comparison.trend === 'down'
                ? 'en baisse'
                : 'stable';
          formattedMessage += `\n\nComparaison N-1 : ${response.comparison.previous_value} (${response.comparison.variance_percent > 0 ? '+' : ''}${response.comparison.variance_percent.toFixed(1)}%, ${trend})`;
        }

        // Add source if present
        if (response.source_document) {
          formattedMessage += `\n\nSource : ${response.source_document}`;
          if (response.source_line) {
            formattedMessage += `, ligne ${response.source_line}`;
          }
        }

        const eveMessage: ConversationMessage = {
          role: 'assistant',
          content: formattedMessage,
          timestamp: new Date().toISOString(),
        };
        this.messages.update((msgs) => [...msgs, eveMessage]);
        this.isLoading.set(false);

        // Increment unread if panel is closed
        if (!this.isPanelOpen()) {
          this._unreadCount.update((count) => count + 1);
        }
      }),
      catchError((error) => {
        console.error('Error explaining value:', error);
        this.isLoading.set(false);
        this.error.set('Impossible d\'analyser cette valeur. Veuillez réessayer.');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get conversation history from backend
   */
  getConversationHistory(engagementId: string): Observable<ConversationHistory> {
    return this.http
      .get<ConversationHistory>(`${this.baseUrl}/eve/conversations/${engagementId}`)
      .pipe(
        tap((history) => {
          this.messages.set(history.messages);
        }),
        catchError((error) => {
          // 404 means no conversation exists yet - that's OK
          if (error.status === 404) {
            this.messages.set([]);
            return throwError(() => error);
          }
          console.error('Error fetching conversation history:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Clear conversation history
   */
  clearConversation(): Observable<void> {
    const engagementId = this.currentEngagementId();
    if (!engagementId) {
      this.messages.set([]);
      return new Observable((subscriber) => {
        subscriber.next();
        subscriber.complete();
      });
    }

    return this.http.delete<void>(`${this.baseUrl}/eve/conversations/${engagementId}`).pipe(
      tap(() => {
        this.messages.set([]);
      }),
      catchError((error) => {
        console.error('Error clearing conversation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }
}
