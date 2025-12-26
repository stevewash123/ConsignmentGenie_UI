import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { ProviderItem, PagedResult, ProviderItemQuery } from '../models/consignor.models';
import { LoadingService } from '../../shared/services/loading.service';
import { LOADING_KEYS } from '../constants/loading-keys';

@Component({
  selector: 'app-consignor-items',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './consignor-items.component.html',
  styles: [`
    .consignor-items {
      min-height: 100vh;
      background: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .nav-header {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 1rem 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;
    }

    .nav-links a {
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
    }

    .nav-links a:hover,
    .nav-links a.active {
      color: #3b82f6;
      background: #f3f4f6;
    }

    .content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 2rem 0;
    }

    .search-section {
      margin-bottom: 2rem;
    }

    .search-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 0.5rem;
      max-width: 600px;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1rem;
      padding: 0.5rem;
      background: transparent;
    }

    .search-input::placeholder {
      color: #9ca3af;
    }

    .search-btn,
    .clear-btn {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s ease;
    }

    .clear-btn {
      background: #6b7280;
      padding: 0.25rem 0.5rem;
    }

    .search-btn:hover:not(:disabled) {
      background: #2563eb;
    }

    .clear-btn:hover {
      background: #4b5563;
    }

    .search-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 1rem;
    }

    .tab {
      background: none;
      border: none;
      padding: 0.5rem 1rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      border-radius: 0.375rem;
    }

    .tab:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .tab.active {
      background: #3b82f6;
      color: white;
    }

    .items-table {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
      margin-bottom: 2rem;
    }

    .table-header {
      display: grid;
      grid-template-columns: 80px 2fr 120px 120px 100px;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .table-row {
      display: grid;
      grid-template-columns: 80px 2fr 120px 120px 100px;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      transition: background-color 0.15s ease;
      text-decoration: none;
      color: inherit;
    }

    .table-row:hover {
      background: #f9fafb;
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .col {
      display: flex;
      align-items: center;
    }

    .item-photo {
      width: 60px;
      height: 60px;
      border-radius: 0.375rem;
      overflow: hidden;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .item-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-placeholder {
      font-size: 1.5rem;
      color: #9ca3af;
    }

    .item-info {
      min-width: 0;
    }

    .item-title {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-sku {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-available {
      background: #dcfce7;
      color: #166534;
    }

    .status-sold {
      background: #e0e7ff;
      color: #3730a3;
    }

    .status-removed {
      background: #fef2f2;
      color: #991b1b;
    }

    .no-items {
      padding: 3rem;
      text-align: center;
      color: #6b7280;
      font-style: italic;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .pagination-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
    }

    .pagination-btn:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    .pagination-info {
      font-weight: 500;
      color: #374151;
    }

    .footer-info {
      border-top: 1px solid #e5e7eb;
      padding-top: 1.5rem;
      text-align: center;
    }

    .commission-info {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .contact-info {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .loading, .error {
      text-align: center;
      padding: 2rem;
    }

    .error button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      .nav-header {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .nav-links {
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .content {
        padding: 1rem;
      }

      .filter-tabs {
        flex-wrap: wrap;
      }

      .table-header {
        display: none;
      }

      .table-row {
        grid-template-columns: 1fr;
        gap: 1rem;
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
      }

      .col {
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f3f4f6;
      }

      .col:last-child {
        border-bottom: none;
      }

      .photo-col {
        justify-content: center;
      }

      .pagination {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
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