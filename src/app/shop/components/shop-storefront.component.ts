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
  templateUrl: './shop-storefront.component.html',
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