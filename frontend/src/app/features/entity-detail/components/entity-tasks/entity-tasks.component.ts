import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Circle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Eye,
  FileCheck,
  Keyboard,
  ShieldCheck,
  User,
} from 'lucide-angular';
import { EntityTask, TaskStatus, TaskPriority } from '../../../../core/models/entity.model';

@Component({
  selector: 'app-entity-tasks',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './entity-tasks.component.html',
  styleUrl: './entity-tasks.component.scss',
})
export class EntityTasksComponent {
  // Icons
  readonly Circle = Circle;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly AlertTriangle = AlertTriangle;
  readonly Upload = Upload;
  readonly Eye = Eye;
  readonly FileCheck = FileCheck;
  readonly Keyboard = Keyboard;
  readonly ShieldCheck = ShieldCheck;
  readonly User = User;

  tasks = input.required<EntityTask[]>();

  // Group tasks by status
  pendingTasks = computed(() =>
    this.tasks()
      .filter(t => t.status === 'pending')
      .sort((a, b) => this.priorityOrder(a.priority) - this.priorityOrder(b.priority))
  );

  inProgressTasks = computed(() => this.tasks().filter(t => t.status === 'in_progress'));

  blockedTasks = computed(() => this.tasks().filter(t => t.status === 'blocked'));

  completedTasks = computed(() => this.tasks().filter(t => t.status === 'completed'));

  // Stats
  stats = computed(() => ({
    total: this.tasks().length,
    completed: this.completedTasks().length,
    pending: this.pendingTasks().length,
    inProgress: this.inProgressTasks().length,
    blocked: this.blockedTasks().length,
  }));

  private priorityOrder(priority: TaskPriority): number {
    return { high: 0, medium: 1, low: 2 }[priority];
  }

  getStatusIcon(status: TaskStatus) {
    switch (status) {
      case 'completed':
        return this.CheckCircle2;
      case 'in_progress':
        return this.Clock;
      case 'blocked':
        return this.AlertTriangle;
      default:
        return this.Circle;
    }
  }

  getCategoryIcon(category: string) {
    switch (category) {
      case 'document':
        return this.Upload;
      case 'review':
        return this.Eye;
      case 'approval':
        return this.FileCheck;
      case 'data_entry':
        return this.Keyboard;
      case 'validation':
        return this.ShieldCheck;
      default:
        return this.Circle;
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff <= 7) return `In ${diff} days`;

    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }

  isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }
}
