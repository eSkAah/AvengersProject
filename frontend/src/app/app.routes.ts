import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./features/documents/documents.component').then((m) => m.DocumentsComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
];
