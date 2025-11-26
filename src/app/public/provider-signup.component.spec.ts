import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Component } from '@angular/core';
import { ProviderSignupComponent } from './provider-signup.component';
import { AuthService } from '../services/auth.service';

// Mock components for routing tests
@Component({ template: '' })
class MockLoginComponent { }

@Component({ template: '' })
class MockRoleSelectionComponent { }

describe('ProviderSignupComponent', () => {
  let component: ProviderSignupComponent;
  let fixture: ComponentFixture<ProviderSignupComponent>;
  let router: Router;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['registerProvider']);

    await TestBed.configureTestingModule({
      imports: [
        ProviderSignupComponent,
        RouterTestingModule.withRoutes([
          { path: 'login', component: MockLoginComponent },
          { path: 'signup', component: MockRoleSelectionComponent }
        ])
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderSignupComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.signupForm.get('name')?.value).toBe('');
    expect(component.signupForm.get('email')?.value).toBe('');
    expect(component.signupForm.get('password')?.value).toBe('');
    expect(component.signupForm.get('phone')?.value).toBe('');
  });

  it('should display the correct title and description', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h2')?.textContent).toBe('Join as a Provider');
    expect(compiled.querySelector('.signup-header p')?.textContent)
      .toContain('Create your account to start consigning items at participating shops');
  });

  it('should require all form fields', () => {
    const form = component.signupForm;

    expect(form.get('name')?.hasError('required')).toBe(true);
    expect(form.get('email')?.hasError('required')).toBe(true);
    expect(form.get('password')?.hasError('required')).toBe(true);
    expect(form.get('phone')?.hasError('required')).toBe(true);
  });

  it('should validate email format', () => {
    const emailControl = component.signupForm.get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBe(true);

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBe(false);
  });

  it('should validate password length', () => {
    const passwordControl = component.signupForm.get('password');

    passwordControl?.setValue('short');
    expect(passwordControl?.hasError('minlength')).toBe(true);

    passwordControl?.setValue('longpassword123');
    expect(passwordControl?.hasError('minlength')).toBe(false);
  });

  it('should validate name length', () => {
    const nameControl = component.signupForm.get('name');

    nameControl?.setValue('a');
    expect(nameControl?.hasError('minlength')).toBe(true);

    nameControl?.setValue('John Doe');
    expect(nameControl?.hasError('minlength')).toBe(false);
  });

  it('should validate phone length', () => {
    const phoneControl = component.signupForm.get('phone');

    phoneControl?.setValue('123');
    expect(phoneControl?.hasError('minlength')).toBe(true);

    phoneControl?.setValue('1234567890');
    expect(phoneControl?.hasError('minlength')).toBe(false);
  });

  it('should disable submit button when form is invalid', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('.btn-primary') as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);

    // Fill form with valid data
    component.signupForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890'
    });
    fixture.detectChanges();

    expect(submitButton.disabled).toBe(false);
  });

  it('should show validation errors when fields are touched', () => {
    const nameField = component.signupForm.get('name');
    nameField?.markAsTouched();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorMessage = compiled.querySelector('.form-group .error-message');

    expect(errorMessage?.textContent?.trim()).toBe('Full name is required');
  });

  it('should call authService.registerProvider on form submission', () => {
    const mockResponse = { success: true };
    authService.registerProvider.and.returnValue(of(mockResponse));
    spyOn(router, 'navigate');

    component.signupForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890'
    });

    component.onSubmit();

    expect(authService.registerProvider).toHaveBeenCalledWith({
      storeCode: '',
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890'
    });
  });

  it('should navigate to login with success message on successful registration', () => {
    const mockResponse = { success: true };
    authService.registerProvider.and.returnValue(of(mockResponse));
    spyOn(router, 'navigate');

    component.signupForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890'
    });

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        message: 'Account created successfully! Log in to join consignment shops.'
      }
    });
  });

  it('should display error message on registration failure', () => {
    const mockErrorResponse = { success: false, message: 'Registration failed' };
    authService.registerProvider.and.returnValue(of(mockErrorResponse));

    component.signupForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890'
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Registration failed');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should handle HTTP errors gracefully', () => {
    const mockError = { message: 'Network error' };
    authService.registerProvider.and.returnValue(throwError(() => mockError));

    component.signupForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890'
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Network error');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should not submit if form is invalid', () => {
    spyOn(component, 'markAllFieldsAsTouched' as any);

    // Leave form empty (invalid)
    component.onSubmit();

    expect(authService.registerProvider).not.toHaveBeenCalled();
    expect(component['markAllFieldsAsTouched']).toHaveBeenCalled();
  });

  it('should show loading state during submission', () => {
    authService.registerProvider.and.returnValue(of({ success: true }));

    component.signupForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '1234567890'
    });

    // Start submission
    component.onSubmit();

    // Should be in loading state initially
    expect(component.isSubmitting()).toBe(true);
  });

  it('should display information note about next steps', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const infoNote = compiled.querySelector('.info-note');

    expect(infoNote).toBeTruthy();
    expect(infoNote?.textContent).toContain('After creating your account');
    expect(infoNote?.textContent).toContain('join specific consignment shops');
  });

  it('should have proper navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const roleSelectionLink = compiled.querySelector('a[routerLink="/signup"]');
    expect(roleSelectionLink?.textContent?.trim()).toBe('Choose different account type');

    const loginLink = compiled.querySelector('.alternative-links a[routerLink="/login"]');
    expect(loginLink?.textContent?.trim()).toBe('Already have an account?');
  });
});