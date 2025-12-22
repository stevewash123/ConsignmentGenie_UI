import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsignorItemSummary } from '../models/consignor-item.model';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-card.component.html',
  styleUrls: ['./item-card.component.scss']
})
export class ItemCardComponent {
  @Input() item!: ConsignorItemSummary;
  @Output() itemClick = new EventEmitter<ConsignorItemSummary>();
  @Output() respondToPriceChange = new EventEmitter<ConsignorItemSummary>();

  onCardClick(): void {
    this.itemClick.emit(this.item);
  }

  onRespondClick(event: Event): void {
    event.stopPropagation(); // Prevent card click
    this.respondToPriceChange.emit(this.item);
  }

  getStatusClass(): string {
    switch (this.item.status) {
      case 'available':
        return 'status-available';
      case 'sold':
        return 'status-sold';
      case 'returned':
        return 'status-returned';
      case 'expired':
        return 'status-expired';
      default:
        return 'status-available';
    }
  }

  getStatusIcon(): string {
    switch (this.item.status) {
      case 'available':
        return '🟢';
      case 'sold':
        return '✓';
      case 'returned':
        return '↩️';
      case 'expired':
        return '⚠️';
      default:
        return '';
    }
  }

  getStatusText(): string {
    switch (this.item.status) {
      case 'available':
        return 'Available';
      case 'sold':
        return 'Sold';
      case 'returned':
        return 'Returned';
      case 'expired':
        return 'Expired';
      default:
        return this.item.status;
    }
  }

  getDateDisplayText(): string {
    if (this.item.status === 'sold' && this.item.soldDate) {
      return `Sold ${this.formatDate(this.item.soldDate)}`;
    } else if (this.item.status === 'expired') {
      return '90-day period ended';
    } else {
      const daysText = this.item.daysListed === 1 ? 'day' : 'days';
      return `Listed ${this.item.daysListed} ${daysText} ago`;
    }
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  getImageAlt(): string {
    return `${this.item.name} thumbnail`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder-item.png';
  }
}