import { Injectable } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';

export interface ConsignorItemDto {
  id: string;
  name: string;
  primaryImageUrl: string;
  category: string;
  status: 'available' | 'sold' | 'pending_review' | 'pending_consignor_approval' | 'expired' | 'ready_for_pickup';
  listedPrice: number;
  consignorEarnings: number;
  splitPercentage: number;
  listedDate: Date;
  soldDate?: Date;
  daysListed: number;
  expirationDate?: Date;
  daysUntilExpiration?: number;
  hasPendingPriceRequest: boolean;
  requiresResponse: boolean;
}

export interface ItemImageDto {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ItemPriceHistoryDto {
  id: string;
  date: Date;
  listedPrice: number;
  suggestedPrice: number;
  marketPrice: number;
  changedBy: 'Owner' | 'Consignor';
  reason: string;
}

export interface ItemPriceChangeRequestDto {
  id: string;
  requestDate: Date;
  requestedPrice: number;
  currentPrice: number;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  requestedBy: 'Owner' | 'Consignor';
}

export interface ItemReturnRequestDto {
  id: string;
  itemId: string;
  itemName: string;
  itemThumbnailUrl: string;

  consignorId: string;
  consignorName: string;
  consignorPhone?: string;
  consignorEmail: string;

  reason: 'no_longer_selling' | 'need_it_back' | 'other';
  notes?: string;
  preferredPickup: string;

  status: 'pending' | 'ready' | 'completed' | 'declined';
  submittedDate: Date;
  readyDate?: Date;
  completedDate?: Date;
  declinedDate?: Date;
  declineReason?: string;

