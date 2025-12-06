import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OwnerLayoutComponent } from './owner-layout.component';
import { InventoryService } from '../../services/inventory.service';
import { LoadingService } from '../../shared/services/loading.service';
import {
  ItemListDto,
  ItemQueryParams,
  PagedResult,
  ItemCondition,
  ItemStatus,
  CategoryDto,
  UpdateItemStatusRequest
} from '../../models/inventory.model';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, OwnerLayoutComponent],
  template: `
    <app-owner-layout>
      <div class="inventory-page">
        <!-- Header -->
        <div class="page-header">
          <div class="header-content">
            <h1>Inventory Management</h1>
            <p>View and manage all inventory items</p>
          </div>
          <div class="header-actions">
            <button class="btn-primary" (click)="createNewItem()">
              <span class="btn-icon">📦</span>
              Add New Item
            </button>
          </div>
        </div>

        <!-- Filters Section -->
        <div class="filters-section">
          <div class="filter-row">
            <div class="filter-group">
              <label for="searchQuery">Search</label>
              <input
                type="text"
                id="searchQuery"
                [(ngModel)]="searchQuery"
                (keyup.enter)="applyFilters()"
                placeholder="Search items by title, SKU, or description..."
                class="filter-input">
            </div>
            <div class="filter-group">
              <label for="selectedStatus">Status</label>
              <select id="selectedStatus" [(ngModel)]="selectedStatus" (change)="applyFilters()" class="filter-select">
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
                <option value="Removed">Removed</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="selectedCondition">Condition</label>
              <select id="selectedCondition" [(ngModel)]="selectedCondition" (change)="applyFilters()" class="filter-select">
                <option value="">All Conditions</option>
                <option value="New">New</option>
                <option value="LikeNew">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="selectedCategory">Category</label>
              <select id="selectedCategory" [(ngModel)]="selectedCategory" (change)="applyFilters()" class="filter-select">
                <option value="">All Categories</option>
                @for (category of categories(); track category.id) {
                  <option [value]="category.name">{{ category.name }}</option>
                }
              </select>
            </div>
            <button class="btn-secondary" (click)="clearFilters()">
              Clear Filters
            </button>
          </div>
        </div>

        <!-- Results Section -->
        <div class="results-section">
          <div class="section-header">
            <h2>Inventory Items</h2>
            <div class="table-controls">
              <select [(ngModel)]="pageSize" (change)="changePageSize()" class="page-size-select">
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>

          <div class="table-container" *ngIf="!isInventoryLoading() && pagedResult(); else loadingInventory">
            <table class="inventory-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th (click)="setSorting('sku')" class="sortable">
                    SKU
                    <span class="sort-indicator" [class.active]="sortBy === 'sku'">
                      {{ sortDirection === 'asc' ? '↑' : '↓' }}
                    </span>
                  </th>
                  <th (click)="setSorting('title')" class="sortable">
                    Title
                    <span class="sort-indicator" [class.active]="sortBy === 'title'">
                      {{ sortDirection === 'asc' ? '↑' : '↓' }}
                    </span>
                  </th>
                  <th>Category</th>
                  <th>Condition</th>
                  <th (click)="setSorting('price')" class="sortable">
                    Price
                    <span class="sort-indicator" [class.active]="sortBy === 'price'">
                      {{ sortDirection === 'asc' ? '↑' : '↓' }}
                    </span>
                  </th>
                  <th>Status</th>
                  <th>Consignor</th>
                  <th (click)="setSorting('receivedDate')" class="sortable">
                    Received
                    <span class="sort-indicator" [class.active]="sortBy === 'receivedDate'">
                      {{ sortDirection === 'asc' ? '↑' : '↓' }}
                    </span>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of itemsResult()!.items" class="item-row">
                  <td class="image-cell">
                    @if (item.primaryImageUrl) {
                      <img [src]="item.primaryImageUrl" [alt]="item.title" class="item-thumbnail">
                    } @else {
                      <div class="no-image">
                        📷
                      </div>
                    }
                  </td>
                  <td class="sku-cell">{{ item.sku }}</td>
                  <td class="title-cell">
                    <div class="item-info">
                      <div class="item-title">{{ item.title }}</div>
                      <div class="item-description" *ngIf="item.description">{{ item.description | slice:0:50 }}{{ item.description.length > 50 ? '...' : '' }}</div>
                    </div>
                  </td>
                  <td>{{ item.category }}</td>
                  <td class="condition-cell">
                    <span class="condition-badge" [class]="getConditionClass(item.condition)">
                      {{ getConditionLabel(item.condition) }}
                    </span>
                  </td>
                  <td class="price-cell">
                    <div class="item-price">\${{ item.price | number:'1.2-2' }}</div>
                  </td>
                  <td class="status-cell">
                    <span class="status-badge" [class]="'status-' + item.status.toLowerCase()">
                      {{ item.status }}
                    </span>
                  </td>
                  <td class="consignor-cell">
                    <div class="consignor-info">
                      <div class="consignor-name">{{ item.consignorName }}</div>
                    </div>
                  </td>
                  <td class="date-cell">
                    {{ item.receivedDate | date:'MMM d, y' }}
                  </td>
                  <td class="actions-cell">
                    <div class="action-buttons">
                      <button class="btn-icon" (click)="viewItem(item.itemId)" title="View Details">
                        👁️
                      </button>
                      <button class="btn-icon" (click)="editItem(item.itemId)" title="Edit">
                        ✏️
                      </button>
                      @if (item.status === 'Available') {
                        <button class="btn-icon" (click)="markAsRemoved(item)" title="Mark as Removed">
                          📦
                        </button>
                      }
                      <button class="btn-icon danger" (click)="deleteItem(item)" title="Delete">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div class="pagination" *ngIf="itemsResult()!.totalPages > 1">
              <button
                class="page-btn"
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)">
                Previous
              </button>

              <div class="page-numbers">
                <button
                  *ngFor="let page of visiblePages()"
                  class="page-btn"
                  [class.active]="page === currentPage()"
                  (click)="goToPage(page)">
                  {{ page }}
                </button>
              </div>

              <button
                class="page-btn"
                [disabled]="currentPage() === itemsResult()!.totalPages"
                (click)="goToPage(currentPage() + 1)">
                Next
              </button>
            </div>
          </div>

          <ng-template #loadingInventory>
            <div class="loading-state" *ngIf="isInventoryLoading()">
              <div class="loading-spinner"></div>
              <p>Loading inventory...</p>
            </div>
            <div class="empty-state" *ngIf="!isInventoryLoading() && (!itemsResult() || itemsResult()!.items.length === 0)">
              <p>No inventory items found.</p>
              <button class="btn-primary" (click)="createNewItem()">
                <span class="btn-icon">📦</span>
                Add Your First Item
              </button>
            </div>
          </ng-template>
        </div>

      </div>
    </app-owner-layout>
  `,
  styles: [`
    .inventory-page {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .page-header h1 {
      color: #059669;
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }

    .page-header p {
      color: #6b7280;
      margin: 0;
    }

    .btn-primary, .btn-secondary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #059669;
      color: white;
    }

    .btn-primary:hover {
      background: #047857;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .filters-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .filter-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
    }

    .filter-group label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .filter-input, .filter-select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .filter-input:focus, .filter-select:focus {
      outline: none;
      border-color: #059669;
      box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
    }

    .results-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-header h2 {
      color: #1f2937;
      font-size: 1.25rem;
      margin: 0;
    }

    .page-size-select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .table-container {
      overflow-x: auto;
    }

    .inventory-table {
      width: 100%;
      border-collapse: collapse;
    }

    .inventory-table th {
      background: #f9fafb;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .inventory-table th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .inventory-table th.sortable:hover {
      background: #f3f4f6;
    }

    .sort-indicator {
      opacity: 0.3;
      margin-left: 0.5rem;
    }

    .sort-indicator.active {
      opacity: 1;
      color: #059669;
    }

    .item-row {
      border-bottom: 1px solid #e5e7eb;
    }

    .item-row:hover {
      background: #f9fafb;
    }

    .item-row td {
      padding: 1rem;
      vertical-align: top;
    }

    .image-cell {
      width: 60px;
      text-align: center;
    }

    .item-thumbnail {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 6px;
    }

    .no-image {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border-radius: 6px;
      color: #6b7280;
      font-size: 1.2rem;
    }

    .sku-cell {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .item-info {
      display: flex;
      flex-direction: column;
    }

    .item-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .item-description {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .condition-badge, .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .condition-new { background: #dcfce7; color: #166534; }
    .condition-like-new { background: #dbeafe; color: #1e40af; }
    .condition-good { background: #fef3c7; color: #92400e; }
    .condition-fair { background: #fed7aa; color: #9a3412; }
    .condition-poor { background: #fecaca; color: #991b1b; }

    .status-available { background: #dcfce7; color: #166534; }
    .status-sold { background: #fef3c7; color: #92400e; }
    .status-removed { background: #f3f4f6; color: #6b7280; }

    .item-price {
      font-weight: 600;
      color: #1f2937;
      font-size: 1rem;
    }

    .consignor-info {
      display: flex;
      flex-direction: column;
    }

    .consignor-name {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .date-cell {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      background: #f3f4f6;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #e5e7eb;
    }

    .btn-icon.danger:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .page-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .page-btn.active {
      background: #059669;
      color: white;
      border-color: #059669;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-numbers {
      display: flex;
      gap: 0.5rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #6b7280;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top: 3px solid #059669;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      color: #6b7280;
    }

    .empty-state p {
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }

    @media (max-width: 768px) {
      .inventory-page {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .filter-row {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .inventory-table {
        font-size: 0.875rem;
      }

      .inventory-table th,
      .inventory-table td {
        padding: 0.75rem 0.5rem;
      }

      .action-buttons {
        flex-direction: column;
        gap: 0.25rem;
      }

      .btn-icon {
        width: 28px;
        height: 28px;
        font-size: 0.75rem;
      }

      .pagination {
        flex-direction: column;
        gap: 1rem;
      }
    }

  `]
})
export class InventoryListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  // State signals
  itemsResult = signal<PagedResult<ItemListDto> | null>(null);
  categories = signal<CategoryDto[]>([]);
  error = signal<string | null>(null);

  isInventoryLoading(): boolean {
    return this.loadingService.isLoading('inventory-list');
  }

  // Filter state
  searchQuery = '';
  selectedStatus = '';
  selectedCondition = '';
  selectedCategory = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  sortBy = 'CreatedAt';
  sortDirection = 'desc';
  currentPage = signal(1);
  pageSize = 25;


  // Computed values
  visiblePages = computed(() => {
    const result = this.itemsResult();
    if (!result) return [];

    const current = this.currentPage();
    const total = result.totalPages;
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  });

  ngOnInit() {
    this.loadCategories();
    this.loadItems();
  }

  private loadCategories() {
    this.inventoryService.getCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data);
        }
      },
      error: (err) => console.error('Failed to load categories:', err)
    });
  }

  loadItems() {
    this.loadingService.start('inventory-list');
    this.error.set(null);

    const params: ItemQueryParams = {
      page: this.currentPage(),
      pageSize: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedCondition) params.condition = this.selectedCondition;
    if (this.selectedCategory) params.category = this.selectedCategory;
    if (this.priceMin !== null) params.priceMin = this.priceMin;
    if (this.priceMax !== null) params.priceMax = this.priceMax;

    this.inventoryService.getItems(params).subscribe({
      next: (result) => {
        this.itemsResult.set(result);
      },
      error: (err) => {
        this.error.set('Failed to load inventory items. Please try again.');
        console.error('Error loading items:', err);
      },
      complete: () => {
        this.loadingService.stop('inventory-list');
      }
    });
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadItems();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedCondition = '';
    this.selectedCategory = '';
    this.priceMin = null;
    this.priceMax = null;
    this.sortBy = 'CreatedAt';
    this.sortDirection = 'desc';
    this.applyFilters();
  }

  setSorting(column: string) {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'desc';
    }
    this.loadItems();
  }

  changePageSize() {
    this.currentPage.set(1);
    this.loadItems();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadItems();
  }

  pagedResult() {
    return this.itemsResult();
  }

  createNewItem() {
    this.router.navigate(['/owner/inventory/new']);
  }

  viewItem(id: string) {
    this.router.navigate(['/owner/inventory', id]);
  }

  editItem(id: string) {
    this.router.navigate(['/owner/inventory', id, 'edit']);
  }

  markAsRemoved(item: ItemListDto) {
    if (confirm(`Mark "${item.title}" as removed?`)) {
      const request: UpdateItemStatusRequest = {
        status: 'Removed',
        reason: 'Marked as removed from inventory list'
      };

      this.inventoryService.updateItemStatus(item.itemId, request).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadItems(); // Refresh the list
          }
        },
        error: (err) => {
          this.error.set('Failed to update item status.');
          console.error('Error updating item status:', err);
        }
      });
    }
  }

  deleteItem(item: ItemListDto) {
    if (confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
      this.inventoryService.deleteItem(item.itemId).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadItems(); // Refresh the list
          }
        },
        error: (err) => {
          this.error.set('Failed to delete item.');
          console.error('Error deleting item:', err);
        }
      });
    }
  }

  getConditionClass(condition: ItemCondition): string {
    return `condition-${condition.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()}`;
  }

  getConditionLabel(condition: ItemCondition): string {
    switch (condition) {
      case ItemCondition.LikeNew: return 'Like New';
      default: return condition;
    }
  }

  getStatusClass(status: ItemStatus): string {
    return `status-${status.toLowerCase()}`;
  }
}