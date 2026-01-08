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
import { ConsignorService } from '../../services/consignor.service';
import { Consignor } from '../../models/consignor.model';
import {
  ItemListDto,
  ItemQueryParams,
  PagedResult,
  ItemCondition,
  ItemStatus,
  ItemCategoryDto,
  UpdateItemStatusRequest,
  PendingSquareImportDto
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
  private consignorService = inject(ConsignorService);
  private destroyRef = inject(DestroyRef);

  // State signals
  itemsResult = signal<PagedResult<ItemListDto> | null>(null);
  pendingImportsResult = signal<PagedResult<PendingSquareImportDto> | null>(null);
  categories = signal<ItemCategoryDto[]>([]);
  consignors = signal<Consignor[]>([]);
  error = signal<string | null>(null);
  isBulkImportModalOpen = signal(false);
  isColorGuideModalOpen = signal(false);
  isLoading = signal(false);

  isInventoryLoading(): boolean {
    return this.loadingService.isLoading('inventory-list');
  }

  // View mode state
  viewMode = signal<'regular' | 'pending'>('regular');

  // Selection state for pending imports
  selectedPendingImports = signal<Set<string>>(new Set());
  allPendingSelected = signal(false);

  // Bulk assign state
  selectedConsignorId = signal<string>('');

  // Individual assign state
  assignmentDropdownOpen = signal<string | null>(null);
  individualConsignorSelections = signal<Map<string, string>>(new Map());

  // Filter state
  searchQuery = '';
  selectedStatus = '';
  selectedCondition = '';
  selectedCategory = '';
  selectedExpiration = '';
  selectedConsignor = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  sortBy = 'sku';
  sortDirection = 'desc';
  currentPage = signal(1);
  pageSize = 25;


  // Computed values
  visiblePages = computed(() => {
    const result = this.viewMode() === 'pending' ? this.pendingImportsResult() : this.itemsResult();
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
    this.loadConsignors();
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

  private loadConsignors() {
    this.consignorService.getConsignors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (consignors) => {
          this.consignors.set(consignors);
        },
        error: (err) => console.error('Failed to load consignors:', err)
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
    if (this.selectedConsignor) params.consignorId = this.selectedConsignor;
    if (this.priceMin !== null) params.priceMin = this.priceMin;
    if (this.priceMax !== null) params.priceMax = this.priceMax;

    if (this.viewMode() === 'pending') {
      // Load pending Square imports
      this.inventoryService.getPendingSquareImports(params)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result) => {
            console.log('Pending imports result:', result);
            console.log('First pending item:', result.items[0]);
            if (result.items[0]) {
              console.log('First pendingImportId:', result.items[0].pendingImportId);
            }
            this.pendingImportsResult.set(result);
            this.itemsResult.set(null); // Clear regular items
          },
          error: (err) => {
            this.error.set('Failed to load Square pending imports. Please ensure you are connected to Square and try again.');
            console.error('Error loading Square pending imports:', err);
          },
          complete: () => {
            this.loadingService.stop('inventory-list');
          }
        });
    } else {
      // Load regular ConsignmentGenie inventory
      this.inventoryService.getItems(params)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result) => {
            this.itemsResult.set(result);
            this.pendingImportsResult.set(null); // Clear pending imports
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
    this.selectedConsignor = '';
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
    return this.viewMode() === 'pending' ? this.pendingImportsResult() : this.itemsResult();
  }

  switchViewMode(mode: 'regular' | 'pending') {
    this.viewMode.set(mode);
    this.currentPage.set(1); // Reset to page 1 when switching views
    this.clearSelection(); // Clear selection when switching views
    this.loadItems();
  }

  // Selection methods for pending imports
  clearSelection() {
    this.selectedPendingImports.set(new Set());
    this.allPendingSelected.set(false);
  }

  toggleSelectAll() {
    const pendingResult = this.pendingImportsResult();
    if (!pendingResult) return;

    if (this.allPendingSelected()) {
      this.selectedPendingImports.set(new Set());
      this.allPendingSelected.set(false);
    } else {
      const allIds = new Set(pendingResult.items.map(item => item.pendingImportId));
      this.selectedPendingImports.set(allIds);
      this.allPendingSelected.set(true);
    }
  }

  toggleSelectItem(pendingImportId: string) {
    const selected = new Set(this.selectedPendingImports());
    if (selected.has(pendingImportId)) {
      selected.delete(pendingImportId);
    } else {
      selected.add(pendingImportId);
    }
    this.selectedPendingImports.set(selected);

    // Update select all state
    const pendingResult = this.pendingImportsResult();
    if (pendingResult) {
      const allSelected = pendingResult.items.every(item => selected.has(item.pendingImportId));
      this.allPendingSelected.set(allSelected);
    }
  }

  isSelected(pendingImportId: string): boolean {
    return this.selectedPendingImports().has(pendingImportId);
  }

  async bulkAssignConsignor() {
    const selectedIds = Array.from(this.selectedPendingImports());
    const consignorId = this.selectedConsignorId();

    if (selectedIds.length === 0) {
      this.error.set('Please select at least one item to assign.');
      return;
    }

    if (!consignorId) {
      this.error.set('Please select a consignor to assign items to.');
      return;
    }

    this.isLoading.set(true);
    try {
      const request = { pendingImportIds: selectedIds, consignorId };
      await firstValueFrom(this.inventoryService.bulkAssignConsignorToPendingImports(request));

      // Clear selection and reload data
      this.clearSelection();
      this.selectedConsignorId.set('');
      this.loadItems();

      // Show success message (you can add a toast service here)
      console.log(`Successfully assigned ${selectedIds.length} items to consignor`);
    } catch (error) {
      console.error('Failed to bulk assign consignor:', error);
      this.error.set('Failed to assign items to consignor. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async assignIndividualConsignor(pendingImportId: string, consignorId: string) {
    if (!consignorId) {
      this.error.set('Please select a consignor to assign this item to.');
      return;
    }

    this.isLoading.set(true);
    try {
      await firstValueFrom(this.inventoryService.assignConsignorToPendingImport(pendingImportId, consignorId));

      // Close dropdown and clear selection for this row
      this.assignmentDropdownOpen.set(null);
      const selections = new Map(this.individualConsignorSelections());
      selections.delete(pendingImportId);
      this.individualConsignorSelections.set(selections);

      // Reload data to show updated status
      this.loadItems();

      console.log('Successfully assigned item to consignor');
    } catch (error) {
      console.error('Failed to assign consignor to item:', error);
      this.error.set('Failed to assign item to consignor. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleAssignmentDropdown(pendingImportId: string) {
    console.log('toggleAssignmentDropdown called with pendingImportId:', pendingImportId);
    console.log('Current assignmentDropdownOpen:', this.assignmentDropdownOpen());

    if (this.assignmentDropdownOpen() === pendingImportId) {
      // Close dropdown and clear selection for this row
      console.log('Closing dropdown for pendingImportId:', pendingImportId);
      this.assignmentDropdownOpen.set(null);
      const selections = new Map(this.individualConsignorSelections());
      selections.delete(pendingImportId);
      this.individualConsignorSelections.set(selections);
    } else {
      // Open dropdown for this row
      console.log('Opening dropdown for pendingImportId:', pendingImportId);
      this.assignmentDropdownOpen.set(pendingImportId);
    }

    console.log('New assignmentDropdownOpen:', this.assignmentDropdownOpen());
  }

  cancelIndividualAssignment(pendingImportId: string) {
    this.assignmentDropdownOpen.set(null);
    const selections = new Map(this.individualConsignorSelections());
    selections.delete(pendingImportId);
    this.individualConsignorSelections.set(selections);
  }

  confirmIndividualAssignment(pendingImportId: string) {
    const consignorId = this.individualConsignorSelections().get(pendingImportId);
    if (consignorId) {
      this.assignIndividualConsignor(pendingImportId, consignorId);
    }
  }

  updateIndividualConsignorSelection(pendingImportId: string, consignorId: string) {
    const selections = new Map(this.individualConsignorSelections());
    if (consignorId) {
      selections.set(pendingImportId, consignorId);
    } else {
      selections.delete(pendingImportId);
    }
    this.individualConsignorSelections.set(selections);
  }

  getIndividualConsignorSelection(pendingImportId: string): string {
    return this.individualConsignorSelections().get(pendingImportId) || '';
  }

  onConsignorSelectionChange(pendingImportId: string, event: Event) {
    const target = event.target as HTMLSelectElement;
    this.updateIndividualConsignorSelection(pendingImportId, target.value);
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

  refreshInventory() {
    if (this.isSquareInventoryMode()) {
      // Refresh Square inventory via service
      this.isLoading.set(true);
      this.squareService.performFullSync()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            // Reload the inventory list after sync
            this.loadItems();
          },
          error: (error) => {
            console.error('Failed to refresh Square inventory:', error);
            this.error.set('Failed to refresh Square inventory. Please try again.');
          },
          complete: () => {
            this.isLoading.set(false);
          }
        });
    } else {
      // Just reload CG native inventory
      this.loadItems();
    }
  }
}