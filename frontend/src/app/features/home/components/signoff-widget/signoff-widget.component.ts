import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
  ViewChild,
  TemplateRef,
  OnDestroy,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TemplatePortal, PortalModule } from '@angular/cdk/portal';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
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
  imports: [CommonModule, FormsModule, LucideAngularModule, PortalModule, OverlayModule],
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
      }

      <!-- View All footer - always shown for consistent card height -->
      <div class="widget-footer">
        <button class="view-all-link" (click)="viewAllToSignOff()">
          View All
          <lucide-icon [img]="icons.arrowRight" [size]="14"></lucide-icon>
        </button>
      </div>
    </div>

    <!-- Approval Modal Template (rendered via CDK Overlay to avoid parent clipping) -->
    <ng-template #approvalModalTemplate>
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
    </ng-template>

    <!-- Success Toast Template (rendered via CDK Overlay to avoid parent clipping) -->
    <ng-template #successToastTemplate>
      <div class="success-toast">
        <lucide-icon [img]="icons.checkCircle" [size]="20"></lucide-icon>
        <span>Document approved successfully</span>
      </div>
    </ng-template>
  `,
  styles: [`
    // =============================================================================
    // SIGNOFF WIDGET - EY Design System
    // Cards: white bg, border #e5e7eb, border-radius 12px, shadow-card, hover lift
    // Typography: Inter font, 11px labels uppercase, 13-14px body, 18px values
    // =============================================================================

    :host {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

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
        color: #3B82F6; // info color
      }

      h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #2E2E38;
        line-height: 1.4;
      }
    }

    .count-badge {
      background: #DBEAFE; // info-light
      color: #1D4ED8; // info-dark
      min-width: 24px;
      height: 24px;
      padding: 0 8px;
      border-radius: 9999px;
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
      color: #10B981;
      gap: 8px;
      padding: 20px 0;

      span {
        font-size: 13px;
        font-weight: 500;
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
      gap: 12px;
      padding: 8px 12px;
      background: #F9FAFB;
      border-radius: 6px;
      margin-bottom: 8px;

      span {
        font-size: 11px; // text-overline
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
    }

    .table-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow-y: auto;
    }

    .table-row {
      display: grid;
      grid-template-columns: 1fr 1fr 80px;
      gap: 12px;
      padding: 12px 14px;
      background: #FFFFFF;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      cursor: pointer;
      transition: all 200ms ease-out;

      &:hover {
        border-color: #3B82F6;
        background: #EFF6FF;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }
    }

    .col-entity {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .entity-flag {
      font-size: 16px;
      flex-shrink: 0;
    }

    .entity-name {
      font-size: 13px;
      font-weight: 500;
      color: #2E2E38;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .col-document {
      font-size: 13px;
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
      gap: 4px;
      background: #3B82F6;
      color: #FFFFFF;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 200ms ease-out;

      &:hover {
        background: #2563EB;
        transform: scale(1.02);
      }

      &:active {
        transform: scale(0.98);
      }
    }

    .widget-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 12px;
    }

    .view-all-link {
      display: flex;
      align-items: center;
      gap: 4px;
      background: transparent;
      border: none;
      color: #6b7280;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 0;
      transition: all 200ms ease-out;

      lucide-icon {
        transition: transform 200ms ease-out;
      }

      &:hover {
        color: #2E2E38;

        lucide-icon {
          transform: translateX(2px);
        }
      }
    }

    // =========================================================================
    // MODAL STYLES - EY Design System
    // =========================================================================

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 200ms ease-out;
    }

    .modal-content {
      background: #FFFFFF;
      border-radius: 12px;
      width: 95%;
      max-width: 900px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
      animation: slideUp 300ms ease-out;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: 12px;

      lucide-icon {
        color: #3B82F6;
      }
    }

    .modal-title-text {
      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #2E2E38;
        line-height: 1.4;
      }

      .modal-subtitle {
        font-size: 13px;
        color: #6b7280;
        line-height: 1.5;
      }
    }

    .close-btn {
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: #6b7280;
      border-radius: 6px;
      transition: all 200ms ease-out;

      &:hover {
        background: #F5F5F5;
        color: #2E2E38;
      }
    }

    .modal-body {
      display: grid;
      grid-template-columns: 1fr 320px;
      flex: 1;
      overflow: hidden;
    }

    // PDF Preview
    .pdf-preview {
      background: #F5F5F5;
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
      background: #FFFFFF;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .pdf-header-bar {
      background: #2E2E38;
      color: #FFFFFF;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 600;
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
        color: #6b7280;
        margin: 0 0 8px 0;
        line-height: 1.6;

        strong {
          color: #2E2E38;
          font-weight: 600;
        }
      }
    }

    .pdf-table {
      background: #FAFAFA;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
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
        background: #F5F5F5;
        font-weight: 600;
      }

      span:first-child {
        color: #6b7280;
      }

      span:last-child {
        color: #2E2E38;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }
    }

    // Comment Section
    .comment-section {
      background: #FFFFFF;
      padding: 24px;
      border-left: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
    }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 600;
      color: #2E2E38;

      lucide-icon {
        color: #6b7280;
      }
    }

    .comment-input {
      flex: 1;
      min-height: 120px;
      padding: 12px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      resize: none;
      transition: all 200ms ease-out;
      color: #2E2E38;

      &:focus {
        outline: none;
        border-color: #FFE600;
        box-shadow: 0 0 0 3px #FFF9CC;
      }

      &::placeholder {
        color: #A3A3A3;
      }
    }

    .approve-action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 20px;
      padding: 12px 20px;
      background: #10B981;
      color: #FFFFFF;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 200ms ease-out;

      &:hover:not(:disabled) {
        background: #059669;
        transform: scale(1.02);
      }

      &:active:not(:disabled) {
        transform: scale(0.98);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }

    // Success Toast
    .success-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 24px;
      background: #10B981;
      color: #FFFFFF;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
      animation: slideInRight 300ms ease-out;
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
export class SignoffWidgetComponent implements OnDestroy {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);

  /** Reference to the approval modal template */
  @ViewChild('approvalModalTemplate') approvalModalTemplate!: TemplateRef<unknown>;
  /** Reference to the success toast template */
  @ViewChild('successToastTemplate') successToastTemplate!: TemplateRef<unknown>;

  /** Overlay reference for the modal - allows rendering outside parent container */
  private modalOverlayRef: OverlayRef | null = null;
  /** Overlay reference for the toast */
  private toastOverlayRef: OverlayRef | null = null;

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

  readonly selectedDocument = signal<SignOffDocument | null>(null);
  readonly isApproving = signal(false);
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

  ngOnDestroy(): void {
    this.disposeModalOverlay();
    this.disposeToastOverlay();
  }

  /**
   * Opens the approval modal using CDK Overlay.
   * This renders the modal directly in the document body,
   * avoiding any parent overflow:hidden clipping issues.
   */
  openApprovalModal(doc: SignOffDocument): void {
    this.selectedDocument.set(doc);
    this.comment = '';

    // Create a global overlay that covers the entire viewport
    this.modalOverlayRef = this.overlay.create({
      hasBackdrop: false, // We handle our own backdrop in the template
      positionStrategy: this.overlay.position().global(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
      panelClass: 'approval-modal-panel',
    });

    // Attach the template to the overlay using the component's ViewContainerRef
    const portal = new TemplatePortal(this.approvalModalTemplate, this.viewContainerRef);
    this.modalOverlayRef.attach(portal);
  }

  /**
   * Closes the approval modal and cleans up the overlay.
   */
  closeApprovalModal(): void {
    this.disposeModalOverlay();
    this.selectedDocument.set(null);
    this.comment = '';
  }

  /**
   * Handles document approval with loading state and success feedback.
   */
  approveDocument(): void {
    this.isApproving.set(true);

    // Simulate approval process
    setTimeout(() => {
      this.isApproving.set(false);
      this.closeApprovalModal();
      this.showSuccessToast();
    }, 1500);
  }

  /**
   * Shows the success toast using CDK Overlay.
   */
  private showSuccessToast(): void {
    // Create overlay positioned at bottom-right
    this.toastOverlayRef = this.overlay.create({
      hasBackdrop: false,
      positionStrategy: this.overlay.position()
        .global()
        .bottom('24px')
        .right('24px'),
      panelClass: 'success-toast-panel',
    });

    const portal = new TemplatePortal(this.successToastTemplate, this.viewContainerRef);
    this.toastOverlayRef.attach(portal);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.disposeToastOverlay();
    }, 3000);
  }

  viewAllToSignOff(): void {
    this.router.navigate(['/app/documents'], {
      queryParams: { status: 'uploaded' }
    });
  }

  private disposeModalOverlay(): void {
    if (this.modalOverlayRef) {
      this.modalOverlayRef.dispose();
      this.modalOverlayRef = null;
    }
  }

  private disposeToastOverlay(): void {
    if (this.toastOverlayRef) {
      this.toastOverlayRef.dispose();
      this.toastOverlayRef = null;
    }
  }
}
