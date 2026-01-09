import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserRole } from './auth.guard';

@Injectable({
  providedIn: 'root'
})
export class ConsignorGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('auth_token');
    const userDataStr = localStorage.getItem('user_data');

    if (!token || !userDataStr) {
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const userData = JSON.parse(userDataStr);

      // Normalize role to handle both string and numeric values
      const normalizedRole = this.normalizeRole(userData.role);

      // Allow consignor role access to consignor area
      // Note: Owners can also access consignor areas for their shop's consignors
      const allowedRoles = [
        UserRole.consignor,
        UserRole.Owner  // Owners can see consignor pages for their shop
      ];

      if (allowedRoles.includes(normalizedRole)) {
        return true;
      }

      // Redirect non-consignor users to their appropriate dashboard
      this.redirectToUserDashboard(normalizedRole);
      return false;
    } catch (error) {
      console.error('Invalid user data in localStorage');
      this.router.navigate(['/login']);
      return false;
    }
  }

  private redirectToUserDashboard(userRole: number) {
    switch (userRole) {
      case UserRole.Admin:
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserRole.Customer:
        this.router.navigate(['/customer/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  private normalizeRole(role: string | number): number {
    // Handle string role values from API
    if (typeof role === 'string') {
      switch (role.toLowerCase()) {
        case 'admin': return UserRole.Admin;
        case 'owner': return UserRole.Owner;
        case 'consignor': return UserRole.consignor;
        case 'customer': return UserRole.Customer;
        default: return UserRole.Customer; // Default fallback
      }
    }

    // Handle numeric role values
    if (typeof role === 'number') {
      return role;
    }

    // Fallback for unexpected types
    return UserRole.Customer;
  }
}