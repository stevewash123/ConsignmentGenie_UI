import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../services/category.service';
import { LoadingService } from '../../../shared/services/loading.service';
import { LookupManagementComponent } from '../../../shared/components/lookup-management.component';
import { CategoryDto, LookupItem, CreateCategoryRequest, UpdateCategoryRequest, ReorderCategoriesRequest, ItemCategoryDto, CreateItemCategoryDto, UpdateItemCategoryDto } from '../../../models/inventory.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, LookupManagementComponent],
  template: `
    <div class="categories-page">
      <div class="page-header">
        <h1>Category Management</h1>
        <p>Organize your inventory with custom categories. Categories help you group similar items and make it easier for customers to browse your store.</p>
      </div>

      <div *ngIf="errorMessage()" class="error-banner">
        <div class="error-icon">⚠️</div>
        <span>{{ errorMessage() }}</span>
        <button type="button" class="dismiss-btn" (click)="errorMessage.set('')">✕</button>
      </div>

      <div *ngIf="successMessage()" class="success-banner">
        <div class="success-icon">✅</div>
        <span>{{ successMessage() }}</span>
        <button type="button" class="dismiss-btn" (click)="successMessage.set('')">✕</button>
      </div>

      <div *ngIf="isLoading()" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading categories...</p>
      </div>

      <div *ngIf="!isLoading()">
        <app-lookup-management
          title="Categories"
          description="Categories help organize your inventory and make it easier for customers to find items."
          [items]="lookupItems()"
          itemLabel="items"
          [allowReorder]="true"
          [showCount]="true"
          (add)="onAddCategory($event)"
          (rename)="onRenameCategory($event)"
          (delete)="onDeleteCategory($event)"
          (reorder)="onReorderCategories($event)"
        ></app-lookup-management>
      </div>
    </div>
  `,
  styles: [`
    .categories-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;
      text-align: center;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 1rem 0;
    }

    .page-header p {
      color: #6b7280;
      font-size: 1rem;
      line-height: 1.5;
      margin: 0;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .error-banner,
    .success-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .error-banner {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .success-banner {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .error-icon,
    .success-icon {
      font-size: 1rem;
      flex-shrink: 0;
    }

    .dismiss-btn {
      margin-left: auto;
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dismiss-btn:hover {
      opacity: 1;
    }

    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #6b7280;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-state p {
      margin: 0;
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .categories-page {
        padding: 1rem;
      }

      .page-header h1 {
        font-size: 1.75rem;
      }

      .page-header p {
        font-size: 0.875rem;
      }
    }
  `]
})
export class CategoriesComponent implements OnInit {
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