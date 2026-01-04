import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsignorItemDetailDto } from '../services/mock-consignor-item.service';

@Component({
  selector: 'app-pricing-breakdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pricing-breakdown.component.html',
  styleUrls: ['./pricing-breakdown.component.scss']
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