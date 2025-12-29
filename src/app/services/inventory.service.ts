import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ItemListDto,
  ItemDetailDto,
  CreateItemRequest,
  UpdateItemRequest,
  UpdateItemStatusRequest,
  ItemQueryParams,
  PagedResult,
  CreateItemCategoryDto,
  UpdateItemCategoryDto,
  ItemCategoryDto,
  ApiResponse
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api`;

  // Items API
  getItems(params?: ItemQueryParams): Observable<PagedResult<ItemListDto>> {
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

  bulkCreateItems(items: CreateItemRequest[], fileName?: string, firstDataRow?: string): Observable<ApiResponse<any>> {
    const request = {
      items,
      fileName,
      firstDataRow
    };
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/items/bulk-import`, request);
  }

  // Metrics endpoint
  getInventoryMetrics(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/items/metrics`);
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