import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { OwnerLayoutComponent } from './owner-layout.component';
import { BulkImportModalComponent } from './bulk-import-modal.component';
import { InventoryService } from '../../services/inventory.service';
import { LoadingService } from '../../shared/services/loading.service';
import { SquareIntegrationService } from '../../services/square-integration.service';
import { ConfirmationDialogService } from '../../shared/services/confirmation-dialog.service';
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
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);
  private squareService = inject(SquareIntegrationService);
  private confirmationService = inject(ConfirmationDialogService);
  private destroyRef = inject(DestroyRef);

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
    this.inventoryService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    this.inventoryService.getItems(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    this.confirmationService.confirm({
      title: 'Remove Item',
      message: `Mark "${item.title}" as removed?`,
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel'
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(result => {
      if (!result.confirmed) return;

      const request: UpdateItemStatusRequest = {
        status: 'Removed',
        reason: 'Marked as removed from inventory list'
      };

      this.inventoryService.updateItemStatus(item.itemId, request)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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
    });
  }

  deleteItem(item: ItemListDto) {
    this.confirmationService.confirm({
      title: 'Delete Item',
      message: `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      isDestructive: true
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(result => {
      if (!result.confirmed) return;

      this.inventoryService.deleteItem(item.itemId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
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
    });
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
    const daysUntil = this.getDaysUntilExpiration(expDate);

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

    const expDate = new Date(expirationDate);
    const daysUntil = this.getDaysUntilExpiration(expDate);

    if (daysUntil < 0) {
      return 'expiration-expired';
    }

    if (daysUntil <= 7) {
      return 'expiration-warning';
    }

    return 'expiration-normal';
  }

  private getDaysUntilExpiration(date: Date): number {
    const today = new Date();
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  manageSquareSettings() {
    this.router.navigate(['/owner/settings/integrations/inventory']);
  }

  async refreshInventory() {
    if (this.isSquareInventoryMode()) {
      // Refresh Square inventory via service
      this.isLoading.set(true);
      try {
        await this.squareService.syncNow();
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