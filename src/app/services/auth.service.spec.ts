import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    // Create HttpClient spy
    mockHttpClient = jasmine.createSpyObj('HttpClient', ['post', 'get']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: mockHttpClient }
      ]
    });
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', fakeAsync(() => {
    const loginRequest = { email: 'test@test.com', password: 'password' };
    const mockResponse = {
      token: 'mock-token',
      refreshToken: 'mock-refresh',
      user: { id: 1, email: 'test@test.com', businessName: 'Test', ownerName: 'Test User', organizationId: 1, role: 'Owner' },
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.login(loginRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(service.isLoggedIn()).toBeTruthy();
    });

    tick();

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/login', loginRequest);
  }));

  it('should register successfully', fakeAsync(() => {
    const registerRequest = {
      email: 'test@test.com',
      password: 'password',
      businessName: 'Test Business',
      ownerName: 'Test User'
    };
    const mockResponse = {
      token: 'mock-token',
      refreshToken: 'mock-refresh',
      user: { id: 1, email: 'test@test.com', businessName: 'Test Business', ownerName: 'Test User', organizationId: 1, role: 'Owner' },
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.register(registerRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(service.isLoggedIn()).toBeTruthy();
    });

    tick();

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/register', registerRequest);
  }));

  it('should register owner successfully', fakeAsync(() => {
    const ownerRequest = {
      fullName: 'Shop Owner',
      email: 'owner@test.com',
      password: 'password123',
      shopName: 'Test Shop'
    };
    const mockResponse = { success: true, message: 'Owner registered successfully' };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.registerOwner(ownerRequest).then(result => {
      expect(result).toEqual(mockResponse);
    });

    tick();

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/register/owner', ownerRequest);
  }));

  it('should handle owner registration error', fakeAsync(() => {
    const ownerRequest = {
      fullName: 'Shop Owner',
      email: 'owner@test.com',
      password: 'password123',
      shopName: 'Test Shop'
    };

    mockHttpClient.post.and.returnValue(
      throwError(() => ({
        error: {
          message: 'Email already exists',
          errors: ['Email is already in use']
        }
      }))
    );

    service.registerOwner(ownerRequest).then(result => {
      expect(result.success).toBeFalse();
      expect(result.message).toBe('Email already exists');
      expect(result.errors).toEqual(['Email is already in use']);
    });

    tick();
  }));

  it('should register provider successfully', fakeAsync(() => {
    const providerRequest = {
      storeCode: '1234',
      fullName: 'Provider Name',
      email: 'provider@test.com',
      password: 'password123'
    };
    const mockResponse = { success: true, message: 'Provider registered successfully' };

    mockHttpClient.post.and.returnValue(of(mockResponse));

    service.registerProvider(providerRequest).then(result => {
      expect(result).toEqual(mockResponse);
    });

    tick();

    expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/register/provider', providerRequest);
  }));

  it('should validate store code successfully', fakeAsync(() => {
    const storeCode = '1234';
    const mockResponse = {
      isValid: true,
      shopName: 'Test Shop'
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.validateStoreCode(storeCode).then(result => {
      expect(result).toEqual(mockResponse);
    });

    tick();

    expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/auth/validate-store-code/1234');
  }));

  it('should handle invalid store code', fakeAsync(() => {
    const storeCode = '9999';
    const mockResponse = {
      isValid: false,
      errorMessage: 'Invalid store code'
    };

    mockHttpClient.get.and.returnValue(of(mockResponse));

    service.validateStoreCode(storeCode).then(result => {
      expect(result.isValid).toBeFalse();
      expect(result.errorMessage).toBe('Invalid store code');
    });

    tick();
  }));

  it('should logout successfully', () => {
    // Set up some stored data
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@test.com' }));
    service.isLoggedIn.set(true);

    service.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.getCurrentUser()).toBeNull();
  });

  it('should get token from localStorage', () => {
    localStorage.setItem('token', 'test-token');
    expect(service.getToken()).toBe('test-token');
  });

  it('should return null if no token', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should detect expired tokens', () => {
    expect(service.isTokenExpired()).toBeTruthy();

    const futureDate = new Date(Date.now() + 3600000);
    service['tokenInfo'].set({ token: 'token', expiresAt: futureDate });
    expect(service.isTokenExpired()).toBeFalsy();
  });
});