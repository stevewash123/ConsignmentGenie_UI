import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { UserData } from '../guards/auth.guard';

@Component({
  selector: 'app-clerk-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './clerk-layout.component.html',
  styleUrls: ['./clerk-layout.component.scss']
})
export class ClerkLayoutComponent {
  private authService = inject(AuthService);
  private permissionService = inject(PermissionService);
  private router = inject(Router);

  showUserMenu = signal<boolean>(false);

  // Get current user from auth service
  currentUser = computed(() => this.authService.getCurrentUser());

  // Permission-based navigation items
  canAccessInventory = computed(() => this.permissionService.canAccessInventory());

  toggleUserMenu() {
    this.showUserMenu.update(value => !value);
  }

  closeUserMenu() {
    this.showUserMenu.set(false);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeUserMenu();
  }

  getInitials(email?: string): string {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }

  getCurrentUser(): UserData | null {
    return this.currentUser();
  }

  getShopName(): string {
    return this.currentUser()?.organizationName || 'ConsignmentGenie';
  }
}