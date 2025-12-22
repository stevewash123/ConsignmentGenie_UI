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
  ApiResponse
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/api/categories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<CategoryDto[]>> {
    return this.http.get<ApiResponse<CategoryDto[]>>(this.apiUrl);
  }

  getById(id: string): Observable<ApiResponse<CategoryDto>> {
    return this.http.get<ApiResponse<CategoryDto>>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateCategoryRequest): Observable<ApiResponse<CategoryDto>> {
    return this.http.post<ApiResponse<CategoryDto>>(this.apiUrl, request);
  }

  update(id: string, request: UpdateCategoryRequest): Observable<ApiResponse<CategoryDto>> {
    return this.http.put<ApiResponse<CategoryDto>>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  reorder(request: ReorderCategoriesRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/reorder`, request);
  }

  getUsageStats(): Observable<ApiResponse<CategoryUsageDto[]>> {
    return this.http.get<ApiResponse<CategoryUsageDto[]>>(`${this.apiUrl}/usage-stats`);
  }
}