  pickupInstructions?: string;
}

export interface CreateReturnRequestDto {
  itemId: string;
  reason: 'no_longer_selling' | 'need_it_back' | 'other';
  notes?: string;
  preferredPickup: string;
}

export interface ConsignorItemDetailDto extends ConsignorItemDto {
  description: string;
  brand: string;
  size: string;
  color: string;
  condition: string;
  images: ItemImageDto[];
  suggestedPrice: number;
  marketPrice: number;
  ownerNote: string;
  soldPrice?: number;
  earnedAmount?: number;
  pendingPriceRequest?: ItemPriceChangeRequestDto;
  pendingReturnRequest?: ItemReturnRequestDto;
  priceHistory: ItemPriceHistoryDto[];
}

export interface ConsignorItemsQuery {
  status?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'price_high' | 'price_low';
  page?: number;
  pageSize?: number;
}

export interface CreatePriceChangeRequestDto {
  currentPrice: number;
  requestedPrice: number;
  reason?: string;
}

export interface PriceRequestListItemDto {
  id: string;
  itemId: string;
  itemName: string;
  itemImageUrl: string;
  category: string;
  brand?: string;
  consignorName: string;
  consignorSplitPercentage: number;
  currentPrice: number;
  requestedPrice: number;
  consignorReason: string;
  daysListed: number;
  requestDate: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ReviewPriceRequestDto {
  approved: boolean;
  ownerNotes?: string;
}

export interface PriceRequestsQuery {
  status?: 'pending' | 'approved' | 'rejected' | 'all';
  sortBy?: 'newest' | 'oldest' | 'price_change';
}

export interface PagedConsignorItems {
  items: ConsignorItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MockConsignorItemService {

  private mockItems: ConsignorItemDto[] = [
    {
      id: '1',
      name: 'Vintage Coach Handbag',
      primaryImageUrl: 'https://via.placeholder.com/300x300?text=Coach+Bag',
      category: 'Accessories',
      status: 'available',
      listedPrice: 85.00,
      consignorEarnings: 51.00,
      splitPercentage: 60,
      listedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      daysListed: 45,
      expirationDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      daysUntilExpiration: 45,
      hasPendingPriceRequest: false,
      requiresResponse: false
    },
    {
      id: '2',
      name: 'Mid-Century Table Lamp',
      primaryImageUrl: 'https://via.placeholder.com/300x300?text=Table+Lamp',
      category: 'Home Decor',
      status: 'sold',
      listedPrice: 75.00,
      consignorEarnings: 45.00,
      splitPercentage: 60,
      listedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      soldDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // sold 10 days ago
      daysListed: 50,
      hasPendingPriceRequest: false,
      requiresResponse: false
    },
    {
      id: '3',
      name: 'Vintage Band T-Shirt',
      primaryImageUrl: 'https://via.placeholder.com/300x300?text=Band+Tshirt',
      category: 'Clothing',
      status: 'pending_consignor_approval',
      listedPrice: 85.00,
      consignorEarnings: 39.00, // Based on proposed $65 price
      splitPercentage: 60,
      listedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      daysListed: 30,
      expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      daysUntilExpiration: 60,
      hasPendingPriceRequest: true,
      requiresResponse: true
    },
    {
      id: '4',
      name: 'Designer Scarf Collection',
      primaryImageUrl: 'https://via.placeholder.com/300x300?text=Designer+Scarves',
      category: 'Accessories',
      status: 'available',
      listedPrice: 120.00,
      consignorEarnings: 72.00,
      splitPercentage: 60,
      listedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      daysListed: 15,
      expirationDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
      daysUntilExpiration: 75,
      hasPendingPriceRequest: false,
      requiresResponse: false
    },
    {
      id: '5',
      name: 'Antique Jewelry Box',
      primaryImageUrl: 'https://via.placeholder.com/300x300?text=Jewelry+Box',
      category: 'Antiques',
      status: 'expired',
      listedPrice: 95.00,
      consignorEarnings: 57.00,
      splitPercentage: 60,
      listedDate: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000),
      daysListed: 95,
      expirationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // expired 5 days ago
      daysUntilExpiration: -5,
      hasPendingPriceRequest: false,
      requiresResponse: false
    },
    {
      id: '6',
      name: 'Leather Boots',
      primaryImageUrl: 'https://via.placeholder.com/300x300?text=Leather+Boots',
      category: 'Shoes',
      status: 'ready_for_pickup',
      listedPrice: 65.00,
      consignorEarnings: 39.00,
      splitPercentage: 60,
      listedDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      daysListed: 120,
      hasPendingPriceRequest: false,
      requiresResponse: false
    },
    {
      id: '7',
      name: 'Crystal Vase Set',
      primaryImageUrl: 'https://via.placeholder.com/300x300?text=Crystal+Vase',
      category: 'Home Decor',
      status: 'sold',
      listedPrice: 150.00,
      consignorEarnings: 90.00,
      splitPercentage: 60,
      listedDate: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
      soldDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      daysListed: 75,
      hasPendingPriceRequest: false,
      requiresResponse: false
    },
    {
      id: '8',
      name: 'Art Deco Mirror',
      primaryImageUrl: 'https://via.placeholder.com/300x300?text=Art+Deco+Mirror',
      category: 'Home Decor',
      status: 'pending_review',
      listedPrice: 200.00,
      consignorEarnings: 120.00,
      splitPercentage: 60,
      listedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      daysListed: 5,
      expirationDate: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000),
      daysUntilExpiration: 85,
      hasPendingPriceRequest: true,
      requiresResponse: false // This is owner review, not consignor
    }
  ];

