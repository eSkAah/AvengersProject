import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, throwError, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MOCK_ENGAGEMENTS } from '../mocks/engagements.mock';
import { MOCK_DOCUMENTS } from '../mocks/documents.mock';

// Enable mock mode for demo (no backend required)
const USE_MOCK_MODE = true;

// =============================================================================
// Types
// =============================================================================

export interface SourceReference {
  document: string;
  page?: number;
  line?: number;
}

export type EveContextMode = 'global' | 'engagement';

export interface AppContext {
  currentPage: string;
  engagementId?: string;
  engagementName?: string;
  documentId?: string;
  filters?: Record<string, string>;
  selectedKpis?: string[];
}

export interface ChatRequest {
  message: string;
  engagement_id?: string;
  context?: Record<string, unknown>;
  app_context?: AppContext;
  mode?: EveContextMode;
}

export interface ChatResponse {
  message: string;
  sources?: SourceReference[];
  engagement_id?: string;
  engagement_name?: string;
  timestamp: string;
  response_type?: 'text' | 'gantt' | 'chart';
  data?: unknown;
  mode?: EveContextMode;
  context_switched?: boolean;
  switched_from?: EveContextMode;
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
  response_type?: 'text' | 'gantt' | 'chart';
  data?: unknown;
  sources?: SourceReference[];
  context_switched?: boolean;
  switched_to_engagement?: string;
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

  // Context mode (global vs engagement)
  readonly contextMode = signal<EveContextMode>('global');

  // Current engagement context
  readonly currentEngagementId = signal<string | null>(null);
  readonly currentEngagementName = signal<string | null>(null);

  // Context switch notification
  readonly lastContextSwitch = signal<{
    from: EveContextMode;
    to: EveContextMode;
    engagement?: string;
  } | null>(null);

  // App context (current page, filters, etc.)
  private readonly _appContext = signal<AppContext>({ currentPage: 'home' });
  readonly appContext = this._appContext.asReadonly();

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

    // Update context mode
    if (engagementId) {
      this.contextMode.set('engagement');
    } else {
      this.contextMode.set('global');
    }

