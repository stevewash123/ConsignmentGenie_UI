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
    path: 'pending-approvals',
    loadComponent: () => import('./components/pending-approvals.component').then(m => m.PendingApprovalsComponent)
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
    path: 'inventory/:id',
    loadComponent: () => import('./components/item-detail.component').then(m => m.ItemDetailComponent)
  },
  {
    path: 'inventory/:id/edit',
    loadComponent: () => import('./components/inventory-edit.component').then(m => m.InventoryEditComponent)
  },
  {
    path: 'inventory/categories',
    loadComponent: () => import('./inventory/categories.component').then(m => m.InventoryCategoriesComponent)
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
    path: 'dropoff-requests',
    loadComponent: () => import('./components/owner-dropoff-requests.component').then(m => m.OwnerDropoffRequestsComponent)
  },
  {
    path: 'dropoff-requests/:id',
    loadComponent: () => import('./components/owner-dropoff-detail.component').then(m => m.OwnerDropoffDetailComponent)
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
            redirectTo: 'defaults',
            pathMatch: 'full'
          },
          {
            path: 'defaults',
            loadComponent: () => import('./settings/consignors/consignor-settings.component').then(m => m.ConsignorSettingsComponent)
          },
          {
            path: 'onboarding',
            loadComponent: () => import('./settings/consignors/onboarding/consignor-onboarding.component').then(m => m.ConsignorOnboardingComponent)
          },
          {
            path: 'agreement',
            loadComponent: () => import('./settings/consignors/agreement/agreements.component').then(m => m.AgreementsComponent)
          },
          {
            path: 'payout-settings',
            loadComponent: () => import('./settings/consignors/consignor-payout-settings.component').then(m => m.ConsignorPayoutSettingsComponent)
          }
        ]
      },
      {
        path: 'consignor-management',
        children: [
          {
            path: 'permissions',
            loadComponent: () => import('./settings/consignor-management/permissions/permissions.component').then(m => m.PermissionsComponent)
          }
        ]
      },
      {
        path: 'payouts',
        children: [
          {
            path: '',
            redirectTo: 'schedule-thresholds',
            pathMatch: 'full'
          },
          {
            path: 'schedule-thresholds',
            loadComponent: () => import('./settings/payouts/schedule-thresholds.component').then(m => m.ScheduleThresholdsComponent)
          },
          {
            path: 'payment-methods',
            loadComponent: () => import('./settings/payouts/payment-methods.component').then(m => m.PaymentMethodsComponent)
          },
          {
            path: 'automation',
            loadComponent: () => import('./settings/payouts/automation.component').then(m => m.AutomationComponent)
          },
          {
            path: 'reports',
            loadComponent: () => import('./settings/payouts/reports.component').then(m => m.ReportsComponent)
          }
        ]
      },
      {
        path: 'integrations',
        children: [
          {
            path: '',
            redirectTo: 'sales',
            pathMatch: 'full'
          },
          {
            path: 'sales',
            loadComponent: () => import('./settings/integrations/sales/sales.component').then(m => m.SalesComponent)
          },
          {
            path: 'accounting',
            loadComponent: () => import('./settings/integrations/accounting/accounting.component').then(m => m.AccountingComponent)
          },
          {
            path: 'payouts',
            loadComponent: () => import('./settings/integrations/payouts/payouts.component').then(m => m.Payouts)
          }
        ]
      },
      {
        path: 'notifications',
        loadComponent: () => import('./settings/notifications/notifications.component').then(m => m.AccountNotificationsComponent)
      },
      {
        path: 'account',
        children: [
          {
            path: '',
            loadComponent: () => import('./settings/account/account-settings.component').then(m => m.AccountSettingsComponent)
          },
          {
            path: 'owner-contact-info',
            loadComponent: () => import('./settings/account/owner-contact-info/owner-contact-info.component').then(m => m.OwnerContactInfoComponent)
          },
          {
            path: 'billing',
            loadComponent: () => import('./settings/account/license.component').then(m => m.LicenseComponent)
          }
        ]
      }
    ]
  }
  // Note: Login is now handled by /login route in main app routing
];