export interface Transaction {
  id: string;
  saleDate: Date;
  salePrice: number;
  salesTaxAmount?: number;
  paymentMethod: string;

  // Commission split
  consignorsplitPercentage: number;
  providerAmount: number;
  shopAmount: number;

  // Navigation data
  item: ItemSummary;
  consignor: consignorsummary;
  notes?: string;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemSummary {
  id: string;
  name: string;
  description?: string;
  originalPrice: number;
}

export interface consignorsummary {
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