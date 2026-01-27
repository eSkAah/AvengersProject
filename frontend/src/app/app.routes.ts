import { Routes } from '@angular/router';

export const routes: Routes = [
  // Landing page - bypasses layout shell
  {
    path: '',
    loadComponent: () =>
      import('./features/landing-page/landing-page.component').then(m => m.LandingPageComponent),
    data: { noLayout: true },
  },
  // App routes - with layout shell
  {
    path: 'app',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  // Engagements routes removed - functionality integrated elsewhere
  // Redirect old engagement URLs to home
  {
    path: 'app/engagements',
    redirectTo: '/app',
    pathMatch: 'full',
  },
  {
    path: 'app/engagements/:id',
    redirectTo: '/app',
    pathMatch: 'full',
  },
  {
    path: 'app/services/:id',
    loadComponent: () =>
      import('./features/service-detail/service-detail.component').then(
        m => m.ServiceDetailComponent
      ),
  },
  {
    path: 'app/entities/:entityId',
    loadComponent: () =>
      import('./features/entity-detail/entity-detail.component').then(m => m.EntityDetailComponent),
  },
  {
    path: 'app/structure',
    loadComponent: () =>
      import('./features/structure/structure.component').then(m => m.StructureComponent),
  },
  {
    path: 'app/documents',
    loadComponent: () =>
      import('./features/documents/documents.component').then(m => m.DocumentsComponent),
  },
  {
    path: 'app/eve',
    loadComponent: () => import('./features/eve/eve.component').then(m => m.EveComponent),
  },
  // Redirect unknown routes to landing
  {
    path: '**',
    redirectTo: '',
  },
];
