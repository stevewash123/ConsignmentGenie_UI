import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  agreementStatus = signal<any>(null);
  showAgreementBanner = signal(false);

  constructor(private consignorService: ConsignorPortalService) {}

  ngOnInit() {
    this.loadDashboard();
    this.checkAgreementStatus();
  }

  checkAgreementStatus() {
    this.consignorService.getAgreementStatus().subscribe({
      next: (status) => {
        this.agreementStatus.set(status);
        // Show banner if agreement is required but not completed
        if (status?.required && status?.status !== 'completed') {
          this.showAgreementBanner.set(true);
        }
      },
      error: (err) => {
        console.error('Agreement status error:', err);
        // Don't show error to user for agreement status check
      }
    });
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
}