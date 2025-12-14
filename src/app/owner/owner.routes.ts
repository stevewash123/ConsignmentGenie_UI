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
    loadComponent: () => import('./components/consignor-list.component').then(m => m.ConsignorListComponent)
  },
  {
    path: 'consignors/new',
    loadComponent: () => import('./components/consignor-add.component').then(m => m.ConsignorAddComponent)
  },
  {
    path: 'consignors/:id',
    loadComponent: () => import('./components/consignor-detail.component').then(m => m.ConsignorDetailComponent)
  },
  {
    path: 'consignors/:id/edit',
    loadComponent: () => import('./components/consignor-edit.component').then(m => m.ConsignorEditComponent)
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
    loadComponent: () => import('./components/consignor-balance-dashboard.component').then(m => m.ConsignorBalanceDashboardComponent)
  },
  {
    path: 'payouts/history',
    loadComponent: () => import('./components/payout-history.component').then(m => m.PayoutHistoryComponent)
  },
  {
    path: 'payouts/check-clearance',
    loadComponent: () => import('./components/manual-check-clearance.component').then(m => m.ManualCheckClearanceComponent)
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/owner-notifications.component').then(m => m.OwnerNotificationsComponent)
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
        path: 'store-profile',
        children: [
          {
            path: 'basic-info',
            loadComponent: () => import('./settings/profile/basic-info/store-profile-basic-info.component').then(m => m.StoreProfileBasicInfoComponent)
          },
          {
            path: '',
            redirectTo: 'basic-info',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'business',
        children: [
          {
            path: '',
            loadComponent: () => import('./settings/business/business-settings.component').then(m => m.BusinessSettingsComponent)
          },
          {
            path: 'tax-settings',
            loadComponent: () => import('./settings/business/tax-settings.component').then(m => m.TaxSettingsComponent)
          },
          {
            path: 'receipt-settings',
            loadComponent: () => import('./settings/business/receipt-settings/receipt-settings.component').then(m => m.ReceiptSettingsComponent)
          },
          {
            path: 'policies',
            loadComponent: () => import('./settings/business/policies/policies.component').then(m => m.PoliciesComponent)
          }
        ]
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
        children: [
          {
            path: '',
            loadComponent: () => import('./settings/consignors/consignor-settings.component').then(m => m.ConsignorSettingsComponent)
          },
          {
            path: 'payout-settings',
            loadComponent: () => import('./settings/consignors/consignor-payout-settings.component').then(m => m.ConsignorPayoutSettingsComponent)
          }
        ]
      },
      {
        path: 'subscription',
        loadComponent: () => import('./settings/subscription/subscription-settings.component').then(m => m.SubscriptionSettingsComponent)
      },
      {
        path: 'integrations',
        loadComponent: () => import('./settings/integrations/integrations-settings.component').then(m => m.IntegrationsSettingsComponent)
      },
      {
        path: 'account',
        children: [
          {
            path: '',
            loadComponent: () => import('./settings/account/account-settings.component').then(m => m.AccountSettingsComponent)
          },
          {
            path: 'notifications',
            loadComponent: () => import('./settings/account/account-notifications.component').then(m => m.AccountNotificationsComponent)
          }
        ]
      }
    ]
  }
  // Note: Login is now handled by /login route in main app routing
];