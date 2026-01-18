import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'engagements',
    loadComponent: () =>
      import('./features/engagements/engagements.component').then(m => m.EngagementsComponent),
  },
  {
    path: 'engagements/:id',
    loadComponent: () =>
      import('./features/engagement-detail/engagement-detail.component').then(
        m => m.EngagementDetailComponent
      ),
  },
  {
    path: 'structure',
    loadComponent: () =>
      import('./features/structure/structure.component').then(m => m.StructureComponent),
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
