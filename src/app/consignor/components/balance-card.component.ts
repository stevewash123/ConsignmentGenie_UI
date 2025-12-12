import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BalanceAmount, InTransitBalance } from '../models/consignor.models';

export type BalanceCardType = 'pending' | 'available' | 'in-transit';

@Component({
  selector: 'app-balance-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-card.component.html',
  styleUrls: ['./balance-card.component.scss']
})
export class BalanceCardComponent {
  @Input() type: BalanceCardType = 'available';
  @Input() balance: BalanceAmount | null = null;
  @Input() inTransitData: InTransitBalance | null = null;
  @Input() expanded: boolean = false;
  @Output() cardClick = new EventEmitter<void>();
  @Output() confirmReceived = new EventEmitter<string>();

  get cardTitle(): string {
    switch (this.type) {
      case 'pending': return 'Pending';
      case 'available': return 'Available';
      case 'in-transit': return 'In Transit';
      default: return '';
    }
  }

  get cardIcon(): string {
    switch (this.type) {
      case 'pending': return '⏳';
      case 'available': return '💰';
      case 'in-transit': return '🚚';
      default: return '💰';
    }
  }

  get cardDescription(): string {
    switch (this.type) {
      case 'pending': return 'Payment is processing (card/check clearing)';
      case 'available': return 'Ready to be paid out by the shop';
      case 'in-transit': return 'Payout sent, should arrive soon';
      default: return '';
    }
  }

  get isZeroBalance(): boolean {
    if (this.type === 'in-transit') {
      return !this.inTransitData || this.inTransitData.amount === 0;
    }
    return !this.balance || this.balance.amount === 0;
  }

  get displayAmount(): number {
    if (this.type === 'in-transit' && this.inTransitData) {
      return this.inTransitData.amount;
    }
    return this.balance?.amount || 0;
  }

  get displayItemCount(): number {
    if (this.type === 'in-transit') {
      return 1; // Always 1 payout for in-transit
    }
    return this.balance?.itemCount || 0;
  }

  get itemCountLabel(): string {
    if (this.type === 'in-transit') {
      return this.inTransitData ? `Payout #${this.inTransitData.payoutNumber}` : '';
    }
    const count = this.displayItemCount;
    return count === 1 ? '1 item' : `${count} items`;
  }

  onCardClick(): void {
    if (this.type === 'in-transit' && this.inTransitData) {
      this.cardClick.emit();
    }
  }

  onConfirmReceived(): void {
    if (this.inTransitData) {
      this.confirmReceived.emit(this.inTransitData.payoutId);
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}