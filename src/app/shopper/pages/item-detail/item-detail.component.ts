import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ShopperStoreService, StoreInfoDto } from '../../services/shopper-store.service';
import {
  ShopperCatalogService,
  ShopperItemDetail,
  ShopperItemImage,
  ShopperItemList
} from '../../services/shopper-catalog.service';
import { ShopperCartService } from '../../services/shopper-cart.service';
import { LoadingService } from '../../../shared/services/loading.service';
import { LOADING_KEYS } from '../../constants/loading-keys';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.scss']
})
export class ItemDetailComponent implements OnInit, OnDestroy {
  storeInfo: StoreInfoDto | null = null;
  storeSlug = '';
  itemId = '';
  item: ShopperItemDetail | null = null;
  selectedImage: ShopperItemImage | null = null;
  error: string | null = null;

  // Expose for template
  readonly KEYS = LOADING_KEYS;

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
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.storeSlug = params.get('storeSlug') || '';
      this.itemId = params.get('itemId') || '';
      if (this.storeSlug && this.itemId) {
        this.cartService.setCurrentStore(this.storeSlug);
        this.loadItemDetail();
      }
    });

    this.storeService.currentStore$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(store => {
      this.storeInfo = store;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadItemDetail(): void {
    this.loadingService.start(LOADING_KEYS.ITEM_DETAIL);
    this.error = null;

    this.catalogService.getItemDetail(this.storeSlug, this.itemId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.item = response.data;
          this.selectedImage = this.item.images.find(img => img.isPrimary) || this.item.images[0] || null;
        } else {
          this.error = response.message || 'Failed to load item details';
          this.item = null;
        }
      },
      error: (err) => {
        this.error = 'An error occurred while loading item details';
        this.item = null;
        console.error('Item detail load error:', err);
      },
      complete: () => {
        this.loadingService.stop(LOADING_KEYS.ITEM_DETAIL);
      }
    });
  }

  selectImage(image: ShopperItemImage): void {
    this.selectedImage = image;
  }

  hasSpecifications(): boolean {
    return !!(this.item?.size || this.item?.color || this.item?.materials ||
             this.item?.measurements || this.item?.listedDate);
  }

  addToCart(): void {
    if (!this.item?.isAvailable) return;

    // Convert item detail to item list format for cart
    const cartItem: ShopperItemList = {
      itemId: this.item.itemId,
      title: this.item.title,
      description: this.item.description,
      price: this.item.price,
      category: this.item.category,
      brand: this.item.brand,
      size: this.item.size,
      color: this.item.color,
      condition: this.item.condition,
      primaryImageUrl: this.selectedImage?.imageUrl,
      listedDate: this.item.listedDate,
      images: this.item.images
    };

    const success = this.cartService.addItem(cartItem, 1);
    if (success) {
      // Show a more user-friendly notification (could be replaced with toast notification)
      console.log(`${this.item.title} added to cart!`);
    } else {
      console.error('Failed to add item to cart');
    }
  }

  addToFavorites(): void {
    // TODO: Implement favorites functionality
    alert(`${this.item?.title} added to favorites!`);
  }

  goBack(): void {
    this.router.navigate(['/shop', this.storeSlug]);
  }

  onImageError(event: any): void {
    event.target.src = '/assets/placeholder-item.jpg';
  }
}