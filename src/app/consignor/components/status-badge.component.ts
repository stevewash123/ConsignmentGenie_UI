import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
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