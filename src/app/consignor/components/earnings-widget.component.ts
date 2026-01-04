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
        this.error = 'Unable to load earnings. Please try again.';
        this.loading = false;
        console.error('Earnings error:', err);
      }
    });
  }

  getCurrentMonthName(): string {
    const currentDate = new Date();
    return currentDate.toLocaleDateString('en-US', { month: 'short' });
  }

  formatPayoutDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}