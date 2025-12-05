import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OwnerDashboardComponent } from './owner-dashboard.component';
import { OnboardingService } from '../../shared/services/onboarding.service';
import { OnboardingStatus, OnboardingStep } from '../../shared/models/onboarding.models';
import { AuthService } from '../../services/auth.service';
import { ConsignorService } from '../../services/consignor.service';
import { InventoryService } from '../../services/inventory.service';
import { TransactionService } from '../../services/transaction.service';
import { PayoutService } from '../../services/payout.service';

describe('OwnerDashboardComponent - Onboarding Integration', () => {
  let component: OwnerDashboardComponent;
  let mockOnboardingService: jasmine.SpyObj<OnboardingService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockOnboardingStatus: OnboardingStatus = {
    dismissed: false,
    welcomeGuideCompleted: false,
    showModal: true,
    steps: {
      hasconsignors: true,
      storefrontConfigured: false,
      hasInventory: false,
      quickBooksConnected: false
    }
  };

  const mockUser = {
    userId: 'user-1',
    email: 'owner@test.com',
    organizationName: 'Test Shop',
    organizationId: 'org-1',
    role: 1
  };

  beforeEach(async () => {
    const onboardingServiceSpy = jasmine.createSpyObj('OnboardingService', [
      'getOnboardingStatus',
      'shouldShowOnboarding'
    ]);

    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const consignorServiceSpy = jasmine.createSpyObj('ConsignorService', ['getConsignors']);
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getSalesMetrics', 'getTransactions']);
    const payoutServiceSpy = jasmine.createSpyObj('PayoutService', ['getPendingPayouts']);
    const inventoryServiceSpy = jasmine.createSpyObj('InventoryService', ['getInventoryMetrics']);

    // Mock ActivatedRoute
    const mockActivatedRoute = {
      snapshot: { params: {}, queryParams: {} },
      params: of({}),
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [OwnerDashboardComponent],
      providers: [
        { provide: OnboardingService, useValue: onboardingServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ConsignorService, useValue: consignorServiceSpy },
        { provide: InventoryService, useValue: inventoryServiceSpy },
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: PayoutService, useValue: payoutServiceSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    const fixture = TestBed.createComponent(OwnerDashboardComponent);
    component = fixture.componentInstance;

    mockOnboardingService = TestBed.inject(OnboardingService) as jasmine.SpyObj<OnboardingService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Setup default mock returns
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockOnboardingService.getOnboardingStatus.and.returnValue(of(mockOnboardingStatus));
    mockOnboardingService.shouldShowOnboarding.and.returnValue(true);

    // Mock other services to prevent API calls
    const consignorService = TestBed.inject(ConsignorService) as jasmine.SpyObj<ConsignorService>;
    const transactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
    const payoutService = TestBed.inject(PayoutService) as jasmine.SpyObj<PayoutService>;
    const inventoryService = TestBed.inject(InventoryService) as jasmine.SpyObj<InventoryService>;

    consignorService.getConsignors.and.returnValue(of([]));
    transactionService.getSalesMetrics.and.returnValue(of({
      totalSales: 0, totalShopAmount: 0, totalConsignorAmount: 0,
      totalTax: 0, transactionCount: 0, averageTransactionValue: 0,
      topConsignors: [], paymentMethodBreakdown: []
    }));
    transactionService.getTransactions.and.returnValue(of({
      items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0,
      hasNextPage: false, hasPreviousPage: false, organizationId: 'test-org'
    }));
    payoutService.getPendingPayouts.and.returnValue(of([]));
    inventoryService.getInventoryMetrics.and.returnValue(of({
      success: true, data: { totalValue: 0, totalItems: 0 }
    }));
  });

  describe('Onboarding Modal Integration', () => {
    it('should load onboarding status on init', () => {
      component.ngOnInit();
      expect(mockOnboardingService.getOnboardingStatus).toHaveBeenCalled();
      expect(component.onboardingStatus()).toEqual(mockOnboardingStatus);
    });

    it('should show welcome modal when onboarding should be shown', () => {
      component.ngOnInit();
      expect(component.showWelcomeModal()).toBe(true);
    });

    it('should handle onboarding status load error gracefully', () => {
      spyOn(console, 'error');
      mockOnboardingService.getOnboardingStatus.and.returnValue(throwError('API Error'));

      component.ngOnInit();

      expect(console.error).toHaveBeenCalledWith('🚨 DASHBOARD: Failed to load onboarding status:', 'API Error');
    });
  });

  describe('Modal Event Handlers', () => {
    it('should close welcome modal when closeWelcomeModal is called', () => {
      component.showWelcomeModal.set(true);
      component.closeWelcomeModal();
      expect(component.showWelcomeModal()).toBe(false);
    });

    it('should dismiss welcome modal and reload status', () => {
      component.showWelcomeModal.set(true);
      spyOn(component as any, 'loadOnboardingStatus');

      component.dismissWelcomeModal();

      expect(component.showWelcomeModal()).toBe(false);
      expect((component as any).loadOnboardingStatus).toHaveBeenCalled();
    });

    it('should handle step navigation', () => {
      const mockStep: OnboardingStep = {
        id: 'test', title: 'Test', description: 'Test',
        completed: false, actionText: 'Test', routerLink: '/test'
      };
      component.showWelcomeModal.set(true);

      component.navigateToStep(mockStep);

      expect(component.showWelcomeModal()).toBe(false);
    });
  });

  describe('Component Cleanup', () => {
    it('should cleanup subscriptions on destroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});