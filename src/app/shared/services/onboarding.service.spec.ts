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
    steps: {
      hasProviders: true,
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

      const req = httpMock.expectOne(`${baseUrl}/api/dashboard/organization/onboarding-status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should update the onboarding status subject', () => {
      const mockResponse = {
        success: true,
        data: mockOnboardingStatus
      };

      service.getOnboardingStatus().subscribe();

      const req = httpMock.expectOne(`${baseUrl}/api/dashboard/organization/onboarding-status`);
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
      expect(steps[0].id).toBe('providers');
      expect(steps[0].completed).toBe(true); // hasProviders is true
      expect(steps[1].id).toBe('storefront');
      expect(steps[1].completed).toBe(false); // storefrontConfigured is false
      expect(steps[2].id).toBe('inventory');
      expect(steps[2].completed).toBe(true); // hasInventory is true
      expect(steps[3].id).toBe('quickbooks');
      expect(steps[3].completed).toBe(false); // quickBooksConnected is false
    });

    it('should have proper routing links', () => {
      const steps = service.getOnboardingSteps(mockOnboardingStatus);

      expect(steps[0].routerLink).toBe('/owner/providers');
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
      expect(progress.completedSteps).toBe(2); // providers and inventory are completed
      expect(progress.progressPercentage).toBe(50);
    });

    it('should handle 100% completion', () => {
      const completedStatus: OnboardingStatus = {
        dismissed: false,
        steps: {
          hasProviders: true,
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
        steps: {
          hasProviders: false,
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

  describe('shouldShowOnboarding', () => {
    it('should return false if dismissed', () => {
      const dismissedStatus: OnboardingStatus = {
        ...mockOnboardingStatus,
        dismissed: true
      };

      expect(service.shouldShowOnboarding(dismissedStatus)).toBe(false);
    });

    it('should return true if not dismissed and steps incomplete', () => {
      expect(service.shouldShowOnboarding(mockOnboardingStatus)).toBe(true);
    });

    it('should return false if all steps completed', () => {
      const completedStatus: OnboardingStatus = {
        dismissed: false,
        steps: {
          hasProviders: true,
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
        steps: {
          hasProviders: true,
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
        steps: {
          hasProviders: false,
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

    it('should return progress message for partial completion', () => {
      const message = service.getWelcomeMessage(mockOnboardingStatus, shopName);

      expect(message.title).toContain('progress');
      expect(message.subtitle).toContain('left to complete');
    });

    it('should return completion message for completed setup', () => {
      const completedStatus: OnboardingStatus = {
        dismissed: false,
        steps: {
          hasProviders: true,
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