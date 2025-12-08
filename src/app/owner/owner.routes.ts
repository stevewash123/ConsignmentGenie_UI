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
    path: 'settings',
    loadComponent: () => import('./settings/settings-layout.component').then(m => m.SettingsLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'store-profile/basic-info',
        pathMatch: 'full'
      },
      // Store Profile subsections
      {
        path: 'store-profile/basic-info',
        loadComponent: () => import('./settings/store-profile/basic-info/basic-info.component').then(m => m.BasicInfoComponent)
      },
      {
        path: 'store-profile/branding',
        loadComponent: () => import('./settings/store-profile/branding/branding.component').then(m => m.BrandingComponent)
      },
      {
        path: 'store-profile/domain-settings',
        loadComponent: () => import('./settings/store-profile/domain-settings/domain-settings.component').then(m => m.DomainSettingsComponent)
      },
      // Business Settings subsections
      {
        path: 'business-settings/tax-settings',
        loadComponent: () => import('./settings/business-settings/tax-settings/tax-settings.component').then(m => m.TaxSettingsComponent)
      },
      {
        path: 'business-settings/receipt-settings',
        loadComponent: () => import('./settings/business-settings/receipt-settings/receipt-settings.component').then(m => m.ReceiptSettingsComponent)
      },
      {
        path: 'business-settings/policies',
        loadComponent: () => import('./settings/business-settings/policies/policies.component').then(m => m.PoliciesComponent)
      },
      // Consignor Settings subsections
      {
        path: 'consignor-settings/defaults',
        loadComponent: () => import('./settings/consignor-settings/defaults/defaults.component').then(m => m.DefaultsComponent)
      },
      {
        path: 'consignor-settings/agreements',
        loadComponent: () => import('./settings/consignor-settings/agreements/agreements.component').then(m => m.AgreementsComponent)
      },
      {
        path: 'consignor-settings/payout-settings',
        loadComponent: () => import('./settings/consignor-settings/payout-settings/payout-settings.component').then(m => m.PayoutSettingsComponent)
      },
      // Consignor Management subsections
      {
        path: 'consignor-management/store-codes',
        loadComponent: () => import('./settings/consignor-management/store-codes/store-codes.component').then(m => m.StoreCodesComponent)
      },
      {
        path: 'consignor-management/approval-workflow',
        loadComponent: () => import('./settings/consignor-management/approval-workflow/approval-workflow.component').then(m => m.ApprovalWorkflowComponent)
      },
      {
        path: 'consignor-management/permissions',
        loadComponent: () => import('./settings/consignor-management/permissions/permissions.component').then(m => m.PermissionsComponent)
      },
      // Integrations subsections
      {
        path: 'integrations/inventory-sales',
        loadComponent: () => import('./settings/integrations/inventory-sales/inventory-sales.component').then(m => m.InventorySalesComponent)
      },
      {
        path: 'integrations/accounting',
        loadComponent: () => import('./settings/integrations/accounting/accounting.component').then(m => m.AccountingComponent)
      },
      {
        path: 'integrations/payments',
        loadComponent: () => import('./settings/integrations/payments/payments.component').then(m => m.PaymentsComponent)
      },
      {
        path: 'integrations/banking',
        loadComponent: () => import('./settings/integrations/banking/banking.component').then(m => m.BankingComponent)
      },
      // Account Settings subsections
      {
        path: 'account-settings/notifications',
        loadComponent: () => import('./settings/account-settings/notifications/notifications.component').then(m => m.AccountNotificationsComponent)
      },
      {
        path: 'account-settings/license',
        loadComponent: () => import('./settings/account-settings/license/license.component').then(m => m.LicenseComponent)
      }
    ]
  }
  // Note: Login is now handled by /login route in main app routing
];