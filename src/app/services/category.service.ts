import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CategoryDto,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ReorderCategoriesRequest,
  CategoryUsageDto,
  ItemCategoryDto,
  CreateItemCategoryDto,
  UpdateItemCategoryDto,
  ApiResponse
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/api/itemcategories`;

  constructor(private http: HttpClient) {}

  // Primary methods using ItemCategory endpoints
  getAll(): Observable<ApiResponse<ItemCategoryDto[]>> {
    return this.http.get<ApiResponse<ItemCategoryDto[]>>(this.apiUrl);
  }

  getById(id: string): Observable<ApiResponse<ItemCategoryDto>> {
    return this.http.get<ApiResponse<ItemCategoryDto>>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateItemCategoryDto): Observable<ApiResponse<ItemCategoryDto>> {
    return this.http.post<ApiResponse<ItemCategoryDto>>(this.apiUrl, request);
  }

  update(id: string, request: UpdateItemCategoryDto): Observable<ApiResponse<ItemCategoryDto>> {
    return this.http.put<ApiResponse<ItemCategoryDto>>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
  }

  // Legacy methods kept for backward compatibility (can be removed later)
  reorder(request: ReorderCategoriesRequest): Observable<ApiResponse<any>> {
    // Note: ItemCategories doesn't have a reorder endpoint, using sortOrder instead
    // This method is kept for compatibility but may need special handling
    throw new Error('Reorder not supported with ItemCategories - use sortOrder in update instead');
  }

  getUsageStats(): Observable<ApiResponse<CategoryUsageDto[]>> {
    // Legacy method - ItemCategories includes usage data in the main response
    throw new Error('Usage stats integrated into main getAll() response for ItemCategories');
  }
}