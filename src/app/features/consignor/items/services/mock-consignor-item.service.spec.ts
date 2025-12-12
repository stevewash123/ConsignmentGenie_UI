import { TestBed } from '@angular/core/testing';
import { MockConsignorItemService } from './mock-consignor-item.service';
import { ConsignorItemsRequest } from '../models/consignor-item.model';
import { firstValueFrom } from 'rxjs';

describe('MockConsignorItemService', () => {
  let service: MockConsignorItemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockConsignorItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all items when no filter is applied', async () => {
    const result = await firstValueFrom(service.getConsignorItems());

    expect(result).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.statusCounts).toBeDefined();
    expect(result.statusCounts.all).toBe(result.statusCounts.available + result.statusCounts.sold + result.statusCounts.returned + result.statusCounts.expired);
  });

  it('should filter items by status', async () => {
    const request: ConsignorItemsRequest = {
      filter: { status: 'available' }
    };

    const result = await firstValueFrom(service.getConsignorItems(request));

    expect(result.items.every(item => item.status === 'available')).toBeTruthy();
  });

  it('should filter items by search text', async () => {
    const request: ConsignorItemsRequest = {
      filter: { searchText: 'coach' }
    };

    const result = await firstValueFrom(service.getConsignorItems(request));

    expect(result.items.every(item =>
      item.name.toLowerCase().includes('coach')
    )).toBeTruthy();
  });

  it('should sort items by price descending', async () => {
    const request: ConsignorItemsRequest = {
      sort: { field: 'price', direction: 'desc' }
    };

    const result = await firstValueFrom(service.getConsignorItems(request));

    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i-1].listedPrice).toBeGreaterThanOrEqual(result.items[i].listedPrice);
    }
  });

  it('should sort items by name ascending', async () => {
    const request: ConsignorItemsRequest = {
      sort: { field: 'name', direction: 'asc' }
    };

    const result = await firstValueFrom(service.getConsignorItems(request));

    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i-1].name.localeCompare(result.items[i].name)).toBeLessThanOrEqual(0);
    }
  });

  it('should handle pagination correctly', async () => {
    const request: ConsignorItemsRequest = {
      page: 1,
      pageSize: 5
    };

    const result = await firstValueFrom(service.getConsignorItems(request));

    expect(result.items.length).toBeLessThanOrEqual(5);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(5);
    expect(result.totalPages).toBeGreaterThan(0);
  });

  it('should return empty array for page beyond total pages', async () => {
    const request: ConsignorItemsRequest = {
      page: 999,
      pageSize: 10
    };

    const result = await firstValueFrom(service.getConsignorItems(request));

    expect(result.items.length).toBe(0);
  });

  it('should calculate status counts correctly', async () => {
    const result = await firstValueFrom(service.getConsignorItems());

    expect(result.statusCounts.available).toBeGreaterThan(0);
    expect(result.statusCounts.sold).toBeGreaterThan(0);
    expect(result.statusCounts.returned).toBeGreaterThan(0);
    expect(result.statusCounts.expired).toBeGreaterThan(0);
    expect(result.statusCounts.all).toBe(
      result.statusCounts.available +
      result.statusCounts.sold +
      result.statusCounts.returned +
      result.statusCounts.expired
    );
  });
});