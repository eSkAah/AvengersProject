import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, LayoutDashboard } from 'lucide-angular';
import { MockDataService } from '../../core';
import {
  UploadWidgetComponent,
  DonutWidgetComponent,
  DonutSegment,
  SignoffWidgetComponent,
  EngagementListWidgetComponent,
} from './components';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UploadWidgetComponent,
    DonutWidgetComponent,
    SignoffWidgetComponent,
    EngagementListWidgetComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  readonly icons = {
    layoutDashboard: LayoutDashboard,
  };

  // State for donut filter
  readonly selectedDonutSegment = signal<DonutSegment>('all');

  onDonutSegmentChange(segment: DonutSegment): void {
    this.selectedDonutSegment.set(segment);
  }

  onFilesUpload(files: File[]): void {
    // Navigate to documents page with upload mode
    this.router.navigate(['/app/documents'], {
      queryParams: { upload: true },
    });
  }
}
