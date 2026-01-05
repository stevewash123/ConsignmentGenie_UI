import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface UserData {
  userId: string;
  email: string;
  role: number;
  organizationId: string;
  organizationName: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss']
})
export class AppHeaderComponent implements OnInit {
  currentUser = signal<UserData | null>(null);
  showUserMenu = signal(false);

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadUserData();
  }

  private loadUserData() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      this.currentUser.set(JSON.parse(userData));
    }
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 1; // Owner role can act as admin
  }

  isOwner(): boolean {
    return [1, 2, 3, 4, 5].includes(this.currentUser()?.role || 0); // Owner, Manager, Staff, Cashier, Accountant
  }

  isCustomerOrProvider(): boolean {
    return [6, 7].includes(this.currentUser()?.role || 0); // consignor, Customer
  }

  getRoleName(role?: number): string {
    const roleMap: { [key: number]: string } = {
      1: 'Owner',
      2: 'Manager',
      3: 'Staff',
      4: 'Cashier',
      5: 'Accountant',
      6: 'consignor',
      7: 'Customer'
    };
    return roleMap[role || 0] || 'Unknown';
  }

  getInitials(email?: string): string {
    if (!email) return '?';
    return email.substring(0, 2).toUpperCase();
  }

  toggleUserMenu() {
    this.showUserMenu.update(show => !show);
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    this.router.navigate(['/login']);
  }
}