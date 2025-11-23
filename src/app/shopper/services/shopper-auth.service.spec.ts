import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ShopperAuthService, ShopperLoginRequest, ShopperRegisterRequest } from './shopper-auth.service';

describe('ShopperAuthService', () => {
  let service: ShopperAuthService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  const mockStoreSlug = 'test-store';

  beforeEach(() => {
    mockHttpClient = jasmine.createSpyObj('HttpClient', ['post', 'get']);

    TestBed.configureTestingModule({
      providers: [
        ShopperAuthService,
        { provide: HttpClient, useValue: mockHttpClient }
      ]
    });

    service = TestBed.inject(ShopperAuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with no authenticated user', () => {
    expect(service.isAuthenticated(mockStoreSlug)).toBeFalse();
    expect(service.getCurrentUser(mockStoreSlug)).toBeNull();
  });

  it('should login successfully and store token', fakeAsync(() => {
    const loginRequest: ShopperLoginRequest = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false
    };

    const mockResponse = {
      success: true,
      token: 'mock-jwt-token',
      shopper: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fullName: 'John Doe',
        email: 'test@example.com'
      }
    };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.login(mockStoreSlug, loginRequest).subscribe(response => {
      expect(response.success).toBeTruthy();
      expect(response.token).toBe('mock-jwt-token');
      expect(service.isAuthenticated(mockStoreSlug)).toBeTruthy();
      expect(service.getCurrentUser(mockStoreSlug)).toEqual(mockResponse.shopper);
    });

    tick();

    expect(mockHttpClient.post).toHaveBeenCalled();
    const storedToken = localStorage.getItem(`shopper_token_${mockStoreSlug}`);
    expect(storedToken).toBe('mock-jwt-token');
  }));

  it('should handle login failure', fakeAsync(() => {
    const loginRequest: ShopperLoginRequest = {
      email: 'test@example.com',
      password: 'wrongpassword',
      rememberMe: false
    };

    const mockErrorResponse = {
      success: false,
      errorMessage: 'Invalid credentials'
    };

    mockHttpClient.post.and.returnValue(of(mockErrorResponse));

    service.login(mockStoreSlug, loginRequest).subscribe(response => {
      expect(response.success).toBeFalsy();
      expect(response.errorMessage).toBe('Invalid credentials');
      expect(service.isAuthenticated(mockStoreSlug)).toBeFalsy();
    });

    tick();

    const storedToken = localStorage.getItem(`shopper_token_${mockStoreSlug}`);
    expect(storedToken).toBeNull();
  }));

  it('should handle HTTP error during login', fakeAsync(() => {
    const loginRequest: ShopperLoginRequest = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false
    };

    mockHttpClient.post.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    service.login(mockStoreSlug, loginRequest).subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error).toBeTruthy();
        expect(service.isAuthenticated(mockStoreSlug)).toBeFalsy();
      }
    });

    tick();
  }));

  it('should register successfully', fakeAsync(() => {
    const registerRequest: ShopperRegisterRequest = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      phone: '555-123-4567',
      address: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701'
    };

    const mockResponse = {
      success: true,
      token: 'mock-jwt-token',
      shopper: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        fullName: 'Jane Doe',
        email: 'jane@example.com'
      }
    };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.register(mockStoreSlug, registerRequest).subscribe(response => {
      expect(response.success).toBeTruthy();
      expect(response.token).toBe('mock-jwt-token');
      expect(service.isAuthenticated(mockStoreSlug)).toBeTruthy();
    });

    tick();

    expect(mockHttpClient.post).toHaveBeenCalled();
  }));

  it('should handle registration failure', fakeAsync(() => {
    const registerRequest: ShopperRegisterRequest = {
      fullName: 'Jane Doe',
      email: 'existing@example.com',
      password: 'password123'
    };

    const mockErrorResponse = {
      success: false,
      errorMessage: 'Email already exists'
    };

    mockHttpClient.post.and.returnValue(of(mockErrorResponse));

    service.register(mockStoreSlug, registerRequest).subscribe(response => {
      expect(response.success).toBeFalsy();
      expect(response.errorMessage).toBe('Email already exists');
    });

    tick();
  }));

  it('should logout and clear stored data', () => {
    localStorage.setItem(`shopper_token_${mockStoreSlug}`, 'mock-token');
    localStorage.setItem(`shopper_user_${mockStoreSlug}`, JSON.stringify({
      id: '123',
      fullName: 'John Doe',
      email: 'john@example.com'
    }));

    expect(service.isAuthenticated(mockStoreSlug)).toBeTruthy();

    service.logout(mockStoreSlug);

    expect(service.isAuthenticated(mockStoreSlug)).toBeFalsy();
    expect(service.getCurrentUser(mockStoreSlug)).toBeNull();
    expect(localStorage.getItem(`shopper_token_${mockStoreSlug}`)).toBeNull();
    expect(localStorage.getItem(`shopper_user_${mockStoreSlug}`)).toBeNull();
  });

  it('should check authentication status correctly', () => {
    expect(service.isAuthenticated(mockStoreSlug)).toBeFalsy();

    localStorage.setItem(`shopper_token_${mockStoreSlug}`, 'valid-token');
    expect(service.isAuthenticated(mockStoreSlug)).toBeTruthy();

    localStorage.removeItem(`shopper_token_${mockStoreSlug}`);
    expect(service.isAuthenticated(mockStoreSlug)).toBeFalsy();
  });

  it('should return correct current user', () => {
    const mockUser = {
      id: '123',
      fullName: 'John Doe',
      email: 'john@example.com'
    };

    expect(service.getCurrentUser(mockStoreSlug)).toBeNull();

    localStorage.setItem(`shopper_user_${mockStoreSlug}`, JSON.stringify(mockUser));
    expect(service.getCurrentUser(mockStoreSlug)).toEqual(mockUser);
  });

  it('should handle corrupted user data in localStorage', () => {
    localStorage.setItem(`shopper_user_${mockStoreSlug}`, 'invalid-json');
    expect(service.getCurrentUser(mockStoreSlug)).toBeNull();
  });

  it('should create guest session successfully', fakeAsync(() => {
    const guestRequest = {
      email: 'guest@example.com',
      fullName: 'Guest User'
    };

    const mockResponse = {
      success: true,
      token: 'guest-jwt-token',
      sessionId: 'guest-session-123'
    };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.createGuestSession(mockStoreSlug, guestRequest).subscribe(response => {
      expect(response.success).toBeTruthy();
      expect(response.token).toBe('guest-jwt-token');
      expect(response.sessionId).toBe('guest-session-123');
    });

    tick();

    expect(mockHttpClient.post).toHaveBeenCalled();
  }));

  it('should handle multiple store authentication separately', () => {
    const store1 = 'store-one';
    const store2 = 'store-two';

    localStorage.setItem(`shopper_token_${store1}`, 'token-store-1');
    localStorage.setItem(`shopper_token_${store2}`, 'token-store-2');

    expect(service.isAuthenticated(store1)).toBeTruthy();
    expect(service.isAuthenticated(store2)).toBeTruthy();

    service.logout(store1);
    expect(service.isAuthenticated(store1)).toBeFalsy();
    expect(service.isAuthenticated(store2)).toBeTruthy();
  });
});