import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MonthlyStatementsService, StatementMonth } from '../services/monthly-statements.service';
import { LoadingService } from '../../shared/services/loading.service';

@Component({
  selector: 'app-monthly-statements',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="statements-container">
      <!-- Header -->
      <div class="statements-header">
        <a routerLink="/consignor/dashboard" class="back-link">← Dashboard</a>
        <h1>Monthly Statements</h1>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading statements...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-state">
        <p>{{ error }}</p>
        <button class="btn-retry" (click)="loadStatements()">Retry</button>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && !error && (!statements || statements.length === 0)" class="empty-state">
        <div class="empty-icon">📄</div>
        <h2>No statements available yet</h2>
        <p>Statements are generated for months with sales or payout activity.</p>
      </div>

      <!-- Statements Table -->
      <div *ngIf="!loading && !error && statements && statements.length > 0" class="statements-content">
        <div class="statements-table">
          <div class="table-header">
            <div class="col-month">MONTH</div>
            <div class="col-sales">SALES</div>
            <div class="col-earnings">EARNINGS</div>
            <div class="col-payouts">PAYOUTS</div>
            <div class="col-actions"></div>
          </div>

          <div *ngFor="let statement of statements" class="table-row">
            <div class="col-month">{{ statement.monthName }}</div>
            <div class="col-sales">{{ statement.salesCount }}</div>
            <div class="col-earnings">\${{ statement.totalEarnings.toFixed(2) }}</div>
            <div class="col-payouts">{{ statement.payoutCount }}</div>
            <div class="col-actions">
              <button
                class="btn-download"
                (click)="downloadPdf(statement)"
                [disabled]="downloading">
                {{ downloading ? 'Loading...' : '[PDF]' }}
              </button>
            </div>
          </div>
        </div>

        <div class="footer-note">
          Showing months with activity
        </div>
      </div>
    </div>
  `,
  styles: [`
    .statements-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .statements-header {
      margin-bottom: 2rem;
    }

    .back-link {
      display: inline-block;
      color: #007bff;
      text-decoration: none;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 600;
      color: #1f2937;
    }

    .loading-state, .error-state, .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h2 {
      margin: 0 0 1rem;
      font-size: 1.5rem;
      color: #374151;
    }

    .empty-state p {
      color: #6b7280;
      line-height: 1.5;
    }

    .statements-table {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr;
      background: #f9fafb;
      padding: 1rem;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e5e7eb;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr;
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
      align-items: center;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .table-row:hover {
      background: #f9fafb;
    }

    .col-month {
      font-weight: 500;
      color: #1f2937;
    }

    .col-sales, .col-payouts {
      color: #6b7280;
    }

    .col-earnings {
      font-weight: 600;
      color: #059669;
    }

    .btn-download {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.375rem 0.75rem;
      border-radius: 4px;
      font-size: 0.875rem;
      cursor: pointer;
      min-width: 60px;
    }

    .btn-download:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-download:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-retry {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 1rem;
    }

    .footer-note {
      padding: 1rem;
      color: #6b7280;
      font-size: 0.875rem;
      text-align: center;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .statements-container {
        padding: 1rem;
      }

      .table-header, .table-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
        text-align: left;
      }

      .table-header {
        display: none;
      }

      .table-row {
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        margin-bottom: 1rem;
        background: white;
      }

      .col-month::before { content: "Month: "; font-weight: 600; }
      .col-sales::before { content: "Sales: "; font-weight: 600; }
      .col-earnings::before { content: "Earnings: "; font-weight: 600; }
      .col-payouts::before { content: "Payouts: "; font-weight: 600; }
    }
  `]
})
export class MonthlyStatementsComponent implements OnInit {
  statements: StatementMonth[] = [];
  loading = true;
  error: string | null = null;
  downloading = false;

  constructor(
    private monthlyStatementsService: MonthlyStatementsService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadStatements();
  }

  loadStatements() {
    this.loading = true;
    this.error = null;

    this.monthlyStatementsService.getAvailableMonths().subscribe({
      next: (response) => {
        this.statements = response.statements;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load statements. Please try again.';
        this.loading = false;
        console.error('Error loading statements:', error);
      }
    });
  }

  downloadPdf(statement: StatementMonth) {
    if (this.downloading) return;

    this.downloading = true;

    this.monthlyStatementsService.downloadMonthlyPdf(statement.year, statement.month).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `statement-${statement.year}-${statement.month.toString().padStart(2, '0')}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.downloading = false;
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF. Please try again.');
        this.downloading = false;
      }
    });
  }
}