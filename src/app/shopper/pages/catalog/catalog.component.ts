import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ShopperStoreService, StoreInfoDto } from '../../services/shopper-store.service';
import {
  ShopperCatalogService,
  ShopperItemList,
  ShopperCategory,
  CatalogRequest
} from '../../services/shopper-catalog.service';
import { ShopperCartService } from '../../services/shopper-cart.service';
import { LoadingService } from '../../../shared/services/loading.service';
import { LOADING_KEYS } from '../../constants/loading-keys';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit, OnDestroy {
  storeInfo: StoreInfoDto | null = null;
  storeSlug = '';

  // Real data from API
  items: ShopperItemList[] = [];
  categories: ShopperCategory[] = [];

  // Search and filter state
  searchTerm = '';
  selectedCategory = '';
  sortBy = 'newest';
  sortDirection = 'desc';
  currentPage = 1;
  itemsPerPage = 20;
  totalCount = 0;
  totalPages = 1;
  error: string | null = null;

  // Expose for template
  readonly KEYS = LOADING_KEYS;

  // Search debouncing
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storeService: ShopperStoreService,
    private catalogService: ShopperCatalogService,
    private cartService: ShopperCartService,
    public loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    // Get store slug from route
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.storeSlug = params.get('storeSlug') || '';
      if (this.storeSlug) {
        this.cartService.setCurrentStore(this.storeSlug);
        this.loadCatalogData();
        this.loadCategories();
      }
    });

    // Get store info
    this.storeService.currentStore$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(store => {
      this.storeInfo = store;
    });

    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.loadCatalogData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCatalogData(): void {
    const loadingKey = this.searchTerm ? LOADING_KEYS.CATALOG_SEARCH : LOADING_KEYS.CATALOG_ITEMS;
    this.loadingService.start(loadingKey);
    this.error = null;

    const request: CatalogRequest = {
      page: this.currentPage,
      pageSize: this.itemsPerPage,
      sortBy: this.getSortByValue(),
      sortDirection: this.sortDirection
    };

    if (this.selectedCategory) {
      request.category = this.selectedCategory;
    }

    // Use search if there's a search term
    const serviceCall = this.searchTerm
      ? this.catalogService.searchItems(this.storeSlug, { ...request, searchQuery: this.searchTerm })
      : this.catalogService.getCatalogItems(this.storeSlug, request);

    serviceCall.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.items = response.data.items;
          this.totalCount = response.data.totalCount;
          this.totalPages = response.data.totalPages;
          this.currentPage = response.data.page;
        } else {
          this.error = response.message || 'Failed to load catalog items';
          this.items = [];
        }
      },
      error: (err) => {
        this.error = 'An error occurred while loading catalog items';
        this.items = [];
        console.error('Catalog load error:', err);
      },
      complete: () => {
        this.loadingService.stop(loadingKey);
      }
    });
  }

  private loadCategories(): void {
    this.catalogService.getCategories(this.storeSlug).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = response.data;
        }
      },
      error: (err) => {
        console.error('Categories load error:', err);
      }
    });
  }

  private getSortByValue(): string {
    switch (this.sortBy) {
      case 'name':
        this.sortDirection = 'asc';
        return 'title';
      case 'price-low':
        this.sortDirection = 'asc';
        return 'price';
      case 'price-high':
        this.sortDirection = 'desc';
        return 'price';
      case 'newest':
        this.sortDirection = 'desc';
        return 'ListedDate';
      default:
        this.sortDirection = 'desc';
        return 'ListedDate';
    }
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.loadCatalogData();
  }

  onSortChange(): void {
    this.loadCatalogData();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.sortBy = 'newest';
    this.sortDirection = 'desc';
    this.currentPage = 1;
    this.loadCatalogData();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCatalogData();
    }
  }

  addToCart(item: ShopperItemList): void {
    const success = this.cartService.addItem(item, 1);
    if (success) {
      // Show a more user-friendly notification (could be replaced with toast notification)
      console.log(`${item.title} added to cart!`);
    } else {
      console.error('Failed to add item to cart');
    }
  }

  viewItemDetail(item: ShopperItemList): void {
    this.router.navigate(['/shop', this.storeSlug, 'items', item.itemId]);
  }

  onImageError(event: any): void {
    event.target.src = '/assets/placeholder-item.jpg';
  }
}