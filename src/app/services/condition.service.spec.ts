import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConditionService, ConditionOption } from './condition.service';
import { environment } from '../../environments/environment';

describe('ConditionService', () => {
  let service: ConditionService;
  let httpMock: HttpTestingController;

  const mockConditions: ConditionOption[] = [
    { value: 'New', label: 'New' },
    { value: 'LikeNew', label: 'Like New' },
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
    { value: 'Poor', label: 'Poor' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConditionService]
    });
    service = TestBed.inject(ConditionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should retrieve condition options from the API', () => {
      service.getAll().subscribe(conditions => {
        expect(conditions).toEqual(mockConditions);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/conditions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConditions);
    });

    it('should cache condition options on subsequent calls', () => {
      // First call
      service.getAll().subscribe(conditions => {
        expect(conditions).toEqual(mockConditions);
      });

      const firstReq = httpMock.expectOne(`${environment.apiUrl}/api/conditions`);
      firstReq.flush(mockConditions);

      // Second call should not make another HTTP request due to caching
      service.getAll().subscribe(conditions => {
        expect(conditions).toEqual(mockConditions);
      });

      // Verify no additional requests were made
      httpMock.expectNone(`${environment.apiUrl}/api/conditions`);
    });

    it('should handle empty condition list', () => {
      const emptyConditions: ConditionOption[] = [];

      service.getAll().subscribe(conditions => {
        expect(conditions).toEqual(emptyConditions);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/conditions`);
      req.flush(emptyConditions);
    });

    it('should handle HTTP errors gracefully', () => {
      const errorMessage = 'Failed to load conditions';

      service.getAll().subscribe({
        next: () => fail('Expected error, but got success'),
        error: error => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/conditions`);
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });
});