import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  FileText,
  Hash,
  Banknote,
  Users,
  Check,
  Workflow,
  AlertTriangle,
  X,
} from 'lucide-angular';
import {
  EntityDetail,
  EntityTaxReport,
  TaxPeriodOption,
  WorkflowStep,
} from '../../core/models/entity.model';
import { MOCK_ENTITY_DETAILS } from '../../core/mocks/entity-detail.mock';
import { EntityTasksComponent } from './components/entity-tasks/entity-tasks.component';
import { EntityDocumentsComponent } from './components/entity-documents/entity-documents.component';
import { EntityTaxReportComponent } from './components/entity-tax-report/entity-tax-report.component';
import { EntityContactsComponent } from './components/entity-contacts/entity-contacts.component';
import { EntityInsightsComponent } from './components/entity-insights/entity-insights.component';
import { EntityWorkflowComponent } from './components/entity-workflow/entity-workflow.component';

type TabId = 'tasks' | 'documents' | 'tax-report' | 'insights' | 'contacts' | 'workflow';

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
    EntityWorkflowComponent,
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
  readonly Check = Check;
  readonly Workflow = Workflow;
  readonly AlertTriangle = AlertTriangle;
  readonly X = X;

  // State
  entity = signal<EntityDetail | null>(null);
  activeTab = signal<TabId>('workflow');
  loading = signal(true);
  selectedTaxYear = signal<number | null>(null);
  showApprovalModal = signal(false);

  // Computed: Available tax periods from entity
  availableTaxPeriods = computed<TaxPeriodOption[]>(() => {
    const e = this.entity();
    if (!e || !e.availableTaxPeriods) return [];
    return e.availableTaxPeriods;
  });

  // Computed: Selected tax report based on selected year
  selectedTaxReport = computed<EntityTaxReport | undefined>(() => {
    const e = this.entity();
    if (!e) return undefined;

    const year = this.selectedTaxYear();
    if (year && e.taxReportsByYear && e.taxReportsByYear[year]) {
      return e.taxReportsByYear[year];
    }

    // Fallback to default tax report
    return e.taxReport;
  });

  // Tabs with task counts
  tabs = computed<Tab[]>(() => {
    const e = this.entity();
    if (!e) return [];

    const pendingTasks = e.tasks.filter(t => t.status !== 'completed').length;

    return [
      { id: 'workflow', label: 'Workflow' },
      { id: 'tasks', label: 'Tasks', count: pendingTasks },
      { id: 'documents', label: 'Documents' },
      { id: 'tax-report', label: 'Tax Report' },
      { id: 'insights', label: 'Insights' },
      { id: 'contacts', label: 'Contacts' },
    ];
  });

  // Workflow steps from entity
  workflowSteps = computed<WorkflowStep[]>(() => {
    const e = this.entity();
    if (!e || !e.workflowSteps) return [];
    return e.workflowSteps;
  });

  // Approval state
  isApproved = computed(() => {
    const e = this.entity();
    return e?.isApproved ?? false;
  });

  ngOnInit(): void {
    const entityId = this.route.snapshot.paramMap.get('entityId');
    if (entityId) {
      this.loadEntity(entityId);
    }
  }

  private loadEntity(entityId: string): void {
    // Load mock data immediately (no artificial delay for POC)
    const entity = MOCK_ENTITY_DETAILS[entityId];
    if (entity) {
      this.entity.set(entity);
      // Initialize selected tax year to the most recent one
      if (entity.availableTaxPeriods && entity.availableTaxPeriods.length > 0) {
        this.selectedTaxYear.set(entity.availableTaxPeriods[0].year);
      } else if (entity.taxReport) {
        this.selectedTaxYear.set(entity.taxReport.fiscalYear);
      }
    }
    this.loading.set(false);
  }

  onTaxYearChange(year: number): void {
    this.selectedTaxYear.set(year);
  }

  setTab(tabId: TabId): void {
    this.activeTab.set(tabId);
  }

  goBack(): void {
    this.router.navigate(['/app/services/cit']);
  }

  openApprovalModal(): void {
    this.showApprovalModal.set(true);
  }

  closeApprovalModal(): void {
    this.showApprovalModal.set(false);
  }

  confirmApproval(): void {
    const e = this.entity();
    if (e) {
      this.entity.set({ ...e, isApproved: true });
    }
    this.showApprovalModal.set(false);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