  getMyItems(query?: ConsignorItemsQuery): Observable<PagedConsignorItems> {
    let filteredItems = [...this.mockItems];

    // Filter by status
    if (query?.status) {
      filteredItems = filteredItems.filter(item => item.status === query.status);
    }

    // Search by name
    if (query?.search) {
      const searchLower = query.search.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (query?.sortBy) {
      switch (query.sortBy) {
        case 'newest':
          filteredItems.sort((a, b) => b.listedDate.getTime() - a.listedDate.getTime());
          break;
        case 'oldest':
          filteredItems.sort((a, b) => a.listedDate.getTime() - b.listedDate.getTime());
          break;
        case 'price_high':
          filteredItems.sort((a, b) => b.listedPrice - a.listedPrice);
          break;
        case 'price_low':
          filteredItems.sort((a, b) => a.listedPrice - b.listedPrice);
          break;
      }
    }

    // Pagination
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;
    const totalCount = filteredItems.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedItems = filteredItems.slice(startIndex, endIndex);

    const result: PagedConsignorItems = {
      items: pagedItems,
      totalCount,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };

    // Simulate network delay
    return of(result).pipe(delay(500));
  }

  getItemCounts(): Observable<{ total: number; available: number; sold: number; pending: number; returned: number }> {
    const counts = {
      total: this.mockItems.length,
      available: this.mockItems.filter(i => i.status === 'available').length,
      sold: this.mockItems.filter(i => i.status === 'sold').length,
      pending: this.mockItems.filter(i =>
        i.status === 'pending_review' ||
        i.status === 'pending_consignor_approval' ||
        i.status === 'expired'
      ).length,
      returned: this.mockItems.filter(i => i.status === 'ready_for_pickup').length
    };

    return of(counts).pipe(delay(300));
  }

  getItemDetail(id: string): Observable<ConsignorItemDetailDto | null> {
    const baseItem = this.mockItems.find(item => item.id === id);
    if (!baseItem) {
      return of(null).pipe(delay(500));
    }

    const detailItem: ConsignorItemDetailDto = {
      ...baseItem,
      description: this.getDetailDescription(id),
      brand: this.getDetailBrand(id),
      size: this.getDetailSize(id),
      color: this.getDetailColor(id),
      condition: this.getDetailCondition(id),
      images: this.getDetailImages(id),
      suggestedPrice: this.getDetailSuggestedPrice(id),
      marketPrice: this.getDetailMarketPrice(id),
      ownerNote: this.getDetailOwnerNote(id),
      soldPrice: baseItem.status === 'sold' ? baseItem.listedPrice : undefined,
      earnedAmount: baseItem.status === 'sold' ? baseItem.consignorEarnings : undefined,
      pendingPriceRequest: baseItem.hasPendingPriceRequest ? this.getDetailPriceRequest(id) : undefined,
      pendingReturnRequest: undefined, // No return requests in mock data for now
      priceHistory: this.getDetailPriceHistory(id)
    };

    return of(detailItem).pipe(delay(500));
  }

  private getDetailDescription(id: string): string {
    const descriptions: { [key: string]: string } = {
      '1': 'Beautiful vintage Coach bag from the 1990s. Brown leather with brass hardware. Some minor wear on corners but overall excellent condition. Original dust bag included.',
      '2': 'Mid-century modern table lamp with brass base and original shade. Works perfectly. A few small dings in the metal base but nothing major. Great accent piece.',
      '3': 'Rare vintage band t-shirt from 1985 tour. 100% cotton, still very soft. Minor fading consistent with age. True vintage piece for collectors.',
      '4': 'Collection of 3 designer scarves - two silk Hermès-style and one cashmere. Beautiful patterns and colors. One has very minor snag, others perfect.',
      '5': 'Antique wooden jewelry box with velvet lining. Hand-carved details on lid and sides. Original key included. Some age-appropriate wear on finish.',
      '6': 'Genuine leather boots, lightly worn. Italian-made with excellent construction. Minor scuffs that can be polished out. Very comfortable.',
      '7': 'Set of 3 crystal vases in graduated sizes. No chips or cracks. Beautiful clarity and weight. Perfect for flowers or display.',
      '8': 'Art Deco mirror with original beveled glass. Frame has been professionally restored. Stunning piece that will be a focal point in any room.'
    };
    return descriptions[id] || 'Beautiful item in great condition.';
  }

  private getDetailBrand(id: string): string {
    const brands: { [key: string]: string } = {
      '1': 'Coach',
      '2': 'West Elm',
      '3': 'Vintage Rock',
      '4': 'Designer Collection',
      '5': 'Antique',
      '6': 'Italian Leather Co.',
      '7': 'Crystal Works',
      '8': 'Art Deco Original'
    };
    return brands[id] || 'Unknown';
  }

  private getDetailSize(id: string): string {
    const sizes: { [key: string]: string } = {
      '1': 'Medium',
      '2': '24" H x 8" W',
      '3': 'Large',
      '4': 'One Size',
      '5': '8" x 6" x 4"',
      '6': 'Size 9',
      '7': 'Small: 6", Med: 8", Large: 10"',
      '8': '36" x 24"'
    };
    return sizes[id] || 'One Size';
  }

  private getDetailColor(id: string): string {
    const colors: { [key: string]: string } = {
      '1': 'Brown',
      '2': 'Brass/Cream',
      '3': 'Black',
      '4': 'Multi-Color',
      '5': 'Walnut Brown',
      '6': 'Black',
      '7': 'Clear',
      '8': 'Silver'
    };
    return colors[id] || 'Multi-Color';
  }

  private getDetailCondition(id: string): string {
    const conditions: { [key: string]: string } = {
      '1': 'Very Good',
      '2': 'Good',
      '3': 'Vintage/Used',
      '4': 'Excellent',
      '5': 'Good',
      '6': 'Very Good',
      '7': 'Like New',
      '8': 'Restored'
    };
    return conditions[id] || 'Good';
  }

  private getDetailImages(id: string): ItemImageDto[] {
    const baseUrl = 'https://via.placeholder.com';
    const imageMap: { [key: string]: string[] } = {
      '1': [`${baseUrl}/400x400?text=Coach+Bag+Main`, `${baseUrl}/400x400?text=Coach+Bag+2`, `${baseUrl}/400x400?text=Coach+Bag+3`],
      '2': [`${baseUrl}/400x400?text=Table+Lamp+Main`, `${baseUrl}/400x400?text=Table+Lamp+Detail`],
      '3': [`${baseUrl}/400x400?text=Band+Tshirt+Front`, `${baseUrl}/400x400?text=Band+Tshirt+Back`],
      '4': [`${baseUrl}/400x400?text=Scarves+Collection`, `${baseUrl}/400x400?text=Scarf+Detail+1`, `${baseUrl}/400x400?text=Scarf+Detail+2`],
      '5': [`${baseUrl}/400x400?text=Jewelry+Box+Closed`, `${baseUrl}/400x400?text=Jewelry+Box+Open`],
      '6': [`${baseUrl}/400x400?text=Leather+Boots+Main`, `${baseUrl}/400x400?text=Leather+Boots+Side`],
      '7': [`${baseUrl}/400x400?text=Crystal+Vase+Set`, `${baseUrl}/400x400?text=Crystal+Detail`],
      '8': [`${baseUrl}/400x400?text=Art+Deco+Mirror`, `${baseUrl}/400x400?text=Mirror+Detail`]
    };

    const urls = imageMap[id] || [`${baseUrl}/400x400?text=Item+Photo`];
    return urls.map((url, index) => ({
      id: `${id}-img-${index + 1}`,
      url,
      isPrimary: index === 0,
      sortOrder: index + 1
    }));
  }

  private getDetailSuggestedPrice(id: string): number {
    const suggested: { [key: string]: number } = {
      '1': 125.00,
      '2': 95.00,
      '3': 95.00,
      '4': 150.00,
      '5': 110.00,
      '6': 85.00,
      '7': 175.00,
      '8': 250.00
    };
    return suggested[id] || 100.00;
  }

  private getDetailMarketPrice(id: string): number {
    const baseItem = this.mockItems.find(item => item.id === id);
    return baseItem?.listedPrice || 50.00;
  }

  private getDetailOwnerNote(id: string): string {
    const notes: { [key: string]: string } = {
      '1': 'Similar Coach bags from this era are selling $75-95 in our area. Great item - should move well at this price!',
      '2': 'Mid-century lighting is very popular right now. This piece is in good working condition and priced competitively.',
      '3': 'Vintage band tees are hot right now, especially from the 80s. This is authentic and in surprisingly good condition for its age.',
      '4': 'Designer scarves always sell well. Priced to move quickly as a set - individual pieces would be worth more but take longer to sell.',
      '5': 'Antique jewelry boxes are steady sellers. Nice craftsmanship on this piece. Should appeal to collectors.',
      '6': 'Quality Italian leather boots in good condition. Size 9 is a popular size. Priced fairly for quick sale.',
      '7': 'Crystal is making a comeback! These have beautiful clarity and weight. Set pricing makes them attractive to buyers.',
      '8': 'Art Deco pieces are very sought after right now. This mirror has been professionally restored and is a real showpiece.'
    };
    return notes[id] || 'This item is priced competitively based on current market conditions.';
  }

  private getDetailPriceRequest(id: string): ItemPriceChangeRequestDto | undefined {
    if (id === '3') { // Vintage band t-shirt has pending price request
      return {
        id: 'pr-1',
        requestDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        requestedPrice: 65.00,
        currentPrice: 85.00,
        reason: 'Lower price to increase chances of sale',
        status: 'pending',
        requestedBy: 'Owner'
      };
    }
    return undefined;
  }

  private getDetailPriceHistory(id: string): ItemPriceHistoryDto[] {
    const baseItem = this.mockItems.find(item => item.id === id);
    if (!baseItem) return [];

    return [
      {
        id: `ph-${id}-1`,
        date: baseItem.listedDate,
        listedPrice: baseItem.listedPrice,
        suggestedPrice: this.getDetailSuggestedPrice(id),
        marketPrice: baseItem.listedPrice,
        changedBy: 'Owner',
        reason: 'Initial listing based on market research'
      }
    ];
  }

  requestPriceChange(itemId: string, request: CreatePriceChangeRequestDto): Observable<ItemPriceChangeRequestDto> {
    // Mock implementation
    return of({
      id: 'new-request-id',
      requestDate: new Date(),
      currentPrice: request.currentPrice,
      requestedPrice: request.requestedPrice,
      reason: request.reason || '',
      status: 'pending' as 'pending' | 'approved' | 'declined',
      requestedBy: 'Consignor' as 'Owner' | 'Consignor'
    }).pipe(delay(500));
  }

  // Owner functionality
  getPriceRequests(query?: PriceRequestsQuery): Observable<PriceRequestListItemDto[]> {
    const mockRequests: PriceRequestListItemDto[] = [
      {
        id: 'req-1',
        itemId: '1',
        itemName: 'Vintage Coach Handbag',
        itemImageUrl: 'https://picsum.photos/400x400?text=Coach+Bag',
        category: 'Bags',
        brand: 'Coach',
        consignorName: 'Jane Doe',
        consignorSplitPercentage: 60,
        currentPrice: 85.00,
        requestedPrice: 65.00,
        consignorReason: "Item hasn't moved in 45 days. Need cash this month.",
        daysListed: 45,
        requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        id: 'req-2',
        itemId: '6',
        itemName: 'Leather Boots',
        itemImageUrl: 'https://picsum.photos/400x400?text=Leather+Boots',
        category: 'Shoes',
        brand: 'Timberland',
        consignorName: 'Bob Smith',
        consignorSplitPercentage: 55,
        currentPrice: 120.00,
        requestedPrice: 150.00,
        consignorReason: "Saw similar boots sell for $180 online recently",
        daysListed: 20,
        requestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        id: 'req-3',
        itemId: '3',
        itemName: 'Vintage Band T-Shirt',
        itemImageUrl: 'https://picsum.photos/400x400?text=Band+Tee',
        category: 'Clothing',
        brand: 'Vintage',
        consignorName: 'Alex Johnson',
        consignorSplitPercentage: 50,
        currentPrice: 45.00,
        requestedPrice: 35.00,
        consignorReason: "Want to move it quickly before summer ends",
        daysListed: 30,
        requestDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'approved'
      },
      {
        id: 'req-4',
        itemId: '15',
        itemName: 'Designer Watch',
        itemImageUrl: 'https://picsum.photos/400x400?text=Designer+Watch',
        category: 'Jewelry',
        brand: 'Fossil',
        consignorName: 'Emily Chen',
        consignorSplitPercentage: 70,
        currentPrice: 180.00,
        requestedPrice: 160.00,
        consignorReason: 'Price drop to attract more buyers',
        daysListed: 50,
        requestDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        status: 'rejected'
      }
    ];

    let filteredRequests = mockRequests;

    // Filter by status
    if (query?.status && query.status !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.status === query.status);
    }

    // Sort
    if (query?.sortBy) {
      switch (query.sortBy) {
        case 'newest':
          filteredRequests.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
          break;
        case 'oldest':
          filteredRequests.sort((a, b) => a.requestDate.getTime() - b.requestDate.getTime());
          break;
        case 'price_change':
          filteredRequests.sort((a, b) => Math.abs(b.requestedPrice - b.currentPrice) - Math.abs(a.requestedPrice - a.currentPrice));
          break;
      }
    }

    return of(filteredRequests).pipe(delay(300));
  }

