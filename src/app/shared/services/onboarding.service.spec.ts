import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OnboardingService } from './onboarding.service';
import { OnboardingStatus, OnboardingStep, OnboardingProgress } from '../models/onboarding.models';
import { environment } from '../../../environments/environment';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  const mockOnboardingStatus: OnboardingStatus = {
    dismissed: false,
    welcomeGuideCompleted: false,
    showModal: true,
    steps: {
      hasconsignors: true,
      storefrontConfigured: false,
      hasInventory: true,
      quickBooksConnected: false
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OnboardingService]
    });
    service = TestBed.inject(OnboardingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getOnboardingStatus', () => {
    it('should fetch onboarding status from API', () => {
      const mockResponse = {
        success: true,
        data: mockOnboardingStatus
      };

      service.getOnboardingStatus().subscribe(status => {
        expect(status).toEqual(mockOnboardingStatus);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/organization/setup-status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should update the onboarding status subject', () => {
      const mockResponse = {
        success: true,
        data: mockOnboardingStatus
      };

      service.getOnboardingStatus().subscribe();

      const req = httpMock.expectOne(`${baseUrl}/api/organization/setup-status`);
      req.flush(mockResponse);

      service.onboardingStatus$.subscribe(status => {
        expect(status).toEqual(mockOnboardingStatus);
      });
    });
  });

  describe('dismissOnboarding', () => {
    it('should send dismiss request to API', () => {
      const mockResponse = {
        success: true,
        message: 'Onboarding dismissed successfully'
      };

      service.dismissOnboarding().subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/dashboard/organization/dismiss-onboarding`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ dismissed: true });
      req.flush(mockResponse);
    });

    it('should update onboarding status when dismiss succeeds', () => {
      // First set an initial status
      service['onboardingStatusSubject'].next(mockOnboardingStatus);

      const mockResponse = {
        success: true,
        message: 'Onboarding dismissed successfully'
      };

      service.dismissOnboarding().subscribe();

      const req = httpMock.expectOne(`${baseUrl}/api/dashboard/organization/dismiss-onboarding`);
      req.flush(mockResponse);

      service.onboardingStatus$.subscribe(status => {
        expect(status?.dismissed).toBe(true);
      });
    });
  });

  describe('getOnboardingSteps', () => {
    it('should return correctly configured steps', () => {
      const steps = service.getOnboardingSteps(mockOnboardingStatus);

      expect(steps.length).toBe(4);
      expect(steps[0].id).toBe('consignors');
      expect(steps[0].completed).toBe(true); // hasconsignors is true
      expect(steps[1].id).toBe('storefront');
      expect(steps[1].completed).toBe(false); // storefrontConfigured is false
      expect(steps[2].id).toBe('inventory');
      expect(steps[2].completed).toBe(true); // hasInventory is true
      expect(steps[3].id).toBe('quickbooks');
      expect(steps[3].completed).toBe(false); // quickBooksConnected is false
    });

    it('should have proper routing links', () => {
      const steps = service.getOnboardingSteps(mockOnboardingStatus);

      expect(steps[0].routerLink).toBe('/owner/consignors');
      expect(steps[1].routerLink).toBe('/owner/settings/storefront');
      expect(steps[2].routerLink).toBe('/owner/inventory');
      expect(steps[3].routerLink).toBe('/owner/settings/integrations');
    });

    it('should have icons for all steps', () => {
      const steps = service.getOnboardingSteps(mockOnboardingStatus);

      steps.forEach(step => {
        expect(step.icon).toBeDefined();
        expect(step.icon!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getOnboardingProgress', () => {
    it('should calculate progress correctly', () => {
      const progress = service.getOnboardingProgress(mockOnboardingStatus);

      expect(progress.totalSteps).toBe(4);
      expect(progress.completedSteps).toBe(2); // consignors and inventory are completed
      expect(progress.progressPercentage).toBe(50);
    });

    it('should handle 100% completion', () => {
      const completedStatus: OnboardingStatus = {
        dismissed: false,
        welcomeGuideCompleted: false,
        showModal: false,
        steps: {
          hasconsignors: true,
          storefrontConfigured: true,
          hasInventory: true,
          quickBooksConnected: true
        }
      };

      const progress = service.getOnboardingProgress(completedStatus);

      expect(progress.completedSteps).toBe(4);
      expect(progress.progressPercentage).toBe(100);
    });

    it('should handle 0% completion', () => {
      const incompleteStatus: OnboardingStatus = {
        dismissed: false,
        welcomeGuideCompleted: false,
        showModal: true,
        steps: {
          hasconsignors: false,
          storefrontConfigured: false,
          hasInventory: false,
          quickBooksConnected: false
        }
      };

      const progress = service.getOnboardingProgress(incompleteStatus);

      expect(progress.completedSteps).toBe(0);
      expect(progress.progressPercentage).toBe(0);
    });
  });

  describe('dismissWelcomeGuide', () => {
    it('should send dismiss request to API', () => {
      const mockResponse = {
        success: true,
        welcomeGuideCompleted: true,
        message: 'Welcome guide dismissed successfully'
      };

      service.dismissWelcomeGuide().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.welcomeGuideCompleted).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/organization/dismiss-welcome-guide`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should update onboarding status when dismiss succeeds', () => {
      // First set an initial status
      service['onboardingStatusSubject'].next(mockOnboardingStatus);

      const mockResponse = {
        success: true,
        welcomeGuideCompleted: true,
        message: 'Welcome guide dismissed successfully'
      };

      service.dismissWelcomeGuide().subscribe();

      const req = httpMock.expectOne(`${baseUrl}/api/organization/dismiss-welcome-guide`);
      req.flush(mockResponse);

      service.onboardingStatus$.subscribe(status => {
        expect(status?.welcomeGuideCompleted).toBe(true);
        expect(status?.showModal).toBe(false);
      });
    });
  });

  describe('shouldShowOnboarding', () => {
    it('should use server-computed showModal field when available', () => {
      const statusWithShowModal: OnboardingStatus = {
        ...mockOnboardingStatus,
        showModal: false
      };

      expect(service.shouldShowOnboarding(statusWithShowModal)).toBe(false);
    });

    it('should return false if welcomeGuideCompleted is true (fallback logic)', () => {
      const completedGuideStatus: OnboardingStatus = {
        ...mockOnboardingStatus,
        showModal: undefined as any, // Force fallback
        welcomeGuideCompleted: true
      };

      expect(service.shouldShowOnboarding(completedGuideStatus)).toBe(false);
    });

    it('should return true if welcome guide not completed and steps incomplete (fallback logic)', () => {
      const incompleteStatus: OnboardingStatus = {
        ...mockOnboardingStatus,
        showModal: undefined as any, // Force fallback
        welcomeGuideCompleted: false
      };

      expect(service.shouldShowOnboarding(incompleteStatus)).toBe(true);
    });

    it('should return false if all steps completed (fallback logic)', () => {
      const completedStatus: OnboardingStatus = {
        dismissed: false,
        welcomeGuideCompleted: false,
        showModal: undefined as any, // Force fallback
        steps: {
          hasconsignors: true,
          storefrontConfigured: true,
          hasInventory: true,
          quickBooksConnected: true
        }
      };

      expect(service.shouldShowOnboarding(completedStatus)).toBe(false);
    });
  });

  describe('getNextIncompleteStep', () => {
    it('should return the first incomplete step', () => {
      const nextStep = service.getNextIncompleteStep(mockOnboardingStatus);

      expect(nextStep).toBeDefined();
      expect(nextStep!.id).toBe('storefront'); // First incomplete step
      expect(nextStep!.completed).toBe(false);
    });

    it('should return null if all steps completed', () => {
      const completedStatus: OnboardingStatus = {
        dismissed: false,
        welcomeGuideCompleted: false,
        showModal: false,
        steps: {
          hasconsignors: true,
          storefrontConfigured: true,
          hasInventory: true,
          quickBooksConnected: true
        }
      };

      const nextStep = service.getNextIncompleteStep(completedStatus);
      expect(nextStep).toBeNull();
    });
  });

  describe('getWelcomeMessage', () => {
    const shopName = 'Test Shop';

    it('should return welcome message for new users', () => {
      const newUserStatus: OnboardingStatus = {
        dismissed: false,
        welcomeGuideCompleted: false,
        showModal: true,
        steps: {
          hasconsignors: false,
          storefrontConfigured: false,
          hasInventory: false,
          quickBooksConnected: false
        }
      };

      const message = service.getWelcomeMessage(newUserStatus, shopName);

      expect(message.title).toContain(shopName);
      expect(message.title).toContain('Welcome');
      expect(message.subtitle).toContain('set up');
    });

    it('should return "almost there" message for partial completion', () => {
      const message = service.getWelcomeMessage(mockOnboardingStatus, shopName);

      expect(message.title).toBe('Almost there! 🎯');
      expect(message.subtitle).toBe("Here's what's left to complete your setup:");
    });

    it('should return completion message for completed setup', () => {
      const completedStatus: OnboardingStatus = {
        dismissed: false,
        welcomeGuideCompleted: false,
        showModal: false,
        steps: {
          hasconsignors: true,
          storefrontConfigured: true,
          hasInventory: true,
          quickBooksConnected: true
        }
      };

      const message = service.getWelcomeMessage(completedStatus, shopName);

      expect(message.title).toContain('all set');
      expect(message.subtitle).toContain('ready to go');
    });
  });

  describe('clearCache', () => {
    it('should clear the onboarding status subject', () => {
      service['onboardingStatusSubject'].next(mockOnboardingStatus);

      service.clearCache();

      service.onboardingStatus$.subscribe(status => {
        expect(status).toBeNull();
      });
    });
  });
});