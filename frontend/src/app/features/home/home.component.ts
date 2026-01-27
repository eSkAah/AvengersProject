import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Home } from 'lucide-angular';
import { MockDataService } from '../../core';
import {
  DropFileWidgetComponent,
  MissingDocumentsWidgetComponent,
  SignoffWidgetComponent,
  ServicesWidgetComponent,
  TaxNewsWidgetComponent,
  RecentActivityWidgetComponent,
  ContactsWidgetComponent,
} from './components';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DropFileWidgetComponent,
    MissingDocumentsWidgetComponent,
    SignoffWidgetComponent,
    ServicesWidgetComponent,
    TaxNewsWidgetComponent,
    RecentActivityWidgetComponent,
    ContactsWidgetComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly mockData = inject(MockDataService);
  private readonly router = inject(Router);

  readonly icons = {
    home: Home,
  };

  readonly today = new Date();

  onFilesUpload(files: File[]): void {
    // Navigate to documents page with upload mode
    this.router.navigate(['/app/documents'], {
      queryParams: { upload: true },
    });
  }
}
