// Updated inventory models to match the new specification

export interface ItemListDto {
  ItemId: string;
  Sku: string;
  Title: string;
  Description?: string;
  Price: number;
  Category?: string;
  Condition: ItemCondition;
  Status: ItemStatus;
  PrimaryImageUrl?: string;
  ReceivedDate: Date;
  SoldDate?: Date;
  ConsignorId: string;
  ConsignorName: string;
  CommissionRate: number;
}

export interface ItemDetailDto {
  ItemId: string;
  ConsignorId: string;
  ConsignorName: string;
  CommissionRate: number;
  Sku: string;
  Barcode?: string;
  Title: string;
  Description?: string;
  Category?: string;
  Brand?: string;
  Size?: string;
  Color?: string;
  Condition: ItemCondition;
  Materials?: string;
  Measurements?: string;
  Price: number;
  OriginalPrice?: number;
  MinimumPrice?: number;
  ShopAmount: number;
  ConsignorAmount: number;
  Status: ItemStatus;
  StatusChangedAt?: Date;
  StatusChangedReason?: string;
  ReceivedDate: Date;
  ListedDate?: Date;
  ExpirationDate?: Date;
  SoldDate?: Date;
  Images: ItemImageDto[];
  Location?: string;
  Notes?: string;
  InternalNotes?: string;
  CreatedAt: Date;
  UpdatedAt: Date;
  TransactionId?: string;
  SalePrice?: number;
}

export interface ItemImageDto {
  ItemImageId: string;
  ImageUrl: string;
  DisplayOrder: number;
  IsPrimary: boolean;
}

export interface CreateItemRequest {
  consignorId: string;
  sku?: string;
  barcode?: string;
  title: string;
  description?: string;
  category: string;
  brand?: string;
  size?: string;
  color?: string;
  condition: ItemCondition;
  materials?: string;
  measurements?: string;
  price: number;
  originalPrice?: number;
  minimumPrice?: number;
  receivedDate?: Date;
  expirationDate?: Date;
  location?: string;
  notes?: string;
  internalNotes?: string;
}

export interface UpdateItemRequest {
  consignorId: string;
  sku?: string;
  barcode?: string;
  title: string;
  description?: string;
  category: string;
  brand?: string;
  size?: string;
  color?: string;
  condition: ItemCondition;
  materials?: string;
  measurements?: string;
  price: number;
  originalPrice?: number;
  minimumPrice?: number;
  receivedDate?: Date;
  expirationDate?: Date;
  location?: string;
  notes?: string;
  internalNotes?: string;
}

export interface UpdateItemStatusRequest {
  status: string;
  reason?: string;
}

export interface ItemQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  status?: string;
  condition?: string;
  consignorId?: string;
  priceMin?: number;
  priceMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  sortBy?: string;
  sortDirection?: string;
}

export interface PagedResult<T> {
  Items: T[];
  TotalCount: number;
  Page: number;
  PageSize: number;
  TotalPages: number;
  HasNextPage: boolean;
  HasPreviousPage: boolean;
  OrganizationId: string;
}

export enum ItemCondition {
  New = 'New',
  LikeNew = 'LikeNew',
  Good = 'Good',
  Fair = 'Fair',
  Poor = 'Poor'
}

export enum ItemStatus {
  Available = 'Available',
  Sold = 'Sold',
  Removed = 'Removed'
}

export interface CategoryDto {
  CategoryId: string;
  Name: string;
  DisplayOrder: number;
  ItemCount?: number;
}

export interface CreateCategoryRequest {
  name: string;
  displayOrder?: number;
}

export interface UpdateCategoryRequest {
  name: string;
  displayOrder: number;
}

export interface ReorderCategoriesRequest {
  CategoryIds: string[];
}

export interface CategoryUsageDto {
  CategoryId: string;
  CategoryName: string;
  ItemCount: number;
  AvailableItemCount: number;
  SoldItemCount: number;
}

export interface LookupItem {
  id: string;
  name: string;
  count?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

// New interfaces for bulk operations and metrics
export interface BulkStatusUpdateRequest {
  itemIds: string[];
  status: string;
  reason?: string;
}

export interface BulkUpdateResultDto {
  successfulUpdates: number;
  failedUpdates: number;
  errorMessages: string[];
  updatedItemIds: string[];
  failedItemIds: string[];
}

export interface InventoryMetricsDto {
  totalItems: number;
  availableItems: number;
  soldItems: number;
  removedItems: number;
  totalValue: number;
  averagePrice: number;
  itemsAddedThisMonth: number;
  itemsSoldThisMonth: number;
  byCategory: CategoryBreakdownDto[];
  byProvider: ConsignorBreakdownDto[];
}

export interface CategoryBreakdownDto {
  category: string;
  count: number;
  value: number;
}

export interface ConsignorBreakdownDto {
  consignorId: string;
  consignorName: string;
  count: number;
  value: number;
}