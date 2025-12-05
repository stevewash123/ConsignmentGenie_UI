import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { ConsignorSignupStep1Component } from './consignor-signup-step1.component';
import { AuthService } from '../services/auth.service';
import { ConsignorService } from '../services/consignor.service';

describe('ConsignorSignupStep1Component', () => {
  let component: ConsignorSignupStep1Component;
  let fixture: ComponentFixture<ConsignorSignupStep1Component>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockConsignorService: jasmine.SpyObj<ConsignorService>;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['registerProvider']);
    const ConsignorServiceSpy = jasmine.createSpyObj('ConsignorService', ['validateInvitation', 'registerFromInvitation']);
    const httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of({}),
      routerState: { root: {} }
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    mockRouter.navigate.and.returnValue(Promise.resolve(true));
    const mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        data: {},
        queryParams: {}
      },
      params: of({}),
      queryParams: of({})
    });

    await TestBed.configureTestingModule({
      imports: [
        ConsignorSignupStep1Component
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ConsignorService, useValue: ConsignorServiceSpy },
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsignorSignupStep1Component);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockConsignorService = TestBed.inject(ConsignorService) as jasmine.SpyObj<ConsignorService>;
    mockHttpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isSubmitting()).toBeFalse();
    expect(component.errorMessage()).toBe('');
    expect(component.authForm.get('email')?.value).toBe('');
    expect(component.authForm.get('password')?.value).toBe('');
    expect(component.authForm.get('confirmPassword')?.value).toBe('');
  });

  it('should display the correct title and description', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent?.trim()).toBe('LOGIN');
    expect(compiled.querySelector('.subtitle')?.textContent?.trim())
      .toBe('Choose your method to log in as a consignor');
  });

  it('should validate required fields', () => {
    const form = component.authForm;

    expect(form.valid).toBeFalse();
    expect(form.get('email')?.hasError('required')).toBeTrue();
    expect(form.get('password')?.hasError('required')).toBeTrue();
    expect(form.get('confirmPassword')?.hasError('required')).toBeTrue();
  });

  it('should validate email format', () => {
    const emailControl = component.authForm.get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTrue();

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalse();
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.authForm.get('password');

    passwordControl?.setValue('short');
    expect(passwordControl?.hasError('minlength')).toBeTrue();

    passwordControl?.setValue('validpassword');
    expect(passwordControl?.hasError('minlength')).toBeFalse();
  });

  it('should validate password confirmation match', () => {
    const form = component.authForm;
    const confirmPasswordControl = form.get('confirmPassword');

    form.get('password')?.setValue('password123');
    confirmPasswordControl?.setValue('differentpassword');

    // Trigger validator
    component.passwordMatchValidator(form);

    expect(confirmPasswordControl?.hasError('passwordMismatch')).toBeTrue();

    confirmPasswordControl?.setValue('password123');
    component.passwordMatchValidator(form);

    expect(confirmPasswordControl?.hasError('passwordMismatch')).toBeFalsy();
  });

  it('should disable submit button when form is invalid', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('.submit-btn') as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);

    // Fill form with valid data
    component.authForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    fixture.detectChanges();

    expect(submitButton.disabled).toBe(false);
  });

  it('should show correct button text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('.submit-btn') as HTMLButtonElement;

    expect(submitButton.textContent?.trim()).toBe('Continue to consignor Details');

    component.isSubmitting.set(true);
    fixture.detectChanges();

    expect(submitButton.textContent?.trim()).toBe('Creating Account...');
  });

  it('should store auth data and navigate to step 2 on successful submit', fakeAsync(() => {
    spyOn(sessionStorage, 'setItem');

    // Fill form with valid data
    component.authForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();

    expect(component.isSubmitting()).toBeTrue();
    expect(sessionStorage.setItem).toHaveBeenCalledWith('consignorAuthData',
      JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    );

    // Advance time by 1000ms to trigger the setTimeout
    tick(1000);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/signup/consignor/details']);
    expect(component.isSubmitting()).toBeFalse();
  }));

  it('should not submit if form is invalid', () => {
    spyOn(component as any, 'markAllFieldsTouched');

    // Form is invalid by default (empty fields)
    component.onSubmit();

    expect((component as any).markAllFieldsTouched).toHaveBeenCalled();
    expect(component.isSubmitting()).toBeFalse();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should mark all fields as touched when form is invalid', () => {
    const form = component.authForm;

    // Ensure fields are not touched initially
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsUntouched();
    });

    (component as any).markAllFieldsTouched();

    Object.keys(form.controls).forEach(key => {
      expect(form.get(key)?.touched).toBeTrue();
    });
  });

  it('should display validation errors when fields are touched', () => {
    const emailField = component.authForm.get('email');
    emailField?.markAsTouched();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorMessage = compiled.querySelector('.form-group .error-message');

    expect(errorMessage?.textContent?.trim()).toBe('Email is required');
  });

  describe('Social Authentication', () => {
    it('should show coming soon message for Google sign in', () => {
      component.signInWithGoogle();
      expect(component.errorMessage()).toBe('Social login coming soon! Please use email/password for now.');
    });

    it('should show coming soon message for Facebook sign in', () => {
      component.signInWithFacebook();
      expect(component.errorMessage()).toBe('Social login coming soon! Please use email/password for now.');
    });

    it('should show coming soon message for Twitter sign in', () => {
      component.signInWithTwitter();
      expect(component.errorMessage()).toBe('Social login coming soon! Please use email/password for now.');
    });

    it('should show coming soon message for Apple sign in', () => {
      component.signInWithApple();
      expect(component.errorMessage()).toBe('Social login coming soon! Please use email/password for now.');
    });

    it('should show coming soon message for LinkedIn sign in', () => {
      component.signInWithLinkedIn();
      expect(component.errorMessage()).toBe('Social login coming soon! Please use email/password for now.');
    });

    it('should display all social authentication options', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('.google-btn')).toBeTruthy();
      expect(compiled.querySelector('.facebook-btn')).toBeTruthy();
      expect(compiled.querySelector('.twitter-btn')).toBeTruthy();
      expect(compiled.querySelector('.apple-btn')).toBeTruthy();
      expect(compiled.querySelector('.linkedin-btn')).toBeTruthy();
    });
  });

  describe('Password Match Validator', () => {
    it('should return null when passwords match', () => {
      const form = component.authForm;
      form.get('password')?.setValue('password123');
      form.get('confirmPassword')?.setValue('password123');

      const result = component.passwordMatchValidator(form);

      expect(result).toBeNull();
      expect(form.get('confirmPassword')?.hasError('passwordMismatch')).toBeFalsy();
    });

    it('should set error when passwords do not match', () => {
      const form = component.authForm;
      form.get('password')?.setValue('password123');
      form.get('confirmPassword')?.setValue('differentpassword');

      const result = component.passwordMatchValidator(form);

      expect(result).toBeNull();
      expect(form.get('confirmPassword')?.hasError('passwordMismatch')).toBeTrue();
    });

    it('should clear previous passwordMismatch error when passwords match', () => {
      const form = component.authForm;
      const confirmPasswordControl = form.get('confirmPassword');

      // Set initial mismatch
      form.get('password')?.setValue('password123');
      confirmPasswordControl?.setValue('differentpassword');
      component.passwordMatchValidator(form);
      expect(confirmPasswordControl?.hasError('passwordMismatch')).toBeTrue();

      // Fix the mismatch
      confirmPasswordControl?.setValue('password123');
      component.passwordMatchValidator(form);
      expect(confirmPasswordControl?.hasError('passwordMismatch')).toBeFalsy();
    });
  });

  describe('Navigation and UI Elements', () => {
    it('should have proper navigation links', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      const backLink = compiled.querySelector('.back-link');
      expect(backLink?.getAttribute('routerLink')).toBe('/signup');
      expect(backLink?.textContent?.trim()).toBe('← Back');

      const loginLink = compiled.querySelector('.login-link a');
      expect(loginLink?.getAttribute('routerLink')).toBe('/login');
      expect(loginLink?.textContent?.trim()).toBe('Sign in here');
    });

    it('should use purple theme for consignor branding', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      // Check if the component has consignor-specific styling
      const authPage = compiled.querySelector('.auth-page');
      expect(authPage).toBeTruthy();

      const backLink = compiled.querySelector('.back-link') as HTMLElement;
      expect(getComputedStyle(backLink).color).toBe('rgb(124, 58, 237)'); // #7c3aed
    });

    it('should display consignor-specific subtitle', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const subtitle = compiled.querySelector('.subtitle');

      expect(subtitle?.textContent?.trim()).toBe('Choose your method to log in as a consignor');
    });
  });

  describe('Invitation Token Detection', () => {
    it('should not redirect when no invitation parameters are present', () => {
      // Reset the router navigate spy before this test
      mockRouter.navigate.calls.reset();

      // This is the default case (no token, no storeCode) - use the existing component
      component.ngOnInit();

      // Should not redirect
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });
});

