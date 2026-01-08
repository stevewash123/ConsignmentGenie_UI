import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';
import { ConsoleErrorTracker } from '@testing/console-error-tracker';

/**
 * Smoke tests for AuthInterceptor
 */
describe('AuthInterceptor', () => {
  let interceptor: AuthInterceptor;
  let tracker: ConsoleErrorTracker;
  let mockHandler: jasmine.SpyObj<HttpHandler>;

  beforeEach(() => {
    tracker = new ConsoleErrorTracker();
    mockHandler = jasmine.createSpyObj('HttpHandler', ['handle']);
    mockHandler.handle.and.returnValue(of({} as HttpEvent<any>));
    
    TestBed.configureTestingModule({
      providers: [
        AuthInterceptor,
        // TODO: Add mock providers
      ],
    });
    
    interceptor = TestBed.inject(AuthInterceptor);
  });

  afterEach(() => {
    tracker.stop();
  });

  describe('SMOKE', () => {
    it('should be created without console errors', () => {
      tracker.start();
      
      expect(interceptor).toBeTruthy();
      
      tracker.expectNoErrors();
    });

    it('should intercept request without console errors', () => {
      tracker.start();
      
      const mockRequest = new HttpRequest('GET', '/api/test');
      interceptor.intercept(mockRequest, mockHandler);
      
      expect(mockHandler.handle).toHaveBeenCalled();
      tracker.expectNoErrors();
    });
  });
});
