import { Routes } from '@angular/router';

export const consignorRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/consignor-layout.component').then(m => m.ConsignorLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/consignor-dashboard.component').then(m => m.ConsignorDashboardComponent)
      },
      {
        path: 'items',
        loadComponent: () => import('./components/consignor-items.component').then(m => m.ConsignorItemsComponent)
      },
      {
        path: 'items/:id',
        loadComponent: () => import('./components/consignor-item-detail.component').then(m => m.ConsignorItemDetailComponent)
      },
      {
        path: 'sales',
        loadComponent: () => import('./components/consignor-sales.component').then(m => m.ConsignorSalesComponent)
      },
      {
        path: 'payouts',
        loadComponent: () => import('./components/consignor-payouts.component').then(m => m.ConsignorPayoutsComponent)
      },
      {
        path: 'payouts/:id',
        loadComponent: () => import('./components/consignor-payout-detail.component').then(m => m.ConsignorPayoutDetailComponent)
      },
      {
        path: 'statements',
        loadComponent: () => import('./components/monthly-statements.component').then(m => m.MonthlyStatementsComponent)
      },
      {
        path: 'statements/:id',
        loadComponent: () => import('./components/consignor-statement-detail.component').then(m => m.ConsignorStatementDetailComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./components/consignor-notifications.component').then(m => m.ConsignorNotificationsComponent)
      },
      {
        path: 'notifications/preferences',
        loadComponent: () => import('./components/consignor-notification-preferences.component').then(m => m.ConsignorNotificationPreferencesComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/consignor-profile.component').then(m => m.ConsignorProfileComponent)
      }
    ]
  }
];