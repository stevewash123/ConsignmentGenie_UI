export interface PriceChangeRequest {
  itemId: string;
  currentPrice: number;
  newPrice: number;
  updatedMarketPrice?: number;
  noteToConsignor?: string;
}

export interface PriceChangeResponse {
  success: boolean;
  message: string;
  immediateUpdate?: boolean; // True for price increases
  requiresApproval?: boolean; // True for price decreases
}