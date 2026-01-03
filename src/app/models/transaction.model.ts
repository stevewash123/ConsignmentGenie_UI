export interface Transaction {
  id: string;
  transactionDate: Date;

  // Legacy compatibility
  saleDate: Date; // Maps to transactionDate

  paymentType: string;
  source: string;

  // Transaction totals
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;

  // Legacy compatibility
  salePrice: number; // Maps to total
  salesTaxAmount: number; // Maps to taxAmount
  paymentMethod: string; // Maps to paymentType

  // Customer info
  customerEmail?: string;
  notes?: string;

  // Multi-item data
  items: TransactionItem[];

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionItem {
  id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;

  // Split calculation
  consignorSplitPercentage: number;
  consignorAmount: number;
  storeAmount: number;

  // Item and Consignor info
  item: ItemSummary;
  consignor: ConsignorSummary;
}

export interface ItemSummary {
  id: string;
  title: string; // Changed from 'name' to 'title' to match API
  sku: string;
  description?: string;
  price: number; // Current price, changed from 'originalPrice'
}

export interface ConsignorSummary {
  id: string;
  name: string;
  email?: string;
}

export interface CreateTransactionRequest {
  itemId: string;
  salePrice: number;
  salesTaxAmount?: number;
  paymentMethod: string;
  notes?: string;
  saleDate?: Date;
}