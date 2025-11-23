import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ShopperStoreService, StoreInfoDto } from './shopper-store.service';

describe('ShopperStoreService', () => {
  let service: ShopperStoreService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  const mockStoreSlug = 'test-store';

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj('HttpClient', ['get']);

    TestBed.configureTestingModule({
      providers: [
        ShopperStoreService,
        { provide: HttpClient, useValue: mockHttpClient }
      ]
    });

    service = TestBed.inject(ShopperStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null current store', fakeAsync(() => {
    service.currentStore$.subscribe(store => {
      expect(store).toBeNull();
    });
    tick();
  }));

  it('should fetch store info successfully', fakeAsync(() => {
    const mockStoreInfo: StoreInfoDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Store',
      slug: mockStoreSlug,
      description: 'A test consignment store',
      address: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      phone: '555-123-4567',
      email: 'info@teststore.com',
      logoUrl: 'https://example.com/logo.jpg',
      bannerUrl: 'https://example.com/banner.jpg',
      isActive: true,
      businessHours: 'Mon-Fri 9AM-6PM',
      website: 'https://teststore.com',
      facebookUrl: 'https://facebook.com/teststore',
      instagramUrl: 'https://instagram.com/teststore'
    };

    mockHttpClient.get.and.returnValue(of(mockStoreInfo));

    service.getStoreInfo(mockStoreSlug).subscribe(storeInfo => {
      expect(storeInfo).toEqual(mockStoreInfo);
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalled();
  }));

  it('should handle store not found error', fakeAsync(() => {
    mockHttpClient.get.and.returnValue(
      throwError(() => ({ status: 404 }))
    );

    service.getStoreInfo('nonexistent-store').subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error.status).toBe(404);
      }
    });

    tick();
  }));

  it('should handle server error', fakeAsync(() => {
    mockHttpClient.get.and.returnValue(
      throwError(() => ({ status: 500 }))
    );

    service.getStoreInfo(mockStoreSlug).subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    tick();
  }));

  it('should set current store and emit to observable', fakeAsync(() => {
    const mockStoreInfo: StoreInfoDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Store',
      slug: mockStoreSlug,
      description: 'A test store',
      isActive: true
    };

    let receivedStoreInfo: StoreInfoDto | null = null;
    service.currentStore$.subscribe(store => {
      receivedStoreInfo = store;
    });

    service.setCurrentStore(mockStoreInfo);
    tick();

    expect(receivedStoreInfo).toEqual(mockStoreInfo);
  }));

  it('should handle null store info', fakeAsync(() => {
    let receivedStoreInfo: StoreInfoDto | null = undefined;
    service.currentStore$.subscribe(store => {
      receivedStoreInfo = store;
    });

    service.setCurrentStore(null);
    tick();

    expect(receivedStoreInfo).toBeNull();
  }));

  it('should clear current store', fakeAsync(() => {
    const mockStoreInfo: StoreInfoDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Store',
      slug: mockStoreSlug,
      isActive: true
    };

    let receivedStoreInfo: StoreInfoDto | null = undefined;
    service.currentStore$.subscribe(store => {
      receivedStoreInfo = store;
    });

    service.setCurrentStore(mockStoreInfo);
    tick();
    expect(receivedStoreInfo).toEqual(mockStoreInfo);

    service.clearCurrentStore();
    tick();
    expect(receivedStoreInfo).toBeNull();
  }));

  it('should emit initial null value to new subscribers', fakeAsync(() => {
    let emissionCount = 0;
    let lastValue: StoreInfoDto | null = undefined;

    service.currentStore$.subscribe(store => {
      emissionCount++;
      lastValue = store;
    });

    tick();

    expect(emissionCount).toBe(1);
    expect(lastValue).toBeNull();
  }));

  it('should emit new values to all subscribers', fakeAsync(() => {
    const mockStoreInfo: StoreInfoDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Store',
      slug: mockStoreSlug,
      isActive: true
    };

    const subscriber1Values: (StoreInfoDto | null)[] = [];
    const subscriber2Values: (StoreInfoDto | null)[] = [];

    service.currentStore$.subscribe(store => {
      subscriber1Values.push(store);
    });

    service.currentStore$.subscribe(store => {
      subscriber2Values.push(store);
    });

    service.setCurrentStore(mockStoreInfo);
    tick();

    expect(subscriber1Values).toEqual([null, mockStoreInfo]);
    expect(subscriber2Values).toEqual([null, mockStoreInfo]);
  }));

  it('should handle network errors gracefully', fakeAsync(() => {
    let errorReceived = false;

    mockHttpClient.get.and.returnValue(
      throwError(() => new Error('Network Error'))
    );

    service.getStoreInfo(mockStoreSlug).subscribe({
      next: () => fail('Should have failed'),
      error: () => {
        errorReceived = true;
      }
    });

    tick();

    expect(errorReceived).toBeTruthy();
  }));

  it('should handle malformed response data', fakeAsync(() => {
    const malformedData = { invalidProperty: 'not a valid store info' };
    mockHttpClient.get.and.returnValue(of(malformedData));

    service.getStoreInfo(mockStoreSlug).subscribe(storeInfo => {
      expect(storeInfo).toBeDefined();
    });

    tick();
  }));

  it('should maintain store state across multiple operations', fakeAsync(() => {
    const mockStoreInfo: StoreInfoDto = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Store',
      slug: mockStoreSlug,
      isActive: true
    };

    const storeValues: (StoreInfoDto | null)[] = [];
    service.currentStore$.subscribe(store => {
      storeValues.push(store);
    });

    tick();
    expect(storeValues).toEqual([null]);

    service.setCurrentStore(mockStoreInfo);
    tick();
    expect(storeValues).toEqual([null, mockStoreInfo]);

    const updatedStoreInfo = { ...mockStoreInfo, name: 'Updated Store' };
    service.setCurrentStore(updatedStoreInfo);
    tick();
    expect(storeValues).toEqual([null, mockStoreInfo, updatedStoreInfo]);

    service.clearCurrentStore();
    tick();
    expect(storeValues).toEqual([null, mockStoreInfo, updatedStoreInfo, null]);
  }));
});