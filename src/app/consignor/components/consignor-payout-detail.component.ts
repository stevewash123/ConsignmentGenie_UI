import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ProviderPortalService } from '../services/consignor-portal.service';
import { ProviderPayoutDetail } from '../models/consignor.models';
import { LoadingService } from '../../shared/services/loading.service';
import { LOADING_KEYS } from '../constants/loading-keys';

@Component({
  selector: 'app-consignor-payout-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './consignor-payout-detail.component.html',
  styles: [`
    .payout-detail {
      min-height: 100vh;
      background: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .nav-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 1rem 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;
    }

    .nav-links a {
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
    }

    .nav-links a:hover,
    .nav-links a.active {
      color: #3b82f6;
      background: #f3f4f6;
    }

    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .back-section {
      margin-bottom: 1rem;
    }

    .back-btn {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .back-btn:hover {
      color: #2563eb;
    }

    .payout-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .payout-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .payout-number {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
      font-size: 1rem;
      color: #3b82f6;
      font-weight: 600;
    }

    .summary-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .value {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
    }

    .value.amount {
      font-size: 1.25rem;
      color: #059669;
    }

    .value.reference {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
      font-size: 0.875rem;
      color: #3b82f6;
    }

    .items-section {
      margin-bottom: 2rem;
    }

    .items-section h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
    }

    .items-table {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .table-header {
      display: grid;
      grid-template-columns: 120px 2fr 120px 120px;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .table-row {
      display: grid;
      grid-template-columns: 120px 2fr 120px 120px;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .table-row:last-of-type {
      border-bottom: 1px solid #e5e7eb;
    }

    .total-row {
      display: grid;
      grid-template-columns: 120px 2fr 120px 120px;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #f9fafb;
      font-weight: 600;
    }

    .col {
      display: flex;
      align-items: center;
    }

    .item-info {
      min-width: 0;
    }

    .item-title {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-sku {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .total-label {
      font-weight: 600;
      color: #111827;
    }

    .total-amount {
      font-weight: 700;
      color: #059669;
    }

    .footer-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      text-decoration: none;
      font-weight: 500;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .loading, .error {
      text-align: center;
      padding: 2rem;
    }

    .error button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      .nav-header {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .nav-links {
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .content {
        padding: 1rem;
      }

      .payout-header {
        flex-direction: column;
        gap: 0.5rem;
        align-items: flex-start;
      }

      .summary-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .table-header {
        display: none;
      }

      .table-row, .total-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
        padding: 1rem;
      }

      .col {
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f3f4f6;
      }

      .col:last-child {
        border-bottom: none;
      }

      .footer-actions {
        flex-direction: column;
        gap: 1rem;
      }

      .footer-actions > * {
        width: 100%;
        text-align: center;
      }
    }
  `]
})
export class ConsignorPayoutDetailComponent implements OnInit {
  payoutDetail: ProviderPayoutDetail | null = null;
  error: string | null = null;
  payoutId: string;

  // Expose for template
  readonly KEYS = LOADING_KEYS;

  constructor(
    private ConsignorService: ProviderPortalService,
    private route: ActivatedRoute,
    public loadingService: LoadingService
  ) {
    this.payoutId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit() {
    if (this.payoutId) {
      this.loadPayoutDetail();
    }
  }

  loadPayoutDetail() {
    this.loadingService.start(LOADING_KEYS.PAYOUT_DETAIL);
    this.error = null;

    this.ConsignorService.getMyPayout(this.payoutId).subscribe({
      next: (detail) => {
        this.payoutDetail = detail;
      },
      error: (err) => {
        this.error = 'Failed to load payout details. Please try again.';
        console.error('Payout detail error:', err);
      },
      complete: () => {
        this.loadingService.stop(LOADING_KEYS.PAYOUT_DETAIL);
      }
    });
  }

  getTotalSalePrice(): number {
    if (!this.payoutDetail) return 0;
    return this.payoutDetail.items.reduce((sum, item) => sum + item.salePrice, 0);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  formatFullDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  printPayout() {
    window.print();
  }
}