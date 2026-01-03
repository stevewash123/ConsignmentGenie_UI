import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  MockConsignorItemService,
  PriceRequestListItemDto,
  ReviewPriceRequestDto
} from '../../../consignor/services/mock-consignor-item.service';
import { PriceRequestReviewModalComponent } from './price-request-review-modal.component';
import { OwnerLayoutComponent } from '../owner-layout.component';

@Component({
  selector: 'app-price-request-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PriceRequestReviewModalComponent, OwnerLayoutComponent],
  templateUrl: './price-request-list.component.html',
  styleUrls: ['./price-request-list.component.scss']
})
export class PriceRequestListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  requests: PriceRequestListItemDto[] = [];
  filteredRequests: PriceRequestListItemDto[] = [];
  loading = false;
  error: string | null = null;

  searchTerm = '';
  sortBy: 'newest' | 'oldest' | 'highestPrice' | 'lowestPrice' = 'newest';
  filterStatus: 'all' | 'pending' | 'approved' | 'rejected' = 'pending';

  // Review modal state
  showReviewModal = false;
  selectedRequest: PriceRequestListItemDto | null = null;

  constructor(private itemService: MockConsignorItemService) {}

  ngOnInit() {
    this.loadPriceRequests();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPriceRequests() {
    this.loading = true;
    this.error = null;

    this.itemService.getPriceRequests()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (requests) => {
          this.requests = requests;
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load price requests';
          this.loading = false;
          console.error('Price requests error:', err);
        }
      });
  }

  applyFilters() {
    let filtered = [...this.requests];

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === this.filterStatus);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(req =>
        req.itemName.toLowerCase().includes(search) ||
        req.consignorName.toLowerCase().includes(search) ||
        req.category?.toLowerCase().includes(search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
        case 'oldest':
          return new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime();
        case 'highestPrice':
          return b.requestedPrice - a.requestedPrice;
        case 'lowestPrice':
          return a.requestedPrice - b.requestedPrice;
        default:
          return 0;
      }
    });

    this.filteredRequests = filtered;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  quickApprove(request: PriceRequestListItemDto) {
    if (request.status !== 'pending') return;

    this.itemService.quickApproveRequest(request.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update local state
          const index = this.requests.findIndex(r => r.id === request.id);
          if (index !== -1) {
            this.requests[index] = { ...this.requests[index], status: 'approved' };
            this.applyFilters();
          }
        },
        error: (err) => {
          console.error('Quick approve error:', err);
          alert('Failed to approve request. Please try again.');
        }
      });
  }

  quickReject(request: PriceRequestListItemDto) {
    if (request.status !== 'pending') return;

    this.itemService.quickRejectRequest(request.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update local state
          const index = this.requests.findIndex(r => r.id === request.id);
          if (index !== -1) {
            this.requests[index] = { ...this.requests[index], status: 'rejected' };
            this.applyFilters();
          }
        },
        error: (err) => {
          console.error('Quick reject error:', err);
          alert('Failed to reject request. Please try again.');
        }
      });
  }

  openReviewModal(request: PriceRequestListItemDto) {
    this.selectedRequest = request;
    this.showReviewModal = true;
  }

  onReviewModalClosed(result: { action: 'approved' | 'rejected' | null, request?: PriceRequestListItemDto }) {
    this.showReviewModal = false;
    this.selectedRequest = null;

    if (result.action && result.request) {
      // Update local state with the reviewed request
      const index = this.requests.findIndex(r => r.id === result.request!.id);
      if (index !== -1) {
        this.requests[index] = result.request;
        this.applyFilters();
      }

      // Show success message
      const actionText = result.action === 'approved' ? 'approved' : 'rejected';
      alert(`Price change request ${actionText} successfully!`);
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  }

  getPriceChangeClass(currentPrice: number, requestedPrice: number): string {
    if (requestedPrice > currentPrice) {
      return 'price-increase';
    } else if (requestedPrice < currentPrice) {
      return 'price-decrease';
    }
    return '';
  }

  getPriceChangeAmount(currentPrice: number, requestedPrice: number): number {
    return Math.abs(requestedPrice - currentPrice);
  }

  getPriceChangePercentage(currentPrice: number, requestedPrice: number): number {
    if (currentPrice === 0) return 0;
    return Math.abs(((requestedPrice - currentPrice) / currentPrice) * 100);
  }
}