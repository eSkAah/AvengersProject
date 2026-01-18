import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'engagements/:id',
    loadComponent: () =>
      import('./features/engagement-detail/engagement-detail.component').then(
        m => m.EngagementDetailComponent
      ),
  },
  {
    path: 'engagements/:id/dashboard',
    loadComponent: () =>
      import('./features/dashboard/engagement-dashboard/engagement-dashboard.component').then(
        m => m.EngagementDashboardComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./features/documents/documents.component').then(m => m.DocumentsComponent),
  },
  {
    path: 'eve',
    loadComponent: () => import('./features/eve/eve.component').then(m => m.EveComponent),
  },
];
