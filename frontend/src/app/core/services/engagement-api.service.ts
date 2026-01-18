import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RiskLevel } from '../models';

// =============================================================================
// Types
// =============================================================================

export interface RiskDetailsResponse {
  engagement_id: string;
  level: RiskLevel;
  reasons: string[];
  suggested_actions: string[];
  days_remaining: number;
  completion_percent: number;
  missing_documents: string[];
}

export interface PredictionResponse {
  engagement_id: string;
  predicted_date: string | null;
  days_difference: number;
  velocity: number;
  is_on_track: boolean;
  confidence: 'high' | 'medium' | 'low';
  due_date: string;
  formatted_prediction: string;
}

// =============================================================================
// Service
// =============================================================================

@Injectable({
  providedIn: 'root',
})
export class EngagementApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // Cache for risk details
  private readonly riskDetailsCache = new Map<string, RiskDetailsResponse>();
  private readonly predictionCache = new Map<string, PredictionResponse>();

  /**
   * Get detailed risk information for an engagement
   */
  getRiskDetails(engagementId: string, useCache = true): Observable<RiskDetailsResponse> {
    // Check cache first
    if (useCache && this.riskDetailsCache.has(engagementId)) {
      return new Observable((subscriber) => {
        subscriber.next(this.riskDetailsCache.get(engagementId)!);
        subscriber.complete();
      });
    }

    return this.http
      .get<RiskDetailsResponse>(`${this.baseUrl}/engagements/${engagementId}/risk`)
      .pipe(
        tap((details) => {
          this.riskDetailsCache.set(engagementId, details);
        }),
        catchError((error) => {
          console.error('Error fetching risk details:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get completion prediction for an engagement
   */
  getPrediction(engagementId: string, useCache = true): Observable<PredictionResponse> {
    // Check cache first
    if (useCache && this.predictionCache.has(engagementId)) {
      return new Observable((subscriber) => {
        subscriber.next(this.predictionCache.get(engagementId)!);
        subscriber.complete();
      });
    }

    return this.http
      .get<PredictionResponse>(`${this.baseUrl}/engagements/${engagementId}/prediction`)
      .pipe(
        tap((prediction) => {
          this.predictionCache.set(engagementId, prediction);
        }),
        catchError((error) => {
          console.error('Error fetching prediction:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Clear cache for a specific engagement
   */
  clearCache(engagementId?: string): void {
    if (engagementId) {
      this.riskDetailsCache.delete(engagementId);
      this.predictionCache.delete(engagementId);
    } else {
      this.riskDetailsCache.clear();
      this.predictionCache.clear();
    }
  }

  /**
   * Format prediction for display
   */
  formatPrediction(prediction: PredictionResponse): {
    text: string;
    color: string;
    icon: string;
  } {
    if (!prediction.predicted_date) {
      return {
        text: 'Prediction unavailable',
        color: '#9CA3AF',
        icon: 'help-circle',
      };
    }

    if (prediction.is_on_track) {
      if (prediction.days_difference < 0) {
        return {
          text: prediction.formatted_prediction,
          color: '#10B981', // green
          icon: 'trending-up',
        };
      }
      return {
        text: prediction.formatted_prediction,
        color: '#10B981', // green
        icon: 'check-circle',
      };
    }

    return {
      text: prediction.formatted_prediction,
      color: '#EF4444', // red
      icon: 'alert-triangle',
    };
  }
}