  getPendingRequestsCount(): Observable<number> {
    return this.getPriceRequests({ status: 'pending' }).pipe(
      map(requests => requests.length)
    );
  }

  reviewPriceRequest(requestId: string, review: ReviewPriceRequestDto): Observable<any> {
    // Mock implementation - simulate review processing
    return of({
      id: requestId,
      status: review.approved ? 'approved' : 'rejected',
      reviewedAt: new Date(),
      ownerNotes: review.ownerNotes
    }).pipe(delay(800));
  }

  quickApproveRequest(requestId: string): Observable<any> {
    // Mock implementation for quick approve
    return of({
      id: requestId,
      status: 'approved',
      reviewedAt: new Date()
    }).pipe(delay(400));
  }

  quickRejectRequest(requestId: string): Observable<any> {
    // Mock implementation for quick reject
    return of({
      id: requestId,
      status: 'rejected',
      reviewedAt: new Date()
    }).pipe(delay(400));
  }

  // Return Request Methods
  requestItemReturn(itemId: string, request: CreateReturnRequestDto): Observable<ItemReturnRequestDto> {
    const item = this.mockItems.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Item not found');
    }

    const returnRequest: ItemReturnRequestDto = {
      id: `return-${Date.now()}`,
      itemId: itemId,
      itemName: item.name,
      itemThumbnailUrl: item.primaryImageUrl,

      consignorId: 'consignor-123',
      consignorName: 'Jane Doe',
      consignorEmail: 'jane@example.com',
      consignorPhone: '(555) 123-4567',

      reason: request.reason,
      notes: request.notes,
      preferredPickup: request.preferredPickup,

      status: 'pending',
      submittedDate: new Date()
    };

