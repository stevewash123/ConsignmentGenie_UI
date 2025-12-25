import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login successfully', () => {
    const loginRequest = { email: 'test@test.com', password: 'password' };
    const authData = {
      token: 'mock-token',
      userId: 'user-123',
      email: 'test@test.com',
      role: 1,
      organizationId: 'org-123',
      organizationName: 'Test Organization',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };
    const mockResponse = {
      success: true,
      data: authData,
      message: 'Login successful'
    };

    service.login(loginRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(service.isLoggedIn()).toBeTruthy();
    });

    const req = httpTestingController.expectOne('http://localhost:5000/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(loginRequest);
    req.flush(mockResponse);
  });

  it('should logout successfully', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_data', JSON.stringify({ id: 1, email: 'test@test.com' }));
    localStorage.setItem('refreshToken', 'test-refresh-token');
    localStorage.setItem('tokenExpiry', new Date(Date.now() + 3600000).toISOString());
    service.isLoggedIn.set(true);

    service.logout();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('tokenExpiry')).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.getCurrentUser()).toBeNull();
  });

  it('should get token from localStorage', () => {
    localStorage.setItem('auth_token', 'test-token');
    expect(service.getToken()).toBe('test-token');
  });

  it('should return null if no token', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should register successfully', () => {
    const registerRequest = {
      email: 'test@test.com',
      password: 'password',
      businessName: 'Test Business',
      ownerName: 'Test User'
    };
    const mockResponse = {
      token: 'mock-token',
      userId: 'user-123',
      email: 'test@test.com',
      role: 1,
      organizationId: 'org-123',
      organizationName: 'Test Organization',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };

    service.register(registerRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(service.isLoggedIn()).toBeTruthy();
    });

    const req = httpTestingController.expectOne('http://localhost:5000/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(registerRequest);
    req.flush(mockResponse);
  });

  it('should register owner successfully', () => {
    const ownerRequest = {
      fullName: 'Shop Owner',
      email: 'owner@test.com',
      password: 'password123',
      shopName: 'Test Shop',
      subdomain: 'testshop',
      address: '123 Test Street, Test City, TS 12345'
    };
    const mockResponse = { success: true, message: 'Owner registered successfully' };

    service.registerOwner(ownerRequest).subscribe(result => {
      expect(result).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne('http://localhost:5000/api/OwnerRegistration/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(ownerRequest);
    req.flush(mockResponse);
  });

  it('should register consignor successfully', () => {
    const providerRequest = {
      storeCode: '1234',
      fullName: 'consignor Name',
      email: 'consignor@test.com',
      password: 'password123'
    };
    const mockResponse = { success: true, message: 'consignor registered successfully' };

    service.registerProvider(providerRequest).subscribe(result => {
      expect(result).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne('http://localhost:5000/api/auth/register/consignor');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(providerRequest);
    req.flush(mockResponse);
  });

  it('should validate store code successfully', () => {
    const storeCode = '1234';
    const mockResponse = {
      isValid: true,
      shopName: 'Test Shop'
    };

    service.validateStoreCode(storeCode).subscribe(result => {
      expect(result).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne('http://localhost:5000/api/auth/validate-store-code/1234');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  // Token lifecycle tests
  it('should detect expired tokens', () => {
    expect(service.isTokenExpired()).toBeTruthy();

    const futureDate = new Date(Date.now() + 3600000);
    service['tokenInfo'].set({ token: 'token', expiresAt: futureDate });
    expect(service.isTokenExpired()).toBeFalsy();
  });

  it('should logout if stored token is expired', () => {
    const pastDate = new Date(Date.now() - 3600000);
    const userData = { userId: 'user-123', email: 'test@test.com', role: 1, organizationId: 'org-123', organizationName: 'Test Organization' };

    localStorage.setItem('auth_token', 'expired-token');
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('tokenExpiry', pastDate.toISOString());

    service.loadStoredAuth();

    expect(service.isLoggedIn()).toBeFalsy();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.getToken()).toBeNull();
  });

  xit('should refresh token successfully', () => {
    const refreshToken = 'refresh-token';
    const mockResponse = {
      token: 'new-token',
      userId: 'user-123',
      email: 'test@test.com',
      role: 1,
      organizationId: 'org-123',
      organizationName: 'Test Organization',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };

    localStorage.setItem('refreshToken', refreshToken);

    service.refreshToken().subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(service.getToken()).toBe('new-token');
    });

    const req = httpTestingController.expectOne('http://localhost:5000/api/auth/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken });
    req.flush(mockResponse);
  });

  // Auth state management tests
  it('should load stored authentication on init', () => {
    const futureDate = new Date(Date.now() + 3600000);
    const userData = { userId: 'user-123', email: 'test@test.com', role: 1, organizationId: 'org-123', organizationName: 'Test Organization' };

    localStorage.setItem('auth_token', 'stored-token');
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('tokenExpiry', futureDate.toISOString());

    service.loadStoredAuth();

    expect(service.isLoggedIn()).toBeTruthy();
    expect(service.getCurrentUser()).toEqual(userData);
    expect(service.getToken()).toBe('stored-token');
  });

  it('should return current user observable', () => {
    const userData = { userId: 'user-123', email: 'test@test.com', role: 1, organizationId: 'org-123', organizationName: 'Test Organization' };

    service['currentUserSubject'].next(userData);

    service.currentUser$.subscribe(user => {
      expect(user).toEqual(userData);
    });
  });

  it('should set auth data correctly', () => {
    const authResponse = {
      token: 'new-token',
      userId: 'user-123',
      email: 'test@test.com',
      role: 1,
      organizationId: 'org-123',
      organizationName: 'Test Organization',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };

    service['setAuthData'](authResponse);

    expect(localStorage.getItem('auth_token')).toBe('new-token');
    const expectedUserData = {
      userId: authResponse.userId,
      email: authResponse.email,
      role: authResponse.role,
      organizationId: authResponse.organizationId,
      organizationName: authResponse.organizationName
    };
    expect(JSON.parse(localStorage.getItem('user_data')!)).toEqual(expectedUserData);
    expect(localStorage.getItem('tokenExpiry')).toBe(authResponse.expiresAt);
    expect(service.isLoggedIn()).toBeTruthy();
    expect(service.getCurrentUser()).toEqual(expectedUserData);
  });
});