import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { ItemCardComponent } from '../item-card/item-card.component';
import { RespondPriceChangeComponent } from '../modals/respond-price-change/respond-price-change.component';
import { MockConsignorItemService } from '../services/mock-consignor-item.service';
import {
  ConsignorItemSummary,
  ConsignorItemsRequest,
  ConsignorItemsResponse,
  ConsignorItemsFilter,
  ConsignorItemsSort
} from '../models/consignor-item.model';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemCardComponent, RespondPriceChangeComponent],
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.scss']
})
export class ItemListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  itemsResponse: ConsignorItemsResponse | null = null;
  loading = false;
  error: string | null = null;

  // Filter and sort state
  selectedStatus: string | null = null;
  searchText = '';
  sortField: 'listedDate' | 'price' | 'name' = 'listedDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage = 1;
  pageSize = 12;

  // Price change response modal
  showPriceChangeModal = false;
  selectedItemForPriceResponse: ConsignorItemSummary | null = null;
  successMessage = '';
  showSuccessMessage = false;

  constructor(
    private consignorItemService: MockConsignorItemService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchText => {
      this.searchText = searchText;
      this.currentPage = 1;
      this.loadItems();
    });
  }

  loadItems(): void {
    this.loading = true;
    this.error = null;

    const filter: ConsignorItemsFilter = {};
    if (this.selectedStatus) {
      filter.status = this.selectedStatus as any;
    }
    if (this.searchText.trim()) {
      filter.searchText = this.searchText.trim();
    }

    const sort: ConsignorItemsSort = {
      field: this.sortField,
      direction: this.sortDirection
    };

    const request: ConsignorItemsRequest = {
      filter,
      sort,
      page: this.currentPage,
      pageSize: this.pageSize
    };

    this.consignorItemService.getConsignorItems(request).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.itemsResponse = response;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load items. Please try again.';
        this.loading = false;
        console.error('Error loading items:', err);
      }
    });
  }

  onFilterByStatus(status: string | null): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadItems();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value);
  }

  onSortChange(field: 'listedDate' | 'price' | 'name'): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = field === 'price' ? 'desc' : 'asc';
    }
    this.currentPage = 1;
    this.loadItems();
  }

  onItemClick(item: ConsignorItemSummary): void {
    // Navigate to item detail view
    this.router.navigate(['/consignor/items', item.id]);
  }

  onPageChange(page: number): void {
    if (this.itemsResponse && page >= 1 && page <= this.itemsResponse.totalPages) {
      this.currentPage = page;
      this.loadItems();
    }
  }

  onLoadMore(): void {
    if (this.itemsResponse && this.currentPage < this.itemsResponse.totalPages) {
      this.currentPage++;
      this.loadItems();
    }
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getSortDisplay(field: 'listedDate' | 'price' | 'name'): string {
    const labels = {
      listedDate: this.sortDirection === 'desc' ? 'Newest First' : 'Oldest First',
      price: this.sortDirection === 'desc' ? 'Price High-Low' : 'Price Low-High',
      name: this.sortDirection === 'asc' ? 'Name A-Z' : 'Name Z-A'
    };
    return labels[field];
  }

  getCurrentSortDisplay(): string {
    return this.getSortDisplay(this.sortField);
  }

  hasItems(): boolean {
    return !!(this.itemsResponse?.items?.length);
  }

  hasResults(): boolean {
    return !!(this.itemsResponse && this.itemsResponse.totalCount > 0);
  }

  getActiveFiltersText(): string {
    const filters = [];
    if (this.selectedStatus) {
      filters.push(`Status: ${this.selectedStatus}`);
    }
    if (this.searchText) {
      filters.push(`Search: "${this.searchText}"`);
    }
    return filters.length > 0 ? `Filtered by ${filters.join(', ')}` : '';
  }

  clearFilters(): void {
    this.selectedStatus = null;
    this.searchText = '';
    this.currentPage = 1;
    this.loadItems();
  }

  getStatusCount(status: string): number {
    if (!this.itemsResponse) return 0;

    const counts = this.itemsResponse.statusCounts;
    switch (status) {
      case 'all': return counts.all;
      case 'available': return counts.available;
      case 'sold': return counts.sold;
      case 'returned': return counts.returned;
      case 'expired': return counts.expired;
      default: return 0;
    }
  }

  onRespondToPriceChange(item: ConsignorItemSummary): void {
    if (!item.priceChangeRequest) return;

    this.selectedItemForPriceResponse = item;
    this.showPriceChangeModal = true;
  }

  onClosePriceChangeModal(): void {
    this.showPriceChangeModal = false;
    this.selectedItemForPriceResponse = null;
  }

  onPriceChangeSubmitted(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;

    // Reload items to reflect changes
    this.loadItems();

    // Hide success message after 5 seconds
    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 5000);
  }

  dismissSuccessMessage(): void {
    this.showSuccessMessage = false;
  }

  hasPriceChangeRequest(item: ConsignorItemSummary): boolean {
    return !!(item.priceChangeRequest);
  }

  getPriceChangeRequestsCount(): number {
    if (!this.itemsResponse) return 0;
    return this.itemsResponse.items.filter(item => item.priceChangeRequest).length;
  }
}