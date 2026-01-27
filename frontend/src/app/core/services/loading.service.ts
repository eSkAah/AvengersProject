import { Injectable, signal, computed } from '@angular/core';

/**
 * Loading Service
 *
 * Tracks active HTTP requests and provides a global loading state.
 * Used by the loading interceptor to manage loading indicators.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly activeRequests = signal(0);

  /**
   * Whether any HTTP requests are currently in progress
   */
  readonly isLoading = computed(() => this.activeRequests() > 0);

  /**
   * The number of active requests
   */
  readonly requestCount = computed(() => this.activeRequests());

  /**
   * Called when a new request starts
   */
  startRequest(): void {
    this.activeRequests.update(count => count + 1);
  }

  /**
   * Called when a request completes (success or error)
   */
  endRequest(): void {
    this.activeRequests.update(count => Math.max(0, count - 1));
  }

  /**
   * Reset the loading state (useful for testing or error recovery)
   */
  reset(): void {
    this.activeRequests.set(0);
  }
}
