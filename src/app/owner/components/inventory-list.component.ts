import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OwnerLayoutComponent } from './owner-layout.component';
import { BulkImportModalComponent } from './bulk-import-modal.component';
import { InventoryService } from '../../services/inventory.service';
import { LoadingService } from '../../shared/services/loading.service';
import { SquareIntegrationService } from '../../services/square-integration.service';
import { environment } from '../../../environments/environment';
import {
  ItemListDto,
  ItemQueryParams,
  PagedResult,
  ItemCondition,
  ItemStatus,
  ItemCategoryDto,
  UpdateItemStatusRequest
} from '../../models/inventory.model';

// Define interface for imported CSV data structure
// Note: CSV headers are PascalCase (Name, Price, ConsignorNumber) but converted to camelCase internally
export interface ImportedItem {
  name: string;              // from CSV "Name"
  description?: string;      // from CSV "Description"
  sku?: string;              // from CSV "SKU"
  price: string;             // from CSV "Price" (string, needs parsing)
  consignorNumber: string;   // from CSV "ConsignorNumber"
  category?: string;         // from CSV "Category"
  condition?: string;        // from CSV "Condition"
  receivedDate?: string;     // from CSV "ReceivedDate"
  location?: string;         // from CSV "Location"
  notes?: string;            // from CSV "Notes"
}

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, OwnerLayoutComponent, BulkImportModalComponent],
  templateUrl: './inventory-list.component.html',
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
      color: #1f2937;
      margin-bottom: 0.5rem;
      font-size: 2rem;
      font-weight: 600;
    }

    .page-header p {
      color: #6b7280;
      margin: 0;
    }

    .square-mode-indicator {
      margin-top: 0.5rem;
    }

    .square-mode-indicator p {
      color: #1d4ed8;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .square-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #dbeafe;
      border: 1px solid #93c5fd;
      color: #1e40af;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .badge-icon {
      font-size: 1rem;
    }

    .square-mode-actions {
      display: flex;
      align-items: center;
      margin-left: 1rem;
    }

    .square-note {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
    }

    .square-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
    }

    .square-link:hover {
      color: #2563eb;
      text-decoration: underline;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
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
      background: #f1f5f9;
      padding: 1rem;
      text-align: left;
      font-weight: 500;
      color: #374151;
      font-size: 1rem;
      border-bottom: 2px solid #e2e8f0;
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

    /* Condition badges: Quality-based (green=best to red=worst) */
    .condition-new { background: #dcfce7; color: #166534; }        /* Green - Perfect */
    .condition-like-new { background: #d1fae5; color: #065f46; }   /* Light green - Excellent */
    .condition-good { background: #fef3c7; color: #92400e; }       /* Yellow - Good */
    .condition-fair { background: #fed7aa; color: #9a3412; }       /* Orange - Fair */
    .condition-poor { background: #fecaca; color: #991b1b; }       /* Red - Poor */

    /* Status badges: Business logic (blue=active, green=success, gray=inactive) */
    .status-available { background: #dbeafe; color: #1d4ed8; }     /* Blue - Active/Available */
    .status-sold { background: #dcfce7; color: #166534; }          /* Green - Success/Completed */
    .status-removed { background: #f3f4f6; color: #6b7280; }       /* Gray - Inactive/Removed */

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

    .consignor-name.clickable {
      color: #2563eb;
      cursor: pointer;
      text-decoration: underline;
      transition: color 0.2s;
    }

    .consignor-name.clickable:hover {
      color: #1d4ed8;
    }

    /* Compact table design styles */
    .inventory-table.compact-design {
      font-size: 0.875rem;
    }

    .inventory-table.compact-design th {
      font-size: 1rem;
      font-weight: 600;
      padding: 0.5rem;
    }

    .inventory-table.compact-design td {
      padding: 0.375rem 0.5rem;
      vertical-align: top;
    }

    /* Row styling */
    .item-row {
      border-bottom: 1px solid #e5e7eb;
    }

    .item-row.even {
      background-color: #f9fafb;
    }

    /* Cell-specific styling */
    .title-sku-cell {
      width: 22%;
    }

    .item-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.125rem;
      line-height: 1.2;
    }

    .item-sku {
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      color: #4b5563;
      font-weight: 600;
    }

    .category-status-cell {
      width: 18%;
    }

    .category {
      margin-bottom: 0.125rem;
      color: #1f2937;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .price-condition-cell {
      width: 15%;
    }

    .consignor-cell {
      width: 15%;
    }

    .actions-cell {
      width: 12%;
      text-align: center;
    }

    .actions-cell th {
      text-align: center;
    }

    .item-price {
      font-weight: 600;
      color: #059669;
      margin-bottom: 0.125rem;
    }

    .condition {
      font-size: 0.75rem;
    }

    .dates-cell {
      width: 18%;
    }

    .received-date {
      margin-bottom: 0.125rem;
      color: #4b5563;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .expires-date {
      font-size: 0.875rem;
      font-weight: 500;
    }


    /* Action buttons horizontal row */
    .compact-design .action-buttons {
      display: flex;
      flex-direction: row;
      gap: 0.25rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .compact-design .btn-icon {
      padding: 0.25rem;
      font-size: 0.8rem;
    }

    .date-cell {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .expiration-cell {
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .expiration-expired {
      color: #dc2626 !important;
      font-weight: 600;
    }

    .expiration-warning {
      color: #ea580c !important;
      font-weight: 600;
    }

    .expiration-normal {
      color: #6b7280;
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

    .header-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .legend-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
      color: #4a5568;
    }

    .legend-toggle:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .legend-icon {
      font-size: 1rem;
    }

    /* Color Guide Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .modal-close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f3f4f6;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: #6b7280;
      transition: all 0.2s;
    }

    .modal-close-btn:hover {
      background: #e5e7eb;
      color: #374151;
    }

    .modal-legend-section {
      margin-bottom: 1.5rem;
    }

    .modal-legend-section:last-child {
      margin-bottom: 0;
    }

    .modal-legend-section h4 {
      margin: 0 0 1rem 0;
      color: #374151;
      font-size: 1rem;
      font-weight: 600;
    }

    .modal-legend-items {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .modal-legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .modal-legend-text {
      font-size: 0.875rem;
      color: #6b7280;
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

      .header-controls {
        flex-direction: column;
        align-items: stretch;
      }

      .legend-items {
        grid-template-columns: 1fr;
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
  private http = inject(HttpClient);
  private loadingService = inject(LoadingService);
  private squareService = inject(SquareIntegrationService);

  // State signals
  itemsResult = signal<PagedResult<ItemListDto> | null>(null);
  categories = signal<ItemCategoryDto[]>([]);
  error = signal<string | null>(null);
  isBulkImportModalOpen = signal(false);
  isColorGuideModalOpen = signal(false);
  isLoading = signal(false);

  isInventoryLoading(): boolean {
    return this.loadingService.isLoading('inventory-list');
  }

  // Filter state
  searchQuery = '';
  selectedStatus = '';
  selectedCondition = '';
  selectedCategory = '';
  selectedExpiration = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  sortBy = 'sku';
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

  // Check if Square inventory mode is active
  isSquareInventoryMode = computed(() => {
    const settings = this.squareService.getSquareUsageSettings();
    return settings.inventoryChoice === 'square';
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
    if (this.selectedExpiration) params.expiration = this.selectedExpiration;
    if (this.priceMin !== null) params.priceMin = this.priceMin;
    if (this.priceMax !== null) params.priceMax = this.priceMax;

    // The InventoryService will automatically detect whether to use Square or CG native inventory
    this.inventoryService.getItems(params).subscribe({
      next: (result) => {
        this.itemsResult.set(result);
      },
      error: (err) => {
        if (this.isSquareInventoryMode()) {
          this.error.set('Failed to load Square inventory items. Please ensure you are connected to Square and try again.');
        } else {
          this.error.set('Failed to load inventory items. Please try again.');
        }
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
    this.selectedExpiration = '';
    this.priceMin = null;
    this.priceMax = null;
    this.sortBy = 'sku';
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

  manageCategories() {
    this.router.navigate(['/owner/inventory/categories']);
  }

  openBulkImport() {
    this.isBulkImportModalOpen.set(true);
  }

  closeBulkImportModal() {
    this.isBulkImportModalOpen.set(false);
  }

  openColorGuideModal() {
    this.isColorGuideModalOpen.set(true);
  }

  closeColorGuideModal() {
    this.isColorGuideModalOpen.set(false);
  }

  onItemsImported(items: ImportedItem[]) {
    if (items && items.length > 0) {
      this.loadItems(); // Refresh inventory list
    }
    this.closeBulkImportModal();
  }

  viewItem(id: string) {
    this.router.navigate(['/owner/inventory', id]);
  }

  editItem(id: string) {
    this.router.navigate(['/owner/inventory', id, 'edit']);
  }

  viewConsignor(consignorId?: string) {
    if (consignorId) {
      this.router.navigate(['/owner/consignors', consignorId]);
    }
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
    // Insert dash between camelCase words, then lowercase
    // e.g., "LikeNew" -> "Like-New" -> "like-new" -> "condition-like-new"
    return `condition-${condition.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
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

  getExpirationDisplayText(expirationDate?: Date): string {
    if (!expirationDate) {
      return '—';
    }

    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return '🔴 EXPIRED';
    }

    if (daysUntil <= 7) {
      return `⚠️ ${expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    return expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getExpirationStatusClass(expirationDate?: Date): string {
    if (!expirationDate) {
      return '';
    }

    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntil = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return 'expiration-expired';
    }

    if (daysUntil <= 7) {
      return 'expiration-warning';
    }

    return 'expiration-normal';
  }

  manageSquareSettings() {
    this.router.navigate(['/owner/settings/integrations/inventory']);
  }

  async refreshInventory() {
    if (this.isSquareInventoryMode()) {
      // Refresh Square inventory
      this.isLoading.set(true);
      try {
        await this.http.post(`${environment.apiUrl}/api/owner/integrations/square/inventory/sync`, {}).toPromise();
        // Reload the inventory list after sync
        this.loadItems();
      } catch (error) {
        console.error('Failed to refresh Square inventory:', error);
        this.error.set('Failed to refresh Square inventory. Please try again.');
      } finally {
        this.isLoading.set(false);
      }
    } else {
      // Just reload CG native inventory
      this.loadItems();
    }
  }
}