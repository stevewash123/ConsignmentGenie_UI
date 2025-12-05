import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { OwnerSignupStep2Component } from './owner-signup-step2.component';
import { AuthService } from '../services/auth.service';

describe('OwnerSignupStep2Component', () => {
  let component: OwnerSignupStep2Component;
  let fixture: ComponentFixture<OwnerSignupStep2Component>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['registerOwner', 'registerOwnerFrictionless', 'validateSubdomain']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of({})
    });
    mockRouter.navigate.and.returnValue(Promise.resolve(true));
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    const mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: { data: {} },
      params: of({}),
      queryParams: of({})
    });

    await TestBed.configureTestingModule({
      imports: [
        OwnerSignupStep2Component
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerSignupStep2Component);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Set up default return values for AuthService methods
    mockAuthService.validateSubdomain.and.returnValue(of({
      success: true,
      data: { isAvailable: true, subdomain: 'test-subdomain' },
      message: 'Subdomain is available'
    }));

    // Set up sessionStorage spies (to be configured in nested beforeEach blocks)
    spyOn(sessionStorage, 'getItem');
    spyOn(sessionStorage, 'removeItem');
  });

  // ===========================================
  // WITH detectChanges in beforeEach
  // ===========================================
  describe('with detectChanges', () => {
    beforeEach(() => {
      // Set up sessionStorage spy return value (spy already created in main beforeEach)
      (sessionStorage.getItem as jasmine.Spy).and.returnValue(
        JSON.stringify({ email: 'test@example.com', password: 'password123' })
      );

      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.isSubmitting()).toBeFalse();
      expect(component.errorMessage()).toBe('');
      expect(component.profileForm.get('fullName')?.value).toBe('');
      expect(component.profileForm.get('shopName')?.value).toBe('');
      expect(component.profileForm.get('subdomain')?.value).toBe('');
      expect(component.profileForm.get('phone')?.value).toBe('');
      expect(component.profileForm.get('streetAddress')?.value).toBe('');
      expect(component.profileForm.get('city')?.value).toBe('');
      expect(component.profileForm.get('state')?.value).toBe('');
      expect(component.profileForm.get('zipCode')?.value).toBe('');
    });

    it('should validate required fields', () => {
      const form = component.profileForm;

      expect(form.valid).toBeFalse();
      expect(form.get('fullName')?.hasError('required')).toBeTrue();
      expect(form.get('shopName')?.hasError('required')).toBeTrue();
      expect(form.get('subdomain')?.hasError('required')).toBeTrue();
      expect(form.get('streetAddress')?.hasError('required')).toBeTrue();
      expect(form.get('city')?.hasError('required')).toBeTrue();
      expect(form.get('state')?.hasError('required')).toBeTrue();
      expect(form.get('zipCode')?.hasError('required')).toBeTrue();
    });

    it('should validate subdomain pattern', () => {
      const subdomainControl = component.profileForm.get('subdomain');

      subdomainControl?.setValue('Invalid_Subdomain!');
      expect(subdomainControl?.hasError('pattern')).toBeTrue();

      subdomainControl?.setValue('valid-subdomain123');
      expect(subdomainControl?.hasError('pattern')).toBeFalse();
    });

    it('should validate ZIP code pattern', () => {
      const zipCodeControl = component.profileForm.get('zipCode');

      zipCodeControl?.setValue('invalid');
      expect(zipCodeControl?.hasError('pattern')).toBeTrue();

      zipCodeControl?.setValue('12345');
      expect(zipCodeControl?.hasError('pattern')).toBeFalse();

      zipCodeControl?.setValue('12345-6789');
      expect(zipCodeControl?.hasError('pattern')).toBeFalse();
    });

    it('should redirect to step 1 if no auth data on init', () => {
      // Override the spy to return null (no auth data)
      (sessionStorage.getItem as jasmine.Spy).and.returnValue(null);

      component.ngOnInit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/signup/owner']);
    });

    it('should handle registration failure', () => {
    const mockResponse = {
      success: false,
      message: 'Shop name already exists'
    };
    mockAuthService.registerOwnerFrictionless.and.returnValue(of(mockResponse));

    // Fill form with valid data
    component.profileForm.patchValue({
      fullName: 'John Doe',
      shopName: 'Existing Shop',
      subdomain: 'existingshop',
      streetAddress: '123 Main St',
      city: 'Test City',
      state: 'CA',
      zipCode: '12345'
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Shop name already exists');
    expect(component.isSubmitting()).toBeFalse();
    expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/register/success'], jasmine.any(Object));
  });

  it('should handle API error during registration', () => {
    const mockError = {
      message: 'Server error occurred'
    };
    mockAuthService.registerOwnerFrictionless.and.returnValue(throwError(() => mockError));

    // Fill form with valid data
    component.profileForm.patchValue({
      fullName: 'John Doe',
      shopName: 'Test Shop',
      subdomain: 'testshop',
      streetAddress: '123 Main St',
      city: 'Test City',
      state: 'CA',
      zipCode: '12345'
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Server error occurred');
    expect(component.isSubmitting()).toBeFalse();
  });

  it('should handle missing session data during submit', () => {
    (sessionStorage.getItem as jasmine.Spy).and.returnValue(null);

    // Fill form with valid data
    component.profileForm.patchValue({
      fullName: 'John Doe',
      shopName: 'Test Shop',
      subdomain: 'testshop',
      streetAddress: '123 Main St',
      city: 'Test City',
      state: 'CA',
      zipCode: '12345'
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Session expired. Please start over.');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/signup/owner']);
    expect(mockAuthService.registerOwnerFrictionless).not.toHaveBeenCalled();
  });

  it('should not submit if form is invalid', () => {
    spyOn(component as any, 'markAllFieldsTouched');

    // Form is invalid by default (empty required fields)
    component.onSubmit();

    expect((component as any).markAllFieldsTouched).toHaveBeenCalled();
    expect(component.isSubmitting()).toBeFalse();
    expect(mockAuthService.registerOwnerFrictionless).not.toHaveBeenCalled();
  });

  it('should mark all fields as touched when form is invalid', () => {
    const form = component.profileForm;

    // Ensure fields are not touched initially
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsUntouched();
    });

    (component as any).markAllFieldsTouched();

    Object.keys(form.controls).forEach(key => {
      expect(form.get(key)?.touched).toBeTrue();
    });
  });

  it('should handle empty phone field correctly', () => {
    const mockResponse = {
      success: true,
      role: 'owner',
      message: 'Registration successful'
    };
    mockAuthService.registerOwnerFrictionless.and.returnValue(of(mockResponse));

    // Fill form with valid data but no phone
    component.profileForm.patchValue({
      fullName: 'John Doe',
      shopName: 'Test Shop',
      subdomain: 'testshop',
      phone: '', // Empty phone
      streetAddress: '123 Main St',
      city: 'Test City',
      state: 'CA',
      zipCode: '12345'
    });

    component.onSubmit();

    expect(mockAuthService.registerOwnerFrictionless).toHaveBeenCalledWith(
      jasmine.objectContaining({
        phone: ''
      })
    );
  });

  it('should combine address fields into single address string', () => {
    const mockResponse = {
      success: true,
      role: 'owner',
      message: 'Registration successful'
    };
    mockAuthService.registerOwnerFrictionless.and.returnValue(of(mockResponse));

    component.profileForm.patchValue({
      fullName: 'John Doe',
      shopName: 'Test Shop',
      subdomain: 'testshop',
      streetAddress: '456 Oak Ave',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701'
    });

    component.onSubmit();

    expect(mockAuthService.registerOwnerFrictionless).toHaveBeenCalledWith(
      jasmine.objectContaining({
        address: '456 Oak Ave, Springfield, IL 62701'
      })
    );
  });

    describe('State Dropdown', () => {
      it('should have all US states as options', () => {
        const stateSelect = fixture.nativeElement.querySelector('#state');
        const options = stateSelect.querySelectorAll('option');

        // Should have 51 options (empty option + 50 states)
        expect(options.length).toBe(51);

        // Check for a few specific states
        const optionValues = Array.from(options).map((option: any) => option.value);
        expect(optionValues).toContain('CA');
        expect(optionValues).toContain('NY');
        expect(optionValues).toContain('TX');
        expect(optionValues).toContain('FL');
      });
    });

    it('should navigate to dashboard when token is provided', fakeAsync(() => {
      const mockResponse = {
        success: true,
        role: 'owner',
        message: 'Registration successful',
        token: 'jwt-token-123'
      };
      mockAuthService.registerOwnerFrictionless.and.returnValue(of(mockResponse));

      // Fill form with valid data
      component.profileForm.patchValue({
        fullName: 'John Doe',
        shopName: 'Test Shop',
        subdomain: 'testshop',
        phone: '555-1234',
        streetAddress: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345'
      });

      component.onSubmit();
      tick();

      expect(mockAuthService.registerOwnerFrictionless).toHaveBeenCalledWith(jasmine.objectContaining({
        fullName: 'John Doe',
        email: 'test@example.com',
        phone: '555-1234',
        password: 'password123',
        shopName: 'Test Shop',
        subdomain: 'testshop',
        address: '123 Main St, Test City, CA 12345'
      }));

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('ownerAuthData');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/owner/dashboard']);
    }));

    it('should navigate to success page when no token (approval required)', fakeAsync(() => {
      const mockResponse = {
        success: true,
        role: 'owner',
        message: 'Registration successful'
        // No token - approval required
      };
      mockAuthService.registerOwnerFrictionless.and.returnValue(of(mockResponse));

      // Fill form with valid data
      component.profileForm.patchValue({
        fullName: 'John Doe',
        shopName: 'Test Shop',
        subdomain: 'testshop',
        phone: '555-1234',
        streetAddress: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345'
      });

      component.onSubmit();
      tick();

      expect(mockAuthService.registerOwnerFrictionless).toHaveBeenCalledWith(jasmine.objectContaining({
        fullName: 'John Doe',
        email: 'test@example.com',
        phone: '555-1234',
        password: 'password123',
        shopName: 'Test Shop',
        subdomain: 'testshop',
        address: '123 Main St, Test City, CA 12345'
      }));

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('ownerAuthData');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/register/success'], {
        queryParams: {
          type: 'owner',
          shopName: 'Test Shop',
          email: 'test@example.com'
        }
      });
    }));
  });
});