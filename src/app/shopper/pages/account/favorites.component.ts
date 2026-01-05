import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ShopperStoreService, StoreInfoDto } from '../../services/shopper-store.service';

interface FavoriteItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  isAvailable: boolean;
  dateAdded: Date;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit, OnDestroy {
  storeInfo: StoreInfoDto | null = null;
  storeSlug = '';
  viewMode: 'grid' | 'list' = 'grid';
  sortBy = 'dateAdded';

  // Sample favorites data for Phase 1 MVP
  favoriteItems: FavoriteItem[] = [
    {
      id: '1',
      name: 'Vintage Leather Jacket',
      description: 'Classic brown leather jacket in excellent condition. Perfect for fall weather.',
      price: 125.00,
      category: 'Clothing',
      isAvailable: true,
      dateAdded: new Date('2024-01-20')
    },
    {
      id: '2',
      name: 'Designer Handbag',
      description: 'Authentic designer handbag with original tags. Like new condition.',
      price: 280.00,
      category: 'Accessories',
      isAvailable: false,
      dateAdded: new Date('2024-01-18')
    },
    {
      id: '3',
      name: 'Modern Art Print',
      description: 'Limited edition print by local artist. Framed and ready to hang.',
      price: 75.00,
      category: 'Art',
      isAvailable: true,
      dateAdded: new Date('2024-01-15')
    },
    {
      id: '4',
      name: 'Retro Coffee Table',
      description: 'Mid-century modern coffee table with sleek lines and original finish.',
      price: 180.00,
      category: 'Furniture',
      isAvailable: true,
      dateAdded: new Date('2024-01-12')
    }
  ];

  sortedItems: FavoriteItem[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private storeService: ShopperStoreService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.storeSlug = params.get('storeSlug') || '';
    });

    this.storeService.currentStore$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(store => {
      this.storeInfo = store;
    });

    this.loadFavoritesFromStorage();
    this.applySorting();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    this.saveFavoritesToStorage();
  }

  onSortChange(): void {
    this.applySorting();
  }

  removeFromFavorites(item: FavoriteItem): void {
    const index = this.favoriteItems.findIndex(fav => fav.id === item.id);
    if (index > -1) {
      this.favoriteItems.splice(index, 1);
      this.applySorting();
      this.saveFavoritesToStorage();
    }
  }

  addToCart(item: FavoriteItem): void {
    if (!item.isAvailable) return;

    // TODO: Implement actual cart functionality
    alert(`${item.name} added to cart!`);
  }

  shareItem(item: FavoriteItem): void {
    // TODO: Implement sharing functionality
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: item.description,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      const url = `${window.location.origin}/shop/${this.storeSlug}/item/${item.id}`;
      navigator.clipboard.writeText(url).then(() => {
        alert('Item link copied to clipboard!');
      }).catch(() => {
        alert('Unable to copy link. Please try again.');
      });
    }
  }

  clearAllFavorites(): void {
    if (confirm('Are you sure you want to remove all items from your favorites?')) {
      this.favoriteItems = [];
      this.sortedItems = [];
      this.saveFavoritesToStorage();
    }
  }

  onImageError(event: any): void {
    event.target.src = '/assets/placeholder-item.jpg';
  }

  private applySorting(): void {
    let sorted = [...this.favoriteItems];

    switch (this.sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'dateAdded':
      default:
        sorted.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
        break;
    }

    this.sortedItems = sorted;
  }

  private loadFavoritesFromStorage(): void {
    try {
      const favoritesData = localStorage.getItem(`favorites_${this.storeSlug}`);
      const viewModeData = localStorage.getItem(`favorites_viewmode_${this.storeSlug}`);

      if (favoritesData) {
        const parsed = JSON.parse(favoritesData);
        this.favoriteItems = parsed.map((item: any) => ({
          ...item,
          dateAdded: new Date(item.dateAdded)
        }));
      }

      if (viewModeData) {
        this.viewMode = viewModeData as 'grid' | 'list';
      }
    } catch (error) {
      console.error('Error loading favorites from storage:', error);
    }
  }

  private saveFavoritesToStorage(): void {
    try {
      localStorage.setItem(`favorites_${this.storeSlug}`, JSON.stringify(this.favoriteItems));
      localStorage.setItem(`favorites_viewmode_${this.storeSlug}`, this.viewMode);
    } catch (error) {
      console.error('Error saving favorites to storage:', error);
    }
  }
}