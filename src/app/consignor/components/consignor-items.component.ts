import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { ProviderItem, ProviderItemQuery } from '../models/consignor.models';
import { PagedResult } from '../../shared/models/api.models';
import { LoadingService } from '../../shared/services/loading.service';
import { LOADING_KEYS } from '../constants/loading-keys';

@Component({
  selector: 'app-consignor-items',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './consignor-items.component.html',
  styleUrls: ['./consignor-items.component.scss']
})
export class ConsignorItemsComponent implements OnInit {
  itemsResult: PagedResult<ProviderItem> | null = null;
  error: string | null = null;

  // Expose for template
  readonly KEYS = LOADING_KEYS;

  selectedStatus: string | null = null;
  currentPage = 1;
  pageSize = 20;
  commissionRate = 50;
  searchTerm = '';

  // Counts for tabs
  totalItemsCount = 0;
  availableCount = 0;
  soldCount = 0;
  removedCount = 0;

  constructor(
    private ConsignorService: ConsignorPortalService,
    public loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadItems();
    this.loadItemCounts();
  }

  loadItems() {
    this.loadingService.start(LOADING_KEYS.ITEMS_LIST);
    this.error = null;

    const query: ProviderItemQuery = {
      page: this.currentPage,
      pageSize: this.pageSize
    };

    if (this.selectedStatus) {
      query.status = this.selectedStatus;
    }

    if (this.searchTerm.trim()) {
      query.search = this.searchTerm.trim();
    }

    this.ConsignorService.getMyItems(query).subscribe({
      next: (result) => {
        this.itemsResult = result;
      },
      error: (err) => {
        this.error = 'Failed to load items. Please try again.';
        console.error('Items error:', err);
      },
      complete: () => {
        this.loadingService.stop(LOADING_KEYS.ITEMS_LIST);
      }
    });
  }

  loadItemCounts() {
    // Load counts for each status to display in tabs
    // This would require separate API calls or the API could return counts in the main response
    // For now, using placeholder values
    this.totalItemsCount = 24;
    this.availableCount = 12;
    this.soldCount = 10;
    this.removedCount = 2;
  }

  filterByStatus(status: string | null) {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.loadItems();
  }

  searchItems() {
    this.currentPage = 1;
    this.loadItems();
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadItems();
  }

  goToPage(page: number) {
    if (page >= 1 && this.itemsResult && page <= this.itemsResult.totalPages) {
      this.currentPage = page;
      this.loadItems();
    }
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
      case 'available': return '● Avail';
      case 'sold': return '○ Sold';
      case 'removed': return '✗ Removed';
      default: return status;
    }
  }
}