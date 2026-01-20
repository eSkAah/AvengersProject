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
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'app/engagements',
    loadComponent: () =>
      import('./features/engagements/engagements.component').then(m => m.EngagementsComponent),
  },
  {
    path: 'app/engagements/:id',
    loadComponent: () =>
      import('./features/engagement-detail/engagement-detail.component').then(
        m => m.EngagementDetailComponent
      ),
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
    path: 'app/insights',
    loadComponent: () =>
      import('./features/insights/insights.component').then(m => m.InsightsComponent),
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
