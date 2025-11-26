import { Routes } from '@angular/router';

export const ownerRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/owner-dashboard.component').then(m => m.OwnerDashboardComponent)
  },
  {
    path: 'providers',
    loadComponent: () => import('../components/provider-list.component').then(m => m.ProviderListComponent)
  },
  {
    path: 'providers/new',
    loadComponent: () => import('../components/provider-add.component').then(m => m.ProviderAddComponent)
  },
  {
    path: 'providers/:id',
    loadComponent: () => import('../components/provider-detail.component').then(m => m.ProviderDetailComponent)
  },
  {
    path: 'providers/:id/edit',
    loadComponent: () => import('../components/provider-edit.component').then(m => m.ProviderEditComponent)
  },
  {
    path: 'inventory',
    loadComponent: () => import('./components/inventory-list.component').then(m => m.InventoryListComponent)
  },
  {
    path: 'sales',
    loadComponent: () => import('./components/owner-sales.component').then(m => m.OwnerSalesComponent)
  },
  {
    path: 'payouts',
    loadComponent: () => import('./components/owner-payouts.component').then(m => m.OwnerPayoutsComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/owner-settings.component').then(m => m.OwnerSettingsComponent)
  }
  // Note: Login is now handled by /login route in main app routing
];