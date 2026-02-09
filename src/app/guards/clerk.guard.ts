import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserRole } from './auth.guard';

@Injectable({
  providedIn: 'root'
})
export class ClerkGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('auth_token');
    const userDataStr = localStorage.getItem('user_data');

    if (!token || !userDataStr) {
      this.router.navigate(['/login']);
      return false;
    }

    let userData;
    try {
      userData = JSON.parse(userDataStr);
    } catch (error) {
      console.error('Invalid user data in localStorage:', error);
      this.router.navigate(['/login']);
      return false;
    }

    // Allow clerk and owner roles to access clerk pages
    // Handle both string and enum role values
    const role = userData.role;
    if (role === UserRole.Clerk || role === 'clerk' ||
        role === UserRole.Owner || role === 'owner') {
      return true;
    }

    // Redirect to appropriate dashboard for other roles
    switch (userData.role) {
      case UserRole.Admin:
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserRole.Consignor:
      case 'consignor':
        this.router.navigate(['/consignor/dashboard']);
        break;
      case UserRole.Customer:
      case 'customer':
        this.router.navigate(['/customer/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }

    return false;
  }
}