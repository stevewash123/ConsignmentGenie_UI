import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { ProviderItemDetail } from '../models/consignor.models';
import { LoadingService } from '../../shared/services/loading.service';
import { LOADING_KEYS } from '../constants/loading-keys';
import { MockConsignorItemService, ConsignorItemDetailDto, ItemPriceChangeRequestDto, ItemReturnRequestDto } from '../services/mock-consignor-item.service';
import { RequestPriceChangeComponent } from './modals/request-price-change.component';
import { ReturnRequestModalComponent } from './modals/return-request-modal.component';

@Component({
  selector: 'app-consignor-item-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, RequestPriceChangeComponent, ReturnRequestModalComponent],
  templateUrl: './consignor-item-detail.component.html',
  styleUrls: ['./consignor-item-detail.component.scss']
})
export class ConsignorItemDetailComponent implements OnInit {
  item: ProviderItemDetail | null = null;
  mockItem: ConsignorItemDetailDto | null = null;
  error: string | null = null;
  itemId: string;
  selectedImageUrl: string = '';
  showPriceChangeModal = false;
  showReturnRequestModal = false;

  // Expose for template
  readonly KEYS = LOADING_KEYS;

  constructor(
    private ConsignorService: ConsignorPortalService,
    private mockService: MockConsignorItemService,
    private route: ActivatedRoute,
    public loadingService: LoadingService
  ) {
    this.itemId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit() {
    if (this.itemId) {
      this.loadItem();
      this.loadMockItem();
    }
  }

  loadItem() {
    this.loadingService.start(LOADING_KEYS.ITEM_DETAIL);
    this.error = null;

    this.ConsignorService.getMyItem(this.itemId).subscribe({
      next: (item) => {
        this.item = item;
        this.selectedImageUrl = item.primaryImageUrl;
      },
      error: (err) => {
        this.error = 'Failed to load item details. Please try again.';
        console.error('Item detail error:', err);
      },
      complete: () => {
        this.loadingService.stop(LOADING_KEYS.ITEM_DETAIL);
      }
    });
  }

  loadMockItem() {
    this.mockService.getItemDetail(this.itemId).subscribe({
      next: (mockItem) => {
        this.mockItem = mockItem;
      },
      error: (err) => {
        console.error('Mock item detail error:', err);
      }
    });
  }

  selectImage(imageUrl: string) {
    this.selectedImageUrl = imageUrl;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'available': return 'status-available';
      case 'sold': return 'status-sold';
      case 'removed': return 'status-removed';
      default: return 'status-available';
    }
  }

  getStatusDisplay(status: string): string {
    switch (status.toLowerCase()) {
      case 'available': return '● Available';
      case 'sold': return '○ Sold';
      case 'removed': return '✗ Removed';
      default: return status;
    }
  }

  canRequestPriceChange(): boolean {
    return this.mockItem?.status === 'available' && !this.mockItem?.hasPendingPriceRequest;
  }

  openPriceChangeModal() {
    if (this.canRequestPriceChange()) {
      this.showPriceChangeModal = true;
    }
  }

  onPriceChangeModalClosed(result: ItemPriceChangeRequestDto | null) {
    this.showPriceChangeModal = false;

    if (result) {
      // Refresh the mock item to show updated pending request status
      this.loadMockItem();
      alert('Price change request submitted successfully! The shop owner will review your request.');
    }
  }

  formatPendingRequestDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  canRequestReturn(): boolean {
    const validStatuses = ['available', 'expired'];
    return validStatuses.includes(this.mockItem?.status || '') && !this.mockItem?.pendingReturnRequest;
  }

  openReturnRequestModal() {
    if (this.canRequestReturn()) {
      this.showReturnRequestModal = true;
    }
  }

  onReturnRequestModalClosed(result: ItemReturnRequestDto | null) {
    this.showReturnRequestModal = false;

    if (result) {
      // Refresh the mock item to show updated pending request status
      this.loadMockItem();
      alert('Return request submitted successfully! The shop owner will review your request and notify you when your item is ready for pickup.');
    }
  }
}