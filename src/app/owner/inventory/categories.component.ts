import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../services/category.service';
import { LoadingService } from '../../shared/services/loading.service';
import { LookupManagementComponent } from '../../shared/components/lookup-management.component';
import { LookupItem, ItemCategoryDto, CreateItemCategoryDto, UpdateItemCategoryDto } from '../../models/inventory.model';

@Component({
  selector: 'app-inventory-categories',
  standalone: true,
  imports: [CommonModule, LookupManagementComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class InventoryCategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private loadingService = inject(LoadingService);

  categories = signal<ItemCategoryDto[]>([]);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  private readonly loadingKey = 'categories-page';

  ngOnInit() {
    this.loadCategories();
  }

  isLoading(): boolean {
    return this.loadingService.isLoading(this.loadingKey);
  }

  lookupItems = (): LookupItem[] => {
    return this.categories().map(category => ({
      id: category.id,
      name: category.name,
      count: category.itemCount
    }));
  };

  private loadCategories() {
    this.loadingService.start(this.loadingKey);
    this.clearMessages();

    this.categoryService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data);
        } else {
          this.showError('Failed to load categories');
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.showError('Failed to load categories. Please try again.');
      },
      complete: () => {
        this.loadingService.stop(this.loadingKey);
      }
    });
  }

  onAddCategory(name: string) {
    this.clearMessages();

    // Check for duplicate names
    if (this.categories().some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      this.showError('A category with this name already exists');
      return;
    }

    const request: CreateItemCategoryDto = {
      name,
      sortOrder: this.categories().length + 1
    };

    this.categoryService.create(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess(`Category "${name}" created successfully`);
          this.loadCategories(); // Refresh the list
        } else {
          this.showError(response.message || 'Failed to create category');
        }
      },
      error: (error) => {
        console.error('Error creating category:', error);
        this.showError('Failed to create category. Please try again.');
      }
    });
  }

  onRenameCategory(event: {id: string, name: string}) {
    this.clearMessages();

    const category = this.categories().find(c => c.id === event.id);
    if (!category) {
      this.showError('Category not found');
      return;
    }

    // Check for duplicate names (excluding current category)
    if (this.categories().some(cat =>
      cat.id !== event.id &&
      cat.name.toLowerCase() === event.name.toLowerCase()
    )) {
      this.showError('A category with this name already exists');
      return;
    }

    const request: UpdateItemCategoryDto = {
      name: event.name,
      description: category.description,
      color: category.color,
      parentCategoryId: category.parentCategoryId,
      sortOrder: category.sortOrder,
      defaultCommissionRate: category.defaultCommissionRate,
      isActive: category.isActive
    };

    this.categoryService.update(event.id, request).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess(`Category renamed to "${event.name}" successfully`);
          this.loadCategories(); // Refresh the list
        } else {
          this.showError(response.message || 'Failed to rename category');
        }
      },
      error: (error) => {
        console.error('Error renaming category:', error);
        this.showError('Failed to rename category. Please try again.');
      }
    });
  }

  onDeleteCategory(id: string) {
    this.clearMessages();

    const category = this.categories().find(c => c.id === id);
    if (!category) {
      this.showError('Category not found');
      return;
    }

    this.categoryService.delete(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess(`Category "${category.name}" deleted successfully`);
          this.loadCategories(); // Refresh the list
        } else {
          this.showError(response.message || 'Failed to delete category');
        }
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        this.showError('Failed to delete category. Please try again.');
      }
    });
  }

  onReorderCategories(categoryIds: string[]) {
    this.clearMessages();

    // ItemCategories doesn't support bulk reordering - would need individual updates
    this.showError('Reordering not supported yet - please edit individual categories to change order');

    // TODO: Implement individual category updates with sortOrder changes
    // For now, just refresh to reset any UI changes
    this.loadCategories();
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    // Auto-dismiss after 8 seconds
    setTimeout(() => this.errorMessage.set(''), 8000);
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    // Auto-dismiss after 5 seconds
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private clearMessages() {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}