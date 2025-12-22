import { TestBed } from '@angular/core/testing';
import { MockConsignorItemService } from './mock-consignor-item.service';

describe('MockConsignorItemService', () => {
  let service: MockConsignorItemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockConsignorItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return mock items', (done) => {
    service.getMyItems().subscribe(result => {
      expect(result).toBeTruthy();
      expect(result.items).toBeTruthy();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThan(0);
      done();
    });
  });

  it('should filter items by status', (done) => {
    service.getMyItems({ status: 'available' }).subscribe(result => {
      expect(result).toBeTruthy();
      expect(result.items.every(item => item.status === 'available')).toBe(true);
      done();
    });
  });

  it('should search items by name', (done) => {
    service.getMyItems({ search: 'Coach' }).subscribe(result => {
      expect(result).toBeTruthy();
      expect(result.items.every(item =>
        item.name.toLowerCase().includes('coach')
      )).toBe(true);
      done();
    });
  });

  it('should return item counts', (done) => {
    service.getItemCounts().subscribe(counts => {
      expect(counts).toBeTruthy();
      expect(counts.total).toBeGreaterThan(0);
      expect(counts.available).toBeGreaterThanOrEqual(0);
      expect(counts.sold).toBeGreaterThanOrEqual(0);
      expect(counts.pending).toBeGreaterThanOrEqual(0);
      expect(counts.returned).toBeGreaterThanOrEqual(0);
      done();
    });
  });
});