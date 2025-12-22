import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClass" [class.requires-response]="requiresResponse">
      <span class="status-icon">{{ statusIcon }}</span>
      {{ displayText }}
      <span *ngIf="requiresResponse" class="action-indicator">⚡</span>
    </span>
  `,
  styles: [`
    span {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .status-icon {
      font-size: 0.8em;
    }

    .action-indicator {
      color: #f59e0b;
      font-weight: 600;
    }

    /* Status Colors */
    .status-available {
      background: #dcfce7;
      color: #166534;
    }

    .status-sold {
      background: #dcfce7;
      color: #166534;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-expired {
      background: #fed7aa;
      color: #c2410c;
    }

    .status-pickup {
      background: #dbeafe;
      color: #1e40af;
    }

    /* Requires Response highlighting */
    .requires-response {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
      box-shadow: 0 0 0 1px #fca5a5;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status!: string;
  @Input() requiresResponse: boolean = false;

  get badgeClass(): string {
    switch (this.status) {
      case 'available':
        return 'status-available';
      case 'sold':
        return 'status-sold';
      case 'pending_review':
      case 'pending_consignor_approval':
        return 'status-pending';
      case 'expired':
        return 'status-expired';
      case 'ready_for_pickup':
        return 'status-pickup';
      default:
        return 'status-available';
    }
  }

  get statusIcon(): string {
    switch (this.status) {
      case 'available':
        return '🟢';
      case 'sold':
        return '✅';
      case 'pending_review':
        return '🟡';
      case 'pending_consignor_approval':
        return '🟡';
      case 'expired':
        return '🟠';
      case 'ready_for_pickup':
        return '🔵';
      default:
        return '🟢';
    }
  }

  get displayText(): string {
    switch (this.status) {
      case 'available':
        return 'Available';
      case 'sold':
        return 'Sold';
      case 'pending_review':
        return 'Pending Review';
      case 'pending_consignor_approval':
        return 'Price Change - Your Response Needed';
      case 'expired':
        return 'Expired';
      case 'ready_for_pickup':
        return 'Ready for Pickup';
      default:
        return 'Unknown';
    }
  }
}