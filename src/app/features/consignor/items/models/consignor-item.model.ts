export interface ConsignorItemSummary {
  id: string;
  name: string;
  thumbnailUrl: string;
  listedPrice: number;
  consignorEarnings: number;  // Their split amount
  status: 'available' | 'sold' | 'returned' | 'expired';
  listedDate: Date;
  soldDate?: Date;
  daysListed: number;
  priceChangeRequest?: PriceChangeRequest;  // If there's a pending price change request
}

export interface ConsignorItemsFilter {
  status?: 'available' | 'sold' | 'returned' | 'expired' | null;
  searchText?: string;
}

export interface ConsignorItemsSort {
  field: 'listedDate' | 'price' | 'name';
  direction: 'asc' | 'desc';
}

export interface ConsignorItemsRequest {
  filter?: ConsignorItemsFilter;
  sort?: ConsignorItemsSort;
  page?: number;
  pageSize?: number;
}

export interface ConsignorItemsResponse {
  items: ConsignorItemSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: {
    all: number;
    available: number;
    sold: number;
    returned: number;
    expired: number;
  };
}

// Price Change Request Models
export interface PriceChangeRequest {
  requestId: string;
  requestedPrice: number;
  requestedEarnings: number;
  ownerNote: string;
  updatedMarketPrice?: number;
  requestDate: Date;
  expiresDate: Date;
}

export interface PriceChangeResponse {
  requestId: string;
  decision: 'accept' | 'keep_current' | 'decline_retrieve';
  consignorNote?: string;
}

export interface PriceChangeDecisionRequest {
  itemId: string;
  response: PriceChangeResponse;
}