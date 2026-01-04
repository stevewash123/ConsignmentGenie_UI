import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss']
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goToDashboard() {
    // Get user role and redirect to appropriate dashboard
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        switch (userData.role) {
          case 1: // Owner
          case 2: // Manager
          case 3: // Staff
          case 4: // Cashier
          case 5: // Accountant
            this.router.navigate(['/owner/dashboard']);
            break;
          case 6: // consignor
            this.router.navigate(['/consignor/dashboard']);
            break;
          case 7: // Customer
            this.router.navigate(['/customer/dashboard']);
            break;
          default:
            this.router.navigate(['/login']);
        }
      } catch (error) {
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    this.router.navigate(['/login']);
  }
}