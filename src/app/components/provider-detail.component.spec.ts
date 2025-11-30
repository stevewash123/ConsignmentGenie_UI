import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router, RouterLinkWithHref, RouterLink } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ProviderDetailComponent } from './provider-detail.component';
import { ProviderService } from '../services/provider.service';
import { Provider } from '../models/provider.model';
import { LoadingService } from '../shared/services/loading.service';

// Mock components for routing tests
@Component({ template: '' })
class MockProviderListComponent { }

@Component({ template: '' })
class MockProviderEditComponent { }

describe('ProviderDetailComponent', () => {
  let component: ProviderDetailComponent;
  let fixture: ComponentFixture<ProviderDetailComponent>;
  let router: Router;
  let activatedRoute: ActivatedRoute;
  let providerService: jasmine.SpyObj<ProviderService>;
  let loadingService: jasmine.SpyObj<LoadingService>;

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
    status: 'active',
    createdAt: new Date('2023-11-26T10:00:00Z'),
    updatedAt: new Date('2023-11-26T10:00:00Z'),
    organizationId: 1
  };

  beforeEach(async () => {
    const providerServiceSpy = jasmine.createSpyObj('ProviderService', [
      'getProvider',
      'deactivateProvider',
      'activateProvider'
    ]);

    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', [
      'start',
      'stop',
      'isLoading'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ProviderDetailComponent,
        RouterTestingModule.withRoutes([
          { path: 'owner/providers', component: MockProviderListComponent },
          { path: 'owner/providers/:id/edit', component: MockProviderEditComponent }
        ])
      ],
      providers: [
        { provide: ProviderService, useValue: providerServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { id: '1' }
            },
            paramMap: of(new Map([['id', '1']]))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderDetailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
    providerService = TestBed.inject(ProviderService) as jasmine.SpyObj<ProviderService>;
    loadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;

    loadingService.isLoading.and.returnValue(false);
    providerService.getProvider.and.returnValue(of(mockProvider));
  });

  describe('Standard behavior', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load provider data on init', () => {
    expect(providerService.getProvider).toHaveBeenCalledWith(1);
    expect(component.provider()?.name).toBe('Test Provider');
    expect(component.provider()?.email).toBe('test@provider.com');
  });

  it('should use LoadingService during provider loading', () => {
    expect(loadingService.start).toHaveBeenCalledWith('provider-detail');
    expect(loadingService.stop).toHaveBeenCalledWith('provider-detail');
  });

  it('should display provider information', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toBe('Test Provider');
    expect(compiled.textContent).toContain('test@provider.com');
    expect(compiled.textContent).toContain('1234567890');
    expect(compiled.textContent).toContain('123 Test Street');
  });

  it('should show active status for active provider', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const statusElement = compiled.querySelector('.status');

    expect(statusElement?.textContent?.trim()).toBe('Active');
    expect(statusElement?.classList.contains('active')).toBe(true);
  });

  it('should show inactive status for inactive provider', () => {
    const inactiveProvider = { ...mockProvider, isActive: false };
    providerService.getProvider.and.returnValue(of(inactiveProvider));

    component.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusElement = compiled.querySelector('.status');

    expect(statusElement?.textContent?.trim()).toBe('Inactive');
    expect(statusElement?.classList.contains('inactive')).toBe(true);
  });

  it('should have correct breadcrumb link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const breadcrumbLink = compiled.querySelector('.breadcrumb a');

    expect(breadcrumbLink?.getAttribute('routerLink')).toBe('/owner/providers');
  });

  it('should show deactivate button for active provider', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const deactivateButton = compiled.querySelector('button.btn-danger');
    const activateButton = compiled.querySelector('button.btn-success');

    expect(deactivateButton).toBeTruthy();
    expect(deactivateButton?.textContent?.trim()).toBe('Deactivate');
    expect(activateButton).toBeFalsy();
  });

  it('should show activate button for inactive provider', () => {
    const inactiveProvider = { ...mockProvider, isActive: false };
    providerService.getProvider.and.returnValue(of(inactiveProvider));

    component.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const deactivateButton = compiled.querySelector('button.btn-danger');
    const activateButton = compiled.querySelector('button.btn-success');

    expect(deactivateButton).toBeFalsy();
    expect(activateButton).toBeTruthy();
    expect(activateButton?.textContent?.trim()).toBe('Activate');
  });

  it('should deactivate provider successfully', () => {
    const deactivatedProvider = { ...mockProvider, isActive: false };
    providerService.deactivateProvider.and.returnValue(of(deactivatedProvider));

    component.deactivateProvider();

    expect(providerService.deactivateProvider).toHaveBeenCalledWith(1);
    expect(component.provider()?.isActive).toBe(false);
    expect(component.isSubmitting()).toBe(false);
  });

  it('should activate provider successfully', () => {
    const inactiveProvider = { ...mockProvider, isActive: false };
    providerService.getProvider.and.returnValue(of(inactiveProvider));
    component.ngOnInit();

    const activatedProvider = { ...inactiveProvider, isActive: true };
    providerService.activateProvider.and.returnValue(of(activatedProvider));

    component.activateProvider();

    expect(providerService.activateProvider).toHaveBeenCalledWith(1);
    expect(component.provider()?.isActive).toBe(true);
    expect(component.isSubmitting()).toBe(false);
  });

  xit('should handle deactivation error', () => {
    providerService.deactivateProvider.and.returnValue(throwError(() => new Error('Deactivation failed')));

    component.deactivateProvider();

    expect(component.errorMessage()).toContain('Failed to deactivate provider');
    expect(component.isSubmitting()).toBe(false);
  });

  xit('should handle activation error', () => {
    providerService.activateProvider.and.returnValue(throwError(() => new Error('Activation failed')));

    component.activateProvider();

    expect(component.errorMessage()).toContain('Failed to activate provider');
    expect(component.isSubmitting()).toBe(false);
  });

  it('should handle provider loading error', () => {
    providerService.getProvider.and.returnValue(throwError(() => new Error('Provider not found')));

    component.ngOnInit();

    expect(component.errorMessage()).toContain('Failed to load provider');
    expect(loadingService.stop).toHaveBeenCalledWith('provider-detail');
  });

  it('should show loading state initially', () => {
    loadingService.isLoading.and.returnValue(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const loadingElement = compiled.querySelector('.loading');

    expect(loadingElement).toBeTruthy();
  });

  it('should disable buttons when submitting', () => {
    component.isSubmitting.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const deactivateButton = compiled.querySelector('button.btn-danger') as HTMLButtonElement;

    expect(deactivateButton?.disabled).toBe(true);
  });

  it('should show submitting text when deactivating', () => {
    component.isSubmitting.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const deactivateButton = compiled.querySelector('button.btn-danger');

    expect(deactivateButton?.textContent?.trim()).toBe('Deactivating...');
  });

  it('should display commission rate correctly', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('50%');
  });

  it('should handle missing optional fields gracefully', () => {
    const providerWithMissingFields = {
      ...mockProvider,
      phone: undefined,
      address: undefined,
      notes: undefined
    };
    providerService.getProvider.and.returnValue(of(providerWithMissingFields));

    component.ngOnInit();
    fixture.detectChanges();

    // Should not crash and should display available information
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toBe('Test Provider');
  });

  });

  describe('Custom detectChanges control', () => {
    it('should have correct edit button link', fakeAsync(() => {
      // Set the providerId signal BEFORE any change detection
      component.providerId.set(1);

      // Now trigger the first change detection with the correct providerId
      fixture.detectChanges();

      // Allow all pending microtasks to complete
      tick();

      // Trigger another change detection to ensure all bindings are updated
      fixture.detectChanges();

      // Query specifically for the edit button (it's a button, not an anchor)
      const editButton = fixture.debugElement.query(By.css('button.btn-secondary'));
      expect(editButton).toBeTruthy();

      // Get the RouterLink directive instance (not RouterLinkWithHref for buttons)
      const routerLinkDirective = editButton.injector.get(RouterLink);
      expect(routerLinkDirective).toBeTruthy();

      // Check the routerLinkInput property (Angular 17+ property name)
      expect((routerLinkDirective as any).routerLinkInput).toEqual(['/owner/providers', 1, 'edit']);
    }));
  });
});