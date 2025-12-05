import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Component } from '@angular/core';
import { consignorsignupStep2Component } from './consignor-signup-step2.component';
import { AuthService } from '../services/auth.service';

// Mock components for routing tests
@Component({ template: '' })
class MockLoginComponent { }

@Component({ template: '' })
class MockconsignorsignupStep1Component { }

describe('consignorsignupStep2Component', () => {
  let component: consignorsignupStep2Component;
  let fixture: ComponentFixture<consignorsignupStep2Component>;
  let router: Router;
  let authService: jasmine.SpyObj<AuthService>;
  let sessionStorageSpy: jasmine.Spy;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['registerProvider']);
    sessionStorageSpy = spyOn(sessionStorage, 'getItem').and.returnValue(null);
    spyOn(sessionStorage, 'setItem');
    spyOn(sessionStorage, 'removeItem');

    await TestBed.configureTestingModule({
      imports: [
        consignorsignupStep2Component,
        RouterTestingModule.withRoutes([
          { path: 'login', component: MockLoginComponent },
          { path: 'signup/consignor', component: MockconsignorsignupStep1Component }
        ])
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(consignorsignupStep2Component);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    spyOn(router, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load auth data from session storage', () => {
      const authData = { email: 'test@example.com', password: 'password123' };
      sessionStorageSpy.and.returnValue(JSON.stringify(authData));

      component.ngOnInit();

      expect(component.authData).toEqual(authData);
    });

    it('should redirect to step 1 if no auth data exists', () => {
      sessionStorageSpy.and.returnValue(null);

      component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/signup/consignor']);
    });
  });

  it('should initialize with empty form', () => {
    expect(component.signupForm.get('name')?.value).toBe('');
    expect(component.signupForm.get('phone')?.value).toBe('');
    expect(component.isSubmitting()).toBeFalse();
    expect(component.errorMessage()).toBe('');
  });

  it('should display the correct title and description', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('Join as a Consignor');
    // The subtitle paragraph was removed as part of the UI updates
    expect(compiled.querySelector('.signup-header p')).toBeNull();
  });

  it('should require all form fields', () => {
    const form = component.signupForm;

    expect(form.get('name')?.hasError('required')).toBe(true);
    expect(form.get('phone')?.hasError('required')).toBe(true);
  });

  it('should validate name minimum length', () => {
    const nameControl = component.signupForm.get('name');

    nameControl?.setValue('a');
    expect(nameControl?.hasError('minlength')).toBe(true);

    nameControl?.setValue('John Doe');
    expect(nameControl?.hasError('minlength')).toBe(false);
  });

  it('should validate phone minimum length', () => {
    const phoneControl = component.signupForm.get('phone');

    phoneControl?.setValue('123');
    expect(phoneControl?.hasError('minlength')).toBe(true);

    phoneControl?.setValue('1234567890');
    expect(phoneControl?.hasError('minlength')).toBe(false);
  });

  it('should disable submit button when form is invalid', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);

    // Fill form with valid data
    component.signupForm.patchValue({
      name: 'John Doe',
      phone: '1234567890'
    });
    fixture.detectChanges();

    expect(submitButton.disabled).toBe(false);
  });

  it('should display validation errors when fields are touched', () => {
    const nameField = component.signupForm.get('name');
    nameField?.markAsTouched();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorMessage = compiled.querySelector('.form-group .error-message');

    expect(errorMessage?.textContent?.trim()).toBe('Full name is required');
  });

  it('should show correct button text based on submission state', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;

    expect(submitButton.textContent?.trim()).toBe('Create Consignor Account');

    component.isSubmitting.set(true);
    fixture.detectChanges();

    expect(submitButton.textContent?.trim()).toBe('Creating Account...');
  });

  it('should have proper navigation links', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const backLink = compiled.querySelector('.back-link');
    expect(backLink?.getAttribute('routerLink')).toBe('/signup/consignor');
    expect(backLink?.textContent?.trim()).toBe('← Back');

    const roleSelectionLink = compiled.querySelector('a[routerLink="/signup"]');
    expect(roleSelectionLink?.textContent?.trim()).toBe('Choose different account type');

    const loginLink = compiled.querySelector('.alternative-links a[routerLink="/login"]');
    expect(loginLink?.textContent?.trim()).toBe('Already have an account?');
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      component.authData = { email: 'test@example.com', password: 'password123' };
      component.signupForm.patchValue({
        name: 'John Doe',
        phone: '1234567890'
      });
    });

    it('should call authService.registerProvider with correct data on form submission', () => {
      const mockResponse = { success: true };
      authService.registerProvider.and.returnValue(of(mockResponse));

      component.onSubmit();

      expect(authService.registerProvider).toHaveBeenCalledWith({
        storeCode: '',
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890'
      });
    });

    it('should navigate to login with success message on successful registration', () => {
      const mockResponse = { success: true };
      authService.registerProvider.and.returnValue(of(mockResponse));

      component.onSubmit();

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('providerAuthData');
      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: {
          message: 'Account created successfully! Log in to join consignment shops.'
        }
      });
    });

    it('should display error message on registration failure', () => {
      const mockErrorResponse = { success: false, message: 'Registration failed' };
      authService.registerProvider.and.returnValue(of(mockErrorResponse));

      component.onSubmit();

      expect(component.errorMessage()).toBe('Registration failed');
      expect(component.isSubmitting()).toBe(false);
      expect(sessionStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should handle HTTP errors gracefully', () => {
      const mockError = { message: 'Network error' };
      authService.registerProvider.and.returnValue(throwError(() => mockError));

      component.onSubmit();

      expect(component.errorMessage()).toBe('Network error');
      expect(component.isSubmitting()).toBe(false);
    });

    it('should handle generic error without message', () => {
      const mockErrorResponse = { success: false };
      authService.registerProvider.and.returnValue(of(mockErrorResponse));

      component.onSubmit();

      expect(component.errorMessage()).toBe('Registration failed. Please try again.');
      expect(component.isSubmitting()).toBe(false);
    });

    it('should not submit if form is invalid', () => {
      spyOn(component, 'markAllFieldsAsTouched' as any);

      // Reset form to invalid state
      component.signupForm.patchValue({
        name: '',
        phone: ''
      });

      component.onSubmit();

      expect(authService.registerProvider).not.toHaveBeenCalled();
      expect(component['markAllFieldsAsTouched']).toHaveBeenCalled();
    });

    it('should not submit if no auth data is available', () => {
      spyOn(component, 'markAllFieldsAsTouched' as any);
      component.authData = null;

      component.onSubmit();

      expect(authService.registerProvider).not.toHaveBeenCalled();
      expect(component['markAllFieldsAsTouched']).toHaveBeenCalled();
    });

    it('should show loading state during submission', () => {
      const mockResponse = { success: true };
      authService.registerProvider.and.returnValue(of(mockResponse));

      component.onSubmit();

      expect(component.isSubmitting()).toBe(true);
    });
  });

  describe('Information Display', () => {
    it('should not display information note (removed in UI update)', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const infoNote = compiled.querySelector('.info-note');

      // The info note was removed as part of the UI updates
      expect(infoNote).toBeNull();
    });

    it('should display error messages when API call fails', () => {
      component.errorMessage.set('Test error message');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorDisplay = compiled.querySelector('.api-error');

      expect(errorDisplay).toBeTruthy();
      expect(errorDisplay?.textContent?.trim()).toBe('Test error message');
    });
  });

  describe('Session Storage Integration', () => {
    it('should remove auth data from session storage on successful registration', () => {
      component.authData = { email: 'test@example.com', password: 'password123' };
      component.signupForm.patchValue({
        name: 'John Doe',
        phone: '1234567890'
      });

      const mockResponse = { success: true };
      authService.registerProvider.and.returnValue(of(mockResponse));

      component.onSubmit();

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('providerAuthData');
    });

    it('should not remove auth data on registration failure', () => {
      component.authData = { email: 'test@example.com', password: 'password123' };
      component.signupForm.patchValue({
        name: 'John Doe',
        phone: '1234567890'
      });

      const mockErrorResponse = { success: false, message: 'Registration failed' };
      authService.registerProvider.and.returnValue(of(mockErrorResponse));

      component.onSubmit();

      expect(sessionStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('Private Methods', () => {
    it('should mark all fields as touched', () => {
      const form = component.signupForm;

      // Ensure fields are not touched initially
      Object.keys(form.controls).forEach(key => {
        form.get(key)?.markAsUntouched();
      });

      (component as any).markAllFieldsAsTouched();

      Object.keys(form.controls).forEach(key => {
        expect(form.get(key)?.touched).toBeTrue();
      });
    });
  });
});