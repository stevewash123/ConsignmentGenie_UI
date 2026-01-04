import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ItemReservationService, ReservationResult, ReservationStatus } from './item-reservation.service';
import { environment } from '../../environments/environment';

describe('ItemReservationService', () => {
  let service: ItemReservationService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/items`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ItemReservationService]
    });

    service = TestBed.inject(ItemReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('reserveItem', () => {
    it('should reserve an item successfully', async () => {
      const itemId = 'test-item-id';
      const mockResponse: ReservationResult = {
        success: true,
        reservationId: 'res-123',
        expiresAt: new Date(Date.now() + 600000), // 10 minutes
        remainingTimeMs: 600000
      };

      const promise = service.reserveItem(itemId);

      const req = httpMock.expectOne(`${apiUrl}/${itemId}/reserve`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ reservedBy: 'POS-Terminal' });

      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should handle reservation conflicts', async () => {
      const itemId = 'test-item-id';
      const mockResponse: ReservationResult = {
        success: false,
        errorMessage: 'Item is already reserved',
        conflictType: 'reserved_elsewhere'
      };

      const promise = service.reserveItem(itemId);

      const req = httpMock.expectOne(`${apiUrl}/${itemId}/reserve`);
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors gracefully', async () => {
      const itemId = 'test-item-id';

      const promise = service.reserveItem(itemId);

      const req = httpMock.expectOne(`${apiUrl}/${itemId}/reserve`);
      req.error(new ProgressEvent('Network error'));

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Network error occurred while reserving item');
      expect(result.conflictType).toBe('api_error');
    });

    it('should use custom reservedBy parameter', async () => {
      const itemId = 'test-item-id';
      const customReservedBy = 'Custom-Terminal';
      const mockResponse: ReservationResult = {
        success: true,
        reservationId: 'res-123',
        expiresAt: new Date(),
        remainingTimeMs: 600000
      };

      const promise = service.reserveItem(itemId, customReservedBy);

      const req = httpMock.expectOne(`${apiUrl}/${itemId}/reserve`);
      expect(req.request.body).toEqual({ reservedBy: customReservedBy });

      req.flush(mockResponse);
      await promise;
    });
  });

  describe('releaseReservation', () => {
    it('should release a reservation successfully', async () => {
      const itemId = 'test-item-id';

      const promise = service.releaseReservation(itemId);

      const req = httpMock.expectOne(`${apiUrl}/${itemId}/reserve`);
      expect(req.request.method).toBe('DELETE');

      req.flush({});

      await promise; // Should complete without throwing
    });

    it('should handle release errors', async () => {
      const itemId = 'test-item-id';

      const promise = service.releaseReservation(itemId);

      const req = httpMock.expectOne(`${apiUrl}/${itemId}/reserve`);
      req.error(new ProgressEvent('Network error'));

      try {
        await promise;
        fail('Expected promise to reject');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe('getReservationStatus', () => {
    it('should get reservation status successfully', async () => {
      const itemId = 'test-item-id';
      const mockStatus: ReservationStatus = {
        isReserved: true,
        reservedBy: 'POS-Terminal',
        expiresAt: new Date(),
        remainingTimeMs: 300000
      };

      const promise = service.getReservationStatus(itemId);

      const req = httpMock.expectOne(`${apiUrl}/${itemId}/reservation-status`);
      expect(req.request.method).toBe('GET');

      req.flush(mockStatus);

      const result = await promise;
      expect(result).toEqual(mockStatus);
    });

    it('should return default status on error', async () => {
      const itemId = 'test-item-id';

      const promise = service.getReservationStatus(itemId);

      const req = httpMock.expectOne(`${apiUrl}/${itemId}/reservation-status`);
      req.error(new ProgressEvent('Network error'));

      const result = await promise;
      expect(result).toEqual({ isReserved: false });
    });
  });

  describe('utility methods', () => {
    describe('calculateRemainingTime', () => {
      it('should calculate remaining time correctly', () => {
        const futureDate = new Date(Date.now() + 300000); // 5 minutes
        const remaining = service.calculateRemainingTime(futureDate);

        expect(remaining).toBeGreaterThan(290000); // ~5 minutes (allowing for test execution time)
        expect(remaining).toBeLessThanOrEqual(300000);
      });

      it('should return 0 for past dates', () => {
        const pastDate = new Date(Date.now() - 60000); // 1 minute ago
        const remaining = service.calculateRemainingTime(pastDate);

        expect(remaining).toBe(0);
      });

      it('should return 0 for undefined date', () => {
        const remaining = service.calculateRemainingTime(undefined);
        expect(remaining).toBe(0);
      });
    });

    describe('formatTime', () => {
      it('should format time correctly', () => {
        expect(service.formatTime(300000)).toBe('5:00'); // 5 minutes
        expect(service.formatTime(90000)).toBe('1:30');  // 1 minute 30 seconds
        expect(service.formatTime(45000)).toBe('0:45');  // 45 seconds
        expect(service.formatTime(5000)).toBe('0:05');   // 5 seconds
        expect(service.formatTime(0)).toBe('0:00');      // 0 seconds
      });
    });

    describe('isExpiringWarning', () => {
      it('should return true for times within warning threshold', () => {
        const oneMinute = 60000;
        const twoMinuteThreshold = 2 * 60000;

        expect(service.isExpiringWarning(oneMinute, twoMinuteThreshold)).toBe(true);
      });

      it('should return false for times outside warning threshold', () => {
        const fiveMinutes = 5 * 60000;
        const twoMinuteThreshold = 2 * 60000;

        expect(service.isExpiringWarning(fiveMinutes, twoMinuteThreshold)).toBe(false);
      });

      it('should return false for expired times', () => {
        const expiredTime = 0;
        const twoMinuteThreshold = 2 * 60000;

        expect(service.isExpiringWarning(expiredTime, twoMinuteThreshold)).toBe(false);
      });

      it('should use default threshold when not specified', () => {
        const oneMinute = 60000; // 1 minute

        expect(service.isExpiringWarning(oneMinute)).toBe(true); // Default is 2 minutes
      });
    });
  });
});