import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, FileCheck, ChevronRight, CheckCircle } from 'lucide-angular';
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
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './signoff-widget.component.html',
  styleUrl: './signoff-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignoffWidgetComponent {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  readonly icons = {
    fileCheck: FileCheck,
    chevronRight: ChevronRight,
    checkCircle: CheckCircle
  };

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
            documentId: req.documentId
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

  onDocumentClick(doc: SignOffDocument): void {
    this.router.navigate(['/app/engagements', doc.engagementId], {
      queryParams: doc.documentId ? { document: doc.documentId } : {}
    });
  }
}
