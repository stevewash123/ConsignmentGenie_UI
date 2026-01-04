import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../shared/services/loading.service';
import { StorageService } from '../shared/services/storage.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;
  let mockStorageService: jasmine.SpyObj<StorageService>;

  // ============================================================================
  // Test Data Factories
  // ============================================================================
  const createLoginResponse = (overrides: Partial<{
    token: string;
    userId: string;
    email: string;
    role: number;
    organizationId: string;
    organizationName: string;
    expiresAt: string;
    approvalStatus: number;
  }> = {}) => ({
    success: true,
    data: {
      token: 'test-token-123',
      userId: 'user-123',
      email: 'test@example.com',
      role: 1,
      organizationId: 'org-123',
      organizationName: 'Test Organization',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      ...overrides
    }
  });

  // ============================================================================
  // Setup
  // ============================================================================
  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login', 'loadStoredAuth']);
    mockLoadingService = jasmine.createSpyObj('LoadingService', ['start', 'stop', 'isLoading']);
    mockStorageService = jasmine.createSpyObj('StorageService', [
      'clearAuthData',
      'setAuthToken',
      'setTokenExpiry',
      'setUserData'
    ]);

    mockLoadingService.isLoading.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: LoadingService, useValue: mockLoadingService },
        { provide: StorageService, useValue: mockStorageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================
  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty credentials', () => {
      expect(component.credentials.email).toBe('');
      expect(component.credentials.password).toBe('');
    });

    it('should initialize with password hidden', () => {
      expect(component.showPassword()).toBeFalse();
    });

    it('should initialize with no error message', () => {
      expect(component.errorMessage()).toBe('');
    });
  });

  // ============================================================================
  // Happy Path Tests - Public Methods
  // ============================================================================
  describe('isAuthLoading', () => {
    it('should return loading state from LoadingService', () => {
      mockLoadingService.isLoading.and.returnValue(true);
      expect(component.isAuthLoading()).toBeTrue();

      mockLoadingService.isLoading.and.returnValue(false);
      expect(component.isAuthLoading()).toBeFalse();
    });

    it('should check loading with correct key', () => {
      component.isAuthLoading();
      expect(mockLoadingService.isLoading).toHaveBeenCalledWith('auth-login');
    });
  });

  describe('togglePassword', () => {
    it('should toggle password visibility from false to true', () => {
      expect(component.showPassword()).toBeFalse();
      component.togglePassword();
      expect(component.showPassword()).toBeTrue();
    });

    it('should toggle password visibility from true to false', () => {
      component.togglePassword(); // false -> true
      component.togglePassword(); // true -> false
      expect(component.showPassword()).toBeFalse();
    });
  });

  describe('useTestAccount', () => {
    it('should set email to provided value', () => {
      component.useTestAccount('admin@test.com');
      expect(component.credentials.email).toBe('admin@test.com');
    });

    it('should set password to default test password', () => {
      component.useTestAccount('admin@test.com');
      expect(component.credentials.password).toBe('password123');
    });

    it('should clear any existing error message', () => {
      component.errorMessage.set('Previous error');
      component.useTestAccount('admin@test.com');
      expect(component.errorMessage()).toBe('');
    });
  });

  describe('onSubmit - Happy Paths', () => {
    beforeEach(() => {
      component.credentials.email = 'test@example.com';
      component.credentials.password = 'password123';
    });

    it('should start and stop loading during submission', async () => {
      mockAuthService.login.and.returnValue(of(createLoginResponse()));

      await component.onSubmit();

      expect(mockLoadingService.start).toHaveBeenCalledWith('auth-login');
      expect(mockLoadingService.stop).toHaveBeenCalledWith('auth-login');
    });

    it('should clear error message before submission', async () => {
      component.errorMessage.set('Previous error');
      mockAuthService.login.and.returnValue(of(createLoginResponse()));

      await component.onSubmit();

      expect(component.errorMessage()).toBe('');
    });

    it('should call AuthService login with credentials', async () => {
      mockAuthService.login.and.returnValue(of(createLoginResponse()));

      await component.onSubmit();

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should store auth data on successful login', async () => {
      const response = createLoginResponse();
      mockAuthService.login.and.returnValue(of(response));

      await component.onSubmit();

      expect(mockStorageService.clearAuthData).toHaveBeenCalled();
      expect(mockStorageService.setAuthToken).toHaveBeenCalledWith('test-token-123');
      expect(mockStorageService.setTokenExpiry).toHaveBeenCalled();
      expect(mockStorageService.setUserData).toHaveBeenCalled();
    });

    it('should call loadStoredAuth after storing data', async () => {
      mockAuthService.login.and.returnValue(of(createLoginResponse()));

      await component.onSubmit();

      expect(mockAuthService.loadStoredAuth).toHaveBeenCalled();
    });

    // Role-based routing tests
    it('should redirect Admin (role 0) to admin dashboard', async () => {
      mockAuthService.login.and.returnValue(of(createLoginResponse({ role: 0 })));

      await component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('should redirect Owner (role 1) with approved status to owner dashboard', async () => {
      mockAuthService.login.and.returnValue(of(createLoginResponse({ 
        role: 1, 
        approvalStatus: 1 
      })));

      await component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/owner/dashboard']);
    });

    it('should redirect Consignor (role 2) to customer dashboard', async () => {
      mockAuthService.login.and.returnValue(of(createLoginResponse({ role: 2 })));

      await component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/customer/dashboard']);
    });

    it('should redirect Customer (role 3) to customer dashboard', async () => {
      mockAuthService.login.and.returnValue(of(createLoginResponse({ role: 3 })));

      await component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/customer/dashboard']);
    });

    it('should redirect system admin email to admin dashboard regardless of role', async () => {
      component.credentials.email = 'admin@microsaasbuilders.com';
      mockAuthService.login.and.returnValue(of(createLoginResponse({ 
        email: 'admin@microsaasbuilders.com',
        role: 1 // Even with Owner role
      })));

      await component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('should handle string role values', async () => {
      const response = {
        success: true,
        data: {
          ...createLoginResponse().data,
          role: 'Owner' as unknown as number
        }
      };
      mockAuthService.login.and.returnValue(of(response));

      await component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/owner/dashboard']);
    });

    it('should default unknown roles to owner dashboard', async () => {
      mockAuthService.login.and.returnValue(of(createLoginResponse({ role: 99 })));

      await component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/owner/dashboard']);
    });
  });

  // ============================================================================
  // Edge Cases & Error Handling
  // ============================================================================
  describe('onSubmit - Validation', () => {
    it('should not submit if email is empty', async () => {
      component.credentials.email = '';
      component.credentials.password = 'password123';

      await component.onSubmit();

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockLoadingService.start).not.toHaveBeenCalled();
    });

    it('should not submit if password is empty', async () => {
      component.credentials.email = 'test@example.com';
      component.credentials.password = '';

      await component.onSubmit();

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(mockLoadingService.start).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit - Approval Status', () => {
    beforeEach(() => {
      component.credentials.email = 'owner@example.com';
      component.credentials.password = 'password123';
    });

    it('should block login for pending owner approval (status 0)', async () => {
      mockAuthService.login.and.returnValue(of(createLoginResponse({ 
        role: 1, 
        approvalStatus: 0 
      })));

      await component.onSubmit();

      expect(component.errorMessage()).toContain('pending admin approval');
      expect(router.navigate).not.toHaveBeenCalled();
      expect(mockStorageService.setAuthToken).not.toHaveBeenCalled();
    });

    it('should block login for rejected owner (status 2)', async () => {
      mockAuthService.login.and.returnValue(of(createLoginResponse({ 
        role: 1, 
        approvalStatus: 2 
      })));

      await component.onSubmit();

      expect(component.errorMessage()).toContain('has been rejected');
      expect(router.navigate).not.toHaveBeenCalled();
      expect(mockStorageService.setAuthToken).not.toHaveBeenCalled();
    });

    it('should allow non-owner roles without approval check', async () => {
      mockAuthService.login.and.returnValue(of(createLoginResponse({ 
        role: 3, // Customer
        approvalStatus: 0 // Even with pending status
      })));

      await component.onSubmit();

      expect(router.navigate).toHaveBeenCalledWith(['/customer/dashboard']);
    });
  });

  describe('onSubmit - Error Handling', () => {
    beforeEach(() => {
      component.credentials.email = 'test@example.com';
      component.credentials.password = 'password123';
    });

    it('should handle 401 unauthorized error', async () => {
      mockAuthService.login.and.returnValue(throwError(() => ({ status: 401 })));

      await component.onSubmit();

      expect(component.errorMessage()).toContain('Invalid email or password');
      expect(mockLoadingService.stop).toHaveBeenCalledWith('auth-login');
    });

    it('should handle network error (status 0)', async () => {
      mockAuthService.login.and.returnValue(throwError(() => ({ status: 0 })));

      await component.onSubmit();

      expect(component.errorMessage()).toContain('Unable to connect to server');
    });

    it('should handle generic server error (500)', async () => {
      mockAuthService.login.and.returnValue(throwError(() => ({ status: 500 })));

      await component.onSubmit();

      expect(component.errorMessage()).toContain('Login failed');
    });

    it('should always stop loading even on error', async () => {
      mockAuthService.login.and.returnValue(throwError(() => ({ status: 500 })));

      await component.onSubmit();

      expect(mockLoadingService.stop).toHaveBeenCalledWith('auth-login');
    });
  });

  describe('onSubmit - Null/Undefined Response', () => {
    beforeEach(() => {
      component.credentials.email = 'test@example.com';
      component.credentials.password = 'password123';
    });

    it('should handle null response gracefully', async () => {
      mockAuthService.login.and.returnValue(of(null as any));

      await component.onSubmit();

      expect(router.navigate).not.toHaveBeenCalled();
      expect(mockStorageService.setAuthToken).not.toHaveBeenCalled();
    });

    it('should handle response with null data', async () => {
      mockAuthService.login.and.returnValue(of({ data: null } as any));

      await component.onSubmit();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
