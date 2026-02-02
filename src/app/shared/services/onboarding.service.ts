import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  OnboardingStatus,
  OnboardingResponse,
  DismissOnboardingRequest,
  DismissOnboardingResponse,
  DismissWelcomeGuideRequest,
  DismissWelcomeGuideResponse,
  OnboardingStep,
  OnboardingProgress
} from '../models/onboarding.models';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private baseUrl = environment.apiUrl;
  private onboardingStatusSubject = new BehaviorSubject<OnboardingStatus | null>(null);

  public onboardingStatus$ = this.onboardingStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get current onboarding/setup status for the organization
   */
  getOnboardingStatus(): Observable<OnboardingStatus> {
    const url = `${this.baseUrl}/api/organizations/setup/status`;
    console.log('🔍 SERVICE: Making API call to:', url);
    return this.http.get<OnboardingResponse>(url)
      .pipe(
        tap(response => console.log('🔍 SERVICE: Raw API response:', response)),
        map(response => {
          // Handle both wrapped and unwrapped API responses
          const statusData = response.data || response;
          return this.normalizeStatus(statusData as OnboardingStatus);
        }),
        tap(status => {
          console.log('🔍 SERVICE: Processed status:', status);
          this.onboardingStatusSubject.next(status);
        })
      );
  }

  /**
   * Normalize status to handle legacy field names
   */
  private normalizeStatus(status: OnboardingStatus): OnboardingStatus {
    return {
      ...status,
      steps: {
        ...status.steps,
        // Handle legacy field name (hasconsignors -> hasConsignors)
        hasConsignors: status.steps.hasConsignors ?? status.steps.hasconsignors ?? false,
        // Ensure new fields have defaults if API hasn't been updated yet
        shopConfigured: status.steps.shopConfigured ?? false,
        agreementUploaded: status.steps.agreementUploaded ?? false,
      }
    };
  }

  /**
   * Dismiss the onboarding modal permanently
   */
  dismissOnboarding(): Observable<DismissOnboardingResponse> {
    const request: DismissOnboardingRequest = { dismissed: true };

    return this.http.post<DismissOnboardingResponse>(
      `${this.baseUrl}/api/dashboard/organization/dismiss-onboarding`,
      request
    ).pipe(
      tap(response => {
        if (response.success) {
          const currentStatus = this.onboardingStatusSubject.value;
          if (currentStatus) {
            this.onboardingStatusSubject.next({
              ...currentStatus,
              dismissed: true
            });
          }
        }
      })
    );
  }

  /**
   * Dismiss the welcome guide permanently (new API endpoint)
   */
  dismissWelcomeGuide(): Observable<DismissWelcomeGuideResponse> {
    return this.http.post<DismissWelcomeGuideResponse>(
      `${this.baseUrl}/api/organizations/setup/dismiss-welcome-guide`,
      {}
    ).pipe(
      tap(response => {
        if (response.success) {
          const currentStatus = this.onboardingStatusSubject.value;
          if (currentStatus) {
            this.onboardingStatusSubject.next({
              ...currentStatus,
              welcomeGuideCompleted: true,
              showModal: false
            });
          }
        }
      })
    );
  }

  /**
   * Get onboarding steps with completion status and routing information
   *
   * NEW ORDER (logical setup flow):
   * 1. Configure shop settings (commission rates, payout schedules)
   * 2. Upload consignment agreement (required before inviting consignors)
   * 3. Set up storefront (how you'll sell)
   * 4. Invite consignors (now that everything is configured)
   *
   * Optional steps shown after core setup:
   * 5. Add inventory
   * 6. Connect QuickBooks (optional)
   */
  getOnboardingSteps(status: OnboardingStatus): OnboardingStep[] {
    const steps: OnboardingStep[] = [
      // STEP 1: Configure shop settings FIRST
      {
        id: 'settings',
        title: 'Configure your shop',
        description: 'Set your default commission rates, payout schedules, and business rules.',
        completed: status.steps.shopConfigured,
        actionText: 'Configure Settings',
        routerLink: '/owner/settings/store-profile/basic-info',
        icon: '⚙️'
      },
      // STEP 2: Upload agreement BEFORE inviting anyone
      {
        id: 'agreement',
        title: 'Upload consignment agreement',
        description: 'Add your legal agreement that consignors will review and sign when they join.',
        completed: status.steps.agreementUploaded,
        actionText: 'Add Agreement',
        routerLink: '/owner/settings/consignors/agreement',
        icon: '📄'
      },
      // STEP 3: Storefront setup
      {
        id: 'storefront',
        title: 'Set up your storefront',
        description: 'Decide how you\'ll sell: Use our built-in shop or connect Shopify/Square.',
        completed: status.steps.storefrontConfigured,
        actionText: 'Set Up Storefront',
        routerLink: '/owner/settings/sales/general',
        icon: '🏪'
      },
      // STEP 4: NOW invite consignors (after everything is configured)
      {
        id: 'consignors',
        title: 'Invite your consignors',
        description: 'Now you\'re ready! Invite people who consign items with you. They\'ll review your agreement and track their inventory.',
        completed: status.steps.hasConsignors,
        actionText: 'Invite Consignors',
        routerLink: '/owner/consignors?invite=true',
        icon: '👥'
      }
    ];

    return steps;
  }

  /**
   * Calculate onboarding progress
   */
  getOnboardingProgress(status: OnboardingStatus): OnboardingProgress {
    const steps = this.getOnboardingSteps(status);
    const completedSteps = steps.filter(step => step.completed).length;
    const totalSteps = steps.length;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    return {
      totalSteps,
      completedSteps,
      progressPercentage
    };
  }

  /**
   * Check if onboarding should be shown (updated logic per specification)
   */
  shouldShowOnboarding(status: OnboardingStatus): boolean {
    console.log('🔍 SERVICE: shouldShowOnboarding called with:', status);

    // Use server-computed showModal field if available
    if (status.showModal !== undefined) {
      console.log('🔍 SERVICE: Using server-computed showModal:', status.showModal);
      return status.showModal;
    }

    // Fallback logic: Don't show if welcome guide is completed
    if (status.welcomeGuideCompleted) {
      console.log('🔍 SERVICE: Welcome guide completed, not showing modal');
      return false;
    }

    // Show if any core setup steps are incomplete (not counting optional integrations)
    const showModal = !status.steps.shopConfigured ||
                      !status.steps.agreementUploaded ||
                      !status.steps.storefrontConfigured ||
                      !status.steps.hasConsignors;

    console.log('🔍 SERVICE: Final decision - should show:', showModal);
    return showModal;
  }

  /**
   * Get the next incomplete step
   */
  getNextIncompleteStep(status: OnboardingStatus): OnboardingStep | null {
    const steps = this.getOnboardingSteps(status);
    return steps.find(step => !step.completed) || null;
  }

  /**
   * Get welcome message based on progress
   */
  getWelcomeMessage(status: OnboardingStatus, shopName: string): { title: string; subtitle: string } {
    const progress = this.getOnboardingProgress(status);

    if (progress.completedSteps === 0) {
      return {
        title: `Welcome to ${shopName}! 🎉`,
        subtitle: 'Let\'s get your shop set up. Here\'s what to do next:'
      };
    } else if (progress.completedSteps === progress.totalSteps) {
      return {
        title: 'You\'re all set! 🚀',
        subtitle: 'Your shop is ready to go. Great work!'
      };
    } else {
      return {
        title: 'Almost there! 🎯',
        subtitle: 'Here\'s what\'s left to complete your setup:'
      };
    }
  }

  /**
   * Clear cached onboarding status (useful for testing)
   */
  clearCache(): void {
    this.onboardingStatusSubject.next(null);
  }
}