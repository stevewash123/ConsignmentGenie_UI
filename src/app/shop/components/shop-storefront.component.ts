import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

interface ShopItem {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  consignor: string;
  condition: string;
  isAvailable: boolean;
}

@Component({
  selector: 'app-shop-storefront',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="shop-storefront">
      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <h1>Welcome to Our Shop</h1>
        <p>Discover unique consignment items from local consignors</p>
      </div>

      <!-- Categories Filter -->
      <div class="categories-filter">
        <h3>Shop by Category</h3>
        <div class="category-buttons">
          <button
            (click)="setActiveCategory('all')"
            [class.active]="activeCategory() === 'all'"
            class="category-btn">
            All Items
          </button>
          <button
            *ngFor="let category of categories()"
            (click)="setActiveCategory(category)"
            [class.active]="activeCategory() === category"
            class="category-btn">
            {{ category }}
          </button>
        </div>
      </div>

      <!-- Items Grid -->
      <div class="items-section">
        <div class="items-header">
          <h3>Featured Items</h3>
          <p>{{ filteredItems().length }} items available</p>
        </div>

        <div class="items-grid" *ngIf="filteredItems().length > 0; else noItems">
          <div class="item-card" *ngFor="let item of filteredItems()">
            <div class="item-image">
              <img *ngIf="item.imageUrl; else placeholder"
                   [src]="item.imageUrl"
                   [alt]="item.title"
                   loading="lazy">
              <ng-template #placeholder>
                <div class="image-placeholder">
                  <span>📷</span>
                </div>
              </ng-template>
            </div>

            <div class="item-details">
              <h4 class="item-title">{{ item.title }}</h4>
              <p class="item-description">{{ item.description }}</p>

              <div class="item-meta">
                <span class="item-consignor">by {{ item.consignor }}</span>
                <span class="item-condition">{{ item.condition }}</span>
              </div>

              <div class="item-footer">
                <div class="item-price">\${{ item.price | number:'1.2-2' }}</div>
                <button
                  [disabled]="!item.isAvailable"
                  class="btn btn-primary"
                  (click)="addToCart(item)">
                  {{ item.isAvailable ? 'Add to Cart' : 'Sold' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <ng-template #noItems>
          <div class="no-items">
            <div class="no-items-icon">🛍️</div>
            <h3>No items found</h3>
            <p>Check back soon for new additions to our collection!</p>
          </div>
        </ng-template>
      </div>

      <!-- Call to Action -->
      <div class="cta-section">
        <div class="cta-card">
          <h3>Interested in Consigning?</h3>
          <p>Turn your unused items into cash by consigning with us.</p>
          <a routerLink="/signup/consignor" class="btn btn-outline">Become a consignor</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shop-storefront {
      max-width: 1200px;
      margin: 0 auto;
    }

    .welcome-banner {
      text-align: center;
      padding: 2rem 0;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 12px;
    }

    .welcome-banner h1 {
      color: #1f2937;
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .welcome-banner p {
      color: #6b7280;
      font-size: 1.2rem;
      margin: 0;
    }

    .categories-filter {
      margin-bottom: 3rem;
    }

    .categories-filter h3 {
      color: #1f2937;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .category-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .category-btn {
      padding: 0.5rem 1rem;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      color: #374151;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .category-btn:hover {
      border-color: #047857;
      color: #047857;
    }

    .category-btn.active {
      background: #047857;
      border-color: #047857;
      color: white;
    }

    .items-section {
      margin-bottom: 3rem;
    }

    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .items-header h3 {
      color: #1f2937;
      font-size: 1.75rem;
      margin: 0;
    }

    .items-header p {
      color: #6b7280;
      margin: 0;
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .item-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.2s;
    }

    .item-card:hover {
      transform: translateY(-2px);
    }

    .item-image {
      width: 100%;
      height: 200px;
      position: relative;
    }

    .item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-placeholder {
      width: 100%;
      height: 100%;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      color: #9ca3af;
    }

    .item-details {
      padding: 1.25rem;
    }

    .item-title {
      color: #1f2937;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .item-description {
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.4;
      margin: 0 0 0.75rem 0;
    }

    .item-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
      font-size: 0.8rem;
    }

    .item-consignor {
      color: #047857;
      font-weight: 500;
    }

    .item-condition {
      color: #6b7280;
      background: #f3f4f6;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .item-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .item-price {
      color: #1f2937;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      text-align: center;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: #047857;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #065f46;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .btn-outline {
      background: transparent;
      color: #047857;
      border: 1px solid #047857;
    }

    .btn-outline:hover {
      background: #047857;
      color: white;
    }

    .no-items {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .no-items-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .no-items h3 {
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .cta-section {
      margin-top: 4rem;
    }

    .cta-card {
      background: linear-gradient(135deg, #047857 0%, #065f46 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
    }

    .cta-card h3 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .cta-card p {
      margin-bottom: 1.5rem;
      opacity: 0.9;
    }

    .cta-card .btn-outline {
      background: transparent;
      color: white;
      border-color: white;
    }

    .cta-card .btn-outline:hover {
      background: white;
      color: #047857;
    }

    @media (max-width: 768px) {
      .welcome-banner h1 {
        font-size: 2rem;
      }

      .items-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .items-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
      }
    }
  `]
})
export class ShopStorefrontComponent implements OnInit {
  items = signal<ShopItem[]>([]);
  categories = signal<string[]>([]);
  activeCategory = signal<string>('all');
  filteredItems = signal<ShopItem[]>([]);

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.loadShopItems();
  }

  private loadShopItems() {
    // Mock data - in real app, this would come from API based on shop slug
    const mockItems: ShopItem[] = [
      {
        id: '1',
        title: 'Vintage Leather Jacket',
        description: 'Classic brown leather jacket in excellent condition',
        price: 125.00,
        category: 'Clothing',
        consignor: 'Sarah Thompson',
        condition: 'Excellent',
        isAvailable: true
      },
      {
        id: '2',
        title: 'Antique Jewelry Box',
        description: 'Beautiful handcrafted wooden jewelry box with mirror',
        price: 89.99,
        category: 'Home & Garden',
        consignor: 'Mike Chen',
        condition: 'Very Good',
        isAvailable: true
      },
      {
        id: '3',
        title: 'Designer Handbag',
        description: 'Authentic designer purse with original tags',
        price: 275.00,
        category: 'Accessories',
        consignor: 'Emma Rodriguez',
        condition: 'Like New',
        isAvailable: false
      },
      {
        id: '4',
        title: 'Vintage Books Set',
        description: 'Collection of classic literature hardcover books',
        price: 45.00,
        category: 'Books',
        consignor: 'David Wilson',
        condition: 'Good',
        isAvailable: true
      }
    ];

    this.items.set(mockItems);
    this.updateCategories();
    this.updateFilteredItems();
  }

  private updateCategories() {
    const categorySet = new Set(this.items().map(item => item.category));
    this.categories.set(Array.from(categorySet).sort());
  }

  setActiveCategory(category: string) {
    this.activeCategory.set(category);
    this.updateFilteredItems();
  }

  private updateFilteredItems() {
    const category = this.activeCategory();
    if (category === 'all') {
      this.filteredItems.set(this.items());
    } else {
      this.filteredItems.set(this.items().filter(item => item.category === category));
    }
  }

  addToCart(item: ShopItem) {
    if (!item.isAvailable) return;

    // TODO: Implement cart functionality
    console.log('Added to cart:', item);
    alert(`Added "${item.title}" to cart!`);
  }
}