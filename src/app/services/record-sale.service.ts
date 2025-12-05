import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Item {
  id: string;
  name: string;
  sku: string;
  price: number;
  consignorName: string;
  status: string;
}

export interface CartItem {
  item: Item;
  quantity: number; // For MVP, always 1 (consignment items are unique)
}

export interface SaleRequest {
  items: CartItem[];
  paymentType: string;
  customerEmail?: string;
}

export interface SaleResponse {
  transactionId: string;
  total: number;
  receiptSent: boolean;
}

// Mock data as specified in requirements
const mockItems: Item[] = [
  { id: '1', name: 'Vintage Lamp', sku: 'ITM-00001', price: 45.00, consignorName: 'Jane Smith', status: 'Available' },
  { id: '2', name: 'Blue Ceramic Vase', sku: 'ITM-00002', price: 22.00, consignorName: 'Bob Johnson', status: 'Available' },
  { id: '3', name: 'Oak Rocking Chair', sku: 'ITM-00003', price: 89.00, consignorName: 'Jane Smith', status: 'Available' },
  { id: '4', name: 'Silver Ring', sku: 'ITM-00004', price: 35.00, consignorName: 'Alice Brown', status: 'Available' },
  { id: '5', name: 'Antique Mirror', sku: 'ITM-00005', price: 120.00, consignorName: 'Bob Johnson', status: 'Available' },
  { id: '6', name: 'Leather Handbag', sku: 'ITM-00006', price: 67.00, consignorName: 'Carol Davis', status: 'Available' },
  { id: '7', name: 'Crystal Glasses Set', sku: 'ITM-00007', price: 156.00, consignorName: 'David Wilson', status: 'Available' },
  { id: '8', name: 'Wooden Picture Frame', sku: 'ITM-00008', price: 18.00, consignorName: 'Alice Brown', status: 'Available' },
  { id: '9', name: 'Vintage Scarf', sku: 'ITM-00009', price: 29.00, consignorName: 'Jane Smith', status: 'Available' },
  { id: '10', name: 'Brass Candlesticks', sku: 'ITM-00010', price: 43.00, consignorName: 'Bob Johnson', status: 'Available' },
  { id: '11', name: 'Porcelain Figurine', sku: 'ITM-00011', price: 78.00, consignorName: 'Carol Davis', status: 'Available' },
  { id: '12', name: 'Wooden Jewelry Box', sku: 'ITM-00012', price: 52.00, consignorName: 'David Wilson', status: 'Available' },
  { id: '13', name: 'Vintage Tea Set', sku: 'ITM-00013', price: 134.00, consignorName: 'Alice Brown', status: 'Available' },
  { id: '14', name: 'Quilted Throw', sku: 'ITM-00014', price: 95.00, consignorName: 'Jane Smith', status: 'Available' },
  { id: '15', name: 'Cast Iron Skillet', sku: 'ITM-00015', price: 38.00, consignorName: 'Bob Johnson', status: 'Available' }
];

// Mock tax rate (from shop settings)
const mockTaxRate = 0.08; // 8%

// Mock payment types
export const paymentTypes = ['Cash', 'Card', 'Check', 'Other'];

@Injectable({
  providedIn: 'root'
})
export class RecordSaleService {

  /**
   * Get available items with optional search filtering
   */
  getAvailableItems(search?: string): Observable<Item[]> {
    // Return mock items, filtered by search and status
    let items = mockItems.filter(i => i.status === 'Available');

    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      items = items.filter(i =>
        i.name.toLowerCase().includes(searchLower) ||
        i.sku.toLowerCase().includes(searchLower) ||
        i.consignorName.toLowerCase().includes(searchLower)
      );
    }

    return of(items).pipe(delay(300));
  }

  /**
   * Get the shop's tax rate
   */
  getTaxRate(): Observable<number> {
    return of(mockTaxRate);
  }

  /**
   * Complete a sale transaction
   */
  completeSale(request: SaleRequest): Observable<SaleResponse> {
    // Mock successful sale
    const response: SaleResponse = {
      transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      total: this.calculateTotal(request.items),
      receiptSent: !!request.customerEmail
    };

    return of(response).pipe(delay(500));
  }

  /**
   * Calculate total including tax
   */
  private calculateTotal(items: CartItem[]): number {
    const subtotal = items.reduce((sum, ci) => sum + (ci.item.price * ci.quantity), 0);
    return subtotal * (1 + mockTaxRate);
  }

  /**
   * Get available payment types
   */
  getPaymentTypes(): string[] {
    return [...paymentTypes];
  }

  /**
   * Calculate subtotal (before tax)
   */
  calculateSubtotal(items: CartItem[]): number {
    return items.reduce((sum, ci) => sum + (ci.item.price * ci.quantity), 0);
  }

  /**
   * Calculate tax amount
   */
  calculateTaxAmount(subtotal: number): number {
    return subtotal * mockTaxRate;
  }
}