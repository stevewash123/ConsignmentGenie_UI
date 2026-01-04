import { Component, OnInit, OnDestroy, OnChanges, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { OnboardingService } from '../../shared/services/onboarding.service';
import { OnboardingStatus, OnboardingStep, OnboardingProgress } from '../../shared/models/onboarding.models';

@Component({
  selector: 'app-owner-welcome-modal',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './owner-welcome-modal.component.html',
})
export class OwnerWelcomeModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() shopName: string = 'Your Shop';
  @Input() onboardingStatus: OnboardingStatus | null = null;
  @Input() isManualOpen: boolean = false; // Controls button text ("Close" vs "No thanks...")
  @Output() closed = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();
  @Output() stepClicked = new EventEmitter<OnboardingStep>();

  private destroy$ = new Subject<void>();

  steps: OnboardingStep[] = [];
  progress: OnboardingProgress | null = null;
  welcomeMessage: { title: string; subtitle: string } = { title: '', subtitle: '' };
  isDismissing = signal(false);

  constructor(private onboardingService: OnboardingService) {}

  ngOnInit() {
    this.setupStaticModal();
  }

  ngOnChanges() {
    // Refresh modal content when onboarding status changes
    if (this.onboardingStatus) {
      this.setupStaticModal();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupStaticModal() {
    // Use onboarding service for dynamic content if status is available
    if (this.onboardingStatus) {
      this.welcomeMessage = this.onboardingService.getWelcomeMessage(this.onboardingStatus, this.shopName);
      this.steps = this.onboardingService.getOnboardingSteps(this.onboardingStatus);
      this.progress = this.onboardingService.getOnboardingProgress(this.onboardingStatus);
    } else {
      // Fallback to static content
      this.welcomeMessage = {
        title: `Welcome to ${this.shopName}! 🎉`,
        subtitle: "Let's get your shop set up. Here's what to do next:"
      };

      this.steps = [
        {
          id: 'consignors',
          title: 'Add your consignors',
          description: 'Invite the people who consign items with you. They\'ll be able to track their inventory and payouts.',
          completed: false,
          actionText: 'Add Consignors',
          routerLink: '/owner/consignors',
          icon: '1'
        },
        {
          id: 'storefront',
          title: 'Change your storefront or use ours',
          description: 'Decide how you\'ll sell: Use our built-in shop or connect Shopify/Square.',
          completed: false,
          actionText: 'Set Up Storefront',
          routerLink: '/owner/settings/storefront',
          icon: '2'
        },
        {
          id: 'inventory',
          title: 'Add inventory',
          description: 'Enter items manually or upload in bulk via CSV.',
          completed: false,
          actionText: 'Add Inventory',
          routerLink: '/owner/inventory',
          icon: '3'
        },
        {
          id: 'quickbooks',
          title: 'Connect QuickBooks',
          description: 'Sync transactions and payouts with your accounting. (optional)',
          completed: false,
          actionText: 'Connect QuickBooks',
          routerLink: '/owner/settings/integrations',
          icon: '4'
        }
      ];

      this.progress = null;
    }
  }

  trackByStepId(index: number, step: OnboardingStep): string {
    return step.id;
  }

  isNextStep(step: OnboardingStep): boolean {
    // Find the first incomplete step
    const firstIncompleteStep = this.steps.find(s => !s.completed);
    return firstIncompleteStep?.id === step.id;
  }

  onBackdropClick(event: Event) {
    // Only close if clicking the backdrop itself, not the modal content
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal() {
    this.closed.emit();
  }

  onStepClick(step: OnboardingStep) {
    this.stepClicked.emit(step);
    // Modal will close when navigation occurs
  }

  dismissOrClose() {
    if (this.isDismissing()) return;

    if (this.isManualOpen) {
      // Just close the modal when opened manually
      this.closeModal();
    } else {
      // Dismiss permanently when auto-shown
      this.dismissPermanently();
    }
  }

  private dismissPermanently() {
    this.isDismissing.set(true);

    this.onboardingService.dismissWelcomeGuide()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dismissed.emit();
          }
          this.isDismissing.set(false);
        },
        error: (error) => {
          console.error('Error dismissing welcome guide:', error);
          this.isDismissing.set(false);
          // Still close the modal even if dismiss fails
          this.closeModal();
        }
      });
  }
}