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
    path: 'inventory/new',
    loadComponent: () => import('./components/inventory-add.component').then(m => m.InventoryAddComponent)
  },
  {
    path: 'inventory/bulk-upload',
    loadComponent: () => import('./components/inventory-bulk-upload.component').then(m => m.InventoryBulkUploadComponent)
  },
  {
    path: 'inventory/:id',
    loadComponent: () => import('./components/inventory-detail.component').then(m => m.InventoryDetailComponent)
  },
  {
    path: 'inventory/:id/edit',
    loadComponent: () => import('./components/inventory-edit.component').then(m => m.InventoryEditComponent)
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
    path: 'price-requests',
    loadComponent: () => import('./components/price-requests/price-request-list.component').then(m => m.PriceRequestListComponent)
  },
  {
    path: 'return-requests',
    loadComponent: () => import('./components/return-requests-list.component').then(m => m.ReturnRequestsListComponent)
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
        path: 'profile',
        children: [
          {
            path: 'branding',
            loadComponent: () => import('./settings/profile/branding/branding.component').then(m => m.BrandingComponent)
          },
          {
            path: '',
            redirectTo: 'branding',
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
        path: 'inventory-management/categories',
        loadComponent: () => import('./settings/inventory/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'subscription',
        loadComponent: () => import('./settings/subscription/subscription-settings.component').then(m => m.SubscriptionSettingsComponent)
      },
      {
        path: 'consignor-management',
        children: [
          {
            path: 'store-codes',
            loadComponent: () => import('./settings/consignor-management/store-codes/store-codes.component').then(m => m.StoreCodesComponent)
          },
          {
            path: 'approval-workflow',
            loadComponent: () => import('./settings/consignor-management/approval-workflow/approval-workflow.component').then(m => m.ApprovalWorkflowComponent)
          },
          {
            path: 'permissions',
            loadComponent: () => import('./settings/consignor-management/permissions/permissions.component').then(m => m.PermissionsComponent)
          }
        ]
      },
      {
        path: 'integrations',
        children: [
          {
            path: '',
            loadComponent: () => import('./settings/integrations/integrations-settings.component').then(m => m.IntegrationsSettingsComponent)
          },
          {
            path: 'inventory-sales',
            loadComponent: () => import('./settings/integrations/inventory-sales/inventory-sales.component').then(m => m.InventorySalesComponent)
          },
          {
            path: 'accounting',
            loadComponent: () => import('./settings/integrations/accounting/accounting.component').then(m => m.AccountingComponent)
          },
          {
            path: 'payments',
            loadComponent: () => import('./settings/integrations/payments/payments.component').then(m => m.PaymentsComponent)
          },
          {
            path: 'banking',
            loadComponent: () => import('./settings/integrations/banking/banking.component').then(m => m.BankingComponent)
          }
        ]
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