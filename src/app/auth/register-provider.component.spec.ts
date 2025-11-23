import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterProviderComponent } from './register-provider.component';
import { AuthService } from '../services/auth.service';

describe('RegisterProviderComponent', () => {
  let component: RegisterProviderComponent;
  let fixture: ComponentFixture<RegisterProviderComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // ✅ Create proper router spy
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['registerProvider']);

    await TestBed.configureTestingModule({
      declarations: [ RegisterProviderComponent ],
      imports: [ ReactiveFormsModule ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }  // ✅ Provide router spy
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with invalid form', () => {
    expect(component.registerForm.valid).toBeFalsy();
  });

  // ✅ Fix the hanging test with fakeAsync + tick
  it('should navigate on successful registration', fakeAsync(() => {
    // Setup mock to return successful observable
    mockAuthService.registerProvider.and.returnValue(of({ success: true }));
    
    // Fill form
    component.registerForm.patchValue({
      email: 'test@example.com',
      password: 'Password123!',
      fullName: 'Test User',
      phone: '555-1234',
      storeCode: 'ABC123'
    });

    // Submit
    component.onSubmit();
    
    // ✅ Tick to process async operations
    tick();

    // Verify navigation was called
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/pending-approval']);
  }));

  it('should display error on registration failure', fakeAsync(() => {
    const errorResponse = { 
      error: { 
        message: 'Email already exists' 
      } 
    };
    
    mockAuthService.registerProvider.and.returnValue(
      throwError(() => errorResponse)
    );
    
    component.registerForm.patchValue({
      email: 'test@example.com',
      password: 'Password123!',
      fullName: 'Test User',
      phone: '555-1234',
      storeCode: 'ABC123'
    });

    component.onSubmit();
    tick();

    expect(component.errorMessage).toBe('Email already exists');
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  }));

  it('should show generic error when no message provided', fakeAsync(() => {
    mockAuthService.registerProvider.and.returnValue(
      throwError(() => ({ error: {} }))
    );
    
    component.registerForm.patchValue({
      email: 'test@example.com',
      password: 'Password123!',
      fullName: 'Test User',
      phone: '555-1234',
      storeCode: 'ABC123'
    });

    component.onSubmit();
    tick();

    expect(component.errorMessage).toBe('Registration failed');
  }));

  it('should validate required fields', () => {
    const form = component.registerForm;
    
    expect(form.get('email')?.hasError('required')).toBeTruthy();
    expect(form.get('password')?.hasError('required')).toBeTruthy();
    expect(form.get('fullName')?.hasError('required')).toBeTruthy();
    expect(form.get('storeCode')?.hasError('required')).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.registerForm.get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.registerForm.get('password');
    
    passwordControl?.setValue('short');
    expect(passwordControl?.hasError('minlength')).toBeTruthy();
    
    passwordControl?.setValue('LongEnough123!');
    expect(passwordControl?.hasError('minlength')).toBeFalsy();
  });
});