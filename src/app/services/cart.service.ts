import { Injectable, signal, computed } from '@angular/core';
import { ItemListDto } from '../models/inventory.model';

export interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  imageUrl?: string;
  consignorName?: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  customerEmail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private items = signal<CartItem[]>([]);
  private customerEmail = signal<string | undefined>(undefined);
  private taxRate = 0.08; // 8% tax rate from specification

  // Computed values
  subtotal = computed(() => {
    return this.items().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  });

  tax = computed(() => {
    return this.subtotal() * this.taxRate;
  });

  total = computed(() => {
    return this.subtotal() + this.tax();
  });

  itemCount = computed(() => {
    return this.items().reduce((count, item) => count + item.quantity, 0);
  });

  cartState = computed<CartState>(() => ({
    items: this.items(),
    subtotal: this.subtotal(),
    tax: this.tax(),
    total: this.total(),
    customerEmail: this.customerEmail()
  }));

  constructor() {
    this.loadCart();
  }

  addItem(inventoryItem: ItemListDto): void {
    const currentItems = this.items();
    const existingItemIndex = currentItems.findIndex(item => item.id === inventoryItem.itemId);

    if (existingItemIndex >= 0) {
      // Item already in cart, increase quantity
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex].quantity += 1;
      this.items.set(updatedItems);
    } else {
      // New item, add to cart
      const cartItem: CartItem = {
        id: inventoryItem.itemId,
        sku: inventoryItem.sku,
        name: inventoryItem.title,
        price: inventoryItem.price,
        imageUrl: inventoryItem.primaryImageUrl,
        consignorName: inventoryItem.consignorName,
        quantity: 1
      };
      this.items.set([...currentItems, cartItem]);
    }

    this.saveCart();
  }

  removeItem(itemId: string): void {
    const updatedItems = this.items().filter(item => item.id !== itemId);
    this.items.set(updatedItems);
    this.saveCart();
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    const currentItems = this.items();
    const itemIndex = currentItems.findIndex(item => item.id === itemId);

    if (itemIndex >= 0) {
      const updatedItems = [...currentItems];
      updatedItems[itemIndex].quantity = quantity;
      this.items.set(updatedItems);
      this.saveCart();
    }
  }

  setCustomerEmail(email: string): void {
    this.customerEmail.set(email);
    this.saveCart();
  }

  clearCart(): void {
    this.items.set([]);
    this.customerEmail.set(undefined);
    this.clearSavedCart();
  }

  isEmpty(): boolean {
    return this.items().length === 0;
  }

  private loadCart(): void {
    try {
      const savedCart = localStorage.getItem('cart_state');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        this.items.set(cartData.items || []);
        this.customerEmail.set(cartData.customerEmail);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      this.clearCart();
    }
  }

  private saveCart(): void {
    try {
      const cartData = {
        items: this.items(),
        customerEmail: this.customerEmail()
      };
      localStorage.setItem('cart_state', JSON.stringify(cartData));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  private clearSavedCart(): void {
    localStorage.removeItem('cart_state');
  }
}