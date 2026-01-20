import { Component, ChangeDetectionStrategy, signal, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Upload, FileText, Info, ChevronRight, AlertCircle } from 'lucide-angular';
import { MockDataService, DocumentType } from '../../../../core';

interface MissingDocument {
  type: DocumentType;
  label: string;
  engagements: { id: string; entity: string; countryFlag: string }[];
}

@Component({
  selector: 'app-upload-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './upload-widget.component.html',
  styleUrl: './upload-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadWidgetComponent {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  readonly icons = {
    upload: Upload,
    fileText: FileText,
    info: Info,
    chevronRight: ChevronRight,
    alertCircle: AlertCircle
  };

  readonly isDragOver = signal(false);
  readonly uploadFiles = output<File[]>();

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

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFiles.emit(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles.emit(Array.from(input.files));
    }
  }

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
