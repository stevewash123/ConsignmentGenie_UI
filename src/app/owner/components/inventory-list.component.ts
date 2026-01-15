import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { OwnerLayoutComponent } from './owner-layout.component';
import { InventoryService } from '../../services/inventory.service';
import { LoadingService } from '../../shared/services/loading.service';
import { SquareIntegrationService } from '../../services/square-integration.service';
import { ConfirmationDialogService } from '../../shared/services/confirmation-dialog.service';
import { ConsignorService } from '../../services/consignor.service';
import { OwnerService } from '../../services/owner.service';
import { Consignor } from '../../models/consignor.model';
import {
  ItemListDto,
  ItemQueryParams,
  ItemCondition,
  ItemStatus,
  ItemCategoryDto,
  UpdateItemStatusRequest,
  PendingSquareImportDto
} from '../../models/inventory.model';
import { PagedResult } from '../../shared/models/api.models';

// Define interface for imported CSV data structure (used by bulk import modal)
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
  imports: [CommonModule, FormsModule, OwnerLayoutComponent],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loadingService = inject(LoadingService);
  private squareService = inject(SquareIntegrationService);
  private confirmationService = inject(ConfirmationDialogService);
  private consignorService = inject(ConsignorService);
  private ownerService = inject(OwnerService);
  private destroyRef = inject(DestroyRef);

  // State signals
  itemsResult = signal<PagedResult<ItemListDto> | null>(null);
  pendingImportsResult = signal<PagedResult<PendingSquareImportDto> | null>(null);
  categories = signal<ItemCategoryDto[]>([]);
  consignors = signal<Consignor[]>([]);
  error = signal<string | null>(null);
  isColorGuideModalOpen = signal(false);
  isLoading = signal(false);

  isInventoryLoading(): boolean {
    return this.loadingService.isLoading('inventory-list');
  }

  // View mode state
  viewMode = signal<'regular' | 'pending'>('regular');
  manifestIdToLoad = signal<string | null>(null);
  manifestConsignorData = signal<any>(null); // Store manifest consignor data for auto-selection

  // Selection state for pending imports (used for bulk assign)
  selectedPendingImports = signal<Set<string>>(new Set());
  allPendingSelected = signal(false);

  // Verification state for pending imports (for item verification checkboxes)
  verifiedPendingImports = signal<Set<string>>(new Set());
  allPendingVerified = signal(false);

  // Bulk assign state
  selectedConsignorId = signal<string>('');

  // Individual assign state
  assignmentDropdownOpen = signal<string | null>(null);
  individualConsignorSelections = signal<Map<string, string>>(new Map());

  // Track consignor assignments for each pending import item
  assignedConsignors = signal<Map<string, string>>(new Map()); // Maps pendingImportId to consignorId

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

    // Check for manifest query parameters FIRST, then load items
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['openBulkImport'] === 'true' && params['manifestId']) {
        console.log('🧭 Switching to pending imports view for manifestId:', params['manifestId']);
        this.viewMode.set('pending');
        this.manifestIdToLoad.set(params['manifestId']);
        this.loadItems(); // This will load the manifest items in pending view
      } else {
        // Only load regular items if we're not handling manifest parameters
        this.loadItems();
      }
    });
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
          // After consignors load, try to auto-select from manifest data if we have it
          this.tryAutoSelectConsignorFromManifest();
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
      const manifestId = this.manifestIdToLoad();

      if (manifestId) {
        // Load manifest items for pending import
        console.log('🧭 Loading manifest items for pending import:', manifestId);
        this.loadManifestAsPendingImports(manifestId);
      } else {
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
      }
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

  private tryAutoSelectConsignorFromManifest() {
    const manifestConsignor = this.manifestConsignorData();
    if (!manifestConsignor || this.consignors().length === 0) {
      return; // No manifest data or consignors not loaded yet
    }

    // Try to match by consignor ID first (most reliable)
    const consignorId = manifestConsignor.id;
    if (consignorId) {
      const matchingConsignor = this.consignors().find(c => c.id === consignorId);
      if (matchingConsignor) {
        this.selectedConsignorId.set(matchingConsignor.id);
        console.log('🎯 Auto-selected consignor for bulk assignment by ID (deferred):', matchingConsignor.name);
        return;
      }
    }

    // Fallback to matching by name if no ID match
    const consignorName = `${manifestConsignor.firstName || ''} ${manifestConsignor.lastName || ''}`.trim();
    if (consignorName) {
      const matchingConsignor = this.consignors().find(c =>
        c.name.toLowerCase() === consignorName.toLowerCase()
      );
      if (matchingConsignor) {
        this.selectedConsignorId.set(matchingConsignor.id);
        console.log('🎯 Auto-selected consignor for bulk assignment by name (deferred):', matchingConsignor.name);
      }
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
    this.manifestIdToLoad.set(null); // Clear any manifest ID when switching views
    this.manifestConsignorData.set(null); // Clear manifest consignor data when switching views
    this.loadItems();
  }

  // Selection methods for pending imports (used for bulk assign and verification)
  clearSelection() {
    this.selectedPendingImports.set(new Set());
    this.allPendingSelected.set(false);
    this.verifiedPendingImports.set(new Set());
    this.allPendingVerified.set(false);
    this.assignedConsignors.set(new Map());
  }

  toggleSelectAll() {
    const pendingResult = this.pendingImportsResult();
    if (!pendingResult) return;

    if (this.allPendingSelected()) {
      // Deselect all
      this.selectedPendingImports.set(new Set());
      this.allPendingSelected.set(false);
    } else {
      // Select all items that don't have consignors assigned
      const selectableIds = new Set(
        pendingResult.items
          .filter((item: any) => !this.getAssignedConsignorName(item.pendingImportId))
          .map((item: any) => item.pendingImportId as string)
      );
      this.selectedPendingImports.set(selectableIds);
      this.allPendingSelected.set(selectableIds.size > 0);
    }
  }

  toggleSelectItem(pendingImportId: string) {
    // Don't allow selection if item already has a consignor assigned
    if (this.getAssignedConsignorName(pendingImportId)) {
      return;
    }

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
      const selectableItems = pendingResult.items.filter((item: any) => !this.getAssignedConsignorName(item.pendingImportId));
      const allSelectableSelected = selectableItems.length > 0 && selectableItems.every(item => selected.has(item.pendingImportId));
      this.allPendingSelected.set(allSelectableSelected);
    }
  }

  isSelected(pendingImportId: string): boolean {
    return this.selectedPendingImports().has(pendingImportId);
  }

  // New verification methods for the updated UI
  isVerified(itemId: string): boolean {
    return this.verifiedPendingImports().has(itemId);
  }

  toggleAllVerification(event: any) {
    const pendingResult = this.pendingImportsResult();
    if (!pendingResult) return;

    const verified = new Set(this.verifiedPendingImports());

    if (event.target.checked) {
      // Check all items
      pendingResult.items.forEach((item: any) => {
        verified.add(item.pendingImportId);
      });
    } else {
      // Uncheck all items
      verified.clear();
    }

    this.verifiedPendingImports.set(verified);
    this.allPendingVerified.set(event.target.checked);
  }

  toggleItemVerification(itemId: string, event: any) {
    const verified = new Set(this.verifiedPendingImports());
    if (event.target.checked) {
      verified.add(itemId);
    } else {
      verified.delete(itemId);
    }
    this.verifiedPendingImports.set(verified);

    // Update all verified state
    const allItems = this.pendingImportsResult()?.items || [];
    this.allPendingVerified.set(allItems.every(item => verified.has(item.pendingImportId)));
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

  async submitVerifiedItems() {
    const verifiedIds = Array.from(this.verifiedPendingImports());

    if (verifiedIds.length === 0) {
      this.error.set('Please verify at least one item before submitting.');
      return;
    }

    // Check that all verified items have consignors assigned
    const pendingResult = this.pendingImportsResult();
    if (!pendingResult) return;

    const itemsWithoutConsignors = verifiedIds.filter(id => {
      const item = pendingResult.items.find(i => i.pendingImportId === id);
      return !item?.consignorNumber && !item?.consignorId;
    });

    if (itemsWithoutConsignors.length > 0) {
      this.error.set('All verified items must have consignors assigned before submitting. Please assign consignors to all verified items.');
      return;
    }

    this.isLoading.set(true);
    try {
      // Submit only the verified items for import
      const request = { pendingImportIds: verifiedIds };
      await firstValueFrom(this.inventoryService.importPendingItems(request));

      // Clear selections and reload data
      this.clearSelection();
      this.verifiedPendingImports.set(new Set());
      this.loadItems();

      // Show success message
      console.log(`Successfully imported ${verifiedIds.length} verified items`);
      // TODO: Add toast notification here
    } catch (error) {
      console.error('Failed to submit verified items:', error);
      this.error.set('Failed to import verified items. Please try again.');
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


  createNewItem() {
    this.router.navigate(['/owner/inventory/new']);
  }

  manageCategories() {
    this.router.navigate(['/owner/inventory/categories']);
  }

  loadManifestAsPendingImports(manifestId: string) {
    // Fetch manifest data from API and convert to pending imports format
    this.loadingService.start('inventory-list');
    this.ownerService.getDropoffRequestDetail(manifestId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (manifest) => {
        console.log('🔍 Raw manifest data received:', manifest);
        console.log('🔍 Manifest consignor:', manifest.consignor);

        // Store manifest consignor data for auto-selection
        if (manifest.consignor) {
          this.manifestConsignorData.set(manifest.consignor);
        }

        // Extract consignor info from manifest structure
        const consignorNumber = manifest.consignor?.consignorNumber || '';
        const consignorName = manifest.consignor ?
          `${manifest.consignor.firstName} ${manifest.consignor.lastName}`.trim() : '';

        // Convert manifest items to PendingSquareImportDto format for pending imports table
        const pendingItems = manifest.items?.map((item: any, index: number) => ({
          pendingImportId: `manifest-${manifestId}-${index}`,
          name: item.name, // Use 'name' to match template expectation
          description: item.notes || '',
          price: item.suggestedPrice || 0,
          sku: '', // SKU will be generated during import
          consignorNumber: consignorNumber,
          consignorName: consignorName,
          category: item.category || '',
          condition: 'Good', // Default condition
          importedAt: manifest.plannedDate || new Date().toISOString(),
          location: '',
          notes: item.notes || '',
          // Add manifest-specific fields
          isManifestItem: true,
          manifestId: manifestId
        })) || [];

        // Create a PagedResult structure for the pending imports
        const pagedResult: PagedResult<PendingSquareImportDto> = {
          items: pendingItems,
          totalCount: pendingItems.length,
          page: 1,
          pageSize: pendingItems.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          organizationId: '' // Will be set by the API if needed
        };

        this.pendingImportsResult.set(pagedResult);
        this.itemsResult.set(null); // Clear regular items

        // Try to auto-select consignor (this handles both immediate and deferred selection)
        this.tryAutoSelectConsignorFromManifest();

        // Auto-assign the manifest consignor to all manifest items
        if (manifest.consignor?.id) {
          const assignments = new Map(this.assignedConsignors());
          pendingItems.forEach(item => {
            assignments.set(item.pendingImportId, manifest.consignor.id);
          });
          this.assignedConsignors.set(assignments);
          console.log('📋 Auto-assigned consignor to', pendingItems.length, 'manifest items');
        }

        console.log('📦 Manifest loaded as pending imports:', {
          manifestId,
          consignorNumber: consignorNumber,
          consignorName: consignorName,
          itemCount: pendingItems.length,
          sampleItem: pendingItems[0] // Show first item structure for debugging
        });

      },
      error: (error) => {
        console.error('Error loading manifest for pending imports:', error);
        this.error.set('Failed to load manifest data. Please try again.');
        this.pendingImportsResult.set(null);
      },
      complete: () => {
        this.loadingService.stop('inventory-list');
      }
    });
  }

  openBulkImportWithManifest(manifestId: string) {
    // Legacy method - now redirects to pending imports view
    this.viewMode.set('pending');
    this.manifestIdToLoad.set(manifestId);
    this.loadItems();
  }

  openColorGuideModal() {
    this.isColorGuideModalOpen.set(true);
  }

  closeColorGuideModal() {
    this.isColorGuideModalOpen.set(false);
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

  // Individual assignment methods for pending imports
  toggleAssignmentDropdown(pendingImportId: string) {
    if (this.assignmentDropdownOpen() === pendingImportId) {
      this.assignmentDropdownOpen.set(null);
    } else {
      this.assignmentDropdownOpen.set(pendingImportId);
      // Clear any previous selection for this item
      this.individualConsignorSelections.update(map => {
        const newMap = new Map(map);
        newMap.delete(pendingImportId);
        return newMap;
      });
    }
  }

  onConsignorSelectionChange(pendingImportId: string, event: Event) {
    const target = event.target as HTMLSelectElement;
    const consignorId = target.value;

    this.individualConsignorSelections.update(map => {
      const newMap = new Map(map);
      if (consignorId) {
        newMap.set(pendingImportId, consignorId);
      } else {
        newMap.delete(pendingImportId);
      }
      return newMap;
    });
  }

  getIndividualConsignorSelection(pendingImportId: string): string {
    return this.individualConsignorSelections().get(pendingImportId) || '';
  }

  async confirmIndividualAssignment(pendingImportId: string) {
    const consignorId = this.getIndividualConsignorSelection(pendingImportId);
    if (!consignorId) {
      this.error.set('Please select a consignor before confirming assignment.');
      return;
    }

    this.isLoading.set(true);
    try {
      const request = { pendingImportIds: [pendingImportId], consignorId };
      await firstValueFrom(this.inventoryService.bulkAssignConsignorToPendingImports(request));

      // Update the local state to show the assignment
      this.assignedConsignors.update(map => {
        const newMap = new Map(map);
        newMap.set(pendingImportId, consignorId);
        return newMap;
      });

      // Close the dropdown
      this.assignmentDropdownOpen.set(null);

      // Clear the individual selection
      this.individualConsignorSelections.update(map => {
        const newMap = new Map(map);
        newMap.delete(pendingImportId);
        return newMap;
      });

      // Reload data to get updated consignor names
      this.loadItems();

      console.log(`Successfully assigned item to consignor`);
    } catch (error) {
      console.error('Failed to assign item to consignor:', error);
      this.error.set('Failed to assign item to consignor. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  cancelIndividualAssignment(pendingImportId: string) {
    this.assignmentDropdownOpen.set(null);
    this.individualConsignorSelections.update(map => {
      const newMap = new Map(map);
      newMap.delete(pendingImportId);
      return newMap;
    });
  }

  getAssignedConsignorName(pendingImportId: string): string | null {
    // First check if we have a local assignment
    const localConsignorId = this.assignedConsignors().get(pendingImportId);
    if (localConsignorId) {
      const consignor = this.consignors().find(c => c.id === localConsignorId);
      if (consignor) return `${consignor.name} (${consignor.consignorNumber})`;
    }

    // Check the pending imports result for existing assignments
    const pendingResult = this.pendingImportsResult();
    if (pendingResult) {
      const item = pendingResult.items.find(i => i.pendingImportId === pendingImportId);
      if (item && item.consignorName) {
        return `${item.consignorName} (${item.consignorNumber || 'N/A'})`;
      }
    }

    return null;
  }

  async deletePendingItem(pendingImportId: string) {
    const confirmed = await firstValueFrom(this.confirmationService.confirm({
      title: 'Delete Pending Import',
      message: 'Are you sure you want to delete this pending import item? This action cannot be undone.',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      isDestructive: true
    }));

    if (!confirmed.confirmed) return;

    this.isLoading.set(true);
    try {
      await firstValueFrom(this.inventoryService.deletePendingImport(pendingImportId));

      // Remove from local state
      this.selectedPendingImports.update(set => {
        const newSet = new Set(set);
        newSet.delete(pendingImportId);
        return newSet;
      });

      this.verifiedPendingImports.update(set => {
        const newSet = new Set(set);
        newSet.delete(pendingImportId);
        return newSet;
      });

      this.assignedConsignors.update(map => {
        const newMap = new Map(map);
        newMap.delete(pendingImportId);
        return newMap;
      });

      // Reload the items to reflect the deletion
      this.loadItems();

      console.log('Successfully deleted pending import item');
    } catch (error) {
      console.error('Failed to delete pending import item:', error);
      this.error.set('Failed to delete item. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}