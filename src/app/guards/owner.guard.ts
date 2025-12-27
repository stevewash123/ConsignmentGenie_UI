import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserRole } from './auth.guard';

@Injectable({
  providedIn: 'root'
})
export class OwnerGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('auth_token');
    const userDataStr = localStorage.getItem('user_data');

    if (!token || !userDataStr) {
      console.log('OwnerGuard: No token or user data, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const userData = JSON.parse(userDataStr);
      console.log('OwnerGuard: Checking user data:', userData);

      // Handle both string and numeric role formats
      const userRole = userData.role;
      let isAllowed = false;

      // Check for string roles (new format)
      if (typeof userRole === 'string') {
        isAllowed = userRole === 'Owner' || userRole === 'Admin';
        console.log('OwnerGuard: String role check - role:', userRole, 'allowed:', isAllowed);
      } else {
        // Check for numeric roles (legacy format)
        const allowedRoles = [UserRole.Owner, UserRole.Admin];
        const userRoleNum = Number(userRole);
        isAllowed = allowedRoles.includes(userRoleNum);
        console.log('OwnerGuard: Numeric role check - role:', userRoleNum, 'allowed:', isAllowed);
      }

      if (isAllowed) {
        console.log('OwnerGuard: Access granted');
        return true;
      }

      // Redirect non-owner users to their appropriate dashboard
      console.log('OwnerGuard: Access denied, redirecting based on role:', userRole);
      this.redirectToUserDashboard(userRole);
      return false;
    } catch (error) {
      console.error('OwnerGuard: Invalid user data in localStorage', error);
      this.router.navigate(['/login']);
      return false;
    }
  }

  private redirectToUserDashboard(userRole: string | number) {
    console.log('OwnerGuard: Redirecting user with role:', userRole, 'type:', typeof userRole);

    // Handle string roles (new format)
    if (typeof userRole === 'string') {
      switch (userRole) {
        case 'consignor':
          console.log('OwnerGuard: Redirecting to /consignor/dashboard');
          this.router.navigate(['/consignor/dashboard']);
          break;
        case 'Customer':
          console.log('OwnerGuard: Redirecting to /customer/dashboard');
          this.router.navigate(['/customer/dashboard']);
          break;
        default:
          console.log('OwnerGuard: Unknown string role, redirecting to /login');
          this.router.navigate(['/login']);
      }
    } else {
      // Handle numeric roles (legacy format)
      switch (userRole) {
        case UserRole.consignor:
          console.log('OwnerGuard: Redirecting to /consignor/dashboard');
          this.router.navigate(['/consignor/dashboard']);
          break;
        case UserRole.Customer:
          console.log('OwnerGuard: Redirecting to /customer/dashboard');
          this.router.navigate(['/customer/dashboard']);
          break;
        default:
          console.log('OwnerGuard: Unknown numeric role, redirecting to /login');
          this.router.navigate(['/login']);
      }
    }
  }
}