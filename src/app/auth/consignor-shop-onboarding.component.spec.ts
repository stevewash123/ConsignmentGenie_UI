import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { ConsignorShopOnboardingComponent } from './consignor-shop-onboarding.component';
import { ConsignorShopMembershipService } from '../services/consignor-shop-membership.service';
import { PayoutMethod, ShopOnboardingData } from '../models/consignor-shop-membership.model';

describe('ConsignorShopOnboardingComponent', () => {
  let component: ConsignorShopOnboardingComponent;
  let fixture: ComponentFixture<ConsignorShopOnboardingComponent>;
  let mockMembershipService: jasmine.SpyObj<ConsignorShopMembershipService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const mockShopData: ShopOnboardingData = {
    shopName: 'Jane\'s Vintage Consignment',
    storeCode: 'JANE123',
    inventoryMode: 'ApprovalRequired',
    consignmentAgreement: {
      id: '1',
      organizationId: '1',
      title: 'Consignment Agreement',
      content: 'Test agreement content',
      version: '1.0',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    defaultSplitPercentage: 60
  };

  beforeEach(async () => {
    const membershipServiceSpy = jasmine.createSpyObj('ConsignorShopMembershipService', [
      'getShopOnboardingData',
      'createMembership',
      'validateBankAccount'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    mockActivatedRoute = {
      snapshot: {
        queryParams: { storeCode: 'JANE123' }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        ConsignorShopOnboardingComponent,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        { provide: ConsignorShopMembershipService, useValue: membershipServiceSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsignorShopOnboardingComponent);
    component = fixture.componentInstance;
    mockMembershipService = TestBed.inject(ConsignorShopMembershipService) as jasmine.SpyObj<ConsignorShopMembershipService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    spyOn(mockRouter, 'navigate');

    // Setup default service responses
    mockMembershipService.getShopOnboardingData.and.returnValue(of(mockShopData));
    mockMembershipService.createMembership.and.returnValue(of({
      success: true,
      message: 'Membership created successfully',
      membership: undefined
    }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load shop data on init', () => {
    fixture.detectChanges();

    expect(mockMembershipService.getShopOnboardingData).toHaveBeenCalledWith('JANE123');
    expect(component.shopData()).toEqual(mockShopData);
  });

  it('should redirect if no store code provided', () => {
    mockActivatedRoute.snapshot.queryParams = {};

    fixture.detectChanges();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should return correct inventory mode message', () => {
    component.shopData.set(mockShopData);

    const message = component.getInventoryModeMessage();

    expect(message).toBe('You can submit items for approval. The owner reviews submissions before they go live.');
  });

  it('should return different inventory mode messages for different modes', () => {
    const shopDataOwnerOnly = { ...mockShopData, inventoryMode: 'OwnerOnly' as const };
    component.shopData.set(shopDataOwnerOnly);

    expect(component.getInventoryModeMessage()).toBe('The shop owner manages all inventory. You cannot submit items directly.');

    const shopDataDirectAdd = { ...mockShopData, inventoryMode: 'DirectAdd' as const };
    component.shopData.set(shopDataDirectAdd);

    expect(component.getInventoryModeMessage()).toBe('You can add items directly to inventory. Items appear immediately without approval.');
  });

  it('should setup bank details validation for direct deposit', () => {
    fixture.detectChanges();

    // Select direct deposit
    component.onboardingForm.get('payoutMethod')?.setValue(PayoutMethod.DirectDeposit);

    // Check that account and routing fields now have validators
    const accountControl = component.onboardingForm.get('accountNumber');
    const routingControl = component.onboardingForm.get('routingNumber');

    expect(accountControl?.hasError('required')).toBeTruthy();
    expect(routingControl?.hasError('required')).toBeTruthy();
  });

  it('should clear bank details validation for non-direct deposit methods', () => {
    fixture.detectChanges();

    // Set to direct deposit first to add validators
    component.onboardingForm.get('payoutMethod')?.setValue(PayoutMethod.DirectDeposit);

    // Then change to check
    component.onboardingForm.get('payoutMethod')?.setValue(PayoutMethod.Check);

    const accountControl = component.onboardingForm.get('accountNumber');
    const routingControl = component.onboardingForm.get('routingNumber');

    expect(accountControl?.hasError('required')).toBeFalsy();
    expect(routingControl?.hasError('required')).toBeFalsy();
    expect(accountControl?.value).toBe('');
    expect(routingControl?.value).toBe('');
  });

  it('should submit form successfully', () => {
    fixture.detectChanges();
    component.shopData.set(mockShopData);

    // Fill out form
    component.onboardingForm.patchValue({
      agreementAccepted: true,
      payoutMethod: PayoutMethod.Check
    });

    component.onSubmit();

    expect(mockMembershipService.createMembership).toHaveBeenCalledWith({
      storeCode: 'JANE123',
      agreementAccepted: true,
      agreementVersion: '1.0',
      payoutMethod: PayoutMethod.Check,
      bankAccountNumber: undefined,
      routingNumber: undefined,
      splitPercentage: 60
    });

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/consignor/dashboard'], {
      queryParams: { shop: 'JANE123' }
    });
  });

  it('should handle form submission error', () => {
    fixture.detectChanges();
    component.shopData.set(mockShopData);

    mockMembershipService.createMembership.and.returnValue(throwError(() => ({ message: 'Network error' })));

    component.onboardingForm.patchValue({
      agreementAccepted: true,
      payoutMethod: PayoutMethod.Check
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Failed to complete onboarding. Please try again.');
    expect(component.isSubmitting()).toBeFalsy();
  });

  it('should not submit invalid form', () => {
    fixture.detectChanges();
    component.shopData.set(mockShopData);

    // Don't accept agreement
    component.onboardingForm.patchValue({
      agreementAccepted: false,
      payoutMethod: PayoutMethod.Check
    });

    component.onSubmit();

    expect(mockMembershipService.createMembership).not.toHaveBeenCalled();
    expect(component.onboardingForm.get('agreementAccepted')?.touched).toBeTruthy();
  });

  it('should validate direct deposit bank details', () => {
    fixture.detectChanges();
    component.shopData.set(mockShopData);

    component.onboardingForm.patchValue({
      agreementAccepted: true,
      payoutMethod: PayoutMethod.DirectDeposit,
      accountNumber: '12345',
      routingNumber: '123456789'
    });

    component.onSubmit();

    expect(mockMembershipService.createMembership).toHaveBeenCalledWith({
      storeCode: 'JANE123',
      agreementAccepted: true,
      agreementVersion: '1.0',
      payoutMethod: PayoutMethod.DirectDeposit,
      bankAccountNumber: '12345',
      routingNumber: '123456789',
      splitPercentage: 60
    });
  });

  it('should handle shop data loading error', () => {
    mockMembershipService.getShopOnboardingData.and.returnValue(throwError(() => ({ message: 'Shop not found' })));

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Failed to load shop information. Please try again.');
  });
});