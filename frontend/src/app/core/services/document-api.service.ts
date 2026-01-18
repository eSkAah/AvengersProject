import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEventType, HttpEvent } from '@angular/common/http';
import { Observable, throwError, Subject, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Document, DocumentLibrary, DocumentCategoryGroup, DocumentTypeGroup } from '../models';

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface EngagementStatusUpdate {
  status: string;
  completion_percent: number;
  risk_level: string;
}

export interface DocumentUploadResponse {
  id: string;
  name: string;
  type: string;
  status: string;
  engagement_ids: string[];
  uploaded_at: string;
  file_path: string;
  size_bytes: number;
  engagement_update?: EngagementStatusUpdate;
}

export interface UploadError {
  error_type: string;
  message: string;
  allowed_formats?: string[];
  max_size_bytes?: number;
}

export interface DocumentLinkRequest {
  document_id: string;
  engagement_id: string;
}

export interface DocumentLinkResponse {
  success: boolean;
  document_id: string;
  engagement_id: string;
  linked: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/documents`;

  private uploadProgressSubject = new BehaviorSubject<Map<string, UploadProgress>>(new Map());
  uploadProgress$ = this.uploadProgressSubject.asObservable();

  /**
   * Upload a single document to an engagement
   */
  uploadDocument(file: File, engagementId: string): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('engagement_id', engagementId);

    return this.http.post<DocumentUploadResponse>(
      `${this.apiUrl}/upload`,
      formData
    ).pipe(
      catchError((error: HttpErrorResponse) => this.handleUploadError(error))
    );
  }

  /**
   * Upload a document with progress tracking
   */
  uploadDocumentWithProgress(
    file: File,
    engagementId: string
  ): Observable<{ progress: number; response?: DocumentUploadResponse }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('engagement_id', engagementId);

    return this.http.post<DocumentUploadResponse>(
      `${this.apiUrl}/upload`,
      formData,
      {
        reportProgress: true,
        observe: 'events',
      }
    ).pipe(
      map((event: HttpEvent<DocumentUploadResponse>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const progress = event.total
              ? Math.round((100 * event.loaded) / event.total)
              : 0;
            return { progress };
          case HttpEventType.Response:
            return { progress: 100, response: event.body ?? undefined };
          default:
            return { progress: 0 };
        }
      }),
      catchError((error: HttpErrorResponse) => this.handleUploadError(error))
    );
  }

  /**
   * Get all documents (optionally filtered by engagement)
   */
  getDocuments(engagementId?: string): Observable<Document[]> {
    const options: { params?: Record<string, string> } = {};
    if (engagementId) {
      options.params = { engagement_id: engagementId };
    }

    return this.http.get<Record<string, unknown>[]>(this.apiUrl, options).pipe(
      map(docs => docs.map(doc => this.mapDocumentResponse(doc))),
      catchError(this.handleError)
    );
  }

  /**
   * Get a single document by ID
   */
  getDocument(id: string): Observable<Document> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/${id}`).pipe(
      map(doc => this.mapDocumentResponse(doc)),
      catchError(this.handleError)
    );
  }

  /**
   * Delete a document
   */
  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get document library grouped by category and type
   */
  getDocumentLibrary(): Observable<DocumentLibrary> {
    return this.http.get<Record<string, unknown>>(`${this.apiUrl}/library`).pipe(
      map(response => this.mapLibraryResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Link a document to an engagement
   */
  linkDocument(documentId: string, engagementId: string): Observable<DocumentLinkResponse> {
    return this.http.post<DocumentLinkResponse>(`${this.apiUrl}/link`, {
      document_id: documentId,
      engagement_id: engagementId,
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Map backend response to frontend Document model
   */
  private mapDocumentResponse(doc: Record<string, unknown>): Document {
    return {
      id: doc['id'] as string,
      name: doc['name'] as string,
      type: doc['type'] as Document['type'],
      category: doc['category'] as Document['category'],
      engagementIds: (doc['engagement_ids'] ?? []) as string[],
      uploadedAt: (doc['uploaded_at'] ?? doc['uploadedAt']) as string,
      status: doc['status'] as Document['status'],
      size: (doc['size_bytes'] ?? doc['size'] ?? 0) as number,
      aiSummary: doc['ai_summary'] as string | undefined,
      extractedData: doc['extracted_data'] as Record<string, unknown> | undefined,
      filePath: doc['file_path'] as string | undefined,
      year: (doc['year'] ?? new Date().getFullYear()) as number,
      entityId: (doc['entity_id'] ?? ((doc['engagement_ids'] as string[] | undefined)?.[0]) ?? '') as string,
      entityName: (doc['entity_name'] ?? '') as string,
    };
  }

  /**
   * Map library response to frontend DocumentLibrary model
   */
  private mapLibraryResponse(response: Record<string, unknown>): DocumentLibrary {
    const categories = (response['categories'] as Record<string, unknown>[]) ?? [];

    return {
      categories: categories.map(cat => ({
        category: cat['category'] as DocumentCategoryGroup['category'],
        categoryLabel: cat['category_label'] as string,
        types: ((cat['types'] as Record<string, unknown>[]) ?? []).map(type => ({
          type: type['type'] as DocumentTypeGroup['type'],
          typeLabel: type['type_label'] as string,
          documents: ((type['documents'] as Record<string, unknown>[]) ?? []).map(doc =>
            this.mapDocumentResponse(doc)
          ),
          count: type['count'] as number,
        })),
        totalCount: cat['total_count'] as number,
      })),
      totalCount: response['total_count'] as number,
    };
  }

  /**
   * Handle upload-specific errors with user-friendly messages
   */
  private handleUploadError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erreur lors du téléchargement';

    if (error.error) {
      const uploadError = error.error as UploadError | { detail: string };

      if ('error_type' in uploadError) {
        switch (uploadError.error_type) {
          case 'invalid_format':
            errorMessage = `Format non autorisé. Formats acceptés: ${uploadError.allowed_formats?.join(', ')}`;
            break;
          case 'file_too_large':
            const maxMB = uploadError.max_size_bytes
              ? Math.round(uploadError.max_size_bytes / (1024 * 1024))
              : 10;
            errorMessage = `Fichier trop volumineux. Taille max: ${maxMB} MB`;
            break;
          case 'engagement_not_found':
            errorMessage = 'Engagement non trouvé';
            break;
          default:
            errorMessage = uploadError.message || errorMessage;
        }
      } else if ('detail' in uploadError) {
        errorMessage = uploadError.detail;
      }
    } else if (error.status === 0) {
      errorMessage = 'Impossible de contacter le serveur';
    } else if (error.status === 413) {
      errorMessage = 'Fichier trop volumineux';
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Generic error handler
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.detail || error.message || errorMessage;
    }

    console.error('DocumentApiService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
