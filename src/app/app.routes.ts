import { Routes } from '@angular/router';

export const routes: Routes = [



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
    path: 'revision/:id/:approx_check/:lang',
    loadComponent: () => import('./revision/revision.page').then( m => m.RevisionPage)
  },
  {
    path: 'goal-setter',
    loadComponent: () => import('./goal-setter/goal-setter.page').then( m => m.GoalSetterPage)
  },
  {
    path: 'drag-drop-testbed',
    loadComponent: () => import('./drag-drop-testbed/drag-drop-testbed.page').then( m => m.DragDropTestbedPage)
  },
  {
    path: 'flashcards/:id/:lang',
    loadComponent: () => import('./flashcards/flashcards.page').then( m => m.FlashcardsPage)
  },
];
