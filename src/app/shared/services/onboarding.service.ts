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
   * Get current onboarding status for the organization
   */
  getOnboardingStatus(): Observable<OnboardingStatus> {
    return this.http.get<OnboardingResponse>(`${this.baseUrl}/api/dashboard/organization/onboarding-status`)
      .pipe(
        map(response => response.data),
        tap(status => this.onboardingStatusSubject.next(status))
      );
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
   * Get onboarding steps with completion status and routing information
   */
  getOnboardingSteps(status: OnboardingStatus): OnboardingStep[] {
    const steps: OnboardingStep[] = [
      {
        id: 'providers',
        title: 'Add your providers',
        description: 'Invite the people who consign items with you. They\'ll be able to track their inventory and payouts.',
        completed: status.steps.hasProviders,
        actionText: 'Add Providers',
        routerLink: '/owner/providers',
        icon: '👥'
      },
      {
        id: 'storefront',
        title: 'Choose your storefront',
        description: 'Decide how you\'ll sell: Use our built-in shop or connect Shopify/Square.',
        completed: status.steps.storefrontConfigured,
        actionText: 'Set Up Storefront',
        routerLink: '/owner/settings/storefront',
        icon: '🛍️'
      },
      {
        id: 'inventory',
        title: 'Add inventory',
        description: 'Enter items manually or upload in bulk via CSV.',
        completed: status.steps.hasInventory,
        actionText: 'Add Inventory',
        routerLink: '/owner/inventory',
        icon: '📦'
      },
      {
        id: 'quickbooks',
        title: 'Connect QuickBooks',
        description: 'Sync transactions and payouts with your accounting. (optional)',
        completed: status.steps.quickBooksConnected,
        actionText: 'Connect QuickBooks',
        routerLink: '/owner/settings/integrations',
        icon: '📊'
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
   * Check if onboarding should be shown
   */
  shouldShowOnboarding(status: OnboardingStatus): boolean {
    if (status.dismissed) {
      return false;
    }

    // Show if not all steps are completed
    const progress = this.getOnboardingProgress(status);
    return progress.completedSteps < progress.totalSteps;
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
        title: 'You\'re making progress! 💪',
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