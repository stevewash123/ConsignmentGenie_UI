import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SquareIntegrationService } from './square-integration.service';
import {
  ItemListDto,
  ItemDetailDto,
  CreateItemRequest,
  UpdateItemRequest,
  UpdateItemStatusRequest,
  ItemQueryParams,
  CreateItemCategoryDto,
  UpdateItemCategoryDto,
  ItemCategoryDto,
  ApiResponse,
  PendingSquareImportDto,
  BulkAssignConsignorRequest,
  BulkAssignResult
} from '../models/inventory.model';
import { PagedResult } from '../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);
  private squareService = inject(SquareIntegrationService);
  private readonly apiUrl = `${environment.apiUrl}/api`;

  // Items API - Always returns ConsignmentGenie native inventory
  // Use getPendingSquareImports() for Square pending imports
  getItems(params?: ItemQueryParams): Observable<PagedResult<ItemListDto>> {
    // Always return ConsignmentGenie native inventory
    // UI should explicitly call getPendingSquareImports() for Square data
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          if (value instanceof Date) {
            httpParams = httpParams.set(key, value.toISOString());
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<PagedResult<ItemListDto>>(`${this.apiUrl}/items`, { params: httpParams });
  }

  // Square inventory methods - these return pending Square imports that need consignor assignment
  private getSquareItems(params?: ItemQueryParams): Observable<PagedResult<PendingSquareImportDto>> {
    let httpParams = new HttpParams();

    if (params) {
      // Map common parameters to Square API parameters
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      // Note: Other filters like status, condition may not apply to pending imports
    }

    return this.http.get<PagedResult<PendingSquareImportDto>>(`${this.apiUrl}/owner/integrations/square/inventory/items`, { params: httpParams });
  }

  // Public method to get pending Square imports
  getPendingSquareImports(params?: ItemQueryParams): Observable<PagedResult<PendingSquareImportDto>> {
    return this.getSquareItems(params);
  }

  // Method to assign consignor to pending Square imports
  assignConsignorToPendingImport(pendingImportId: string, consignorId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/inventory/pending-imports/${pendingImportId}/assign`, { consignorId });
  }

  // Method to bulk assign consignor to multiple pending imports
  bulkAssignConsignorToPendingImports(request: BulkAssignConsignorRequest): Observable<ApiResponse<BulkAssignResult>> {
    return this.http.post<ApiResponse<BulkAssignResult>>(`${this.apiUrl}/inventory/pending-imports/bulk-assign`, request);
  }

  importPendingItems(request: { pendingImportIds: string[] }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/inventory/pending-imports/import`, request);
  }

  deletePendingImport(pendingImportId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/pending-imports/${pendingImportId}`);
  }

  getItem(id: string): Observable<ApiResponse<ItemDetailDto>> {
    return this.http.get<ApiResponse<ItemDetailDto>>(`${this.apiUrl}/items/${id}`);
  }

  createItem(item: CreateItemRequest): Observable<ApiResponse<ItemDetailDto>> {
    return this.http.post<ApiResponse<ItemDetailDto>>(`${this.apiUrl}/items`, item);
  }

  updateItem(id: string, item: UpdateItemRequest): Observable<ApiResponse<ItemDetailDto>> {
    return this.http.put<ApiResponse<ItemDetailDto>>(`${this.apiUrl}/items/${id}`, item);
  }

  updateItemStatus(id: string, request: UpdateItemStatusRequest): Observable<ApiResponse<ItemDetailDto>> {
    return this.http.put<ApiResponse<ItemDetailDto>>(`${this.apiUrl}/items/${id}/status`, request);
  }

  deleteItem(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/items/${id}`);
  }

  generateSku(prefix: string): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.apiUrl}/items/generate-sku/${prefix}`);
  }

  // Photo management endpoints
  uploadItemImage(itemId: string, file: File): Observable<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/items/${itemId}/images`, formData);
  }

  deleteItemImage(itemId: string, imageId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/items/${itemId}/images/${imageId}`);
  }

  reorderItemImages(itemId: string, images: any[]): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/items/${itemId}/images/reorder`, { images });
  }

  // Bulk operations
  bulkUpdateItemStatus(itemIds: string[], status: string, reason?: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/items/bulk-status`, { itemIds, status, reason });
  }

  bulkCreateItems(items: CreateItemRequest[], fileName?: string, firstDataRow?: string, sourceType?: string, sourceReferenceId?: string): Observable<ApiResponse<any>> {
    const request = {
      items,
      fileName,
      firstDataRow,
      sourceType,
      sourceReferenceId
    };
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/items/bulk-import`, request);
  }

  // Metrics endpoint
  getInventoryMetrics(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/items/metrics`);
  }

  // Duplicate file check
  checkDuplicateFile(request: { fileName: string; firstDataRow: string; rowCount: number }): Observable<{ isDuplicate: boolean; lastUploadDate?: string; lastFileName?: string }> {
    return this.http.post<{ isDuplicate: boolean; lastUploadDate?: string; lastFileName?: string }>(`${this.apiUrl}/items/check-duplicate`, request);
  }

  // Categories API (now using ItemCategories)
  getCategories(): Observable<ApiResponse<ItemCategoryDto[]>> {
    return this.http.get<ApiResponse<ItemCategoryDto[]>>(`${this.apiUrl}/itemcategories`);
  }

  getCategory(id: string): Observable<ApiResponse<ItemCategoryDto>> {
    return this.http.get<ApiResponse<ItemCategoryDto>>(`${this.apiUrl}/itemcategories/${id}`);
  }

  createCategory(category: CreateItemCategoryDto): Observable<ApiResponse<ItemCategoryDto>> {
    return this.http.post<ApiResponse<ItemCategoryDto>>(`${this.apiUrl}/itemcategories`, category);
  }

  updateCategory(id: string, category: UpdateItemCategoryDto): Observable<ApiResponse<ItemCategoryDto>> {
    return this.http.put<ApiResponse<ItemCategoryDto>>(`${this.apiUrl}/itemcategories/${id}`, category);
  }

  deleteCategory(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/itemcategories/${id}`);
  }

  reorderCategories(categoryOrders: { categoryId: string; displayOrder: number }[]): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/itemcategories/reorder`, { categoryOrders });
  }
}