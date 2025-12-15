import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicStoreService } from '../../services/public-store.service';
import { ShoppingCartService } from '../../../customer/services/shopping-cart.service';
import { LoadingService } from '../../../shared/services/loading.service';
import { PublicItem, PagedResult } from '../../../shared/models/api.models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storeService = inject(PublicStoreService);
  protected readonly cartService = inject(ShoppingCartService);
  private readonly loadingService = inject(LoadingService);

  // Signals
  protected orgSlug = signal<string>('');
  protected products = signal<PublicItem[]>([]);
  protected categories = signal<any[]>([]);
  protected totalItems = signal(0);
  protected totalPages = signal(0);
  protected currentPage = signal(1);
  protected viewMode = signal<'grid' | 'list'>('grid');

  // Loading state via LoadingService
  protected isProductsLoading(): boolean {
    return this.loadingService.isLoading('public-product-list');
  }

  // Filter state
  protected selectedCategory = '';
  protected minPrice: number | null = null;
  protected maxPrice: number | null = null;
  protected sortBy = 'created';
  protected pageSize = 20;

  // Computed
  protected pageTitle = computed(() => {
    const category = this.selectedCategory;
    if (category) {
      const categoryObj = this.categories().find(c => c.slug === category);
      return categoryObj ? `${categoryObj.name} Products` : 'Products';
    }
    return 'All Products';
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.orgSlug.set(params['orgSlug'] || '');
    });

    this.route.queryParams.subscribe(queryParams => {
      // Set filters from URL parameters
      this.selectedCategory = queryParams['category'] || '';
      this.minPrice = queryParams['minPrice'] ? parseFloat(queryParams['minPrice']) : null;
      this.maxPrice = queryParams['maxPrice'] ? parseFloat(queryParams['maxPrice']) : null;
      this.sortBy = queryParams['sortBy'] || 'created';
      this.currentPage.set(parseInt(queryParams['page']) || 1);

      this.loadData();
    });

    this.loadCategories();

    // Load view mode preference
    const savedViewMode = localStorage.getItem('cg_view_mode') as 'grid' | 'list';
    if (savedViewMode) {
      this.viewMode.set(savedViewMode);
    }
  }

  private loadData(): void {
    this.loadingService.start('public-product-list');

    const request = {
      orgSlug: this.orgSlug(),
      page: this.currentPage(),
      pageSize: this.pageSize,
      category: this.selectedCategory || undefined,
      minPrice: this.minPrice || undefined,
      maxPrice: this.maxPrice || undefined,
      sortBy: this.sortBy,
      sortOrder: this.getSortOrder()
    };

    this.storeService.searchItems(request).subscribe({
      next: (result) => {
        if (result) {
          this.products.set(result.items);
          this.totalItems.set(result.totalCount);
          this.totalPages.set(result.totalPages);
        }
      },
      error: (error) => {
        console.error('Error loading products:', error);
      },
      complete: () => {
        this.loadingService.stop('public-product-list');
      }
    });
  }

  private loadCategories(): void {
    this.storeService.getCategories(this.orgSlug()).subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  private getSortOrder(): string {
    return this.sortBy.endsWith('_desc') ? 'desc' : 'asc';
  }

  protected setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
    localStorage.setItem('cg_view_mode', mode);
  }

  protected applyFilters(): void {
    this.currentPage.set(1);
    this.updateUrl();
  }

  protected goToPage(page: number): void {
    this.currentPage.set(page);
    this.updateUrl();
  }

  private updateUrl(): void {
    const queryParams: any = {
      page: this.currentPage()
    };

    if (this.selectedCategory) queryParams.category = this.selectedCategory;
    if (this.minPrice) queryParams.minPrice = this.minPrice;
    if (this.maxPrice) queryParams.maxPrice = this.maxPrice;
    if (this.sortBy !== 'created') queryParams.sortBy = this.sortBy;

    // Note: In a real implementation, you'd use Router.navigate()
    // this.router.navigate([], { queryParams, replaceUrl: true });
    this.loadData();
  }

  protected hasActiveFilters(): boolean {
    return !!(this.selectedCategory || this.minPrice || this.maxPrice);
  }

  protected getCategoryName(slug: string): string {
    const category = this.categories().find(c => c.slug === slug);
    return category ? category.name : slug;
  }

  protected clearCategoryFilter(): void {
    this.selectedCategory = '';
    this.applyFilters();
  }

  protected clearPriceFilter(): void {
    this.minPrice = null;
    this.maxPrice = null;
    this.applyFilters();
  }

  protected clearAllFilters(): void {
    this.selectedCategory = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'created';
    this.applyFilters();
  }

  protected addToCart(product: PublicItem): void {
    if (!product.isAvailable) return;

    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => {
        // Success feedback could be shown here
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        // Error feedback could be shown here
      }
    });
  }

  protected toggleWishlist(product: PublicItem): void {
    // Wishlist functionality would be implemented here
    console.log('Toggle wishlist for product:', product.id);
  }

  protected isInWishlist(productId: string): boolean {
    // Wishlist check would be implemented here
    return false;
  }

  protected getPageNumbers(): number[] {
    const pages: number[] = [];
    const current = this.currentPage();
    const total = this.totalPages();

    // Show up to 5 page numbers around current page
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}