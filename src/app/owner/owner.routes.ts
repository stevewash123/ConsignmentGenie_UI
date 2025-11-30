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
    loadComponent: () => import('./settings/settings-layout.component').then(m => m.SettingsLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./settings/hub/settings-hub.component').then(m => m.SettingsHubComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./settings/profile/shop-profile.component').then(m => m.ShopProfileComponent)
      },
      {
        path: 'business',
        loadComponent: () => import('./settings/business/business-settings.component').then(m => m.BusinessSettingsComponent)
      },
      {
        path: 'storefront',
        loadComponent: () => import('./settings/storefront/storefront-settings.component').then(m => m.StorefrontSettingsComponent)
      },
      {
        path: 'accounting',
        loadComponent: () => import('./settings/accounting/accounting-settings.component').then(m => m.AccountingSettingsComponent)
      },
      {
        path: 'consignors',
        loadComponent: () => import('./settings/consignors/consignor-settings.component').then(m => m.ConsignorSettingsComponent)
      },
      {
        path: 'subscription',
        loadComponent: () => import('./settings/subscription/subscription-settings.component').then(m => m.SubscriptionSettingsComponent)
      },
      {
        path: 'account',
        loadComponent: () => import('./settings/account/account-settings.component').then(m => m.AccountSettingsComponent)
      }
    ]
  }
  // Note: Login is now handled by /login route in main app routing
];