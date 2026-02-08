import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ColumnFilterComponent, FilterOption } from '../../shared/components/column-filter.component';
import { InventoryService } from '../../services/inventory.service';
import { LoadingService } from '../../shared/services/loading.service';
import { SquareIntegrationService } from '../../services/square-integration.service';
import { ConfirmationDialogService } from '../../shared/services/confirmation-dialog.service';
import { ConsignorService } from '../../services/consignor.service';
import { OwnerService } from '../../services/owner.service';
import { RecordSaleService, SaleRequest } from '../../services/record-sale.service';
import { Consignor } from '../../models/consignor.model';
import {
  ItemListDto,
  ItemQueryParams,
  ItemCondition,
  ItemStatus,
  ItemCategoryDto,
  UpdateItemStatusRequest,
  PendingImportItemDto
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

// Define interface for tracking pending import edits
export interface PendingImportEdits {
  price?: number;
  category?: string;
  condition?: string;
  isDirty: boolean;
}

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ColumnFilterComponent],
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
  private recordSaleService = inject(RecordSaleService);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  // State signals
  itemsResult = signal<PagedResult<ItemListDto> | null>(null);
  pendingImportsResult = signal<PagedResult<PendingImportItemDto> | null>(null);
  categories = signal<ItemCategoryDto[]>([]);
  consignors = signal<Consignor[]>([]);
  error = signal<string | null>(null);
  isColorGuideModalOpen = signal(false);
  isBulkImportModalOpen = signal(false);
  isBulkAssignModalOpen = signal(false);
  isLoading = signal(false);

  // Quick Sell modal signals
  isQuickSellModalOpen = signal(false);
  quickSellItem = signal<ItemListDto | null>(null);
  quickSellPaymentType = signal<string>('Cash');
  quickSellCustomerEmail = signal<string>('');
  isCompletingQuickSale = signal(false);

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
  markAsVerified = signal<boolean>(true);  // Default to true as requested
  assignAnother = signal<boolean>(false);  // Default to false as requested
  selectedManifestId = signal<string>('');  // Filter by manifest for pending imports

  // Computed property to show active filters
  activeFilters = computed(() => {
    const filters = [];
    if (this.selectedManifestId()) {
      filters.push({ type: 'manifest', label: `Manifest: ${this.selectedManifestId().substring(0, 8)}...`, value: this.selectedManifestId() });
    }
    return filters;
  });

  // Individual assign state
  assignmentDropdownOpen = signal<string | null>(null);
  individualConsignorSelections = signal<Map<string, string>>(new Map());

  // Track consignor assignments for each pending import item
  assignedConsignors = signal<Map<string, string>>(new Map()); // Maps id to consignorId

  // Filter state
  searchQuery = '';
  selectedStatus = '';
  selectedCondition = '';
  selectedCategory = '';
  selectedExpiration = '';
  selectedConsignor = '';
  selectedSource = '';  // Add this property for source filtering
  priceMin: number | null = null;
  priceMax: number | null = null;
  sortBy = 'sku';
  sortDirection = 'desc';
  currentPage = signal(1);
  pageSize = 25;

  // Filter modal state - signals for the actual filtering UI
  showAddModal = signal(false);
  showEditModal = signal(false);
  showViewModal = signal(false);
  selectedItem = signal<ItemListDto | null>(null);

  // Form data for item add/edit modal
  itemForm = {
    name: '',
    description: '',
    salePrice: 0,
    consignorSplit: 50,
    consignorId: '',
    category: ''
  };

  // For search term on filter UI
  searchTerm = '';

  // Pending item assignment/removal modal state
  itemToAssign = signal<ItemListDto | null>(null);
  itemToRemove = signal<ItemListDto | null>(null);
  selectedConsignorForAssignment = '';
  assignmentNotes = '';
  removalNotes = '';

  // Inline editing state for pending imports
  editedValues = signal<Map<string, PendingImportEdits>>(new Map());

  // Additional methods needed by templates
  // Note: This returns union type - use inventoryItems() for type-safe ItemListDto access
  items = computed(() => {
    return this.viewMode() === 'pending' ?
      this.pendingImportsResult()?.items || [] :
      this.itemsResult()?.items || [];
  });

  // Type-safe accessor for regular inventory items only
  inventoryItems = computed((): ItemListDto[] => {
    return this.itemsResult()?.items || [];
  });

  totalItems = computed(() => {
    return this.viewMode() === 'pending' ?
      this.pendingImportsResult()?.totalCount || 0 :
      this.itemsResult()?.totalCount || 0;
  });

  totalPages = computed(() => {
    return this.viewMode() === 'pending' ?
      this.pendingImportsResult()?.totalPages || 1 :
      this.itemsResult()?.totalPages || 1;
  });

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
      if (params['view'] === 'pending' && params['manifestId']) {
        console.log('🧭 Switching to pending imports view for manifestId:', params['manifestId']);
        console.log('✅ Pending imports should already exist (created by notification center)');
        this.viewMode.set('pending');
        this.manifestIdToLoad.set(params['manifestId']);
        this.selectedManifestId.set(params['manifestId']); // Apply the manifest filter
        this.loadItems(); // Load the already-created pending imports
      } else {
        // First load regular inventory to check if it's empty
        this.checkInventoryAndSetDefaultView();
      }
    });
  }

  private checkInventoryAndSetDefaultView() {
    this.loadingService.start('inventory-list');

    // Load regular inventory first to check if it's empty
    const params: ItemQueryParams = {
      page: 1,
      pageSize: 1, // Just check if any items exist
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.inventoryService.getItems(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (result.totalCount === 0) {
            // No regular inventory - check if there are pending imports
            this.inventoryService.getPendingSquareImports(params)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (pendingResult) => {
                  if (pendingResult.totalCount > 0) {
                    console.log('🔀 No regular inventory found, but pending imports exist. Showing pending imports tab by default.');
                    this.viewMode.set('pending');
                  }
                  this.loadItems(); // Load the appropriate view
                },
                error: (err) => {
                  console.error('Failed to check pending imports:', err);
                  this.loadItems(); // Fall back to regular inventory
                },
                complete: () => {
                  this.loadingService.stop('inventory-list');
                }
              });
          } else {
            // Regular inventory exists - show regular view
            this.loadItems();
            this.loadingService.stop('inventory-list');
          }
        },
        error: (err) => {
          console.error('Failed to check inventory:', err);
          this.loadItems(); // Fall back to regular inventory
          this.loadingService.stop('inventory-list');
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
    // Dispatcher method - loads appropriate data based on current view mode
    if (this.viewMode() === 'pending') {
      this.loadPendingImports();
    } else {
      this.loadInventoryItems();
    }
  }

  loadPendingImports() {
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
    if (this.selectedManifestId()) params.sourceReference = this.selectedManifestId(); // Filter by manifest
    if (this.priceMin !== null) params.priceMin = this.priceMin;
    if (this.priceMax !== null) params.priceMax = this.priceMax;

    // Load pending imports (including any manifest filter from selectedManifestId signal)
    this.inventoryService.getPendingSquareImports(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          console.log('📦 Pending imports result:', result);
          if (this.selectedManifestId()) {
            console.log('📋 Loaded with manifest filter:', this.selectedManifestId());
          }
          this.pendingImportsResult.set(result);
          this.itemsResult.set(null); // Clear regular items
        },
        error: (err) => {
          this.error.set('Failed to load pending imports. Please try again.');
          console.error('Error loading pending imports:', err);
        },
        complete: () => {
          this.loadingService.stop('inventory-list');
        }
      });
  }

  loadInventoryItems() {
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
    this.selectedSource = '';
    this.priceMin = null;
    this.priceMax = null;
    this.sortBy = 'sku';
    this.sortDirection = 'desc';
    this.applyFilters();
  }

  clearAllFilters() {
    this.clearFilters();
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

  sort(column: string) {
    this.setSorting(column);
  }

  getSortClass(column: string): string {
    if (this.sortBy === column) {
      return `sorted-${this.sortDirection}`;
    }
    return '';
  }

  changePageSize() {
    this.currentPage.set(1);
    this.loadItems();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadItems();
  }

  Math = Math;

  refreshItems() {
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
          .filter((item: any) => !this.getAssignedConsignorName(item.id))
          .map((item: any) => item.id as string)
      );
      this.selectedPendingImports.set(selectableIds);
      this.allPendingSelected.set(selectableIds.size > 0);
    }
  }

  toggleSelectItem(itemId: string) {
    // Don't allow selection if item already has a consignor assigned
    if (this.getAssignedConsignorName(itemId)) {
      return;
    }

    const selected = new Set(this.selectedPendingImports());
    if (selected.has(itemId)) {
      selected.delete(itemId);
    } else {
      selected.add(itemId);
    }
    this.selectedPendingImports.set(selected);

    // Update select all state
    const pendingResult = this.pendingImportsResult();
    if (pendingResult) {
      const selectableItems = pendingResult.items.filter((item: any) => !this.getAssignedConsignorName(item.id));
      const allSelectableSelected = selectableItems.length > 0 && selectableItems.every(item => selected.has(item.id));
      this.allPendingSelected.set(allSelectableSelected);
    }
  }

  isSelected(itemId: string): boolean {
    return this.selectedPendingImports().has(itemId);
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
        verified.add(item.id);
      });
    } else {
      // Uncheck all items
      verified.clear();
    }

    this.verifiedPendingImports.set(verified);
    this.allPendingVerified.set(event.target.checked);
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
      const request = {
        pendingImportIds: selectedIds,
        consignorId,
        markAsVerified: this.markAsVerified()
      };
      await firstValueFrom(this.inventoryService.bulkAssignConsignorToPendingImports(request));

      // If markAsVerified is true, add the assigned items to verified set immediately
      if (this.markAsVerified()) {
        const currentVerified = new Set(this.verifiedPendingImports());
        selectedIds.forEach(id => currentVerified.add(id));
        this.verifiedPendingImports.set(currentVerified);
      }

      // Clear selection and reload data (the backend will set the correct status)
      this.clearSelection();

      // If "assign another" is checked, keep modal open but reset consignor selection
      if (this.assignAnother()) {
        this.selectedConsignorId.set('');
        // Don't close modal, just refresh the data
        this.loadItems();
      } else {
        // Close modal and reset everything
        this.closeBulkAssignModal();
        this.loadItems();
      }

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
      const item = pendingResult.items.find(i => i.id === id);
      return !item?.consignorId;
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

  async assignIndividualConsignor(itemId: string, consignorId: string) {
    if (!consignorId) {
      this.error.set('Please select a consignor to assign this item to.');
      return;
    }

    this.isLoading.set(true);
    try {
      await firstValueFrom(this.inventoryService.assignConsignorToPendingImport(itemId, consignorId));

      // Close dropdown and clear selection for this row
      this.assignmentDropdownOpen.set(null);
      const selections = new Map(this.individualConsignorSelections());
      selections.delete(itemId);
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

  openAddModal() {
    this.showAddModal.set(true);
  }

  closeItemModal() {
    this.showAddModal.set(false);
    this.showEditModal.set(false);
  }

  manageCategories() {
    this.router.navigate(['/owner/inventory/categories']);
  }

  loadManifestAsPendingImports(manifestId: string) {
    // Set the manifest filter and switch to pending imports view
    this.selectedManifestId.set(manifestId);
    this.viewMode.set('pending');

    // Load pending imports with the manifest filter applied
    this.loadItems();
  }

  clearManifestFilter() {
    this.selectedManifestId.set('');
    if (this.viewMode() === 'pending') {
      this.loadItems(); // Reload without filter
    }
  }

  clearFilter(filterType: string) {
    if (filterType === 'manifest') {
      this.clearManifestFilter();
    }
  }

  openBulkImportWithManifest(manifestId: string) {
    // Legacy method - now redirects to pending imports view
    this.viewMode.set('pending');
    this.manifestIdToLoad.set(manifestId);
    this.createPendingImportsFromManifest(manifestId);
  }

  private createPendingImportsFromManifest(manifestId: string) {
    console.log('📦 Creating pending imports from manifest:', manifestId);
    this.isLoading.set(true);
    this.error.set(null);

    this.inventoryService.createFromManifest(manifestId, true) // Auto-assign consignor
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('✅ API handled manifest processing:', response.data?.length, 'items returned');
          // Set the manifest ID filter and load the pending imports
          this.selectedManifestId.set(manifestId);
          this.loadItems();
        },
        error: (err) => {
          console.error('❌ Failed to create pending imports from manifest:', err);
          this.error.set('Failed to import items from manifest. Please try again.');
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
  }

  openColorGuideModal() {
    this.isColorGuideModalOpen.set(true);
  }

  closeColorGuideModal() {
    this.isColorGuideModalOpen.set(false);
  }

  openBulkImport() {
    this.isBulkImportModalOpen.set(true);
  }

  closeBulkImport() {
    this.isBulkImportModalOpen.set(false);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processCsvFile(file);
    }
  }

  private processCsvFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      this.parseCsvAndCreatePendingImports(csvContent, file.name);
    };
    reader.readAsText(file);
  }

  private parseCsvAndCreatePendingImports(csvContent: string, fileName: string) {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        this.error.set('CSV file must contain at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const items: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === headers.length) {
          const item: any = {};
          headers.forEach((header, index) => {
            switch (header) {
              case 'name':
                item.name = values[index];
                break;
              case 'description':
                item.description = values[index];
                break;
              case 'price':
                item.price = parseFloat(values[index]) || 0;
                break;
              case 'sku':
                item.sku = values[index];
                break;
              case 'category':
                item.category = values[index];
                break;
              case 'condition':
                item.condition = values[index];
                break;
              case 'consignornumber':
                item.consignorNumber = values[index];
                break;
              case 'notes':
                item.notes = values[index];
                break;
            }
          });

          if (item.name && item.price > 0) {
            items.push(item);
          }
        }
      }

      if (items.length === 0) {
        this.error.set('No valid items found in CSV file');
        return;
      }

      // Create pending imports via API
      this.createPendingImportsFromCsv(items, fileName);

    } catch (error) {
      this.error.set('Error parsing CSV file: ' + (error as Error).message);
    }
  }

  private createPendingImportsFromCsv(items: any[], fileName: string) {
    this.isLoading.set(true);
    this.error.set(null);

    // Create request matching the API expectations
    const request = {
      fileName: fileName,
      items: items
    };

    // Call the API to create pending imports
    this.inventoryService.createFromCsv(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('✅ CSV import successful:', response);
          this.closeBulkImport();
          this.switchViewMode('pending');
          this.loadPendingImports();
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('❌ CSV import failed:', error);
          this.error.set('Failed to import CSV: ' + (error.error?.message || error.message || 'Unknown error'));
          this.isLoading.set(false);
        }
      });
  }

  viewItem(id: string) {
    this.router.navigate(['/owner/inventory', id]);
  }

  closeViewModal() {
    this.showViewModal.set(false);
    this.selectedItem.set(null);
  }

  editItem(item: ItemListDto) {
    // For now, navigate to edit - you can implement inline edit modal later
    this.router.navigate(['/owner/inventory', item.itemId, 'edit']);
  }

  sellItem(item: ItemListDto) {
    // Open Quick Sell modal for back-office use
    this.quickSellItem.set(item);
    this.quickSellPaymentType.set('Cash');
    this.quickSellCustomerEmail.set('');
    this.isQuickSellModalOpen.set(true);
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

  deleteItem(id: string) {
    // Use inventoryItems() for type-safe access to ItemListDto
    const item = this.inventoryItems().find(i => i.itemId === id);
    if (!item) return;

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
  toggleAssignmentDropdown(itemId: string) {
    if (this.assignmentDropdownOpen() === itemId) {
      this.assignmentDropdownOpen.set(null);
    } else {
      this.assignmentDropdownOpen.set(itemId);
      // Clear any previous selection for this item
      this.individualConsignorSelections.update(map => {
        const newMap = new Map(map);
        newMap.delete(itemId);
        return newMap;
      });
    }
  }

  onConsignorSelectionChange(itemId: string, event: Event) {
    const target = event.target as HTMLSelectElement;
    const consignorId = target.value;

    this.individualConsignorSelections.update(map => {
      const newMap = new Map(map);
      if (consignorId) {
        newMap.set(itemId, consignorId);
      } else {
        newMap.delete(itemId);
      }
      return newMap;
    });
  }

  getIndividualConsignorSelection(itemId: string): string {
    return this.individualConsignorSelections().get(itemId) || '';
  }

  async confirmIndividualAssignment(itemId: string) {
    const consignorId = this.getIndividualConsignorSelection(itemId);
    if (!consignorId) {
      this.error.set('Please select a consignor before confirming assignment.');
      return;
    }

    this.isLoading.set(true);
    try {
      const request = { pendingImportIds: [itemId], consignorId };
      await firstValueFrom(this.inventoryService.bulkAssignConsignorToPendingImports(request));

      // Update the local state to show the assignment
      this.assignedConsignors.update(map => {
        const newMap = new Map(map);
        newMap.set(itemId, consignorId);
        return newMap;
      });

      // Close the dropdown
      this.assignmentDropdownOpen.set(null);

      // Clear the individual selection
      this.individualConsignorSelections.update(map => {
        const newMap = new Map(map);
        newMap.delete(itemId);
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

  cancelIndividualAssignment(itemId: string) {
    this.assignmentDropdownOpen.set(null);
    this.individualConsignorSelections.update(map => {
      const newMap = new Map(map);
      newMap.delete(itemId);
      return newMap;
    });
  }

  getAssignedConsignorName(itemId: string): string | null {
    // First check if we have a local assignment
    const localConsignorId = this.assignedConsignors().get(itemId);
    if (localConsignorId) {
      const consignor = this.consignors().find(c => c.id === localConsignorId);
      if (consignor) return `${consignor.name} (${consignor.consignorNumber})`;
    }

    // Check the pending imports result for existing assignments
    const pendingResult = this.pendingImportsResult();
    if (pendingResult) {
      const item = pendingResult.items.find(i => i.id === itemId);
      if (item && item.consignorName) {
        return `${item.consignorName} (${item.consignorNumber || 'N/A'})`;
      }
    }

    return null;
  }

  async deletePendingItem(itemId: string) {
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
      await firstValueFrom(this.inventoryService.deletePendingImport(itemId));

      // Remove from local state
      this.selectedPendingImports.update(set => {
        const newSet = new Set(set);
        newSet.delete(itemId);
        return newSet;
      });

      this.verifiedPendingImports.update(set => {
        const newSet = new Set(set);
        newSet.delete(itemId);
        return newSet;
      });

      this.assignedConsignors.update(map => {
        const newMap = new Map(map);
        newMap.delete(itemId);
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

  // Helper method for search input handling
  onSearch() {
    this.applyFilters();
  }

  // Helper method for close modal handling
  closeModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeItemModal();
      this.closeViewModal();
    }
  }

  // Helper methods for form validation
  isItemFormValid(): boolean {
    return this.itemForm.name.trim() !== '' &&
           this.itemForm.salePrice > 0 &&
           this.itemForm.category.trim() !== '';
  }

  // Placeholder methods for add/edit functionality
  addItem() {
    if (!this.isItemFormValid()) return;

    // TODO: Implement add item functionality
    console.log('Add item:', this.itemForm);
    this.closeItemModal();
  }

  updateItem() {
    if (!this.isItemFormValid()) return;

    // TODO: Implement update item functionality
    console.log('Update item:', this.itemForm);
    this.closeItemModal();
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';

    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString();
      }
    }

    return new Date(date).toLocaleDateString();
  }

  // Methods for pending modal assignments
  openAssignModal(item: ItemListDto) {
    this.itemToAssign.set(item);
  }

  closeAssignModal() {
    this.itemToAssign.set(null);
    this.selectedConsignorForAssignment = '';
    this.assignmentNotes = '';
  }

  // Bulk assign modal methods
  openBulkAssignModal() {
    this.isBulkAssignModalOpen.set(true);
  }

  closeBulkAssignModal() {
    this.isBulkAssignModalOpen.set(false);
    this.selectedConsignorId.set('');
    this.assignAnother.set(false); // Reset assign another checkbox
  }

  openRemovalModal(item: ItemListDto) {
    this.itemToRemove.set(item);
  }

  closeRemovalModal() {
    this.itemToRemove.set(null);
    this.removalNotes = '';
  }

  assignToConsignor() {
    const item = this.itemToAssign();
    if (!item || !this.selectedConsignorForAssignment) return;

    // TODO: Implement assign to consignor functionality
    console.log('Assign item to consignor:', item.itemId, this.selectedConsignorForAssignment);
    this.closeAssignModal();
  }

  removeFromConsignor() {
    const item = this.itemToRemove();
    if (!item) return;

    // TODO: Implement remove from consignor functionality
    console.log('Remove item from consignor:', item.itemId, this.removalNotes);
    this.closeRemovalModal();
  }

  // Modal state checks
  isAssignModalOpen(): boolean {
    return this.itemToAssign() !== null;
  }

  isRemovalModalOpen(): boolean {
    return this.itemToRemove() !== null;
  }

  // Image preview functionality
  showImagePreview(event: MouseEvent, imageUrl: string) {
    const target = event.target as HTMLElement;
    const preview = document.createElement('div');
    preview.className = 'image-preview-popup';
    preview.innerHTML = `<img src="${imageUrl}" alt="Preview" class="preview-image">`;

    const rect = target.getBoundingClientRect();
    let left = rect.right + 10;
    let top = rect.top;

    // Keep popup within viewport
    if (left + 104 > window.innerWidth) {
      left = rect.left - 114; // 104 + 10 for gap
    }
    if (top + 104 > window.innerHeight) {
      top = window.innerHeight - 114; // 104 + 10 for gap
    }

    preview.style.left = `${left}px`;
    preview.style.top = `${top}px`;

    document.body.appendChild(preview);
    target.setAttribute('data-preview-id', preview.id);
  }

  hideImagePreview() {
    const previews = document.querySelectorAll('.image-preview-popup');
    previews.forEach(preview => preview.remove());
  }

  // ============================================================================
  // Filter Options and Methods
  // ============================================================================

  // Static filter options
  readonly statusOptions: FilterOption[] = [
    { value: 'Available', label: 'Available' },
    { value: 'Sold', label: 'Sold' },
    { value: 'Removed', label: 'Removed' }
  ];

  readonly conditionOptions: FilterOption[] = [
    { value: 'New', label: 'New' },
    { value: 'LikeNew', label: 'Like New' },
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
    { value: 'Poor', label: 'Poor' }
  ];

  readonly expirationOptions: FilterOption[] = [
    { value: 'expiring-soon', label: 'Expiring Soon' },
    { value: 'expired', label: 'Expired' },
    { value: 'this-month', label: 'This Month' },
    { value: 'next-month', label: 'Next Month' }
  ];

  readonly sourceOptions: FilterOption[] = [
    { value: 'CSV', label: 'CSV' },
    { value: 'Square', label: 'Square' },
    { value: 'Manifest', label: 'Manifest' }
  ];

  // Dynamic filter options (computed from data)
  categoryOptions = computed<FilterOption[]>(() => {
    return this.categories().map(cat => ({
      value: cat.name,
      label: cat.name
    }));
  });

  consignorOptions = computed<FilterOption[]>(() => {
    return this.consignors().map(con => ({
      value: con.id,
      label: con.name
    }));
  });

  // Column filter handlers
  onFilterChange(field: string, value: any) {
    switch (field) {
      case 'category':
        this.selectedCategory = value || '';
        break;
      case 'status':
        this.selectedStatus = value || '';
        break;
      case 'condition':
        this.selectedCondition = value || '';
        break;
      case 'consignor':
        this.selectedConsignor = value || '';
        break;
      case 'expiration':
        this.selectedExpiration = value || '';
        break;
      case 'source':
        this.selectedSource = value || '';
        break;
    }
    this.applyFilters();
  }

  onFilterClear(field: string) {
    this.onFilterChange(field, '');
  }

  // Filter handlers for specific filters
  onCategoryFilter(value: string) {
    this.onFilterChange('category', value);
  }

  clearCategoryFilter() {
    this.onFilterClear('category');
  }

  onStatusFilter(value: string) {
    this.onFilterChange('status', value);
  }

  clearStatusFilter() {
    this.onFilterClear('status');
  }

  onConsignorFilter(value: string) {
    this.onFilterChange('consignor', value);
  }

  clearConsignorFilter() {
    this.onFilterClear('consignor');
  }

  // Inline editing methods for pending imports
  getEditedValue(itemId: string, field: 'price' | 'category' | 'condition'): any {
    const edits = this.editedValues().get(itemId);
    return edits?.[field];
  }

  hasUnsavedEdits(itemId: string): boolean {
    return this.editedValues().get(itemId)?.isDirty || false;
  }

  onFieldEdit(itemId: string, field: 'price' | 'category' | 'condition', value: any) {
    this.editedValues.update(map => {
      const newMap = new Map(map);
      const currentEdits = newMap.get(itemId) || { isDirty: false };

      newMap.set(itemId, {
        ...currentEdits,
        [field]: value,
        isDirty: true
      });

      return newMap;
    });
  }

  onPriceEdit(itemId: string, event: any) {
    const value = parseFloat(event.target.value);
    if (!isNaN(value) && value > 0) {
      this.onFieldEdit(itemId, 'price', value);
    }
  }

  onCategoryEdit(itemId: string, event: any) {
    this.onFieldEdit(itemId, 'category', event.target.value);
  }

  onConditionEdit(itemId: string, event: any) {
    this.onFieldEdit(itemId, 'condition', event.target.value);
  }

  getDisplayValue(item: PendingImportItemDto, field: 'price' | 'category' | 'condition'): any {
    const editedValue = this.getEditedValue(item.id, field);
    if (editedValue !== undefined) {
      return editedValue;
    }

    switch (field) {
      case 'price': return item.price;
      case 'category': return item.category || '';
      case 'condition': return item.condition || '';
      default: return '';
    }
  }

  isPriceBelowFloor(item: PendingImportItemDto): boolean {
    if (!item.minimumPrice) return false;

    const currentPrice = this.getDisplayValue(item, 'price');
    return currentPrice < item.minimumPrice;
  }

  async saveInlineEdits(itemId: string) {
    const edits = this.editedValues().get(itemId);
    if (!edits || !edits.isDirty) return;

    try {
      const patchRequest: any = {};
      if (edits.price !== undefined) patchRequest.price = edits.price;
      if (edits.category !== undefined) patchRequest.category = edits.category;
      if (edits.condition !== undefined) patchRequest.condition = edits.condition;

      await firstValueFrom(this.inventoryService.patchPendingImport(itemId, patchRequest));

      // Clear dirty state for this item
      this.editedValues.update(map => {
        const newMap = new Map(map);
        newMap.delete(itemId);
        return newMap;
      });

      // Reload data to show updated values
      this.loadItems();

    } catch (error) {
      console.error('Failed to save inline edits:', error);
      this.error.set('Failed to save changes. Please try again.');
    }
  }

  async toggleItemVerification(itemId: string, event: any) {
    // Save any pending edits before verification
    if (this.hasUnsavedEdits(itemId)) {
      await this.saveInlineEdits(itemId);
    }

    // Continue with original verification logic
    if (event.target.checked) {
      this.verifiedPendingImports.update(set => new Set([...set, itemId]));
    } else {
      this.verifiedPendingImports.update(set => {
        const newSet = new Set(set);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }

  /**
   * Get CSS classes for table row based on item expiration status
   */
  getRowExpirationClasses(item: ItemListDto): string {
    const classes = [];

    // Only apply expiration styling to items that are still available/active
    if (item.status === 'Sold' || item.status === 'Removed') {
      return '';
    }

    if (item.expirationDate) {
      const expirationClass = this.getExpirationStatusClass(item.expirationDate);

      switch (expirationClass) {
        case 'expiration-expired':
          classes.push('row-expired');
          break;
        case 'expiration-warning':
          classes.push('row-expiring-soon');
          break;
        case 'expiration-normal':
          // Check if it's getting close (within 14 days)
          const daysUntil = this.getDaysUntilExpiration(new Date(item.expirationDate));
          if (daysUntil <= 14 && daysUntil > 7) {
            classes.push('row-expiring');
          }
          break;
      }
    }

    return classes.join(' ');
  }

  /**
   * Get expiration status text with icon for better UX
   */
  getExpirationStatusIcon(expirationDate?: Date): string {
    if (!expirationDate) {
      return '';
    }

    const daysUntil = this.getDaysUntilExpiration(new Date(expirationDate));

    if (daysUntil < 0) {
      return '🔴';  // Expired
    }

    if (daysUntil <= 7) {
      return '⚠️';   // Warning
    }

    if (daysUntil <= 14) {
      return '🟡';   // Approaching
    }

    return '';     // Normal - no icon needed
  }

  // Quick Sell modal methods
  closeQuickSellModal() {
    this.isQuickSellModalOpen.set(false);
    this.quickSellItem.set(null);
    this.quickSellPaymentType.set('Cash');
    this.quickSellCustomerEmail.set('');
  }

  completeQuickSale() {
    const item = this.quickSellItem();
    if (!item) return;

    this.isCompletingQuickSale.set(true);

    // Create the sale request using the existing RecordSaleService format
    const saleRequest: SaleRequest = {
      items: [{
        item: {
          id: item.itemId,
          name: item.title,
          sku: item.sku,
          price: item.price,
          consignorName: item.consignorName,
          status: 'Available',
          category: item.category || 'General'
        },
        quantity: 1,
        salePrice: item.price,
        finalPrice: item.price
      }],
      paymentType: this.quickSellPaymentType(),
      customerEmail: this.quickSellCustomerEmail() || undefined
    };

    this.recordSaleService.completeSale(saleRequest).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (result) => {
        this.isCompletingQuickSale.set(false);
        this.closeQuickSellModal();

        this.toastr.success(`Sale completed! Total: $${result.total.toFixed(2)}`, 'Quick Sale');

        if (result.receiptSent && this.quickSellCustomerEmail()) {
          this.toastr.success(`Receipt sent to ${this.quickSellCustomerEmail()}`, 'Email Sent!');
        }

        // Refresh the inventory to show updated status
        this.loadInventoryItems();
      },
      error: (error) => {
        console.error('Quick sale failed:', error);
        this.isCompletingQuickSale.set(false);
        this.toastr.error('Failed to complete the sale. Please try again.', 'Sale Error');
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Payment type options for Quick Sell
  readonly paymentTypes = ['Cash', 'Card', 'Check', 'Other'];
}