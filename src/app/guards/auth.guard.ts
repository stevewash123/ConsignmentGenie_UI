import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';

export enum UserRole {
  Admin = 0,
  Owner = 1,
  Consignor = 2,
  Customer = 3,
  Clerk = 4
}

export interface UserData {
  userId: string;
  email: string;
  role: number | string; // Support both number (legacy/mock) and string (API standard) - TODO: drop legacy support
  organizationId: string;
  organizationName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = localStorage.getItem('auth_token');
    const userDataStr = localStorage.getItem('user_data');

    // Check if user is authenticated
    if (!token || !userDataStr) {
      this.router.navigate(['/login']);
      return false;
    }

    let userData: UserData;
    try {
      userData = JSON.parse(userDataStr);

      // Validate that userData has required properties
      if (!userData.userId || !userData.email || userData.role === undefined || !userData.organizationId) {
        console.error('User data missing required properties:', userData);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('tokenExpiry');
        this.router.navigate(['/login']);
        return false;
      }
    } catch (error) {
      console.error('Invalid user data in localStorage:', error, 'Raw data:', userDataStr);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('tokenExpiry');
      this.router.navigate(['/login']);
      return false;
    }

    // Get required roles from route data
    const allowedRoles = route.data?.['roles'] as number[] | undefined;

    if (!allowedRoles || allowedRoles.length === 0) {
      // No role restriction, just need to be authenticated
      return true;
    }

    // Check if user has required role
    // Handle both string and number role values - TODO: drop legacy support
    const hasPermission = typeof userData.role === 'number'
      ? allowedRoles.includes(userData.role)
      : this.checkStringRolePermission(userData.role, allowedRoles);

    if (hasPermission) {
      return true;
    }

    // User doesn't have required role, redirect to unauthorized
    this.redirectToUnauthorized(userData.role);
    return false;
  }

  private redirectToUnauthorized(userRole: number | string) {
    // Redirect to appropriate dashboard based on user's actual role
    // Handle both string and number role values - TODO: drop legacy support
    if (typeof userRole === 'string') {
      switch (userRole) {
        case 'admin':
          this.router.navigate(['/admin/dashboard']);
          break;
        case 'owner':
          this.router.navigate(['/owner/dashboard']);
          break;
        case 'consignor':
          this.router.navigate(['/consignor/dashboard']);
          break;
        case 'customer':
          this.router.navigate(['/customer/dashboard']);
          break;
        case 'clerk':
          this.router.navigate(['/pos']);
          break;
        default:
          this.router.navigate(['/login']);
      }
    } else {
      switch (userRole) {
        case UserRole.Admin:
          this.router.navigate(['/admin/dashboard']);
          break;
        case UserRole.Owner:
          this.router.navigate(['/owner/dashboard']);
          break;
        case UserRole.Consignor:
          this.router.navigate(['/consignor/dashboard']);
          break;
        case UserRole.Customer:
          this.router.navigate(['/customer/dashboard']);
          break;
        case UserRole.Clerk:
          this.router.navigate(['/pos']);
          break;
        default:
          this.router.navigate(['/login']);
      }
    }
  }

  private checkStringRolePermission(stringRole: string, allowedRoles: number[]): boolean {
    // Map string roles to corresponding enum numbers for permission checking - TODO: drop legacy support
    const roleMapping: { [key: string]: number } = {
      'admin': UserRole.Admin,
      'owner': UserRole.Owner,
      'consignor': UserRole.Consignor,
      'customer': UserRole.Customer,
      'clerk': UserRole.Clerk
    };

    const numericRole = roleMapping[stringRole.toLowerCase()];
    return numericRole !== undefined && allowedRoles.includes(numericRole);
  }
}