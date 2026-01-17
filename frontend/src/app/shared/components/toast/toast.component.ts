import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { ToastService, Toast } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' })),
      ]),
    ]),
  ],
})
export class ToastComponent {
  private toastService = inject(ToastService);

  toasts = this.toastService.toasts;

  getToastClasses(toast: Toast): string {
    return ['toast', `toast--${toast.type}`].join(' ');
  }

  getIconName(type: string): string {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'x';
      case 'warning':
        return 'alert-triangle';
      case 'info':
      default:
        return 'info';
    }
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
