import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { ProviderDashboard } from '../models/consignor.models';
import { EarningsWidgetComponent } from './earnings-widget.component';

@Component({
  selector: 'app-consignor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, EarningsWidgetComponent],
  templateUrl: './consignor-dashboard.component.html',
  styleUrls: ['./consignor-dashboard.component.scss']
})
export class ConsignorDashboardComponent implements OnInit {
  dashboard: ProviderDashboard | null = null;
  error: string | null = null;

  constructor(
    private consignorService: ConsignorPortalService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAgreementRequirement();
    this.loadDashboard();
  }

  loadDashboard() {
    this.error = null;
    this.consignorService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
      },
      error: (err) => {
        this.error = 'Upload Inventory';
        console.error('Dashboard error:', err);
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  private checkAgreementRequirement() {
    // Check if consignor needs to complete agreement upload
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      // Decode JWT token to check claims
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Consignor dashboard: JWT payload:', payload);

      // Check if user is approved - if not approved, they may need agreement
      const isApproved = payload.isApproved === 'true';

      if (!isApproved) {
        console.log('Consignor not approved - redirecting to agreement onboarding');
        this.router.navigate(['/consignor/agreement']);
        return;
      }
    } catch (error) {
      console.error('Error decoding JWT token:', error);
    }
  }
}