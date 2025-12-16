import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OwnerLayoutComponent } from './owner-layout.component';
import { ItemFormModalComponent } from './item-form-modal.component';
import { BulkImportModalComponent } from './bulk-import-modal.component';
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
  imports: [CommonModule, FormsModule, OwnerLayoutComponent, ItemFormModalComponent, BulkImportModalComponent],
  templateUrl: './inventory-list.component.html',
  styles: [`
    .inventory-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f9fafb;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .add-button {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.375rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .add-button:hover {
      background: #2563eb;
    }

    .header-buttons {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .bulk-upload-button {
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 0.375rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .bulk-upload-button:hover {
      background: #4b5563;
    }

    .filters-section {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .filters-row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 1.5rem;
      align-items: center;
    }

    .search-sort-container {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .search-container {
      position: relative;
    }

    .search-input {
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem 0.5rem 2.25rem;
      font-size: 0.875rem;
      width: 300px;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      pointer-events: none;
    }

    .status-filters {
      display: flex;
      gap: 1rem;
    }

    .filter-select {
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      min-width: 120px;
    }

    .clear-button {
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 0.375rem;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .clear-button:hover {
      background: #4b5563;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .results-info {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .page-size-select {
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }

    .inventory-list {
      display: grid;
      gap: 1rem;
    }

    .inventory-card {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      display: grid;
      grid-template-columns: 80px 1fr auto;
      gap: 1rem;
      align-items: start;
      transition: all 0.2s ease;
    }

    .inventory-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }

    .inventory-thumbnail {
      width: 80px;
      height: 80px;
      border-radius: 0.5rem;
      object-fit: cover;
      border: 1px solid #e5e7eb;
    }

    .inventory-info {
      min-width: 0;
    }

    .inventory-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.75rem;
    }

    .inventory-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
      line-height: 1.3;
    }

    .inventory-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .status-available {
      background: #d1fae5;
      color: #065f46;
    }

    .status-sold {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .status-removed {
      background: #fef3c7;
      color: #92400e;
    }

    .condition-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      background: #f3f4f6;
      color: #374151;
    }

    .condition-new {
      background: #d1fae5;
      color: #065f46;
    }

    .condition-like-new {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .condition-good {
      background: #fef3c7;
      color: #92400e;
    }

    .condition-fair {
      background: #fed7aa;
      color: #9a3412;
    }

    .condition-poor {
      background: #fecaca;
      color: #991b1b;
    }

    .inventory-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }

    .meta-row {
      display: flex;
      gap: 0.5rem;
    }

    .meta-label {
      color: #6b7280;
      font-weight: 500;
      min-width: 70px;
    }

    .meta-value {
      color: #374151;
      font-weight: 600;
    }

    .inventory-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #059669;
    }

    .inventory-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-self: start;
    }

    .action-button {
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .action-button:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .action-button.primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .action-button.primary:hover {
      background: #2563eb;
      border-color: #2563eb;
    }

    .action-button.danger {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }

    .action-button.danger:hover {
      background: #dc2626;
      border-color: #dc2626;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .pagination-info {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .pagination-controls {
      display: flex;
      gap: 0.5rem;
    }

    .pagination-button {
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
    }

    .pagination-button:hover:not(.disabled) {
      background: #f9fafb;
    }

    .pagination-button.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .pagination-button.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 1rem;
    }

    .empty-state-description {
      color: #6b7280;
      font-size: 1rem;
      line-height: 1.5;
      margin-bottom: 2rem;
    }

    .empty-state-button {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .empty-state-button:hover {
      background: #2563eb;
    }

    .loading {
      text-align: center;
      padding: 3rem 2rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      color: #6b7280;
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .inventory-container {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .filters-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .search-sort-container {
        flex-direction: column;
        width: 100%;
      }

      .search-input {
        width: 100%;
      }

      .status-filters {
        flex-direction: column;
        width: 100%;
      }

      .content-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .inventory-card {
        grid-template-columns: 1fr;
        gap: 1rem;
        text-align: center;
      }

      .inventory-header {
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
      }

      .inventory-meta {
        grid-template-columns: 1fr;
      }

      .inventory-actions {
        flex-direction: row;
        justify-content: center;
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

  // Modal state
  isAddModalOpen = false;
  isEditModalOpen = false;
  isBulkImportModalOpen = false;
  editingItem: ItemListDto | null = null;


  // Computed values
  visiblePages = computed(() => {
    const result = this.itemsResult();
    if (!result) return [];

    const current = this.currentPage();
    const total = result.TotalPages;
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
    this.editingItem = null;
    this.isAddModalOpen = true;
  }

  openBulkUpload() {
    this.isBulkImportModalOpen = true;
  }

  viewItem(id: string) {
    this.router.navigate(['/owner/inventory', id]);
  }

  editItem(itemId: string) {
    const item = this.itemsResult()?.Items.find(i => i.ItemId === itemId);
    if (item) {
      this.editingItem = item;
      this.isEditModalOpen = true;
    }
  }

  markAsRemoved(item: ItemListDto) {
    if (confirm(`Mark "${item.Title}" as removed?`)) {
      const request: UpdateItemStatusRequest = {
        status: 'Removed',
        reason: 'Marked as removed from inventory list'
      };

      this.inventoryService.updateItemStatus(item.ItemId, request).subscribe({
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
    if (confirm(`Are you sure you want to delete "${item.Title}"? This action cannot be undone.`)) {
      this.inventoryService.deleteItem(item.ItemId).subscribe({
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

  // Modal event handlers
  closeAddModal() {
    this.isAddModalOpen = false;
    this.editingItem = null;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingItem = null;
  }

  closeBulkImportModal() {
    this.isBulkImportModalOpen = false;
  }

  onItemSaved(item: ItemListDto) {
    // Refresh the list after saving
    this.loadItems();
  }

  onItemsImported(items: any[]) {
    // Mock import - just refresh the list to simulate new items being added
    console.log('Items imported (mock):', items);
    this.loadItems(); // Refresh the list
    this.closeBulkImportModal();
  }

  // Make Math.min available to template
  Math = Math;
}
// Story 00-inventory-browser-redesign: Commit marker for story tracking
