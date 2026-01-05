import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'call',
        loadComponent: () => import('./features/call/call.component').then(m => m.CallComponent)
      },
      {
        path: 'contacts',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) // Placeholder
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) // Placeholder
      },
      {
        path: 'opportunities/pre-sales',
        loadComponent: () => import('./features/pre-sales/pre-sales.component').then(m => m.PreSalesComponent)
      },
      {
        path: 'opportunities/quotation',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) // Placeholder
      },
      {
        path: 'opportunities/confirmed',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) // Placeholder
      },
      {
        path: 'opportunities/development',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) // Placeholder
      },
      {
        path: 'opportunities/completed',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) // Placeholder
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) // Placeholder
      },
      {
        path: 'user-master',
        loadComponent: () => import('./features/user-master/user-master.component').then(m => m.UserMasterComponent)
      },
      {
        path: 'menu-management',
        loadComponent: () => import('./features/menu-management/menu-management.component').then(m => m.MenuManagementComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
