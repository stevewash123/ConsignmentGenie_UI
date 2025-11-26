import { Routes } from '@angular/router';

export const shopRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./shop-layout.component').then(m => m.ShopLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./components/shop-storefront.component').then(m => m.ShopStorefrontComponent)
      },
      {
        path: 'login',
        loadComponent: () => import('./components/shop-login.component').then(m => m.ShopLoginComponent)
      }
    ]
  }
];