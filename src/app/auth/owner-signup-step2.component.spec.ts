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
  let sessionStorageGetItemSpy: jasmine.Spy;
  let sessionStorageRemoveItemSpy: jasmine.Spy;

  const validAuthData = JSON.stringify({ email: 'test@example.com', password: 'password123' });

  const validFormData = {
    fullName: 'John Doe',
    shopName: 'Test Shop',
    phone: '555-1234',
    streetAddress: '123 Main St',
    city: 'Test City',
    state: 'CA',
    zipCode: '12345'
  };

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

    // Set up sessionStorage spies
    sessionStorageGetItemSpy = spyOn(sessionStorage, 'getItem');
    sessionStorageRemoveItemSpy = spyOn(sessionStorage, 'removeItem');
  });

  /**
   * Helper to initialize component with auth data in sessionStorage
   */
  function initializeWithAuthData(authData: string | null = validAuthData) {
    sessionStorageGetItemSpy.and.returnValue(authData);
    fixture.detectChanges();
  }

  /**
   * Helper to fill form with valid data
   */
  function fillValidForm(overrides: Partial<typeof validFormData> = {}) {
    component.profileForm.patchValue({ ...validFormData, ...overrides });
  }

  it('should create', () => {
    initializeWithAuthData();
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    initializeWithAuthData();

    expect(component.isSubmitting()).toBeFalse();
    expect(component.errorMessage()).toBe('');
    expect(component.profileForm.get('fullName')?.value).toBe('');
    expect(component.profileForm.get('shopName')?.value).toBe('');
    expect(component.profileForm.get('phone')?.value).toBe('');
    expect(component.profileForm.get('streetAddress')?.value).toBe('');
    expect(component.profileForm.get('city')?.value).toBe('');
    expect(component.profileForm.get('state')?.value).toBe('');
    expect(component.profileForm.get('zipCode')?.value).toBe('');
  });

  it('should set user email from session data', () => {
    initializeWithAuthData();

    expect(component.userEmail).toBe('test@example.com');
  });

  it('should validate required fields', () => {
    initializeWithAuthData();

    const form = component.profileForm;

    expect(form.valid).toBeFalse();
    expect(form.get('fullName')?.hasError('required')).toBeTrue();
    expect(form.get('shopName')?.hasError('required')).toBeTrue();
    expect(form.get('streetAddress')?.hasError('required')).toBeTrue();
    expect(form.get('city')?.hasError('required')).toBeTrue();
    expect(form.get('state')?.hasError('required')).toBeTrue();
    expect(form.get('zipCode')?.hasError('required')).toBeTrue();
  });

  it('should not require phone field', () => {
    initializeWithAuthData();

    const phoneControl = component.profileForm.get('phone');
    expect(phoneControl?.hasError('required')).toBeFalse();
  });

  it('should validate ZIP code pattern', () => {
    initializeWithAuthData();

    const zipCodeControl = component.profileForm.get('zipCode');

    zipCodeControl?.setValue('invalid');
    expect(zipCodeControl?.hasError('pattern')).toBeTrue();

    zipCodeControl?.setValue('12345');
    expect(zipCodeControl?.hasError('pattern')).toBeFalse();

    zipCodeControl?.setValue('12345-6789');
    expect(zipCodeControl?.hasError('pattern')).toBeFalse();
  });

  it('should redirect to step 1 if no auth data on init', () => {
    initializeWithAuthData(null);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/signup/owner']);
  });

  it('should not submit if form is invalid', () => {
    initializeWithAuthData();
    spyOn<any>(component, 'markAllFieldsTouched');

    // Form is invalid by default (empty required fields)
    component.onSubmit();

    expect(component['markAllFieldsTouched']).toHaveBeenCalled();
    expect(component.isSubmitting()).toBeFalse();
    expect(mockAuthService.registerOwnerFrictionless).not.toHaveBeenCalled();
  });

  it('should mark all fields as touched when form is invalid', () => {
    initializeWithAuthData();

    const form = component.profileForm;

    // Ensure fields are not touched initially
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsUntouched();
    });

    component['markAllFieldsTouched']();

    Object.keys(form.controls).forEach(key => {
      expect(form.get(key)?.touched).toBeTrue();
    });
  });

  it('should handle missing session data during submit', () => {
    initializeWithAuthData();

    // Fill form with valid data
    fillValidForm();

    // Now clear the session data
    sessionStorageGetItemSpy.and.returnValue(null);

    component.onSubmit();

    expect(component.errorMessage()).toBe('Session expired. Please start over.');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/signup/owner']);
    expect(mockAuthService.registerOwnerFrictionless).not.toHaveBeenCalled();
  });

  it('should handle registration failure', () => {
    initializeWithAuthData();

    const mockResponse = {
      success: false,
      message: 'Shop name already exists'
    };
    mockAuthService.registerOwnerFrictionless.and.returnValue(of(mockResponse));

    fillValidForm({ shopName: 'Existing Shop' });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Shop name already exists');
    expect(component.isSubmitting()).toBeFalse();
    expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/register/success'], jasmine.any(Object));
  });

  it('should handle API error during registration', () => {
    initializeWithAuthData();

    const mockError = {
      message: 'Server error occurred'
    };
    mockAuthService.registerOwnerFrictionless.and.returnValue(throwError(() => mockError));

    fillValidForm();

    component.onSubmit();

    expect(component.errorMessage()).toBe('Server error occurred');
    expect(component.isSubmitting()).toBeFalse();
  });

  it('should handle empty phone field correctly', () => {
    initializeWithAuthData();

    const mockResponse = {
      success: true,
      role: 'owner',
      message: 'Registration successful'
    };
    mockAuthService.registerOwnerFrictionless.and.returnValue(of(mockResponse));

    fillValidForm({ phone: '' });

    component.onSubmit();

    expect(mockAuthService.registerOwnerFrictionless).toHaveBeenCalledWith(
      jasmine.objectContaining({
        phone: ''
      })
    );
  });

  it('should combine address fields into single address string', () => {
    initializeWithAuthData();

    const mockResponse = {
      success: true,
      role: 'owner',
      message: 'Registration successful'
    };
    mockAuthService.registerOwnerFrictionless.and.returnValue(of(mockResponse));

    fillValidForm({
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

  it('should send separate address fields in request', () => {
    initializeWithAuthData();

    const mockResponse = {
      success: true,
      role: 'owner',
      message: 'Registration successful'
    };
    mockAuthService.registerOwnerFrictionless.and.returnValue(of(mockResponse));

    fillValidForm({
      streetAddress: '456 Oak Ave',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701'
    });

    component.onSubmit();

    expect(mockAuthService.registerOwnerFrictionless).toHaveBeenCalledWith(
      jasmine.objectContaining({
        streetAddress: '456 Oak Ave',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701'
      })
    );
  });

  it('should navigate to dashboard when token is provided', fakeAsync(() => {
    initializeWithAuthData();

    const mockResponse = {
      success: true,
      role: 'owner',
      message: 'Registration successful',
      token: 'jwt-token-123'
    };
    mockAuthService.registerOwnerFrictionless.and.returnValue(of(mockResponse));

    fillValidForm();

    component.onSubmit();
    tick();

    expect(mockAuthService.registerOwnerFrictionless).toHaveBeenCalledWith(jasmine.objectContaining({
      fullName: 'John Doe',
      email: 'test@example.com',
      phone: '555-1234',
      password: 'password123',
      shopName: 'Test Shop',
      address: '123 Main St, Test City, CA 12345'
    }));

    expect(sessionStorageRemoveItemSpy).toHaveBeenCalledWith('ownerAuthData');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/owner/dashboard']);
  }));

  it('should navigate to success page when no token (approval required)', fakeAsync(() => {
    initializeWithAuthData();

    const mockResponse = {
      success: true,
      role: 'owner',
      message: 'Registration successful'
      // No token - approval required
    };
    mockAuthService.registerOwnerFrictionless.and.returnValue(of(mockResponse));

    fillValidForm();

    component.onSubmit();
    tick();

    expect(mockAuthService.registerOwnerFrictionless).toHaveBeenCalledWith(jasmine.objectContaining({
      fullName: 'John Doe',
      email: 'test@example.com',
      phone: '555-1234',
      password: 'password123',
      shopName: 'Test Shop',
      address: '123 Main St, Test City, CA 12345'
    }));

    expect(sessionStorageRemoveItemSpy).toHaveBeenCalledWith('ownerAuthData');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/register/success'], {
      queryParams: {
        type: 'owner',
        shopName: 'Test Shop',
        email: 'test@example.com'
      }
    });
  }));

  it('should set isSubmitting to true during registration', fakeAsync(() => {
    initializeWithAuthData();

    let submittingDuringCall = false;
    mockAuthService.registerOwnerFrictionless.and.callFake(() => {
      submittingDuringCall = component.isSubmitting();
      return of({ success: true, role: 'owner', message: 'Success' });
    });

    fillValidForm();

    component.onSubmit();

    expect(submittingDuringCall).toBeTrue();

    tick();

    expect(component.isSubmitting()).toBeFalse();
  }));

  it('should handle generic error without message', () => {
    initializeWithAuthData();

    mockAuthService.registerOwnerFrictionless.and.returnValue(throwError(() => ({})));

    fillValidForm();

    component.onSubmit();

    expect(component.errorMessage()).toBe('An unexpected error occurred');
    expect(component.isSubmitting()).toBeFalse();
  });

  it('should handle registration failure without message', () => {
    initializeWithAuthData();

    const mockResponse = {
      success: false
      // No message
    };
    mockAuthService.registerOwnerFrictionless.and.returnValue(of(mockResponse));

    fillValidForm();

    component.onSubmit();

    expect(component.errorMessage()).toBe('Registration failed');
  });

  describe('State Dropdown', () => {
    it('should have all US states as options', () => {
      initializeWithAuthData();

      const stateSelect = fixture.nativeElement.querySelector('#state');
      if (stateSelect) {
        const options = stateSelect.querySelectorAll('option');

        // Should have 51 options (empty option + 50 states)
        expect(options.length).toBe(51);

        // Check for a few specific states
        const optionValues = Array.from(options).map((option: any) => option.value);
        expect(optionValues).toContain('CA');
        expect(optionValues).toContain('NY');
        expect(optionValues).toContain('TX');
        expect(optionValues).toContain('FL');
      }
    });
  });
});