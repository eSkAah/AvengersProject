import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent {
  @Input({ required: true }) items: BreadcrumbItem[] = [];
  @Input() separator: 'chevron' | 'slash' = 'chevron';
  @Input() maxLength = 30;

  @Output() navigate = new EventEmitter<BreadcrumbItem>();
  @Output() homeClick = new EventEmitter<void>();

  onItemClick(item: BreadcrumbItem, index: number): void {
    // Don't emit for last item (current page)
    if (index < this.items.length - 1) {
      this.navigate.emit(item);
    }
  }

  onHomeClick(): void {
    this.homeClick.emit();
  }

  truncateLabel(label: string): string {
    if (label.length <= this.maxLength) {
      return label;
    }
    return label.substring(0, this.maxLength - 3) + '...';
  }

  isLast(index: number): boolean {
    return index === this.items.length - 1;
  }
}
