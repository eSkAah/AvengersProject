import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/components/toast/toast.service';

/**
 * HTTP Error Interceptor
 *
 * Provides centralized error handling for all HTTP requests.
 * Shows user-friendly error messages via ToastService for critical errors.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip showing toast for certain error types that are handled locally
      const skipToast = req.headers.has('X-Skip-Error-Toast');

      if (!skipToast) {
        handleError(error, toastService);
      }

      return throwError(() => error);
    })
  );
};

function handleError(error: HttpErrorResponse, toastService: ToastService): void {
  let message: string;

  if (error.status === 0) {
    // Network error or CORS issue
    message = 'Unable to connect to server. Please check your connection.';
  } else if (error.status === 401) {
    // Unauthorized - session expired
    message = 'Your session has expired. Please log in again.';
  } else if (error.status === 403) {
    // Forbidden
    message = 'You do not have permission to perform this action.';
  } else if (error.status === 404) {
    // Not found - often handled locally, don't show generic toast
    return;
  } else if (error.status === 422) {
    // Validation error - usually has specific message
    message = error.error?.detail || 'Invalid data provided.';
  } else if (error.status === 429) {
    // Rate limited
    message = 'Too many requests. Please wait a moment.';
  } else if (error.status >= 500) {
    // Server error
    message = 'Server error. Please try again later.';
  } else {
    // Other errors
    message = error.error?.detail || error.message || 'An unexpected error occurred.';
  }

  toastService.error(message);
}