    // Clear messages if engagement changed
    if (previousId !== engagementId) {
      this.messages.set([]);
      this.lastContextSwitch.set(null);
    }
  }

  /**
   * Set global context mode (no engagement)
   */
  setGlobalContext(): void {
    this.currentEngagementId.set(null);
    this.currentEngagementName.set(null);
    this.contextMode.set('global');
    this.messages.set([]);
    this.lastContextSwitch.set(null);
  }

  /**
   * Clear context switch notification
   */
  clearContextSwitch(): void {
    this.lastContextSwitch.set(null);
  }

  /**
   * Update app context (called when user navigates or changes filters)
   */
  updateAppContext(context: Partial<AppContext>): void {
    this._appContext.update(current => ({
      ...current,
      ...context,
    }));
  }

  /**
   * Set current page context
   */
  setCurrentPage(page: string): void {
    this._appContext.update(current => ({
      ...current,
      currentPage: page,
    }));
  }

  /**
   * Send a chat message to Eve
   */
  sendMessage(message: string): Observable<ChatResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    // Add user message immediately
    const userMessage: ConversationMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    this.messages.update(msgs => [...msgs, userMessage]);

    // Use mock mode for demo
    if (USE_MOCK_MODE) {
      return this.sendMockMessage(message);
    }

    const request: ChatRequest = {
      message,
      engagement_id: this.currentEngagementId() ?? undefined,
      mode: this.contextMode(),
      app_context: {
        ...this._appContext(),
        engagementId: this.currentEngagementId() ?? undefined,
        engagementName: this.currentEngagementName() ?? undefined,
      },
    };

    return this.http.post<ChatResponse>(`${this.baseUrl}/eve/chat`, request).pipe(
      tap(response => {
        // Handle context switch from backend (auto-switch)
        if (response.context_switched && response.mode === 'engagement') {
          this.lastContextSwitch.set({
            from: 'global',
            to: 'engagement',
            engagement: response.engagement_name,
          });
          // Update context
          this.currentEngagementId.set(response.engagement_id ?? null);
          this.currentEngagementName.set(response.engagement_name ?? null);
          this.contextMode.set('engagement');
        }

        // Add Eve's response with sources and context info
        const eveMessage: ConversationMessage = {
          role: 'assistant',
          content: response.message,
          timestamp: response.timestamp,
          response_type: response.response_type,
          data: response.data,
          sources: response.sources,
          context_switched: response.context_switched,
          switched_to_engagement: response.engagement_name,
        };
        this.messages.update(msgs => [...msgs, eveMessage]);
        this.isLoading.set(false);

        // Increment unread if panel is closed
        if (!this.isPanelOpen()) {
          this._unreadCount.update(count => count + 1);
        }
      }),
      catchError(error => {
        this.isLoading.set(false);

        // Better error messages based on error type
        if (error.status === 0) {
          this.error.set('Unable to connect to server. Check your connection.');
        } else if (error.status === 503) {
          this.error.set('Eve service is temporarily unavailable. Please try again in a moment.');
        } else if (error.status === 429) {
          this.error.set('Too many requests. Please wait a few seconds.');
        } else {
          this.error.set('Unable to contact Eve. Please try again.');
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Send mock message (for demo without backend)
   */
  private sendMockMessage(message: string): Observable<ChatResponse> {
    // Simulate network delay (300-800ms)
    const mockDelay = 300 + Math.random() * 500;

    return of(this.generateMockResponse(message)).pipe(
      delay(mockDelay),
      tap(response => {
        const eveMessage: ConversationMessage = {
          role: 'assistant',
          content: response.message,
          timestamp: response.timestamp,
          response_type: response.response_type,
          data: response.data,
          sources: response.sources,
        };
        this.messages.update(msgs => [...msgs, eveMessage]);
        this.isLoading.set(false);

        if (!this.isPanelOpen()) {
          this._unreadCount.update(count => count + 1);
        }
      })
    );
  }

  /**
   * Explain value mock (for demo without backend)
   */
  private explainValueMock(
    value: string,
    label: string,
    engagementId: string,
    context?: Record<string, unknown>
  ): Observable<ExplainResponse> {
    const mockDelay = 400 + Math.random() * 400;
    const response = this.generateMockExplainResponse(label, value, engagementId, context);

    return of(response).pipe(
      delay(mockDelay),
      tap(res => {
        // Format explanation as a message
        let formattedMessage = res.explanation;

        if (res.breakdown && res.breakdown.length > 0) {
          formattedMessage += '\n\n**Details:**';
          res.breakdown.forEach(item => {
            formattedMessage += `\n• ${item.label}: ${item.value}`;
          });
        }

        if (res.comparison) {
          const trend =
            res.comparison.trend === 'up'
              ? '📈 up'
              : res.comparison.trend === 'down'
                ? '📉 down'
                : '➡️ stable';
          formattedMessage += `\n\n**YoY Comparison:** ${res.comparison.previous_value} (${res.comparison.variance_percent > 0 ? '+' : ''}${res.comparison.variance_percent.toFixed(1)}%, ${trend})`;
        }

        if (res.source_document) {
          formattedMessage += `\n\n📄 **Source:** ${res.source_document}`;
          if (res.source_line) {
            formattedMessage += `, line ${res.source_line}`;
          }
        }

        const eveMessage: ConversationMessage = {
          role: 'assistant',
          content: formattedMessage,
          timestamp: new Date().toISOString(),
        };
        this.messages.update(msgs => [...msgs, eveMessage]);
        this.isLoading.set(false);

        if (!this.isPanelOpen()) {
          this._unreadCount.update(count => count + 1);
        }
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

    // Add user's explain request as a message
    const userMessage: ConversationMessage = {
      role: 'user',
      content: `Explain the value "${label}: ${value}"`,
      timestamp: new Date().toISOString(),
    };
    this.messages.update(msgs => [...msgs, userMessage]);

    // Use mock mode for demo
    if (USE_MOCK_MODE) {
      return this.explainValueMock(value, label, engagementId, context);
    }

    const request: ExplainRequest = {
      value,
      label,
      engagement_id: engagementId,
      context,
    };

    return this.http.post<ExplainResponse>(`${this.baseUrl}/eve/explain`, request).pipe(
      tap(response => {
        // Format explanation as a message
        let formattedMessage = response.explanation;

        // Add breakdown if present
        if (response.breakdown && response.breakdown.length > 0) {
          formattedMessage += '\n\nDetails:';
          response.breakdown.forEach(item => {
            formattedMessage += `\n- ${item.label}: ${item.value}`;
          });
        }

        // Add comparison if present
        if (response.comparison) {
          const trend =
            response.comparison.trend === 'up'
              ? 'up'
              : response.comparison.trend === 'down'
                ? 'down'
                : 'stable';
          formattedMessage += `\n\nYoY Comparison: ${response.comparison.previous_value} (${response.comparison.variance_percent > 0 ? '+' : ''}${response.comparison.variance_percent.toFixed(1)}%, ${trend})`;
        }

        // Add source if present
        if (response.source_document) {
          formattedMessage += `\n\nSource: ${response.source_document}`;
          if (response.source_line) {
            formattedMessage += `, line ${response.source_line}`;
          }
        }

        const eveMessage: ConversationMessage = {
          role: 'assistant',
          content: formattedMessage,
          timestamp: new Date().toISOString(),
        };
        this.messages.update(msgs => [...msgs, eveMessage]);
        this.isLoading.set(false);

        // Increment unread if panel is closed
        if (!this.isPanelOpen()) {
          this._unreadCount.update(count => count + 1);
        }
      }),
      catchError(error => {
        this.isLoading.set(false);
        this.error.set('Unable to analyze this value. Please try again.');
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
        tap(history => {
          this.messages.set(history.messages);
        }),
        catchError(error => {
          // 404 means no conversation exists yet - that's OK
          if (error.status === 404) {
            this.messages.set([]);
          }
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
      return new Observable(subscriber => {
        subscriber.next();
        subscriber.complete();
      });
    }

    return this.http.delete<void>(`${this.baseUrl}/eve/conversations/${engagementId}`).pipe(
      tap(() => {
        this.messages.set([]);
      }),
      catchError(error => {
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

  // =============================================================================
  // Mock Mode - Simulated Responses for Demo
  // =============================================================================

  /**
   * Generate a mock response based on the user's message and context
   */
  private generateMockResponse(message: string): ChatResponse {
    const engagementId = this.currentEngagementId();
    const engagement = engagementId ? MOCK_ENGAGEMENTS.find(e => e.id === engagementId) : null;
    const docs = engagementId
      ? MOCK_DOCUMENTS.filter(d => d.engagementIds.includes(engagementId))
      : MOCK_DOCUMENTS;

    const lowerMessage = message.toLowerCase();

    // Context-aware responses
    if (engagement) {
      // Engagement-specific questions
      if (
        lowerMessage.includes('document') ||
        lowerMessage.includes('file') ||
        lowerMessage.includes('missing')
      ) {
        return this.mockDocumentStatusResponse(engagement, docs);
      }
      if (lowerMessage.includes('risque') || lowerMessage.includes('risk')) {
        return this.mockRiskResponse(engagement);
      }
      if (lowerMessage.includes('actif') || lowerMessage.includes('assets')) {
        return this.mockAssetsResponse(engagement, docs);
      }
      if (
        lowerMessage.includes('passif') ||
        lowerMessage.includes('liabilities') ||
        lowerMessage.includes('dette')
      ) {
        return this.mockLiabilitiesResponse(engagement, docs);
      }
      if (
        lowerMessage.includes('chiffre') ||
        lowerMessage.includes('revenue') ||
        lowerMessage.includes('ca')
      ) {
        return this.mockRevenueResponse(engagement, docs);
      }
      if (
        lowerMessage.includes('deadline') ||
        lowerMessage.includes('due') ||
        lowerMessage.includes('date')
      ) {
        return this.mockDeadlineResponse(engagement);
      }
      if (lowerMessage.includes('status') || lowerMessage.includes('progress')) {
        return this.mockStatusResponse(engagement, docs);
      }
      if (
        lowerMessage.includes('variation') ||
        lowerMessage.includes('n-1') ||
        lowerMessage.includes('comparison') ||
        lowerMessage.includes('yoy')
      ) {
        return this.mockVariationResponse(engagement, docs);
      }

      // Default engagement response
      return this.mockDefaultEngagementResponse(engagement, docs);
    }

    // Global context responses
    if (lowerMessage.includes('engagement') || lowerMessage.includes('list')) {
      return this.mockEngagementListResponse();
    }
    if (
      lowerMessage.includes('risk') ||
      lowerMessage.includes('critical') ||
      lowerMessage.includes('urgent')
    ) {
      return this.mockGlobalRiskResponse();
    }
    if (
      lowerMessage.includes('bonjour') ||
      lowerMessage.includes('hello') ||
      lowerMessage.includes('salut')
    ) {
      return this.mockGreetingResponse();
    }

    // Default global response
    return this.mockDefaultGlobalResponse();
  }

  private mockGreetingResponse(): ChatResponse {
    return {
      message: `Hello, I'm Eve, your tax assistant. I can help you:

- Analyze your engagements and their status
- Understand the financial data of your entities
- Identify missing documents
- Explain YoY variations
- Assess tax risks

How can I help you today?`,
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'global',
    };
  }

  private mockDocumentStatusResponse(
    engagement: (typeof MOCK_ENGAGEMENTS)[0],
    docs: typeof MOCK_DOCUMENTS
  ): ChatResponse {
    const requirements = engagement.documentRequirements ?? [];
    const missing = requirements.filter(r => r.status === 'missing' && r.required);
    const uploaded = requirements.filter(r => r.status !== 'missing');

    let message = `**Document Status for ${engagement.entity}**\n\n`;

    if (missing.length === 0) {
      message += `All required documents have been uploaded.\n\n`;
    } else {
      message += `**${missing.length} missing document(s):**\n`;
      missing.forEach(m => {
        message += `- ${m.label} (${m.fiscalYear})\n`;
      });
      message += '\n';
    }

    message += `**Documents received (${uploaded.length}):**\n`;
    uploaded.forEach(u => {
      const doc = docs.find(d => d.type === u.type);
      const statusIcon = u.status === 'validated' ? '✅' : '🔄';
      message += `• ${statusIcon} ${u.label}`;
      if (doc) {
        message += ` - ${doc.name}`;
      }
      message += '\n';
    });

    return {
      message,
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'engagement',
      sources: docs.slice(0, 2).map(d => ({ document: d.name, page: 1 })),
    };
  }

  private mockRiskResponse(engagement: (typeof MOCK_ENGAGEMENTS)[0]): ChatResponse {
    const riskMessages: Record<string, string> = {
      high: `**HIGH Risk Level** for ${engagement.entity}

**Identified risk factors:**
- Approaching deadline (${engagement.dueDate})
- Only ${engagement.completionPercent}% complete
- Required documents missing

**Recommendations:**
1. Prioritize uploading missing documents
2. Schedule a review with the team
3. Anticipate validation delays

I recommend treating this engagement as a priority.`,

      medium: `**MEDIUM Risk Level** for ${engagement.entity}

**Points of attention:**
- Progress at ${engagement.completionPercent}%
- Due date: ${engagement.dueDate}
- Some documents awaiting validation

**Situation:**
The engagement is progressing well but requires regular monitoring to ensure deadlines are met.`,

      low: `**LOW Risk Level** for ${engagement.entity}

The engagement is on track with ${engagement.completionPercent}% completion.
All indicators are green.`,
    };

    return {
      message: riskMessages[engagement.riskLevel] ?? riskMessages['medium'],
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'engagement',
    };
  }

  private mockAssetsResponse(
    engagement: (typeof MOCK_ENGAGEMENTS)[0],
    docs: typeof MOCK_DOCUMENTS
  ): ChatResponse {
    const fd = engagement.financialData;
    const prevAssets = fd.previousYear?.assets ?? 0;
    const variation =
      prevAssets > 0 ? (((fd.assets - prevAssets) / prevAssets) * 100).toFixed(1) : 'N/A';
    const trend = fd.assets > prevAssets ? '📈 up' : '📉 down';

    const trialBalance = docs.find(d => d.type === 'trial_balance');

    return {
      message: `**Assets for ${engagement.entity}**

| Indicator | Value |
|-----------|-------|
| Total Assets | ${this.formatEuro(fd.assets)} |
| Assets PY | ${this.formatEuro(prevAssets)} |
| Variation | ${variation}% (${trend}) |

**Analysis:**
The assets of ${engagement.entity} amount to ${this.formatEuro(fd.assets)}, representing a ${variation}% variation compared to the previous year.

${trialBalance ? `Source: ${trialBalance.name}` : ''}`,
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'engagement',
      sources: trialBalance ? [{ document: trialBalance.name, page: 1 }] : [],
    };
  }

  private mockLiabilitiesResponse(
    engagement: (typeof MOCK_ENGAGEMENTS)[0],
    docs: typeof MOCK_DOCUMENTS
  ): ChatResponse {
    const fd = engagement.financialData;
    const prevLiab = fd.previousYear?.liabilities ?? 0;
    const variation =
      prevLiab > 0 ? (((fd.liabilities - prevLiab) / prevLiab) * 100).toFixed(1) : 'N/A';

    return {
      message: `**Liabilities for ${engagement.entity}**

| Indicator | Value |
|-----------|-------|
| Total Liabilities | ${this.formatEuro(fd.liabilities)} |
| Liabilities PY | ${this.formatEuro(prevLiab)} |
| Variation | ${variation}% |
| D/E Ratio | ${((fd.liabilities / (fd.assets - fd.liabilities)) * 100).toFixed(0)}% |

The debt level is ${fd.liabilities / fd.assets > 0.6 ? 'relatively high' : 'under control'}.`,
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'engagement',
    };
  }

  private mockRevenueResponse(
    engagement: (typeof MOCK_ENGAGEMENTS)[0],
    docs: typeof MOCK_DOCUMENTS
  ): ChatResponse {
    const fd = engagement.financialData;
    const prevRev = fd.previousYear?.revenue ?? 0;
    const variation = fd.yoyChange;
    const trend = variation > 0 ? '📈 growth' : '📉 decline';

    return {
      message: `**Revenue for ${engagement.entity}**

| Indicator | Value |
|-----------|-------|
| Revenue FY | ${this.formatEuro(fd.revenue)} |
| Revenue PY | ${this.formatEuro(prevRev)} |
| Variation | ${variation > 0 ? '+' : ''}${variation.toFixed(1)}% |

**Trend:** ${trend}

${variation > 10 ? 'Excellent performance compared to PY.' : variation < -5 ? 'Warning: significant revenue decline.' : 'Stable performance compared to previous year.'}`,
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'engagement',
    };
  }

  private mockDeadlineResponse(engagement: (typeof MOCK_ENGAGEMENTS)[0]): ChatResponse {
    const dueDate = new Date(engagement.dueDate);
    const today = new Date();
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let status = '';
    if (daysRemaining < 0) {
      status = '**DEADLINE PASSED**';
    } else if (daysRemaining <= 7) {
      status = '**URGENT** - Less than a week';
    } else if (daysRemaining <= 14) {
      status = '**To monitor**';
    } else {
      status = '**On track**';
    }

    return {
      message: `**Deadline for ${engagement.entity}**

Due date: **${dueDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}**
Days remaining: **${daysRemaining > 0 ? daysRemaining : 'Overdue'}**

${status}

Current completion: ${engagement.completionPercent}%
${engagement.predictedCompletion ? `Predicted completion date: ${new Date(engagement.predictedCompletion).toLocaleDateString('en-US')}` : 'Prediction not available'}`,
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'engagement',
    };
  }

  private mockStatusResponse(
    engagement: (typeof MOCK_ENGAGEMENTS)[0],
    docs: typeof MOCK_DOCUMENTS
  ): ChatResponse {
    const statusLabels: Record<string, string> = {
      waiting: 'Awaiting documents',
      received: 'Documents received',
      processing: 'In progress',
      completed: 'Completed',
    };

    return {
      message: `**Engagement Status for ${engagement.entity}**

| Element | Value |
|---------|-------|
| Status | ${statusLabels[engagement.status]} |
| Progress | ${engagement.completionPercent}% |
| Service | ${engagement.service} |
| Fiscal Year | ${engagement.fiscalYear} |
| Documents | ${docs.length} uploaded |

${engagement.completionPercent === 100 ? 'Engagement completed successfully!' : `Progress ongoing - ${100 - engagement.completionPercent}% remaining.`}`,
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'engagement',
    };
  }

  private mockVariationResponse(
    engagement: (typeof MOCK_ENGAGEMENTS)[0],
    docs: typeof MOCK_DOCUMENTS
  ): ChatResponse {
    const fd = engagement.financialData;
    const py = fd.previousYear;

    if (!py) {
      return {
        message: `Prior year data is not available for ${engagement.entity}.`,
        timestamp: new Date().toISOString(),
        response_type: 'text',
        mode: 'engagement',
      };
    }

    const assetVar = (((fd.assets - py.assets) / py.assets) * 100).toFixed(1);
    const liabVar = (((fd.liabilities - py.liabilities) / py.liabilities) * 100).toFixed(1);
    const revVar = fd.yoyChange.toFixed(1);

    return {
      message: `**YoY Variation Analysis for ${engagement.entity}**

| Indicator | CY | PY | Variation |
|-----------|----|----|-----------|
| Assets | ${this.formatEuro(fd.assets)} | ${this.formatEuro(py.assets)} | ${Number(assetVar) > 0 ? '+' : ''}${assetVar}% |
| Liabilities | ${this.formatEuro(fd.liabilities)} | ${this.formatEuro(py.liabilities)} | ${Number(liabVar) > 0 ? '+' : ''}${liabVar}% |
| Revenue | ${this.formatEuro(fd.revenue)} | ${this.formatEuro(py.revenue)} | ${Number(revVar) > 0 ? '+' : ''}${revVar}% |

**Key points:**
${Number(assetVar) > 10 ? '- Strong asset growth (+' + assetVar + '%)\n' : ''}${Number(revVar) < -5 ? '- Revenue decline to monitor\n' : ''}${Number(liabVar) > 15 ? '- Significant increase in liabilities\n' : ''}`,
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'engagement',
      sources: docs.filter(d => d.type === 'trial_balance').map(d => ({ document: d.name })),
    };
  }

  private mockDefaultEngagementResponse(
    engagement: (typeof MOCK_ENGAGEMENTS)[0],
    docs: typeof MOCK_DOCUMENTS
  ): ChatResponse {
    return {
      message: `I'm Eve, your assistant for the **${engagement.entity}** engagement (${engagement.service}).

**Quick summary:**
- Status: ${engagement.status === 'completed' ? 'Completed' : 'In progress'}
- Progress: ${engagement.completionPercent}%
- Risk: ${engagement.riskLevel === 'high' ? 'High' : engagement.riskLevel === 'medium' ? 'Medium' : 'Low'}
- Documents: ${docs.length} files

**I can help you with:**
- "What documents are missing?"
- "What is the risk level?"
- "Show me the assets"
- "Compare with prior year"
- "What is the deadline?"

Ask me your question!`,
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'engagement',
    };
  }

  private mockEngagementListResponse(): ChatResponse {
    const highRisk = MOCK_ENGAGEMENTS.filter(e => e.riskLevel === 'high');
    const inProgress = MOCK_ENGAGEMENTS.filter(e => e.status !== 'completed');

    let message = `**Engagements Overview**\n\n`;
    message += `**${MOCK_ENGAGEMENTS.length} engagements** in total\n\n`;

    if (highRisk.length > 0) {
      message += `**High risk engagements (${highRisk.length}):**\n`;
      highRisk.forEach(e => {
        message += `- ${e.entity} (${e.service}) - ${e.completionPercent}%\n`;
      });
      message += '\n';
    }

    message += `**In progress (${inProgress.length}):**\n`;
    inProgress.slice(0, 5).forEach(e => {
      const risk = e.riskLevel === 'high' ? '[HIGH]' : e.riskLevel === 'medium' ? '[MED]' : '[LOW]';
      message += `- ${risk} ${e.entity} - ${e.completionPercent}%\n`;
    });

    return {
      message,
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'global',
    };
  }

  private mockGlobalRiskResponse(): ChatResponse {
    const highRisk = MOCK_ENGAGEMENTS.filter(e => e.riskLevel === 'high');

    let message = `**Global Risk Analysis**\n\n`;

    if (highRisk.length === 0) {
      message += `No high-risk engagements.\n`;
    } else {
      message += `**${highRisk.length} high-risk engagement(s):**\n\n`;
      highRisk.forEach(e => {
        const dueDate = new Date(e.dueDate);
        const today = new Date();
        const daysRemaining = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        message += `**${e.entity}** (${e.country})\n`;
        message += `- Service: ${e.service}\n`;
        message += `- Completion: ${e.completionPercent}%\n`;
        message += `- Deadline: ${daysRemaining > 0 ? daysRemaining + ' days' : 'OVERDUE'}\n\n`;
      });
    }

    return {
      message,
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'global',
    };
  }

  private mockDefaultGlobalResponse(): ChatResponse {
    return {
      message: `I'm Eve, your EY tax assistant.

**I can help you:**
- View the list of engagements
- Identify critical risks
- Analyze a specific engagement

**Tip:** For detailed information on an engagement, open it from the home page and ask me your questions.

What would you like to know?`,
      timestamp: new Date().toISOString(),
      response_type: 'text',
      mode: 'global',
    };
  }

  /**
   * Generate mock explain response
   */
  private generateMockExplainResponse(
    label: string,
    value: string,
    engagementId: string,
    context?: Record<string, unknown>
  ): ExplainResponse {
    const engagement = MOCK_ENGAGEMENTS.find(e => e.id === engagementId);
    const docs = engagement
      ? MOCK_DOCUMENTS.filter(d => d.engagementIds.includes(engagementId))
      : [];

    const trialBalance = docs.find(d => d.type === 'trial_balance');
    const fd = engagement?.financialData;
    const py = fd?.previousYear;

    // Generate contextual explanation based on label
    let explanation = '';
    let breakdown: EveBreakdownItem[] = [];
    let comparison: ComparisonData | undefined;

    if (label.toLowerCase().includes('actif') || label.toLowerCase().includes('asset')) {
      explanation = `Total assets for ${engagement?.entity ?? 'the entity'} amount to ${value}. This includes fixed assets, receivables, and available cash.`;
      breakdown = [
        { label: 'Fixed Assets', value: this.formatEuro((fd?.assets ?? 0) * 0.6) },
        { label: 'Receivables', value: this.formatEuro((fd?.assets ?? 0) * 0.25) },
        { label: 'Cash', value: this.formatEuro((fd?.assets ?? 0) * 0.15) },
      ];
      if (py) {
        comparison = {
          previous_value: this.formatEuro(py.assets),
          variance_percent: Number((((fd!.assets - py.assets) / py.assets) * 100).toFixed(1)),
          trend: fd!.assets > py.assets ? 'up' : fd!.assets < py.assets ? 'down' : 'stable',
        };
      }
    } else if (
      label.toLowerCase().includes('passif') ||
      label.toLowerCase().includes('liabilit') ||
      label.toLowerCase().includes('debt')
    ) {
      explanation = `Liabilities for ${engagement?.entity ?? 'the entity'} represent ${value}. This includes financial debt, accounts payable, and provisions.`;
      breakdown = [
        { label: 'Financial Debt', value: this.formatEuro((fd?.liabilities ?? 0) * 0.5) },
        { label: 'Accounts Payable', value: this.formatEuro((fd?.liabilities ?? 0) * 0.35) },
        { label: 'Provisions', value: this.formatEuro((fd?.liabilities ?? 0) * 0.15) },
      ];
    } else if (
      label.toLowerCase().includes('ca') ||
      label.toLowerCase().includes('revenue') ||
      label.toLowerCase().includes('chiffre')
    ) {
      explanation = `Revenue for ${engagement?.entity ?? 'the entity'} reaches ${value} for fiscal year ${engagement?.fiscalYear ?? 'current'}.`;
      if (py) {
        comparison = {
          previous_value: this.formatEuro(py.revenue),
          variance_percent: fd!.yoyChange,
          trend: fd!.yoyChange > 0 ? 'up' : fd!.yoyChange < 0 ? 'down' : 'stable',
        };
      }
    } else {
      explanation = `The value "${label}" of ${value} comes from the analysis of accounting documents for ${engagement?.entity ?? 'the entity'}.`;
    }

    return {
      explanation,
      breakdown: breakdown.length > 0 ? breakdown : undefined,
      comparison,
      source_document: trialBalance?.name,
      source_line: trialBalance ? 42 : undefined,
    };
  }

  private formatEuro(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
}
