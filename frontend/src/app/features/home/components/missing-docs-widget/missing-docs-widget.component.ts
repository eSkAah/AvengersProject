import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, FileText, Info, ChevronRight, Upload, AlertCircle } from 'lucide-angular';
import { MockDataService, DocumentType } from '../../../../core';

interface MissingDocument {
  type: DocumentType;
  label: string;
  engagements: { id: string; entity: string; countryFlag: string }[];
}

@Component({
  selector: 'app-missing-docs-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './missing-docs-widget.component.html',
  styleUrl: './missing-docs-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MissingDocsWidgetComponent {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  readonly icons = {
    fileText: FileText,
    info: Info,
    chevronRight: ChevronRight,
    upload: Upload,
    alertCircle: AlertCircle
  };

  readonly missingDocuments = computed<MissingDocument[]>(() => {
    const engagements = this.mockData.engagements();
    const missingByType = new Map<DocumentType, { label: string; engagements: { id: string; entity: string; countryFlag: string }[] }>();

    engagements.forEach(eng => {
      const requirements = eng.documentRequirements || [];

      requirements
        .filter(req => req.status === 'missing')
        .forEach(req => {
          if (!missingByType.has(req.type)) {
            missingByType.set(req.type, { label: req.label, engagements: [] });
          }
          missingByType.get(req.type)!.engagements.push({
            id: eng.id,
            entity: eng.entity,
            countryFlag: eng.countryFlag
          });
        });
    });

    return Array.from(missingByType.entries()).map(([type, data]) => ({
      type,
      label: data.label,
      engagements: data.engagements
    }));
  });

  readonly totalMissing = computed(() => {
    return this.missingDocuments().reduce((sum, doc) => sum + doc.engagements.length, 0);
  });

  onUploadClick(docType: DocumentType): void {
    this.router.navigate(['/app/documents'], {
      queryParams: { upload: true, type: docType }
    });
  }

  navigateToDoclib(): void {
    this.router.navigate(['/app/documents']);
  }

  getTooltipText(doc: MissingDocument): string {
    return 'Required for: ' + doc.engagements.map(e => e.entity).join(', ');
  }
}
