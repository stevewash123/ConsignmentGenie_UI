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
    path: 'consignors',
    loadComponent: () => import('../components/consignor-list.component').then(m => m.ConsignorListComponent)
  },
  {
    path: 'consignors/new',
    loadComponent: () => import('../components/consignor-add.component').then(m => m.ConsignorAddComponent)
  },
  {
    path: 'consignors/:id',
    loadComponent: () => import('../components/consignor-detail.component').then(m => m.ConsignorDetailComponent)
  },
  {
    path: 'consignors/:id/edit',
    loadComponent: () => import('../components/consignor-edit.component').then(m => m.ConsignorEditComponent)
  },
  {
    path: 'inventory',
    loadComponent: () => import('./components/inventory-list.component').then(m => m.InventoryListComponent)
  },
  {
    path: 'record-sale',
    loadComponent: () => import('./components/record-sale.component').then(m => m.RecordSaleComponent)
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