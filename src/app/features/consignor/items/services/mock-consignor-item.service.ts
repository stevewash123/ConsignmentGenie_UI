import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  ConsignorItemSummary,
  ConsignorItemsRequest,
  ConsignorItemsResponse,
  ConsignorItemsFilter,
  ConsignorItemsSort,
  PriceChangeDecisionRequest
} from '../models/consignor-item.model';

@Injectable({
  providedIn: 'root'
})
export class MockConsignorItemService {

  private mockItems: ConsignorItemSummary[] = [
    {
      id: '1',
      name: 'Vintage Coach Leather Handbag',
      thumbnailUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop&crop=center',
      listedPrice: 125.00,
      consignorEarnings: 75.00,
      status: 'available',
      listedDate: new Date('2024-11-26'),
      daysListed: 14,
      priceChangeRequest: {
        requestId: 'pcr-001',
        requestedPrice: 95.00,
        requestedEarnings: 57.00,
        ownerNote: 'This has been listed for a while. Similar bags have sold recently at lower prices. A reduction should help it move. What do you think?',
        updatedMarketPrice: 90.00,
        requestDate: new Date('2024-12-08'),
        expiresDate: new Date('2024-12-15')
      }
    },
    {
      id: '2',
      name: 'Mid-Century Table Lamp',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center',
      listedPrice: 85.00,
      consignorEarnings: 51.00,
      status: 'sold',
      listedDate: new Date('2024-11-10'),
      soldDate: new Date('2024-11-20'),
      daysListed: 10
    },
    {
      id: '3',
      name: 'Wool Winter Coat',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551318181-655e8c4c5bf5?w=400&h=400&fit=crop&crop=center',
      listedPrice: 150.00,
      consignorEarnings: 90.00,
      status: 'expired',
      listedDate: new Date('2024-08-15'),
      daysListed: 90
    },
    {
      id: '4',
      name: 'Vintage Record Player',
      thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
      listedPrice: 200.00,
      consignorEarnings: 120.00,
      status: 'available',
      listedDate: new Date('2024-12-01'),
      daysListed: 9
    },
    {
      id: '5',
      name: 'Designer Silk Scarf',
      thumbnailUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=400&fit=crop&crop=center',
      listedPrice: 45.00,
      consignorEarnings: 27.00,
      status: 'sold',
      listedDate: new Date('2024-11-15'),
      soldDate: new Date('2024-11-18'),
      daysListed: 3
    },
    {
      id: '6',
      name: 'Antique Jewelry Box',
      thumbnailUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center',
      listedPrice: 75.00,
      consignorEarnings: 45.00,
      status: 'available',
      listedDate: new Date('2024-11-25'),
      daysListed: 15,
      priceChangeRequest: {
        requestId: 'pcr-002',
        requestedPrice: 55.00,
        requestedEarnings: 33.00,
        ownerNote: 'Antique jewelry boxes in this style have been moving better at this price point. Would you like to try the lower price?',
        requestDate: new Date('2024-12-09'),
        expiresDate: new Date('2024-12-16')
      }
    },
    {
      id: '7',
      name: 'Ceramic Vase Set',
      thumbnailUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
      listedPrice: 60.00,
      consignorEarnings: 36.00,
      status: 'returned',
      listedDate: new Date('2024-10-20'),
      daysListed: 30
    },
    {
      id: '8',
      name: 'Leather Bound Books Set',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center',
      listedPrice: 95.00,
      consignorEarnings: 57.00,
      status: 'available',
      listedDate: new Date('2024-11-30'),
      daysListed: 10
    },
    {
      id: '9',
      name: 'Art Deco Mirror',
      thumbnailUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center',
      listedPrice: 180.00,
      consignorEarnings: 108.00,
      status: 'sold',
      listedDate: new Date('2024-11-05'),
      soldDate: new Date('2024-11-22'),
      daysListed: 17
    },
    {
      id: '10',
      name: 'Vintage Camera',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop&crop=center',
      listedPrice: 275.00,
      consignorEarnings: 165.00,
      status: 'available',
      listedDate: new Date('2024-12-05'),
      daysListed: 5
    },
    {
      id: '11',
      name: 'Crystal Chandelier',
      thumbnailUrl: 'https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=400&h=400&fit=crop&crop=center',
      listedPrice: 350.00,
      consignorEarnings: 210.00,
      status: 'expired',
      listedDate: new Date('2024-07-01'),
      daysListed: 90
    },
    {
      id: '12',
      name: 'Hand-Woven Rug',
      thumbnailUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center',
      listedPrice: 220.00,
      consignorEarnings: 132.00,
      status: 'returned',
      listedDate: new Date('2024-09-15'),
      daysListed: 60
    }
  ];

  getConsignorItems(request: ConsignorItemsRequest = {}): Observable<ConsignorItemsResponse> {
    let filteredItems = [...this.mockItems];

    // Apply status filter
    if (request.filter?.status) {
      filteredItems = filteredItems.filter(item => item.status === request.filter?.status);
    }

    // Apply search filter
    if (request.filter?.searchText) {
      const searchLower = request.filter.searchText.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (request.sort) {
      filteredItems = this.sortItems(filteredItems, request.sort);
    } else {
      // Default sort: newest first
      filteredItems = this.sortItems(filteredItems, { field: 'listedDate', direction: 'desc' });
    }

    // Calculate pagination
    const page = request.page || 1;
    const pageSize = request.pageSize || 10;
    const totalCount = filteredItems.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = filteredItems.slice(startIndex, endIndex);

    // Calculate status counts
    const statusCounts = {
      all: this.mockItems.length,
      available: this.mockItems.filter(item => item.status === 'available').length,
      sold: this.mockItems.filter(item => item.status === 'sold').length,
      returned: this.mockItems.filter(item => item.status === 'returned').length,
      expired: this.mockItems.filter(item => item.status === 'expired').length,
    };

    const response: ConsignorItemsResponse = {
      items,
      totalCount,
      page,
      pageSize,
      totalPages,
      statusCounts
    };

    // Simulate API delay
    return of(response).pipe(delay(300));
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

  respondToPriceChange(request: PriceChangeDecisionRequest): Observable<{ success: boolean; message: string }> {
    const item = this.mockItems.find(item => item.id === request.itemId);

    if (!item || !item.priceChangeRequest) {
      return of({ success: false, message: 'Item or price change request not found.' }).pipe(delay(300));
    }

    // Simulate processing the response
    switch (request.response.decision) {
      case 'accept':
        item.listedPrice = item.priceChangeRequest.requestedPrice;
        item.consignorEarnings = item.priceChangeRequest.requestedEarnings;
        item.priceChangeRequest = undefined; // Remove the request
        return of({
          success: true,
          message: `Price updated to ${item.listedPrice.toFixed(2)}. Your new earnings: ${item.consignorEarnings.toFixed(2)}.`
        }).pipe(delay(500));

      case 'keep_current':
        item.priceChangeRequest = undefined; // Remove the request
        return of({
          success: true,
          message: 'Item will continue at current price. No changes made.'
        }).pipe(delay(500));

      case 'decline_retrieve':
        item.status = 'returned'; // Mark for pickup
        item.priceChangeRequest = undefined; // Remove the request
        return of({
          success: true,
          message: 'Item marked for retrieval and removed from listing. You can pick it up during business hours.'
        }).pipe(delay(500));

      default:
        return of({ success: false, message: 'Invalid decision.' }).pipe(delay(300));
    }
  }
}