    // Update item to have pending return request
    const itemIndex = this.mockItems.findIndex(i => i.id === itemId);
    if (itemIndex >= 0) {
      this.mockItems[itemIndex] = {
        ...this.mockItems[itemIndex],
        status: 'pending_return' as any
      };
    }

    return of(returnRequest).pipe(delay(800));
  }

  getReturnRequests(status?: 'pending' | 'ready' | 'completed' | 'declined' | 'all'): Observable<ItemReturnRequestDto[]> {
    const mockReturnRequests: ItemReturnRequestDto[] = [
      {
        id: 'return-1',
        itemId: '1',
        itemName: 'Vintage Coach Handbag',
        itemThumbnailUrl: 'https://via.placeholder.com/300x300?text=Coach+Bag',

        consignorId: 'consignor-1',
        consignorName: 'Jane Doe',
        consignorEmail: 'jane@example.com',
        consignorPhone: '(555) 123-4567',

        reason: 'no_longer_selling',
        notes: 'Moving out of state and need to pack up belongings.',
        preferredPickup: 'Weekday afternoons (2pm-6pm)',

        status: 'pending',
        submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: 'return-2',
        itemId: '6',
        itemName: 'Leather Boots',
        itemThumbnailUrl: 'https://via.placeholder.com/300x300?text=Leather+Boots',

        consignorId: 'consignor-2',
        consignorName: 'Bob Smith',
        consignorEmail: 'bob@example.com',

        reason: 'need_it_back',
        notes: 'Weather turned cold, need my boots back!',
        preferredPickup: 'Contact me',

        status: 'pending',
        submittedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: 'return-3',
        itemId: '3',
        itemName: 'Designer Watch',
        itemThumbnailUrl: 'https://via.placeholder.com/300x300?text=Designer+Watch',

        consignorId: 'consignor-3',
        consignorName: 'Amy Johnson',
        consignorEmail: 'amy@example.com',

        reason: 'other',
        notes: 'Changed my mind about selling',
        preferredPickup: 'Weekend mornings (10am-1pm)',

        status: 'ready',
        submittedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        readyDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // ready since 1 day ago
        pickupInstructions: 'Come to the front counter during store hours (10am-6pm). Ask for your item by name. Bring ID.'
      }
    ];

    let filteredRequests = mockReturnRequests;
    if (status && status !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.status === status);
    }

    return of(filteredRequests).pipe(delay(300));
  }

  getPendingReturnRequestsCount(): Observable<number> {
    return this.getReturnRequests('pending').pipe(
      map(requests => requests.length)
    );
  }

  markReturnRequestReady(requestId: string, instructions: string): Observable<any> {
    return of({
      id: requestId,
      status: 'ready',
      readyDate: new Date(),
      pickupInstructions: instructions
    }).pipe(delay(500));
  }

  markReturnRequestComplete(requestId: string): Observable<any> {
    return of({
      id: requestId,
      status: 'completed',
      completedDate: new Date()
    }).pipe(delay(500));
  }

  declineReturnRequest(requestId: string, reason: string): Observable<any> {
    return of({
      id: requestId,
      status: 'declined',
      declinedDate: new Date(),
      declineReason: reason
    }).pipe(delay(500));
  }
}