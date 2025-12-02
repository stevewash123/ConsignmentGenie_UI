import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth.model';
import { of, throwError } from 'rxjs';

describe('AuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let interceptor: AuthInterceptor;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getToken',
      'isTokenExpired',
      'refreshToken',
      'logout'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthInterceptor,
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    interceptor = TestBed.inject(AuthInterceptor);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('intercept', () => {
    describe('when token exists and is valid', () => {
      it('should add Authorization header with Bearer token', () => {
        const mockToken = 'valid-token-123';
        authServiceSpy.getToken.and.returnValue(mockToken);
        authServiceSpy.isTokenExpired.and.returnValue(false);

        httpClient.get('/api/users').subscribe();

        const req = httpMock.expectOne('/api/users');
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
        req.flush({});
      });

      it('should preserve existing headers when adding token', () => {
        const mockToken = 'valid-token-123';
        authServiceSpy.getToken.and.returnValue(mockToken);
        authServiceSpy.isTokenExpired.and.returnValue(false);

        httpClient.get('/api/users', {
          headers: { 'Content-Type': 'application/json', 'X-Custom': 'custom-value' }
        }).subscribe();

        const req = httpMock.expectOne('/api/users');
        expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
        expect(req.request.headers.get('Content-Type')).toBe('application/json');
        expect(req.request.headers.get('X-Custom')).toBe('custom-value');
        req.flush({});
      });

      it('should pass request through and return successful response', () => {
        const mockToken = 'valid-token-123';
        const mockResponse = { id: '1', name: 'Test User' };
        authServiceSpy.getToken.and.returnValue(mockToken);
        authServiceSpy.isTokenExpired.and.returnValue(false);

        httpClient.get('/api/users/1').subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        const req = httpMock.expectOne('/api/users/1');
        req.flush(mockResponse);
      });
    });

    describe('when token does not exist', () => {
      it('should not add Authorization header', () => {
        authServiceSpy.getToken.and.returnValue(null);

        httpClient.get('/api/public').subscribe();

        const req = httpMock.expectOne('/api/public');
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({});
      });

      it('should pass request through without modification', () => {
        authServiceSpy.getToken.and.returnValue(null);
        const mockResponse = { data: 'public data' };

        httpClient.get('/api/public').subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        const req = httpMock.expectOne('/api/public');
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush(mockResponse);
      });
    });

    describe('when token is expired', () => {
      it('should not add Authorization header', () => {
        authServiceSpy.getToken.and.returnValue('expired-token');
        authServiceSpy.isTokenExpired.and.returnValue(true);

        httpClient.get('/api/users').subscribe();

        const req = httpMock.expectOne('/api/users');
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({});
      });
    });
  });

  describe('error handling', () => {
    describe('401 Unauthorized with valid token', () => {
      it('should attempt to refresh token and retry request', () => {
        const originalToken = 'original-token';
        const newToken = 'refreshed-token';
        const mockResponse = { id: '1', name: 'Test User' };

        authServiceSpy.getToken.and.returnValue(originalToken);
        authServiceSpy.isTokenExpired.and.returnValue(false);
        authServiceSpy.refreshToken.and.returnValue(of({
          token: newToken,
          userId: 'test-user-id',
          email: 'test@example.com',
          role: 1,
          organizationId: 'test-org-id',
          organizationName: 'Test Organization',
          expiresAt: '2024-12-31T23:59:59Z'
        } as AuthResponse));

        httpClient.get('/api/users/1').subscribe(response => {
          expect(response).toEqual(mockResponse);
        });

        // First request with original token fails with 401
        const firstReq = httpMock.expectOne('/api/users/1');
        expect(firstReq.request.headers.get('Authorization')).toBe(`Bearer ${originalToken}`);
        firstReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        // Retry request with new token succeeds
        const retryReq = httpMock.expectOne('/api/users/1');
        expect(retryReq.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
        retryReq.flush(mockResponse);

        expect(authServiceSpy.refreshToken).toHaveBeenCalledTimes(1);
      });

      it('should use new token from refresh response', () => {
        const originalToken = 'original-token';
        const newToken = 'new-refreshed-token-xyz';

        authServiceSpy.getToken.and.returnValue(originalToken);
        authServiceSpy.isTokenExpired.and.returnValue(false);
        authServiceSpy.refreshToken.and.returnValue(of({
          token: newToken,
          userId: 'test-user-id',
          email: 'test@example.com',
          role: 1,
          organizationId: 'test-org-id',
          organizationName: 'Test Organization',
          expiresAt: '2024-12-31T23:59:59Z'
        } as AuthResponse));

        httpClient.get('/api/protected').subscribe();

        const firstReq = httpMock.expectOne('/api/protected');
        firstReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        const retryReq = httpMock.expectOne('/api/protected');
        expect(retryReq.request.headers.get('Authorization')).toBe(`Bearer ${newToken}`);
        retryReq.flush({});
      });
    });

    describe('401 Unauthorized without token', () => {
      it('should not attempt token refresh', () => {
        authServiceSpy.getToken.and.returnValue(null);

        httpClient.get('/api/users').subscribe({
          next: () => fail('should have failed'),
          error: (error: HttpErrorResponse) => {
            expect(error.status).toBe(401);
          }
        });

        const req = httpMock.expectOne('/api/users');
        req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
        expect(authServiceSpy.logout).not.toHaveBeenCalled();
      });
    });

    describe('when token refresh fails', () => {
      it('should call logout and propagate error', () => {
        const originalToken = 'original-token';
        const refreshError = new Error('Refresh token expired');

        authServiceSpy.getToken.and.returnValue(originalToken);
        authServiceSpy.isTokenExpired.and.returnValue(false);
        authServiceSpy.refreshToken.and.returnValue(throwError(() => refreshError));

        httpClient.get('/api/users/1').subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error).toBe(refreshError);
          }
        });

        const req = httpMock.expectOne('/api/users/1');
        req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        expect(authServiceSpy.logout).toHaveBeenCalledTimes(1);
      });

      it('should not retry request when refresh fails', () => {
        const originalToken = 'original-token';

        authServiceSpy.getToken.and.returnValue(originalToken);
        authServiceSpy.isTokenExpired.and.returnValue(false);
        authServiceSpy.refreshToken.and.returnValue(throwError(() => new Error('Refresh failed')));

        httpClient.get('/api/users').subscribe({
          next: () => fail('should have failed'),
          error: () => {}
        });

        const req = httpMock.expectOne('/api/users');
        req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        // Only one request should be made (no retry)
        httpMock.expectNone('/api/users');
      });
    });

    describe('non-401 errors', () => {
      it('should propagate 400 Bad Request without token refresh', () => {
        authServiceSpy.getToken.and.returnValue('valid-token');
        authServiceSpy.isTokenExpired.and.returnValue(false);

        httpClient.post('/api/users', { invalid: 'data' }).subscribe({
          next: () => fail('should have failed'),
          error: (error: HttpErrorResponse) => {
            expect(error.status).toBe(400);
            expect(error.statusText).toBe('Bad Request');
          }
        });

        const req = httpMock.expectOne('/api/users');
        req.flush('Invalid data', { status: 400, statusText: 'Bad Request' });

        expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
        expect(authServiceSpy.logout).not.toHaveBeenCalled();
      });

      it('should propagate 403 Forbidden without token refresh', () => {
        authServiceSpy.getToken.and.returnValue('valid-token');
        authServiceSpy.isTokenExpired.and.returnValue(false);

        httpClient.get('/api/admin').subscribe({
          next: () => fail('should have failed'),
          error: (error: HttpErrorResponse) => {
            expect(error.status).toBe(403);
          }
        });

        const req = httpMock.expectOne('/api/admin');
        req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

        expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
      });

      it('should propagate 404 Not Found without token refresh', () => {
        authServiceSpy.getToken.and.returnValue('valid-token');
        authServiceSpy.isTokenExpired.and.returnValue(false);

        httpClient.get('/api/users/999').subscribe({
          next: () => fail('should have failed'),
          error: (error: HttpErrorResponse) => {
            expect(error.status).toBe(404);
          }
        });

        const req = httpMock.expectOne('/api/users/999');
        req.flush('Not Found', { status: 404, statusText: 'Not Found' });

        expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
      });

      it('should propagate 500 Internal Server Error without token refresh', () => {
        authServiceSpy.getToken.and.returnValue('valid-token');
        authServiceSpy.isTokenExpired.and.returnValue(false);

        httpClient.get('/api/users').subscribe({
          next: () => fail('should have failed'),
          error: (error: HttpErrorResponse) => {
            expect(error.status).toBe(500);
          }
        });

        const req = httpMock.expectOne('/api/users');
        req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

        expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
      });

      it('should propagate network errors without token refresh', () => {
        authServiceSpy.getToken.and.returnValue('valid-token');
        authServiceSpy.isTokenExpired.and.returnValue(false);

        httpClient.get('/api/users').subscribe({
          next: () => fail('should have failed'),
          error: (error: HttpErrorResponse) => {
            expect(error.status).toBe(0);
            expect(error.error).toBeInstanceOf(ProgressEvent);
          }
        });

        const req = httpMock.expectOne('/api/users');
        req.error(new ProgressEvent('error'));

        expect(authServiceSpy.refreshToken).not.toHaveBeenCalled();
      });
    });
  });

  describe('multiple requests', () => {
    it('should add token to all concurrent requests', () => {
      const mockToken = 'valid-token';
      authServiceSpy.getToken.and.returnValue(mockToken);
      authServiceSpy.isTokenExpired.and.returnValue(false);

      httpClient.get('/api/users').subscribe();
      httpClient.get('/api/posts').subscribe();
      httpClient.get('/api/comments').subscribe();

      const usersReq = httpMock.expectOne('/api/users');
      const postsReq = httpMock.expectOne('/api/posts');
      const commentsReq = httpMock.expectOne('/api/comments');

      expect(usersReq.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(postsReq.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(commentsReq.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

      usersReq.flush([]);
      postsReq.flush([]);
      commentsReq.flush([]);
    });

    it('should handle mix of successful and failed requests', () => {
      const mockToken = 'valid-token';
      authServiceSpy.getToken.and.returnValue(mockToken);
      authServiceSpy.isTokenExpired.and.returnValue(false);

      let successCount = 0;
      let errorCount = 0;

      httpClient.get('/api/success').subscribe(() => successCount++);
      httpClient.get('/api/fail').subscribe({
        next: () => fail('should have failed'),
        error: () => errorCount++
      });

      const successReq = httpMock.expectOne('/api/success');
      const failReq = httpMock.expectOne('/api/fail');

      successReq.flush({ data: 'success' });
      failReq.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(successCount).toBe(1);
      expect(errorCount).toBe(1);
    });
  });

  describe('different HTTP methods', () => {
    beforeEach(() => {
      authServiceSpy.getToken.and.returnValue('valid-token');
      authServiceSpy.isTokenExpired.and.returnValue(false);
    });

    it('should add token to POST requests', () => {
      httpClient.post('/api/users', { name: 'Test' }).subscribe();

      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
      req.flush({});
    });

    it('should add token to PUT requests', () => {
      httpClient.put('/api/users/1', { name: 'Updated' }).subscribe();

      const req = httpMock.expectOne('/api/users/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
      req.flush({});
    });

    it('should add token to PATCH requests', () => {
      httpClient.patch('/api/users/1', { name: 'Patched' }).subscribe();

      const req = httpMock.expectOne('/api/users/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
      req.flush({});
    });

    it('should add token to DELETE requests', () => {
      httpClient.delete('/api/users/1').subscribe();

      const req = httpMock.expectOne('/api/users/1');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
      req.flush({});
    });
  });

  describe('edge cases', () => {
    it('should handle empty string token', () => {
      authServiceSpy.getToken.and.returnValue('');

      httpClient.get('/api/users').subscribe();

      const req = httpMock.expectOne('/api/users');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should handle undefined token', () => {
      authServiceSpy.getToken.and.returnValue(undefined as any);

      httpClient.get('/api/users').subscribe();

      const req = httpMock.expectOne('/api/users');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should not modify original request object', () => {
      authServiceSpy.getToken.and.returnValue('valid-token');
      authServiceSpy.isTokenExpired.and.returnValue(false);

      httpClient.get('/api/users').subscribe();

      const req = httpMock.expectOne('/api/users');
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
      req.flush({});

      // Make another request to verify previous request wasn't mutated
      httpClient.get('/api/posts').subscribe();
      const req2 = httpMock.expectOne('/api/posts');
      expect(req2.request.headers.get('Authorization')).toBe('Bearer valid-token');
      req2.flush({});
    });
  });
});