export interface Item {
  id: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  size?: string;
  condition: string;
  purchasePrice: number;
  consignmentPrice: number;
  salePrice?: number;
  status: ItemStatus;
  consignorId: string;
  consignorName?: string;
  consignorEmail?: string;
  imageUrl?: string;
  barcode?: string;
  sku?: string;
  tags?: string[];
  notes?: string;
  createdDate: Date;
  updatedDate?: Date;
  soldDate?: Date;
  organizationId: string;
}

export interface CreateItemRequest {
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  size?: string;
  condition: string;
  purchasePrice: number;
  consignmentPrice: number;
  consignorId: string;
  imageUrl?: string;
  barcode?: string;
  sku?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateItemRequest {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  brand?: string;
  size?: string;
  condition?: string;
  purchasePrice?: number;
  consignmentPrice?: number;
  salePrice?: number;
  status?: ItemStatus;
  consignorId?: string;
  imageUrl?: string;
  barcode?: string;
  sku?: string;
  tags?: string[];
  notes?: string;
}

export enum ItemStatus {
  Available = 'Available',
  Sold = 'Sold',
  Withdrawn = 'Withdrawn',
  Damaged = 'Damaged',
  Lost = 'Lost'
}

export interface ItemSearchParams {
  searchTerm?: string;
  category?: string;
  brand?: string;
  status?: ItemStatus;
  consignorId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageNumber?: number;
  pageSize?: number;
}

export interface ItemResponse {
  items: Item[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}