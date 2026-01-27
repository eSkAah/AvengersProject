import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * HTTP Loading Interceptor
 *
 * Tracks active HTTP requests and updates a global loading state.
 * Useful for showing a global loading indicator.
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip loading indicator for certain requests
  const skipLoading = req.headers.has('X-Skip-Loading');

  if (skipLoading) {
    return next(req);
  }

  const loadingService = inject(LoadingService);
  loadingService.startRequest();

  return next(req).pipe(
    finalize(() => {
      loadingService.endRequest();
    })
  );
};
