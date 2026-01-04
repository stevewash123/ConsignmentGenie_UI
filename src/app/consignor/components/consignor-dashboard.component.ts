import { Component, OnInit } from '@angular/core';
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

  constructor(private ConsignorService: ConsignorPortalService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.error = null;
    this.ConsignorService.getDashboard().subscribe({
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