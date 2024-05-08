import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },

  {
    path: 'signin',
    loadComponent: () => import('./signin/signin.page').then( m => m.SigninPage)
  },

  {
    path: '',
    redirectTo: 'signin',
    pathMatch: 'full',
  },
  {
    path: 'callback',
    loadComponent: () => import('./callback/callback.page').then( m => m.CallbackPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'docs-edit/:id',
    loadComponent: () => import('./docs-edit/docs-edit.page').then( m => m.DocsEditPage)
  },
  {
    path: 'revision',
    loadComponent: () => import('./revision/revision.page').then( m => m.RevisionPage)
  },
];
