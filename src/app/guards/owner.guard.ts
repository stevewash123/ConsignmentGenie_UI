import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

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

      const userRole = userData.role;
      console.log('OwnerGuard: User role:', userRole);

      // Check if user has owner, admin, or clerk role (clerks can access POS/sales)
      const isAllowed = userRole === 'owner' || userRole === 'admin' || userRole === 'clerk';
      console.log('OwnerGuard: Access check - role:', userRole, 'allowed:', isAllowed);

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

  private redirectToUserDashboard(userRole: string) {
    console.log('OwnerGuard: Redirecting user with role:', userRole);

    switch (userRole) {
      case 'consignor':
        console.log('OwnerGuard: Redirecting to /consignor/dashboard');
        this.router.navigate(['/consignor/dashboard']);
        break;
      case 'customer':
        console.log('OwnerGuard: Redirecting to /customer/dashboard');
        this.router.navigate(['/customer/dashboard']);
        break;
      case 'clerk':
        console.log('OwnerGuard: Redirecting clerk to clerk area');
        this.router.navigate(['/clerk/sales']);
        break;
      default:
        console.log('OwnerGuard: Unknown role, redirecting to /login');
        this.router.navigate(['/login']);
    }
  }
}