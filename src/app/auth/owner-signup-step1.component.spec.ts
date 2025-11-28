import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { OwnerSignupStep1Component } from './owner-signup-step1.component';
import { AuthService } from '../services/auth.service';

describe('OwnerSignupStep1Component', () => {
  let component: OwnerSignupStep1Component;
  let fixture: ComponentFixture<OwnerSignupStep1Component>;
  let mockRouter: Router;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['registerOwner']);

    await TestBed.configureTestingModule({
      imports: [
        OwnerSignupStep1Component,
        RouterTestingModule.withRoutes([
          { path: 'signup/owner/profile', component: OwnerSignupStep1Component }
        ])
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerSignupStep1Component);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    spyOn(mockRouter, 'navigate');

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

  it('should store auth data and navigate to step 2 on successful submit', (done) => {
    spyOn(sessionStorage, 'setItem');

    // Fill form with valid data
    component.authForm.patchValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();

    expect(component.isSubmitting()).toBeTrue();

    setTimeout(() => {
      expect(sessionStorage.setItem).toHaveBeenCalledWith('ownerAuthData',
        JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/signup/owner/profile']);
      expect(component.isSubmitting()).toBeFalse();
      done();
    }, 1100);
  });

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
});