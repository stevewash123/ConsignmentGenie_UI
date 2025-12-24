import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MockEarningsService } from '../services/mock-earnings.service';
import { EarningsSummary } from '../models/consignor.models';

@Component({
  selector: 'app-earnings-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="earnings-widget">
      <div class="widget-header">
        <h3 class="widget-title">My Earnings</h3>
      </div>

      <div class="widget-content" *ngIf="earningsSummary && !loading">
        <!-- Earnings Amounts Row -->
        <div class="earnings-row">
          <!-- Pending Column -->
          <div class="earning-column">
            <div class="earning-label">
              Pending
              <span class="info-icon"
                    [title]="earningsSummary.pendingTooltip"
                    tabindex="0">ⓘ</span>
            </div>
            <div class="earning-amount">\${{earningsSummary.pending.toFixed(2)}}</div>
          </div>

          <!-- Paid This Month Column -->
          <div class="earning-column">
            <div class="earning-label">Paid ({{getCurrentMonthName()}})</div>
            <div class="earning-amount">\${{earningsSummary.paidThisMonth.toFixed(2)}}</div>
            <div class="earning-detail" *ngIf="earningsSummary.payoutCountThisMonth > 0">
              ({{earningsSummary.payoutCountThisMonth}} payout{{earningsSummary.payoutCountThisMonth === 1 ? '' : 's'}})
            </div>
          </div>
        </div>

        <!-- Next Payout and Link Row -->
        <div class="footer-row">
          <div class="next-payout" *ngIf="earningsSummary.nextPayoutDate">
            Next payout: {{formatPayoutDate(earningsSummary.nextPayoutDate)}}
          </div>
          <div class="next-payout" *ngIf="!earningsSummary.nextPayoutDate && earningsSummary.pending === 0 && earningsSummary.paidThisMonth === 0">
            No earnings yet
          </div>
          <a routerLink="/consignor/payouts" class="view-history-link">View History →</a>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <p>Loading earnings...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="error">
        <p>{{error}}</p>
        <button (click)="loadEarnings()" class="retry-button">Retry</button>
      </div>
    </div>
  `,
  styles: [`
    .earnings-widget {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .widget-header {
      padding: 1.5rem 1.5rem 0;
      border-bottom: none;
    }

    .widget-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem;
    }

    .widget-content {
      padding: 0 1.5rem 1.5rem;
    }

    .earnings-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }

    .earning-column {
      text-align: left;
    }

    .earning-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .info-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      background: #e5e7eb;
      border-radius: 50%;
      font-size: 0.75rem;
      color: #6b7280;
      cursor: help;
      transition: all 0.2s ease;
    }

    .info-icon:hover,
    .info-icon:focus {
      background: #d1d5db;
      color: #374151;
      outline: none;
    }

    .earning-amount {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      line-height: 1.2;
    }

    .earning-detail {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #f3f4f6;
      padding-top: 1rem;
    }

    .next-payout {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .view-history-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.875rem;
      transition: color 0.2s ease;
    }

    .view-history-link:hover {
      color: #2563eb;
    }

    .loading-state,
    .error-state {
      padding: 2rem 1.5rem;
      text-align: center;
    }

    .loading-state p {
      color: #6b7280;
      margin: 0;
    }

    .error-state p {
      color: #dc2626;
      margin: 0 0 1rem;
    }

    .retry-button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
      transition: background-color 0.2s ease;
    }

    .retry-button:hover {
      background: #2563eb;
    }

    .retry-button:focus {
      outline: 2px solid #93c5fd;
      outline-offset: 2px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .widget-content {
        padding: 0 1rem 1rem;
      }

      .widget-header {
        padding: 1rem 1rem 0;
      }

      .earnings-row {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        margin-bottom: 1rem;
      }

      .earning-amount {
        font-size: 1.5rem;
      }

      .footer-row {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
      }
    }

    /* Empty state styling */
    .earnings-row:has(.earning-amount:contains("$0.00")) {
      opacity: 0.7;
    }
  `]
})
export class EarningsWidgetComponent implements OnInit {
  earningsSummary: EarningsSummary | null = null;
  loading = false;
  error: string | null = null;

  constructor(private earningsService: MockEarningsService) {}

  ngOnInit() {
    this.loadEarnings();
  }

  loadEarnings() {
    this.loading = true;
    this.error = null;

    this.earningsService.getEarningsSummary().subscribe({
      next: (data) => {
        this.earningsSummary = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load earnings data. Please try again.';
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