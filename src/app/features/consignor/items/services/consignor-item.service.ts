import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ConsignorItemSummary,
  ConsignorItemsRequest,
  ConsignorItemsResponse,
  ConsignorItemsFilter,
  ConsignorItemsSort,
  PriceChangeDecisionRequest
} from '../models/consignor-item.model';

export interface ConsignorItemApiDto {
  itemId: string;
  sku: string;
  title: string;
  primaryImageUrl: string;
  price: number;
  myEarnings: number;
  category: string;
  status: string;
  receivedDate: string;
  soldDate?: string;
  salePrice?: number;
}

export interface ConsignorItemQueryParamsApi {
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ConsignorItemsApiResponse {
  items: ConsignorItemApiDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConsignorItemService {
  private baseUrl = `${environment.apiUrl}/api/consignor`;

  constructor(private http: HttpClient) {}

  getConsignorItems(request: ConsignorItemsRequest = {}): Observable<ConsignorItemsResponse> {
    let params = new HttpParams();

    // Map frontend request to API parameters
    if (request.filter?.status && request.filter.status !== null) {
      params = params.set('status', this.capitalizeFirst(request.filter.status));
    }

    if (request.filter?.searchText) {
      params = params.set('search', request.filter.searchText);
    }

    if (request.page) {
      params = params.set('page', request.page.toString());
    }

    if (request.pageSize) {
      params = params.set('pageSize', request.pageSize.toString());
    }

    // Note: Sorting is not implemented in the API yet, so we'll handle it client-side for now

    return this.http.get<ConsignorItemsApiResponse>(`${this.baseUrl}/items`, { params })
      .pipe(
        map(response => this.mapApiResponseToFrontendResponse(response, request.sort))
      );
  }

  respondToPriceChange(request: PriceChangeDecisionRequest): Observable<{ success: boolean; message: string }> {
    // This endpoint doesn't exist in the API yet, so return a mock response for now
    // TODO: Implement this endpoint in the backend
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          message: 'Price change response submitted successfully. This feature is coming soon.'
        });
        observer.complete();
      }, 500);
    });
  }

  private mapApiResponseToFrontendResponse(
    apiResponse: ConsignorItemsApiResponse,
    sort?: ConsignorItemsSort
  ): ConsignorItemsResponse {
    let items = apiResponse.items.map(item => this.mapApiItemToFrontendItem(item));

    // Apply client-side sorting if specified
    if (sort) {
      items = this.sortItems(items, sort);
    }

    // Calculate status counts - we need to call a separate endpoint or calculate from all items
    // For now, we'll use mock counts since the API doesn't return them
    const statusCounts = this.calculateStatusCounts(items, apiResponse.totalCount);

    const totalPages = Math.ceil(apiResponse.totalCount / apiResponse.pageSize);

    return {
      items,
      totalCount: apiResponse.totalCount,
      page: apiResponse.page,
      pageSize: apiResponse.pageSize,
      totalPages,
      statusCounts
    };
  }

  private mapApiItemToFrontendItem(apiItem: ConsignorItemApiDto): ConsignorItemSummary {
    const receivedDate = new Date(apiItem.receivedDate);
    const soldDate = apiItem.soldDate ? new Date(apiItem.soldDate) : undefined;
    const now = new Date();
    const daysListed = Math.floor((now.getTime() - receivedDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: apiItem.itemId,
      name: apiItem.title,
      thumbnailUrl: apiItem.primaryImageUrl || '', // This will be empty initially since no images are uploaded yet
      listedPrice: apiItem.price,
      consignorEarnings: apiItem.myEarnings,
      status: this.mapApiStatusToFrontendStatus(apiItem.status),
      listedDate: receivedDate,
      soldDate,
      daysListed,
      // Price change requests are not implemented in the API yet
      priceChangeRequest: undefined
    };
  }

  private mapApiStatusToFrontendStatus(apiStatus: string): 'available' | 'sold' | 'returned' | 'expired' {
    switch (apiStatus.toLowerCase()) {
      case 'active':
      case 'available':
        return 'available';
      case 'sold':
        return 'sold';
      case 'returned':
      case 'removed':
        return 'returned';
      case 'expired':
        return 'expired';
      default:
        return 'available';
    }
  }

  private calculateStatusCounts(items: ConsignorItemSummary[], totalCount: number) {
    // This is a simplified calculation based on current page items
    // In a real implementation, the API should return these counts
    const available = items.filter(i => i.status === 'available').length;
    const sold = items.filter(i => i.status === 'sold').length;
    const returned = items.filter(i => i.status === 'returned').length;
    const expired = items.filter(i => i.status === 'expired').length;

    return {
      all: totalCount,
      available: available * Math.ceil(totalCount / items.length) || 0,
      sold: sold * Math.ceil(totalCount / items.length) || 0,
      returned: returned * Math.ceil(totalCount / items.length) || 0,
      expired: expired * Math.ceil(totalCount / items.length) || 0
    };
  }

  private sortItems(items: ConsignorItemSummary[], sort: ConsignorItemsSort): ConsignorItemSummary[] {
    return items.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'listedDate':
          comparison = a.listedDate.getTime() - b.listedDate.getTime();
          break;
        case 'price':
          comparison = a.listedPrice - b.listedPrice;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}