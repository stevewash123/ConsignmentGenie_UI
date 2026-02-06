// Updated inventory models to match the new specification

export interface ItemListDto {
  itemId: string;
  sku: string;
  title: string;
  description?: string;
  price: number;
  minimumPrice?: number;
  category?: string;
  condition: ItemCondition;
  status: ItemStatus;
  primaryImageUrl?: string;
  receivedDate: Date;
  expirationDate?: Date;
  soldDate?: Date;
  consignorId: string;
  consignorName: string;
  commissionRate: number;
}

export interface ItemDetailDto {
  itemId: string;
  consignorId: string;
  consignorName: string;
  commissionRate: number;
  sku: string;
  barcode?: string;
  title: string;
  description?: string;
  category?: string;
  brand?: string;
  size?: string;
  color?: string;
  condition: ItemCondition;
  materials?: string;
  measurements?: string;
  price: number;
  originalPrice?: number;
  minimumPrice?: number;
  shopAmount: number;
  consignorAmount: number;
  status: ItemStatus;
  statusChangedAt?: Date;
  statusChangedReason?: string;
  receivedDate: Date;
  listedDate?: Date;
  expirationDate?: Date;
  soldDate?: Date;
  photos: PhotoInfo[];
  location?: string;
  notes?: string;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  transactionId?: string;
  salePrice?: number;
}

export interface ItemImageDto {
  itemImageId: string;
  imageUrl: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface PhotoInfo {
  url: string;
  publicId: string;
  isPrimary: boolean;
  order: number;
  uploadedAt: string;
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
  expiration?: string;
  priceMin?: number;
  priceMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  sortBy?: string;
  sortDirection?: string;
  sourceReference?: string;
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

// Legacy Categories interfaces (to be phased out)
export interface CategoryDto {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
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
  categoryIds: string[];
}

export interface CategoryUsageDto {
  categoryId: string;
  categoryName: string;
  itemCount: number;
  availableItemCount: number;
  soldItemCount: number;
}

// Modern ItemCategory interfaces (using /api/itemcategories)
export interface ItemCategoryDto {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  parentCategoryId?: string;
  sortOrder: number;
  defaultCommissionRate?: number;
  subCategoryCount: number;
  itemCount: number;
  createdAt: Date;
}

export interface CreateItemCategoryDto {
  name: string;
  description?: string;
  color?: string;
  parentCategoryId?: string;
  sortOrder?: number;
  defaultCommissionRate?: number;
}

export interface UpdateItemCategoryDto {
  name: string;
  description?: string;
  color?: string;
  parentCategoryId?: string;
  sortOrder: number;
  defaultCommissionRate?: number;
  isActive: boolean;
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
  byConsignor: ConsignorBreakdownDto[];
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

// Pending Square Import interfaces
export interface PendingSquareImportDto {
  pendingImportId: string;
  squareCatalogId?: string; // Optional for manifest imports
  squareVariationId?: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  category?: string;
  condition?: string;
  squareUpdatedAt?: Date;
  importedAt: Date;
  status?: string;
  // Consignor assignment fields (for both Square and manifest imports)
  consignorId?: string;
  consignorNumber?: string;
  consignorName?: string;
  // Manifest-specific fields
  isManifestItem?: boolean;
  manifestId?: string;
  location?: string;
  notes?: string;
}

// Unified Pending Import interfaces (replaces Square-specific imports)
export interface PendingImportItemDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  minimumPrice?: number;
  sku?: string;
  category?: string;
  brand?: string;
  condition?: string;
  imageUrl?: string;
  source: ImportSource;
  sourceReference?: string;
  consignorId?: string;
  consignorName?: string;
  consignorNumber?: string;
  status: ImportStatus;
  importedAt?: Date;
  importedItemId?: string;
  createdAt: Date;
  notes?: string;
}

export enum ImportSource {
  Manual = 0,
  CSV = 1,
  Square = 2,
  Manifest = 3
}

export enum ImportStatus {
  Pending = 0,
  Assigned = 1,
  Verified = 2,
  Imported = 3,
  Rejected = 4,
  Deleted = 5
}

export interface BulkAssignConsignorRequest {
  pendingImportIds: string[];
  consignorId: string;
}

export interface BulkAssignResult {
  assigned: number;
  failed: FailedAssignment[];
}

export interface FailedAssignment {
  pendingImportId: string;
  reason: string;
}