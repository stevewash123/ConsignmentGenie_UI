import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { LoadingService } from '../../shared/services/loading.service';
import { ItemDetailDto, ItemStatus, ItemCondition } from '../../models/inventory.model';
import { ApiResponse } from '../../models/inventory.model';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss']
})
export class ItemDetailComponent implements OnInit {
  item = signal<ItemDetailDto | null>(null);
  itemId = signal<string>('');
  error = signal<string>('');

  // Activity/history data
  itemHistory = signal<any[]>([]);

  // Modal states
  showPriceChangeModal = signal(false);
  isUpdatingPrice = signal(false);
  newPrice = 0;
  priceChangeReason = '';

  isLoading(): boolean {
    return this.loadingService.isLoading('item-detail');
  }

  constructor(
    private inventoryService: InventoryService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.itemId.set(id);
      this.loadItem();
      this.loadItemHistory();
    }
  }

  loadItem(): void {
    this.loadingService.start('item-detail');

    this.inventoryService.getItem(this.itemId()).subscribe({
      next: (response: ApiResponse<ItemDetailDto>) => {
        this.item.set(response.data);
      },
      error: (error) => {
        console.error('Error loading item:', error);
        this.error.set('Failed to load item details');
      },
      complete: () => {
        this.loadingService.stop('item-detail');
      }
    });
  }

  loadItemHistory(): void {
    // TODO: Implement item history API call when available
    // For now, using mock data
    this.itemHistory.set([
      {
        type: 'created',
        description: 'Item added to inventory',
        date: new Date('2024-11-01'),
        amount: null
      },
      {
        type: 'price_change',
        description: 'Price reduced from $45.00 to $35.00',
        date: new Date('2024-11-15'),
        amount: null
      },
      {
        type: 'listed',
        description: 'Item listed for sale',
        date: new Date('2024-11-02'),
        amount: null
      }
    ]);
  }

  getHistoryIcon(type: string): string {
    switch (type) {
      case 'created': return '📦';
      case 'price_change': return '💰';
      case 'listed': return '🏷️';
      case 'sold': return '✅';
      case 'removed': return '📤';
      default: return '📋';
    }
  }

  goBack(): void {
    this.location.back();
  }

  editItem(): void {
    if (this.item()) {
      this.router.navigate(['/owner/inventory', this.itemId(), 'edit']);
    }
  }

  openPriceChangeModal(): void {
    const item = this.item();
    if (item) {
      this.newPrice = item.price;
      this.priceChangeReason = '';
      this.showPriceChangeModal.set(true);
    }
  }

  closePriceChangeModal(): void {
    this.showPriceChangeModal.set(false);
  }

  async updatePrice(): Promise<void> {
    const item = this.item();
    if (!item || this.newPrice <= 0) return;

    this.isUpdatingPrice.set(true);

    try {
      // TODO: Implement price update API call when available
      // For now, just update the local state
      const updatedItem = { ...item, price: this.newPrice };
      this.item.set(updatedItem);

      this.closePriceChangeModal();
      // Would show success toast here
      console.log('Price updated successfully');
    } catch (error) {
      console.error('Error updating price:', error);
      this.error.set('Failed to update price');
    } finally {
      this.isUpdatingPrice.set(false);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatCommissionRate(rate: number): number {
    // If rate is between 0 and 1, treat as decimal and convert to percentage
    // If rate is greater than 1, assume it's already a percentage
    if (rate <= 1) {
      return Math.round(rate * 100);
    }
    return Math.round(rate);
  }

  getCorrectConsignorAmount(item: ItemDetailDto): number {
    // Calculate what the consignor amount should be based on commission rate
    const commissionRate = item.commissionRate <= 1 ? item.commissionRate : item.commissionRate / 100;
    return item.price * commissionRate;
  }

  getCorrectShopAmount(item: ItemDetailDto): number {
    // Calculate what the shop amount should be (price minus consignor amount)
    return item.price - this.getCorrectConsignorAmount(item);
  }

  getStatusClass(status: ItemStatus): string {
    switch (status) {
      case ItemStatus.Available: return 'badge-success';
      case ItemStatus.Sold: return 'badge-info';
      case ItemStatus.Removed: return 'badge-neutral';
      default: return 'badge-neutral';
    }
  }

  getConditionClass(condition: ItemCondition): string {
    switch (condition) {
      case ItemCondition.New: return 'condition-new';
      case ItemCondition.LikeNew: return 'condition-like-new';
      case ItemCondition.Good: return 'condition-good';
      case ItemCondition.Fair: return 'condition-fair';
      case ItemCondition.Poor: return 'condition-poor';
      default: return 'condition-unknown';
    }
  }

  getConditionLabel(condition: ItemCondition): string {
    return condition;
  }

  getDaysListed(): number {
    const item = this.item();
    if (!item?.listedDate) return 0;

    const listed = new Date(item.listedDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - listed.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysUntilExpiration(): number | null {
    const item = this.item();
    if (!item?.expirationDate) return null;

    const expiration = new Date(item.expirationDate);
    const today = new Date();
    const diffTime = expiration.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return daysRemaining;
  }

  getExpirationDisplayText(): string {
    const daysRemaining = this.getDaysUntilExpiration();

    if (daysRemaining === null) return 'N/A';
    if (daysRemaining < 0) return `Expired ${Math.abs(daysRemaining)} days ago`;
    if (daysRemaining === 0) return 'Expires Today';
    if (daysRemaining === 1) return '1 day';
    return `${daysRemaining} days`;
  }

  getExpirationStatusClass(): string {
    const daysRemaining = this.getDaysUntilExpiration();

    if (daysRemaining === null) return '';
    if (daysRemaining < 0) return 'expiration-expired';
    if (daysRemaining <= 3) return 'expiration-critical';  // Red for last 3 days
    if (daysRemaining <= 7) return 'expiration-warning';   // Orange for last 7 days
    return '';
  }

  viewConsignor(): void {
    const item = this.item();
    if (item?.consignorId) {
      this.router.navigate(['/owner/consignors', item.consignorId]);
    }
  }

  getThumbnailUrl(url: string, width = 200, height = 200): string {
    // Insert transform params into Cloudinary URL
    return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
  }

  viewFullPhoto(photoUrl: string): void {
    // Open photo in new window/tab for full view
    window.open(photoUrl, '_blank');
  }
}