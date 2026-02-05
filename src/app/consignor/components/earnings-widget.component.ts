import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { EarningsSummary } from '../models/consignor.models';

@Component({
  selector: 'app-earnings-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './earnings-widget.component.html',
  styleUrls: ['./earnings-widget.component.scss']
})
export class EarningsWidgetComponent implements OnInit {
  earningsSummary: EarningsSummary | null = null;
  loading = false;
  error: string | null = null;

  constructor(private consignorService: ConsignorPortalService) {}

  ngOnInit() {
    this.loadEarnings();
  }

  loadEarnings() {
    this.loading = true;
    this.error = null;

    this.consignorService.getEarningsSummary().subscribe({
      next: (response: any) => {
        this.earningsSummary = response.success ? response.data : response;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Earnings error:', err);

        // For new consignors or if the endpoint doesn't exist, show a default state instead of error
        if (err.status === 500 || err.status === 404) {
          // Show a default empty earnings summary for new consignors
          this.earningsSummary = {
            pending: 0,
            pendingTooltip: 'No earnings yet',
            paidThisMonth: 0,
            payoutCountThisMonth: 0,
            nextPayoutDate: null
          };
        } else {
          this.error = 'Unable to load earnings. Please try again.';
        }
      }
    });
  }

  getCurrentMonthName(): string {
    const currentDate = new Date();
    return currentDate.toLocaleDateString('en-US', { month: 'short' });
  }

  formatPayoutDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}