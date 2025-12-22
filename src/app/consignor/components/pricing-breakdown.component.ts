import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsignorItemDetailDto } from '../services/mock-consignor-item.service';

@Component({
  selector: 'app-pricing-breakdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pricing-breakdown">
      <h3>Pricing</h3>

      <div class="pricing-grid">
        <div class="pricing-row">
          <span class="label">Your Suggested Price:</span>
          <span class="value suggested">\${{ item.suggestedPrice.toFixed(2) }}</span>
        </div>

        <div class="pricing-row">
          <span class="label">Market Price:</span>
          <span class="value market">\${{ item.marketPrice.toFixed(2) }}</span>
        </div>

        <div class="pricing-row">
          <span class="label">Listed Price:</span>
          <span class="value listed">\${{ item.listedPrice.toFixed(2) }}</span>
        </div>

        <div class="divider"></div>

        <div class="pricing-row split-row">
          <span class="label">Your Split:</span>
          <span class="value split">{{ item.splitPercentage }}%</span>
        </div>

        <div class="pricing-row earnings-row" *ngIf="item.status !== 'sold'">
          <span class="label">If Sold, You Earn:</span>
          <span class="value earnings">\${{ item.consignorEarnings.toFixed(2) }}</span>
        </div>

        <div class="pricing-row earnings-row" *ngIf="item.status === 'sold'">
          <span class="label">You Earned:</span>
          <span class="value earnings">\${{ (item.earnedAmount || item.consignorEarnings).toFixed(2) }}</span>
        </div>
      </div>

      <!-- Owner Note -->
      <div class="owner-note" *ngIf="item.ownerNote">
        <h4>Owner's Note:</h4>
        <blockquote>
          {{ item.ownerNote }}
        </blockquote>
      </div>

      <!-- Pending Price Request Callout -->
      <div class="price-request-callout" *ngIf="item.pendingPriceRequest">
        <div class="callout-header">
          <span class="callout-icon">⏳</span>
          <h4>Pending Price Change Request</h4>
        </div>
        <div class="callout-content">
          <p>
            <strong>{{ item.pendingPriceRequest.requestedBy }}</strong> requested a price change
            <strong>{{ formatDateAgo(item.pendingPriceRequest.requestDate) }}</strong>
          </p>
          <div class="price-change-details">
            <span class="current-price">\${{ item.pendingPriceRequest.currentPrice.toFixed(2) }}</span>
            <span class="arrow">→</span>
            <span class="requested-price">\${{ item.pendingPriceRequest.requestedPrice.toFixed(2) }}</span>
          </div>
          <p class="reason" *ngIf="item.pendingPriceRequest.reason">
            <em>Reason: {{ item.pendingPriceRequest.reason }}</em>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pricing-breakdown {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1.5rem;
    }

    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 1rem 0;
    }

    .pricing-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .pricing-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }

    .label {
      color: #6b7280;
      font-weight: 500;
    }

    .value {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .suggested {
      color: #6b7280;
    }

    .market {
      color: #059669;
    }

    .listed {
      color: #111827;
    }

    .split {
      color: #3b82f6;
    }

    .earnings {
      color: #059669;
      font-size: 1.25rem;
    }

    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 0.5rem 0;
    }

    .split-row {
      border-top: 1px solid #f3f4f6;
      padding-top: 1rem;
    }

    .earnings-row {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 0.375rem;
      padding: 0.75rem;
      margin-top: 0.5rem;
    }

    /* Owner Note */
    .owner-note {
      margin-top: 1.5rem;
    }

    .owner-note h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 0.5rem 0;
    }

    blockquote {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 1rem;
      margin: 0;
      border-radius: 0 0.375rem 0.375rem 0;
      font-style: italic;
      color: #374151;
      line-height: 1.6;
    }

    /* Price Request Callout */
    .price-request-callout {
      margin-top: 1.5rem;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .callout-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .callout-icon {
      font-size: 1.25rem;
    }

    .callout-header h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #92400e;
      margin: 0;
    }

    .callout-content p {
      margin: 0 0 0.5rem 0;
      color: #92400e;
    }

    .price-change-details {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0.75rem 0;
      font-weight: 600;
    }

    .current-price {
      color: #6b7280;
      text-decoration: line-through;
    }

    .arrow {
      color: #f59e0b;
      font-weight: bold;
    }

    .requested-price {
      color: #059669;
    }

    .reason {
      font-style: italic;
      color: #78716c;
      margin: 0.5rem 0 0 0;
    }

    @media (max-width: 768px) {
      .pricing-breakdown {
        padding: 1rem;
      }

      .pricing-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .value {
        font-size: 1rem;
      }

      .earnings {
        font-size: 1.125rem;
      }
    }
  `]
})
export class PricingBreakdownComponent {
  @Input() item!: ConsignorItemDetailDto;

  formatDateAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return '1 day ago';
    } else {
      return `${diffInDays} days ago`;
    }
  }
}