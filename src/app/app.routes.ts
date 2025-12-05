import { Routes } from '@angular/router';
import { AdminGuard } from './guards/admin.guard';
import { OwnerGuard } from './guards/owner.guard';
import { ProviderGuard } from './guards/consignor.guard';
import { CustomerGuard } from './guards/customer.guard';

export const routes: Routes = [
  // Shop-first URL pattern for customers/consignors (/shop/{shop-slug})
  {
    path: 'shop/:shopSlug',
    loadChildren: () => import('./shop/shop.routes').then(m => m.shopRoutes)
  },

  // Legacy shopper storefront routes (/shop/{storeSlug}) - Phase 1
  {
    path: 'shopper/:storeSlug',
    loadChildren: () => import('./shopper/shopper.routes').then(m => m.shopperRoutes)
  },

  // Public storefront routes (fallback when Square/Shopify unavailable)
  {
    path: 'store/:orgSlug',
    loadChildren: () => import('./public-store/public-store.routes').then(m => m.publicStoreRoutes)
  },

  // System admin routes (admin role only)
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes)
  },

  // Owner area routes (owner/manager/staff roles)
  {
    path: 'owner',
    canActivate: [OwnerGuard],
    loadChildren: () => import('./owner/owner.routes').then(m => m.ownerRoutes)
  },

  // consignor area routes (consignor role + owners/managers)
  {
    path: 'consignor',
    canActivate: [ProviderGuard],
    loadChildren: () => import('./consignor/consignor.routes').then(m => m.providerRoutes)
  },

  // Customer area routes (customer/consignor roles)
  {
    path: 'customer',
    canActivate: [CustomerGuard],
    loadChildren: () => import('./customer/customer.routes').then(m => m.customerRoutes)
  },

  // Public landing pages (no auth required)
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./public/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./public/role-selection.component').then(m => m.RoleSelectionComponent)
  },
  {
    path: 'signup/owner',
    loadComponent: () => import('./auth/owner-signup-step1.component').then(m => m.OwnerSignupStep1Component)
  },
  {
    path: 'signup/owner/profile',
    loadComponent: () => import('./auth/owner-signup-step2.component').then(m => m.OwnerSignupStep2Component)
  },
  {
    path: 'signup/consignor',
    loadComponent: () => import('./auth/consignor-signup-step1.component').then(m => m.consignorsignupStep1Component)
  },
  {
    path: 'signup/consignor/details',
    loadComponent: () => import('./auth/consignor-signup-step2.component').then(m => m.consignorsignupStep2Component)
  },

  // Authentication routes (no auth required)
  {
    path: 'login',
    loadComponent: () => import('./auth/login-simple.component').then(m => m.LoginSimpleComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'register/owner',
    loadComponent: () => import('./auth/owner-signup-step1.component').then(m => m.OwnerSignupStep1Component)
  },
  {
    path: 'register/consignor',
    loadComponent: () => import('./auth/register-consignor.component').then(m => m.RegisterProviderComponent)
  },
  {
    path: 'register/consignor/invitation',
    loadComponent: () => import('./components/consignor-registration-step1.component').then(m => m.ProviderRegistrationStep1Component)
  },
  {
    path: 'register/consignor/details',
    loadComponent: () => import('./components/consignor-registration-step2.component').then(m => m.ProviderRegistrationStep2Component)
  },
  {
    path: 'register/success',
    loadComponent: () => import('./auth/register-success.component').then(m => m.RegisterSuccessComponent)
  },

  // Unauthorized access route
  {
    path: 'unauthorized',
    loadComponent: () => import('./auth/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  // Catch-all route
  {
    path: '**',
    redirectTo: '/'
  }
];
