import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  FileCheck,
  ChevronRight,
  CheckCircle,
  X,
  FileText,
  MessageSquare,
  Check,
  Loader2,
  ArrowRight,
} from 'lucide-angular';
import { MockDataService, DocumentType } from '../../../../core';

interface SignOffDocument {
  type: DocumentType;
  label: string;
  entity: string;
  countryFlag: string;
  engagementId: string;
  documentId?: string;
}

@Component({
  selector: 'app-signoff-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="signoff-widget">
      <div class="widget-header">
        <div class="widget-title">
          <lucide-icon [img]="icons.fileCheck" [size]="18"></lucide-icon>
          <h3>Documents to Sign Off</h3>
        </div>
        @if (totalToSignOff() > 0) {
          <span class="count-badge">{{ totalToSignOff() }}</span>
        }
      </div>

      @if (documentsToSignOff().length === 0) {
        <div class="empty-state">
          <lucide-icon [img]="icons.checkCircle" [size]="28"></lucide-icon>
          <span>All documents validated</span>
        </div>
      } @else {
        <div class="signoff-table">
          <div class="table-header">
            <span class="col-entity">Entity</span>
            <span class="col-document">Deliverable</span>
            <span class="col-action">Action</span>
          </div>
          <div class="table-body">
            @for (doc of documentsToSignOff(); track doc.type + doc.engagementId) {
              <div class="table-row" (click)="openApprovalModal(doc)">
                <span class="col-entity">
                  <span class="entity-flag">{{ doc.countryFlag }}</span>
                  <span class="entity-name">{{ doc.entity }}</span>
                </span>
                <span class="col-document">{{ doc.label }}</span>
                <span class="col-action">
                  <button class="approve-btn" (click)="openApprovalModal(doc); $event.stopPropagation()">
                    Approve
                    <lucide-icon [img]="icons.chevronRight" [size]="14"></lucide-icon>
                  </button>
                </span>
              </div>
            }
          </div>
        </div>
        @if (totalToSignOff() > 5) {
          <div class="widget-footer">
            <button class="view-all-btn" (click)="viewAllToSignOff()">
              View All
              <lucide-icon [img]="icons.arrowRight" [size]="14"></lucide-icon>
            </button>
          </div>
        }
      }
    </div>

    <!-- Approval Modal -->
    @if (showApprovalModal()) {
      <div class="modal-overlay" (click)="closeApprovalModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-title">
              <lucide-icon [img]="icons.fileCheck" [size]="20"></lucide-icon>
              <div class="modal-title-text">
                <h3>Document Approval</h3>
                <span class="modal-subtitle">{{ selectedDocument()?.label }} - {{ selectedDocument()?.entity }}</span>
              </div>
            </div>
            <button class="close-btn" (click)="closeApprovalModal()">
              <lucide-icon [img]="icons.x" [size]="20"></lucide-icon>
            </button>
          </div>

          <div class="modal-body">
            <!-- PDF Preview -->
            <div class="pdf-preview">
              <div class="pdf-placeholder">
                <lucide-icon [img]="icons.fileText" [size]="48"></lucide-icon>
                <span class="pdf-name">{{ selectedDocument()?.label }}_{{ selectedDocument()?.entity }}_2025.pdf</span>
                <span class="pdf-info">PDF Document - 2.4 MB</span>
              </div>
              <!-- Simulated PDF content -->
              <div class="pdf-content">
                <div class="pdf-header-bar">
                  <span>EY Tax Return Document</span>
                </div>
                <div class="pdf-body">
                  <div class="pdf-section">
                    <h4>Entity Information</h4>
                    <p><strong>Entity:</strong> {{ selectedDocument()?.entity }}</p>
                    <p><strong>Fiscal Year:</strong> 2025</p>
                    <p><strong>Document Type:</strong> {{ selectedDocument()?.label }}</p>
                  </div>
                  <div class="pdf-section">
                    <h4>Summary</h4>
                    <p>This document has been prepared in accordance with applicable tax regulations and is ready for client sign-off.</p>
                  </div>
                  <div class="pdf-section">
                    <h4>Key Figures</h4>
                    <div class="pdf-table">
                      <div class="pdf-row">
                        <span>Taxable Income</span>
                        <span>EUR 2,450,000</span>
                      </div>
                      <div class="pdf-row">
                        <span>Tax Rate</span>
                        <span>25.0%</span>
                      </div>
                      <div class="pdf-row">
                        <span>Tax Due</span>
                        <span>EUR 612,500</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Comment Section -->
            <div class="comment-section">
              <div class="comment-header">
                <lucide-icon [img]="icons.messageSquare" [size]="16"></lucide-icon>
                <span>Add Comment (Optional)</span>
              </div>
              <textarea
                class="comment-input"
                placeholder="Enter any comments or notes for the EY team..."
                [(ngModel)]="comment"
                rows="4"
              ></textarea>

              <button
                class="approve-action-btn"
                [disabled]="isApproving()"
                (click)="approveDocument()"
              >
                @if (isApproving()) {
                  <lucide-icon [img]="icons.loader2" [size]="18" class="spin"></lucide-icon>
                  <span>Approving...</span>
                } @else {
                  <lucide-icon [img]="icons.check" [size]="18"></lucide-icon>
                  <span>Approve Document</span>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Success Toast -->
    @if (showSuccessToast()) {
      <div class="success-toast">
        <lucide-icon [img]="icons.checkCircle" [size]="20"></lucide-icon>
        <span>Document approved successfully</span>
      </div>
    }
  `,
  styles: [`
    .signoff-widget {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .widget-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .widget-title {
      display: flex;
      align-items: center;
      gap: 8px;

      lucide-icon {
        color: #3b82f6;
      }

      h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #2E2E38;
      }
    }

    .count-badge {
      background: #dbeafe;
      color: #1d4ed8;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #10b981;
      gap: 6px;
      padding: 16px 0;

      span {
        font-size: 13px;
      }
    }

    .signoff-table {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .table-header {
      display: grid;
      grid-template-columns: 1fr 1fr 80px;
      gap: 10px;
      padding: 6px 10px;
      background: #f3f4f6;
      border-radius: 6px;
      margin-bottom: 6px;

      span {
        font-size: 10px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .table-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }

    .table-row {
      display: grid;
      grid-template-columns: 1fr 1fr 80px;
      gap: 10px;
      padding: 10px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #3b82f6;
        background: #eff6ff;
      }
    }

    .col-entity {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .entity-flag {
      font-size: 13px;
      flex-shrink: 0;
    }

    .entity-name {
      font-size: 12px;
      font-weight: 500;
      color: #2E2E38;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .col-document {
      font-size: 12px;
      color: #2E2E38;
      display: flex;
      align-items: center;
    }

    .col-action {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }

    .approve-btn {
      display: flex;
      align-items: center;
      gap: 3px;
      background: #3b82f6;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #2563eb;
      }
    }

    .widget-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #f0f0f0;
    }

    .view-all-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: transparent;
      border: none;
      color: #6b7280;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s;

      lucide-icon {
        transition: transform 0.2s;
      }

      &:hover {
        color: #2E2E38;
        background: #f3f4f6;

        lucide-icon {
          transform: translateX(2px);
        }
      }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      width: 95%;
      max-width: 900px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease-out;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #f0f0f0;
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: 12px;

      lucide-icon {
        color: #3b82f6;
      }
    }

    .modal-title-text {
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #2E2E38;
      }

      .modal-subtitle {
        font-size: 13px;
        color: #6b7280;
      }
    }

    .close-btn {
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: #6b7280;
      border-radius: 8px;
      transition: all 0.2s;

      &:hover {
        background: #f3f4f6;
        color: #2E2E38;
      }
    }

    .modal-body {
      display: grid;
      grid-template-columns: 1fr 320px;
      flex: 1;
      overflow: hidden;
    }

    /* PDF Preview */
    .pdf-preview {
      background: #f3f4f6;
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .pdf-placeholder {
      display: none;
    }

    .pdf-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .pdf-header-bar {
      background: #2E2E38;
      color: white;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 500;
    }

    .pdf-body {
      padding: 24px;
    }

    .pdf-section {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #2E2E38;
        margin: 0 0 12px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;
      }

      p {
        font-size: 13px;
        color: #4b5563;
        margin: 0 0 8px 0;
        line-height: 1.5;

        strong {
          color: #2E2E38;
        }
      }
    }

    .pdf-table {
      background: #f9fafb;
      border-radius: 8px;
      overflow: hidden;
    }

    .pdf-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;

      &:last-child {
        border-bottom: none;
        background: #f3f4f6;
        font-weight: 600;
      }

      span:first-child {
        color: #6b7280;
      }

      span:last-child {
        color: #2E2E38;
        font-weight: 500;
      }
    }

    /* Comment Section */
    .comment-section {
      background: white;
      padding: 24px;
      border-left: 1px solid #f0f0f0;
      display: flex;
      flex-direction: column;
    }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 500;
      color: #2E2E38;

      lucide-icon {
        color: #6b7280;
      }
    }

    .comment-input {
      flex: 1;
      min-height: 120px;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      resize: none;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      &::placeholder {
        color: #9ca3af;
      }
    }

    .approve-action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 20px;
      padding: 14px 24px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #059669;
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    /* Success Toast */
    .success-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 24px;
      background: #10b981;
      color: white;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
      animation: slideInRight 0.3s ease-out;
      z-index: 1100;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .modal-body {
        grid-template-columns: 1fr;
      }

      .pdf-preview {
        max-height: 300px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignoffWidgetComponent {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  readonly icons = {
    fileCheck: FileCheck,
    chevronRight: ChevronRight,
    checkCircle: CheckCircle,
    x: X,
    fileText: FileText,
    messageSquare: MessageSquare,
    check: Check,
    loader2: Loader2,
    arrowRight: ArrowRight,
  };

  readonly showApprovalModal = signal(false);
  readonly selectedDocument = signal<SignOffDocument | null>(null);
  readonly isApproving = signal(false);
  readonly showSuccessToast = signal(false);
  comment = '';

  readonly documentsToSignOff = computed<SignOffDocument[]>(() => {
    const engagements = this.mockData.engagements();
    const docs: SignOffDocument[] = [];

    engagements.forEach(eng => {
      const requirements = eng.documentRequirements || [];

      // Get documents that are uploaded but need validation (not yet validated)
      requirements
        .filter(req => req.status === 'uploaded')
        .forEach(req => {
          docs.push({
            type: req.type,
            label: req.label,
            entity: eng.entity,
            countryFlag: eng.countryFlag,
            engagementId: eng.id,
            documentId: req.documentId,
          });
        });
    });

    // Return max 5 items
    return docs.slice(0, 5);
  });

  readonly totalToSignOff = computed(() => {
    const engagements = this.mockData.engagements();
    let count = 0;
    engagements.forEach(eng => {
      const requirements = eng.documentRequirements || [];
      count += requirements.filter(req => req.status === 'uploaded').length;
    });
    return count;
  });

  openApprovalModal(doc: SignOffDocument): void {
    this.selectedDocument.set(doc);
    this.showApprovalModal.set(true);
    this.comment = '';
  }

  closeApprovalModal(): void {
    this.showApprovalModal.set(false);
    this.selectedDocument.set(null);
    this.comment = '';
  }

  approveDocument(): void {
    this.isApproving.set(true);

    // Simulate approval process
    setTimeout(() => {
      this.isApproving.set(false);
      this.closeApprovalModal();
      this.showSuccessToast.set(true);

      // Hide toast after 3 seconds
      setTimeout(() => {
        this.showSuccessToast.set(false);
      }, 3000);
    }, 1500);
  }

  viewAllToSignOff(): void {
    this.router.navigate(['/app/documents'], {
      queryParams: { filter: 'pending-approval' }
    });
  }
}