describe('ConsignorSignupStep1Component - With Invitation Token', () => {
  let component: ConsignorSignupStep1Component;
  let fixture: ComponentFixture<ConsignorSignupStep1Component>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['registerProvider']);
    const ConsignorServiceSpy = jasmine.createSpyObj('ConsignorService', ['validateInvitation', 'registerFromInvitation']);
    const httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of({}),
      routerState: { root: {} }
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    const mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        data: {},
        queryParams: {
          token: 'test-invitation-token',
          storeCode: 'TEST123'
        }
      },
      params: of({}),
      queryParams: of({})
    });

    await TestBed.configureTestingModule({
      imports: [ConsignorSignupStep1Component],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ConsignorService, useValue: ConsignorServiceSpy },
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsignorSignupStep1Component);
    component = fixture.componentInstance;
  });

  it('should redirect to invitation registration when token and storeCode are present', () => {
    // Trigger ngOnInit
    component.ngOnInit();

    // Verify it redirects to the invitation registration route
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/register/consignor/invitation'], {
      queryParams: { token: 'test-invitation-token' }
    });
  });
});

describe('ConsignorSignupStep1Component - With Token Only', () => {
  let component: ConsignorSignupStep1Component;
  let fixture: ComponentFixture<ConsignorSignupStep1Component>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['registerProvider']);
    const ConsignorServiceSpy = jasmine.createSpyObj('ConsignorService', ['validateInvitation', 'registerFromInvitation']);
    const httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of({}),
      routerState: { root: {} }
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    const mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        data: {},
        queryParams: {
          token: 'test-invitation-token'
          // No storeCode
        }
      },
      params: of({}),
      queryParams: of({})
    });

    await TestBed.configureTestingModule({
      imports: [ConsignorSignupStep1Component],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ConsignorService, useValue: ConsignorServiceSpy },
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsignorSignupStep1Component);
    component = fixture.componentInstance;
  });

  it('should not redirect when only token is present', () => {
    component.ngOnInit();

    // Should not redirect when storeCode is missing
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});