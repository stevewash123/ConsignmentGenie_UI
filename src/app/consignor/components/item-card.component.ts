import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent } from './status-badge.component';
import { ConsignorItemDto } from '../services/mock-consignor-item.service';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  template: `
    <div class="item-card" [class.requires-action]="item.requiresResponse">
      <div class="item-image">
        <img
          *ngIf="item.primaryImageUrl"
          [src]="item.primaryImageUrl"
          [alt]="item.name"
          loading="lazy"
        >
        <div *ngIf="!item.primaryImageUrl" class="image-placeholder">📷</div>
      </div>

      <div class="item-details">
        <div class="item-header">
          <h3 class="item-name">{{ item.name }}</h3>
          <div *ngIf="item.requiresResponse" class="action-banner">
            ⚡ ACTION REQUIRED
          </div>
        </div>

        <div class="pricing-info" *ngIf="item.status !== 'sold'; else soldInfo">
          <span class="price-label">Listed:</span>
          <span class="price">\${{ item.listedPrice.toFixed(2) }}</span>
          <span class="separator">•</span>
          <span class="earnings-label">Your Earnings:</span>
          <span class="earnings">\${{ item.consignorEarnings.toFixed(2) }}</span>
          <span class="percentage">({{ item.splitPercentage }}%)</span>
        </div>

        <ng-template #soldInfo>
          <div class="pricing-info">
            <span class="price-label">Sold:</span>
            <span class="price">\${{ item.listedPrice.toFixed(2) }}</span>
            <span class="separator">•</span>
            <span class="earnings-label">You Earned:</span>
            <span class="earnings">\${{ item.consignorEarnings.toFixed(2) }}</span>
            <span class="percentage">({{ item.splitPercentage }}%)</span>
          </div>
        </ng-template>

        <div class="status-line">
          <span class="status-info">
            <span class="status-label">Status:</span>
            <app-status-badge
              [status]="item.status"
              [requiresResponse]="item.requiresResponse">
            </app-status-badge>
          </span>

          <span *ngIf="item.status === 'sold' && item.soldDate" class="sold-date">
            on {{ item.soldDate | date:'MMM d, y' }}
          </span>

          <span *ngIf="item.status === 'available'" class="days-listed">
            • {{ item.daysListed }} days listed
          </span>

          <span *ngIf="item.hasPendingPriceRequest && item.status === 'pending_consignor_approval'" class="price-change-info">
            Owner proposes: \${{ item.listedPrice }} → \${{ (item.consignorEarnings / (item.splitPercentage / 100)).toFixed(2) }}
          </span>
        </div>
      </div>

      <div class="item-actions">
        <a
          [routerLink]="['/consignor/items', item.id]"
          class="view-details-btn"
          [class.respond-btn]="item.requiresResponse">
          {{ item.requiresResponse ? 'Respond Now →' : 'View Details →' }}
        </a>
      </div>
    </div>
  `,
  styles: [`
    .item-card {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      transition: all 0.15s ease;
      margin-bottom: 1rem;
    }

    .item-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .requires-action {
      border-left: 4px solid #f59e0b;
      background: #fffbeb;
    }

    .item-image {
      flex-shrink: 0;
      width: 80px;
      height: 80px;
      border-radius: 0.5rem;
      overflow: hidden;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-placeholder {
      font-size: 2rem;
      color: #9ca3af;
    }

    .item-details {
      flex: 1;
      min-width: 0;
    }

    .item-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .item-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
      margin-right: 1rem;
    }

    .action-banner {
      background: #f59e0b;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .pricing-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .price-label, .earnings-label {
      color: #6b7280;
    }

    .price {
      font-weight: 600;
      color: #111827;
    }

    .earnings {
      font-weight: 600;
      color: #059669;
    }

    .percentage {
      color: #6b7280;
    }

    .separator {
      color: #d1d5db;
    }

    .status-line {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-size: 0.875rem;
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-label {
      color: #6b7280;
    }

    .sold-date, .days-listed {
      color: #6b7280;
    }

    .price-change-info {
      color: #f59e0b;
      font-weight: 500;
    }

    .item-actions {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .view-details-btn {
      padding: 0.5rem 1rem;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 0.375rem;
      font-weight: 500;
      transition: background-color 0.15s ease;
    }

    .view-details-btn:hover {
      background: #2563eb;
    }

    .respond-btn {
      background: #f59e0b;
    }

    .respond-btn:hover {
      background: #d97706;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .item-card {
        flex-direction: column;
        padding: 1rem;
      }

      .item-header {
        flex-direction: column;
        gap: 0.5rem;
      }

      .item-name {
        margin-right: 0;
      }

      .pricing-info {
        flex-wrap: wrap;
      }

      .item-actions {
        justify-content: stretch;
      }

      .view-details-btn {
        flex: 1;
        text-align: center;
      }
    }
  `]
})
export class ItemCardComponent {
  @Input() item!: ConsignorItemDto;
}