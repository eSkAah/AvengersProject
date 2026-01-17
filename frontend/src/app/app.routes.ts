import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'engagements/:id',
    loadComponent: () =>
      import('./features/engagement-detail/engagement-detail.component').then(
        (m) => m.EngagementDetailComponent
      ),
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./features/documents/documents.component').then(
        (m) => m.DocumentsComponent
      ),
  },
];
