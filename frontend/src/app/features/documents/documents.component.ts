import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService, Document, Engagement } from '../../core';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
  ViewToggleComponent,
  ViewMode,
} from '../../shared';
import {
  DocumentTreeComponent,
  TreeNode,
} from './components/document-tree/document-tree.component';
import { DocumentFiltersComponent, DocumentFilters } from './components/document-filters/document-filters.component';
import { DocumentGridComponent } from './components/document-grid/document-grid.component';
import { DocumentListComponent } from './components/document-list/document-list.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    ViewToggleComponent,
    DocumentTreeComponent,
    DocumentFiltersComponent,
    DocumentGridComponent,
    DocumentListComponent,
  ],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsComponent {
  private readonly mockData = inject(MockDataService);

  readonly engagements = this.mockData.engagements;
  readonly allDocuments = this.mockData.documents;

  viewMode = signal<ViewMode>('grid');
  selectedEngagementId = signal<string | null>(null);
  filters = signal<DocumentFilters>({
    search: '',
    type: null,
    status: null,
    engagementId: null,
  });

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = [{ label: 'Documents', icon: '📁' }];

    const engId = this.selectedEngagementId();
    if (engId) {
      const eng = this.engagements().find((e) => e.id === engId);
      if (eng) {
        items.push({
          label: eng.entity,
          icon: eng.countryFlag,
          path: engId,
        });
      }
    }

    return items;
  });

  filteredDocuments = computed(() => {
    let docs = this.allDocuments();
    const f = this.filters();
    const selectedEng = this.selectedEngagementId();

    // Filter by tree selection
    if (selectedEng) {
      docs = docs.filter((d) => d.engagementId === selectedEng);
    }

    // Filter by engagement dropdown (overrides tree if set)
    if (f.engagementId) {
      docs = docs.filter((d) => d.engagementId === f.engagementId);
    }

    // Filter by search
    if (f.search) {
      const search = f.search.toLowerCase();
      docs = docs.filter((d) => d.name.toLowerCase().includes(search));
    }

    // Filter by type
    if (f.type) {
      docs = docs.filter((d) => d.type === f.type);
    }

    // Filter by status
    if (f.status) {
      docs = docs.filter((d) => d.status === f.status);
    }

    return docs;
  });

  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  onFiltersChange(filters: DocumentFilters): void {
    this.filters.set(filters);
  }

  onTreeNodeSelect(node: TreeNode): void {
    if (node.type === 'client') {
      this.selectedEngagementId.set(null);
    } else if (node.type === 'engagement') {
      this.selectedEngagementId.set(node.id);
    } else if (node.type === 'document' && node.engagementId) {
      this.selectedEngagementId.set(node.engagementId);
    }
  }

  onBreadcrumbNavigate(item: BreadcrumbItem): void {
    if (!item.path) {
      this.selectedEngagementId.set(null);
    }
  }

  onBreadcrumbHome(): void {
    this.selectedEngagementId.set(null);
  }

  onDocumentClick(doc: Document): void {
    console.log('Document clicked:', doc.name);
  }

  onDownload(doc: Document): void {
    console.log('Download:', doc.name);
  }

  onPreview(doc: Document): void {
    console.log('Preview:', doc.name);
  }

  onAskEve(doc: Document): void {
    console.log('Ask Eve about:', doc.name);
  }
}
