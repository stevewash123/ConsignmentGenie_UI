import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';

import { InventoryService } from '../services/inventory.service';
import { PermissionService } from '../services/permission.service';
import { ItemListDto, ItemQueryParams, ItemCondition, ItemStatus } from '../models/inventory.model';
import { PagedResult } from '../shared/models/api.models';

@Component({
  selector: 'app-clerk-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clerk-inventory.component.html',
  styleUrls: ['./clerk-inventory.component.scss']
})
export class ClerkInventoryComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private permissionService = inject(PermissionService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  // Data signals
  items = signal<ItemListDto[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string>('');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(20);
  totalItems = signal<number>(0);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  // Filter signals
  searchQuery = signal<string>('');
  selectedCategory = signal<string>('');
  selectedStatus = signal<string>('');
  selectedCondition = signal<string>('');

  // Categories for filtering
  categories = signal<{ id: string; name: string }[]>([]);

  // Permission-based computed properties
  canAddItems = computed(() => this.permissionService.canAddItems());
  canViewConsignorInfo = computed(() => this.permissionService.canViewConsignorInfo());

  // Constants for dropdowns
  readonly statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'sold', label: 'Sold' },
    { value: 'pending', label: 'Pending' },
    { value: 'removed', label: 'Removed' }
  ];

  readonly conditions = [
    { value: '', label: 'All Conditions' },
    { value: 'new', label: 'New' },
    { value: 'likenew', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  ngOnInit() {
    this.loadItems();
    this.loadCategories();
  }

  private buildQueryParams(): ItemQueryParams {
    return {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      search: this.searchQuery() || undefined,
      category: this.selectedCategory() || undefined,
      status: this.selectedStatus() || undefined,
      condition: this.selectedCondition() || undefined
    };
  }

  loadItems() {
    this.isLoading.set(true);
    this.error.set('');

    const params = this.buildQueryParams();

    this.inventoryService.getItems(params).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response: PagedResult<ItemListDto>) => {
        this.items.set(response.items || []);
        this.totalItems.set(response.totalCount || 0);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading items:', error);
        this.error.set('Failed to load inventory items');
        this.isLoading.set(false);
        this.toastr.error('Failed to load inventory', 'Error');
      }
    });
  }

  private loadCategories() {
    this.inventoryService.getCategories().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  // Filter event handlers
  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page
    this.loadItems();
  }

  onCategoryChange(categoryId: string) {
    this.selectedCategory.set(categoryId);
    this.currentPage.set(1);
    this.loadItems();
  }

  onStatusChange(status: string) {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadItems();
  }

  onConditionChange(condition: string) {
    this.selectedCondition.set(condition);
    this.currentPage.set(1);
    this.loadItems();
  }

  // Pagination
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadItems();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  // Actions
  addNewItem() {
    if (this.canAddItems()) {
      // Navigate to add item form
      this.router.navigate(['/clerk/add-item']);
    }
  }

  viewItemDetails(item: ItemListDto) {
    // Navigate to item details view
    this.router.navigate(['/clerk/inventory', item.itemId]);
  }

  // Utility methods
  getConditionLabel(condition: string): string {
    const conditionMap: { [key: string]: string } = {
      'new': 'New',
      'likenew': 'Like New',
      'good': 'Good',
      'fair': 'Fair',
      'poor': 'Poor'
    };
    return conditionMap[condition] || 'Unknown';
  }

  getConditionBadgeClass(condition: string): string {
    const classMap: { [key: string]: string } = {
      'new': 'badge-success',
      'likenew': 'badge-info',
      'good': 'badge-primary',
      'fair': 'badge-warning',
      'poor': 'badge-danger'
    };
    return classMap[condition] || 'badge-secondary';
  }

  getStatusBadgeClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'available': 'badge-success',
      'pending': 'badge-warning',
      'sold': 'badge-secondary',
      'removed': 'badge-danger'
    };
    return classMap[status] || 'badge-secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  // Clear all filters
  clearFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set('');
    this.selectedStatus.set('');
    this.selectedCondition.set('');
    this.currentPage.set(1);
    this.loadItems();
  }

  // Refresh data
  refresh() {
    this.loadItems();
  }
}