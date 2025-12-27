import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OwnerLayoutComponent } from './owner-layout.component';
import { InitiatePriceChangeComponent } from './modals/initiate-price-change/initiate-price-change.component';
import { InventoryService } from '../../services/inventory.service';
import { LoadingService } from '../../shared/services/loading.service';
import { ItemDetailDto, ItemStatus, ItemCondition } from '../../models/inventory.model';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, OwnerLayoutComponent, InitiatePriceChangeComponent],
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss']
})
export class ItemDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private inventoryService = inject(InventoryService);
  private loadingService = inject(LoadingService);

  item = signal<ItemDetailDto | null>(null);
  error = signal<string | null>(null);
  showPriceChangeModal = signal(false);

  itemId: string | null = null;

  ngOnInit() {
    this.itemId = this.route.snapshot.paramMap.get('id');
    if (this.itemId) {
      this.loadItemDetail();
    } else {
      this.error.set('Item ID is required');
    }
  }

  private loadItemDetail() {
    if (!this.itemId) return;

    this.loadingService.start('item-detail');
    this.error.set(null);

    this.inventoryService.getItem(this.itemId).subscribe({
      next: (response) => {
        if (response.success) {
          this.item.set(response.data);
        } else {
          this.error.set(response.message || 'Failed to load item details');
        }
      },
      error: (err) => {
        console.error('Error loading item:', err);
        if (err.status === 404) {
          this.error.set('Item not found');
        } else {
          this.error.set('Failed to load item details. Please try again.');
        }
      },
      complete: () => {
        this.loadingService.stop('item-detail');
      }
    });
  }

  isLoading(): boolean {
    return this.loadingService.isLoading('item-detail');
  }

  goBack() {
    this.router.navigate(['/owner/inventory']);
  }

  editItem() {
    if (this.itemId) {
      this.router.navigate(['/owner/inventory', this.itemId, 'edit']);
    }
  }

  openPriceChangeModal() {
    this.showPriceChangeModal.set(true);
  }

  closePriceChangeModal() {
    this.showPriceChangeModal.set(false);
  }

  onPriceChangeSubmitted() {
    // Refresh item details after price change
    this.loadItemDetail();
    this.closePriceChangeModal();
  }

  getConditionLabel(condition: ItemCondition): string {
    switch (condition) {
      case ItemCondition.New: return 'New';
      case ItemCondition.LikeNew: return 'Like New';
      case ItemCondition.Good: return 'Good';
      case ItemCondition.Fair: return 'Fair';
      case ItemCondition.Poor: return 'Poor';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: ItemStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  getConditionClass(condition: ItemCondition): string {
    return `condition-${condition.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()}`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getDaysListed(): number {
    const item = this.item();
    if (!item || !item.listedDate) return 0;

    const listedDate = new Date(item.listedDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - listedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}