import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Component } from '@angular/core';
import { ProviderAddComponent } from './provider-add.component';
import { ProviderService } from '../services/provider.service';
import { Provider } from '../models/provider.model';

// Mock components for routing tests
@Component({ template: '' })
class MockProviderListComponent { }

@Component({ template: '' })
class MockProviderDetailComponent { }

describe('ProviderAddComponent', () => {
  let component: ProviderAddComponent;
  let fixture: ComponentFixture<ProviderAddComponent>;
  let router: Router;
  let providerService: jasmine.SpyObj<ProviderService>;

  beforeEach(async () => {
    const providerServiceSpy = jasmine.createSpyObj('ProviderService', ['createProvider']);

    await TestBed.configureTestingModule({
      imports: [
        ProviderAddComponent,
        RouterTestingModule.withRoutes([
          { path: 'owner/providers', component: MockProviderListComponent },
          { path: 'owner/providers/:id', component: MockProviderDetailComponent }
        ])
      ],
      providers: [
        { provide: ProviderService, useValue: providerServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderAddComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    providerService = TestBed.inject(ProviderService) as jasmine.SpyObj<ProviderService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form data', () => {
    expect(component.providerData.name).toBe('');
    expect(component.providerData.email).toBe('');
    expect(component.providerData.phone).toBe('');
    expect(component.providerData.address).toBe('');
    expect(component.providerData.commissionRate).toBe(50);
    expect(component.providerData.preferredPaymentMethod).toBe('');
    expect(component.providerData.paymentDetails).toBe('');
    expect(component.providerData.notes).toBe('');
  });

  it('should display the correct title and description', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toBe('Add New Provider');
    expect(compiled.querySelector('.subtitle')?.textContent)
      .toContain('Create a new provider account or consider using');
  });

  it('should have correct breadcrumb link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const breadcrumbLink = compiled.querySelector('.breadcrumb a');

    expect(breadcrumbLink?.getAttribute('routerLink')).toBe('/owner/providers');
  });

  it('should create provider successfully', () => {
    const mockProvider: Provider = {
      id: 1,
      name: 'Test Provider',
      email: 'test@provider.com',
      phone: '1234567890',
      address: '123 Test Street',
      commissionRate: 50,
      preferredPaymentMethod: 'Bank Transfer',
      paymentDetails: 'Account: 123456',
      notes: 'Test notes',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: 1
    };

    providerService.createProvider.and.returnValue(of(mockProvider));
    spyOn(router, 'navigate');

    // Fill form with valid data
    component.providerData = {
      name: 'Test Provider',
      email: 'test@provider.com',
      phone: '1234567890',
      address: '123 Test Street',
      commissionRate: 50,
      preferredPaymentMethod: 'Bank Transfer',
      paymentDetails: 'Account: 123456',
      notes: 'Test notes'
    };

    component.onSubmit();

    expect(providerService.createProvider).toHaveBeenCalledWith({
      name: 'Test Provider',
      email: 'test@provider.com',
      phone: '1234567890',
      address: '123 Test Street',
      commissionRate: 50,
      preferredPaymentMethod: 'Bank Transfer',
      paymentDetails: 'Account: 123456',
      notes: 'Test notes'
    });

    expect(component.successMessage()).toBe('Provider created successfully!');
    expect(component.isSubmitting()).toBe(false);

    // Check that navigation happens after timeout
    setTimeout(() => {
      expect(router.navigate).toHaveBeenCalledWith(['/owner/providers', 1]);
    }, 2100);
  });

  it('should handle creation error', () => {
    const mockError = { error: { message: 'Email already exists' } };
    providerService.createProvider.and.returnValue(throwError(() => mockError));

    component.providerData = {
      name: 'Test Provider',
      email: 'test@provider.com',
      phone: '1234567890',
      address: '123 Test Street',
      commissionRate: 50,
      preferredPaymentMethod: 'Bank Transfer',
      paymentDetails: 'Account: 123456',
      notes: 'Test notes'
    };

    component.onSubmit();

    expect(component.errorMessage()).toBe('Email already exists');
    expect(component.isSubmitting()).toBe(false);
    expect(component.successMessage()).toBe('');
  });

  it('should handle creation error without message', () => {
    const mockError = {};
    providerService.createProvider.and.returnValue(throwError(() => mockError));

    component.providerData = {
      name: 'Test Provider',
      email: 'test@provider.com',
      phone: '',
      address: '',
      commissionRate: 50,
      preferredPaymentMethod: '',
      paymentDetails: '',
      notes: ''
    };

    component.onSubmit();

    expect(component.errorMessage()).toBe('Failed to create provider. Please try again.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should not submit if already submitting', () => {
    component.isSubmitting.set(true);

    component.onSubmit();

    expect(providerService.createProvider).not.toHaveBeenCalled();
  });

  it('should clean up undefined values in request', () => {
    const mockProvider: Provider = {
      id: 1,
      name: 'Test Provider',
      email: 'test@provider.com',
      phone: '1234567890',
      address: undefined,
      commissionRate: 60,
      preferredPaymentMethod: undefined,
      paymentDetails: undefined,
      notes: undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: 1
    };

    providerService.createProvider.and.returnValue(of(mockProvider));

    component.providerData = {
      name: 'Test Provider',
      email: 'test@provider.com',
      phone: '1234567890',
      address: '',
      commissionRate: 60,
      preferredPaymentMethod: '',
      paymentDetails: '',
      notes: ''
    };

    component.onSubmit();

    expect(providerService.createProvider).toHaveBeenCalledWith({
      name: 'Test Provider',
      email: 'test@provider.com',
      phone: '1234567890',
      address: undefined,
      commissionRate: 60,
      preferredPaymentMethod: undefined,
      paymentDetails: undefined,
      notes: undefined
    });
  });

  it('should have proper form validation', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Check required fields exist
    const nameInput = compiled.querySelector('input[name="name"]');
    const emailInput = compiled.querySelector('input[name="email"]');

    expect(nameInput?.getAttribute('required')).toBe('');
    expect(emailInput?.getAttribute('required')).toBe('');
    expect(emailInput?.getAttribute('type')).toBe('email');
  });

  it('should display error message when present', () => {
    component.errorMessage.set('Test error message');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const errorElement = compiled.querySelector('.api-error');

    expect(errorElement?.textContent?.trim()).toBe('Test error message');
  });

  it('should display success message when present', () => {
    component.successMessage.set('Test success message');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const successElement = compiled.querySelector('.success-message');

    expect(successElement?.textContent?.trim()).toBe('Test success message');
  });

  it('should have cancel buttons with correct routing', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cancelButtons = compiled.querySelectorAll('button[routerLink="/owner/providers"]');

    expect(cancelButtons.length).toBeGreaterThan(0);
  });
});