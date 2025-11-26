import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Component } from '@angular/core';
import { ProviderEditComponent } from './provider-edit.component';
import { ProviderService } from '../services/provider.service';
import { Provider } from '../models/provider.model';

// Mock components for routing tests
@Component({ template: '' })
class MockProviderDetailComponent { }

@Component({ template: '' })
class MockProviderListComponent { }

describe('ProviderEditComponent', () => {
  let component: ProviderEditComponent;
  let fixture: ComponentFixture<ProviderEditComponent>;
  let router: Router;
  let activatedRoute: ActivatedRoute;
  let providerService: jasmine.SpyObj<ProviderService>;

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
    createdAt: new Date('2023-11-26T10:00:00Z'),
    updatedAt: new Date('2023-11-26T10:00:00Z'),
    organizationId: 1
  };

  beforeEach(async () => {
    const providerServiceSpy = jasmine.createSpyObj('ProviderService', [
      'getProvider',
      'updateProvider'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ProviderEditComponent,
        RouterTestingModule.withRoutes([
          { path: 'owner/providers/:id', component: MockProviderDetailComponent },
          { path: 'owner/providers', component: MockProviderListComponent }
        ])
      ],
      providers: [
        { provide: ProviderService, useValue: providerServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['id', '1']]))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderEditComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
    providerService = TestBed.inject(ProviderService) as jasmine.SpyObj<ProviderService>;

    providerService.getProvider.and.returnValue(of(mockProvider));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load provider data on init', () => {
    expect(providerService.getProvider).toHaveBeenCalledWith(1);
    expect(component.editData.name).toBe('Test Provider');
    expect(component.editData.email).toBe('test@provider.com');
    expect(component.editData.phone).toBe('1234567890');
    expect(component.editData.commissionRate).toBe(50);
  });

  it('should display the correct title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toBe('Edit Provider');
  });

  it('should have correct breadcrumb link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const breadcrumbLink = compiled.querySelector('.breadcrumb a');

    expect(breadcrumbLink?.getAttribute('ng-reflect-router-link')).toContain('/owner/providers,1');
  });

  it('should pre-populate form with provider data', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const nameInput = compiled.querySelector('input[name="name"]') as HTMLInputElement;
    const emailInput = compiled.querySelector('input[name="email"]') as HTMLInputElement;
    const phoneInput = compiled.querySelector('input[name="phone"]') as HTMLInputElement;

    expect(nameInput?.value).toBe('Test Provider');
    expect(emailInput?.value).toBe('test@provider.com');
    expect(phoneInput?.value).toBe('1234567890');
  });

  it('should update provider successfully', () => {
    const updatedProvider = { ...mockProvider, name: 'Updated Provider' };
    providerService.updateProvider.and.returnValue(of(updatedProvider));
    spyOn(router, 'navigate');

    // Update form data
    component.editData.name = 'Updated Provider';
    component.editData.email = 'updated@provider.com';

    component.onSubmit();

    expect(providerService.updateProvider).toHaveBeenCalledWith(1, {
      name: 'Updated Provider',
      email: 'updated@provider.com',
      phone: '1234567890',
      address: '123 Test Street',
      commissionRate: 50,
      preferredPaymentMethod: 'Bank Transfer',
      paymentDetails: 'Account: 123456',
      notes: 'Test notes',
      isActive: true
    });

    expect(component.successMessage()).toBe('Provider updated successfully!');
    expect(component.isSubmitting()).toBe(false);

    // Check that navigation happens after timeout
    setTimeout(() => {
      expect(router.navigate).toHaveBeenCalledWith(['/owner/providers', 1]);
    }, 2100);
  });

  it('should handle update error', () => {
    const mockError = { error: { message: 'Email already exists' } };
    providerService.updateProvider.and.returnValue(throwError(() => mockError));

    component.editData.email = 'existing@provider.com';
    component.onSubmit();

    expect(component.errorMessage()).toBe('Email already exists');
    expect(component.isSubmitting()).toBe(false);
    expect(component.successMessage()).toBe('');
  });

  it('should handle update error without message', () => {
    const mockError = {};
    providerService.updateProvider.and.returnValue(throwError(() => mockError));

    component.onSubmit();

    expect(component.errorMessage()).toBe('Failed to update provider. Please try again.');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should not submit if already submitting', () => {
    component.isSubmitting.set(true);

    component.onSubmit();

    expect(providerService.updateProvider).not.toHaveBeenCalled();
  });

  it('should handle provider loading error', () => {
    providerService.getProvider.and.returnValue(throwError(() => new Error('Provider not found')));

    component.ngOnInit();

    expect(component.errorMessage()).toContain('Failed to load provider');
    expect(component.isLoading()).toBe(false);
  });

  it('should clean up undefined values in request', () => {
    const updatedProvider = { ...mockProvider };
    providerService.updateProvider.and.returnValue(of(updatedProvider));

    // Set some fields to empty strings (should become undefined)
    component.editData.phone = '';
    component.editData.address = '';
    component.editData.preferredPaymentMethod = '';
    component.editData.paymentDetails = '';
    component.editData.notes = '';

    component.onSubmit();

    expect(providerService.updateProvider).toHaveBeenCalledWith(1, {
      name: 'Test Provider',
      email: 'test@provider.com',
      phone: undefined,
      address: undefined,
      commissionRate: 50,
      preferredPaymentMethod: undefined,
      paymentDetails: undefined,
      notes: undefined,
      isActive: true
    });
  });

  it('should show loading state initially', () => {
    component.isLoading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const loadingElement = compiled.querySelector('.loading');

    expect(loadingElement).toBeTruthy();
  });

  it('should disable submit button when submitting', () => {
    component.isSubmitting.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(submitButton?.disabled).toBe(true);
  });

  it('should show submitting text when updating', () => {
    component.isSubmitting.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = compiled.querySelector('button[type="submit"]');

    expect(submitButton?.textContent?.trim()).toBe('Updating...');
  });

  it('should have form validation', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Check required fields
    const nameInput = compiled.querySelector('input[name="name"]');
    const emailInput = compiled.querySelector('input[name="email"]');

    expect(nameInput?.getAttribute('required')).toBe('');
    expect(emailInput?.getAttribute('required')).toBe('');
    expect(emailInput?.getAttribute('type')).toBe('email');
  });

  it('should have cancel button with correct routing', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cancelButton = compiled.querySelector('button[routerLink]');

    expect(cancelButton?.getAttribute('ng-reflect-router-link')).toContain('/owner/providers,1');
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

  it('should validate commission rate input', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const commissionInput = compiled.querySelector('input[name="commissionRate"]');

    expect(commissionInput?.getAttribute('type')).toBe('number');
    expect(commissionInput?.getAttribute('min')).toBe('0');
    expect(commissionInput?.getAttribute('max')).toBe('100');
  });

  it('should handle missing optional provider data gracefully', () => {
    const providerWithMissingFields = {
      ...mockProvider,
      phone: undefined,
      address: undefined,
      notes: undefined
    };
    providerService.getProvider.and.returnValue(of(providerWithMissingFields));

    component.ngOnInit();

    expect(component.editData.phone).toBe('');
    expect(component.editData.address).toBe('');
    expect(component.editData.notes).toBe('');
  });
});