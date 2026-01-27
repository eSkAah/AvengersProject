import { Component, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Database,
  Cog,
  Eye,
  CheckCircle2,
  Circle,
  ChevronDown,
  Clock,
  User,
} from 'lucide-angular';
import { WorkflowStep, WorkflowStepId } from '../../../../core/models/entity.model';

@Component({
  selector: 'app-entity-workflow',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './entity-workflow.component.html',
  styleUrl: './entity-workflow.component.scss',
})
export class EntityWorkflowComponent {
  // Icons
  readonly Database = Database;
  readonly Cog = Cog;
  readonly Eye = Eye;
  readonly CheckCircle2 = CheckCircle2;
  readonly Circle = Circle;
  readonly ChevronDown = ChevronDown;
  readonly Clock = Clock;
  readonly User = User;

  steps = input.required<WorkflowStep[]>();

  // Track expanded steps
  expandedSteps = signal<Set<WorkflowStepId>>(new Set());

  // Computed progress percentage
  progressPercent = computed(() => {
    const s = this.steps();
    if (!s || s.length === 0) return 0;
    const completed = s.filter(step => step.status === 'completed').length;
    return (completed / s.length) * 100;
  });

  // Get current active step index
  currentStepIndex = computed(() => {
    const s = this.steps();
    const idx = s.findIndex(step => step.status === 'in_progress');
    return idx >= 0 ? idx : s.filter(step => step.status === 'completed').length;
  });

  // Count completed tasks for a step
  getCompletedTaskCount(step: WorkflowStep): number {
    return step.tasks.filter(t => t.status === 'completed').length;
  }

  // Check if step is expanded
  isExpanded(stepId: WorkflowStepId): boolean {
    return this.expandedSteps().has(stepId);
  }

  // Toggle step expansion
  toggleStep(stepId: WorkflowStepId): void {
    const current = this.expandedSteps();
    const newSet = new Set(current);
    if (newSet.has(stepId)) {
      newSet.delete(stepId);
    } else {
      newSet.add(stepId);
    }
    this.expandedSteps.set(newSet);
  }

  getStepIcon(stepId: WorkflowStepId) {
    switch (stepId) {
      case 'collect_data':
        return this.Database;
      case 'processing':
        return this.Cog;
      case 'reviewing':
        return this.Eye;
      case 'completed':
        return this.CheckCircle2;
      default:
        return this.Circle;
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatShortDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  }
}
