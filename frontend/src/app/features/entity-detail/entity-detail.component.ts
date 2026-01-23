import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Building2, Calendar, MapPin, FileText, Hash, Banknote, Users } from 'lucide-angular';
import { EntityDetail } from '../../core/models/entity.model';
import { MOCK_ENTITY_DETAILS } from '../../core/mocks/entity-detail.mock';
import { EntityTasksComponent } from './components/entity-tasks/entity-tasks.component';
import { EntityDocumentsComponent } from './components/entity-documents/entity-documents.component';
import { EntityTaxReportComponent } from './components/entity-tax-report/entity-tax-report.component';
import { EntityContactsComponent } from './components/entity-contacts/entity-contacts.component';
import { EntityInsightsComponent } from './components/entity-insights/entity-insights.component';

type TabId = 'tasks' | 'documents' | 'tax-report' | 'insights' | 'contacts';

interface Tab {
  id: TabId;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-entity-detail',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    EntityTasksComponent,
    EntityDocumentsComponent,
    EntityTaxReportComponent,
    EntityContactsComponent,
    EntityInsightsComponent,
  ],
  templateUrl: './entity-detail.component.html',
  styleUrl: './entity-detail.component.scss',
})
export class EntityDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Icons
  readonly ArrowLeft = ArrowLeft;
  readonly Building2 = Building2;
  readonly Calendar = Calendar;
  readonly MapPin = MapPin;
  readonly FileText = FileText;
  readonly Hash = Hash;
  readonly Banknote = Banknote;
  readonly Users = Users;

  // State
  entity = signal<EntityDetail | null>(null);
  activeTab = signal<TabId>('tasks');
  loading = signal(true);

  // Tabs with task counts
  tabs = computed<Tab[]>(() => {
    const e = this.entity();
    if (!e) return [];

    const pendingTasks = e.tasks.filter(t => t.status !== 'completed').length;

    return [
      { id: 'tasks', label: 'Tasks', count: pendingTasks },
      { id: 'documents', label: 'Documents' },
      { id: 'tax-report', label: 'Tax Report' },
      { id: 'insights', label: 'Insights' },
      { id: 'contacts', label: 'Contacts' },
    ];
  });

  ngOnInit(): void {
    const entityId = this.route.snapshot.paramMap.get('entityId');
    if (entityId) {
      this.loadEntity(entityId);
    }
  }

  private loadEntity(entityId: string): void {
    // Simulate API call
    setTimeout(() => {
      const entity = MOCK_ENTITY_DETAILS[entityId];
      if (entity) {
        this.entity.set(entity);
      }
      this.loading.set(false);
    }, 300);
  }

  setTab(tabId: TabId): void {
    this.activeTab.set(tabId);
  }

  goBack(): void {
    this.router.navigate(['/app/services/cit']);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
