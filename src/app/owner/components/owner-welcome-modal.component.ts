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
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)" *ngIf="isVisible">
      <div class="welcome-modal" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <button class="close-btn" (click)="closeModal()" aria-label="Close modal">
            <span aria-hidden="true">×</span>
          </button>
          <h2 class="modal-title">{{ welcomeMessage.title }}</h2>
          <p class="modal-subtitle">{{ welcomeMessage.subtitle }}</p>

          <!-- Progress Bar -->
          <div class="progress-section" *ngIf="progress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progress.progressPercentage"></div>
            </div>
            <p class="progress-text">
              {{ progress.completedSteps }} of {{ progress.totalSteps }} completed
              <span class="progress-percentage">({{ progress.progressPercentage }}%)</span>
            </p>
          </div>
        </div>

        <!-- Steps List -->
        <div class="modal-body">
          <div class="steps-list">
            <div
              *ngFor="let step of steps; trackBy: trackByStepId"
              class="step-item"
              [class.completed]="step.completed"
              [class.next-step]="!step.completed && isNextStep(step)">

              <!-- Icon and Status -->
              <div class="step-icon-container">
                <div class="step-icon" *ngIf="!step.completed">{{ step.icon }}</div>
                <div class="step-check" *ngIf="step.completed">✅</div>
              </div>

              <!-- Content -->
              <div class="step-content">
                <h3 class="step-title">{{ step.title }}</h3>
                <p class="step-description">{{ step.description }}</p>
              </div>

              <!-- Action Button -->
              <div class="step-action">
                <a
                  *ngIf="!step.completed"
                  [routerLink]="step.routerLink"
                  class="step-button primary"
                  (click)="onStepClick(step)">
                  {{ step.actionText }}
                </a>
                <div
                  *ngIf="step.completed"
                  class="step-completed">
                  ✓ Done
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <div class="footer-center">
            <button
              class="btn-dismiss"
              (click)="dismissOrClose()"
              [disabled]="isDismissing()">
              {{ isDismissing() ? 'Saving...' : (isManualOpen ? 'Close' : 'No thanks, I can find my own way') }}
            </button>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div class="loading-overlay" *ngIf="isDismissing()">
          <div class="loading-spinner"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .welcome-modal {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    }

    .modal-header {
      padding: 2rem 2rem 1rem 2rem;
      border-bottom: 1px solid #e5e7eb;
      position: relative;
    }

    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background-color: #f3f4f6;
      color: #374151;
    }

    .modal-title {
      color: #047857;
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }

    .modal-subtitle {
      color: #6b7280;
      font-size: 1rem;
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
    }

    .progress-section {
      margin-top: 1rem;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background-color: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #047857, #059669);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-text {
      margin: 0.5rem 0 0 0;
      font-size: 0.875rem;
      color: #6b7280;
      text-align: center;
    }

    .progress-percentage {
      font-weight: 600;
      color: #047857;
    }

    .modal-body {
      padding: 1.5rem 2rem;
    }

    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      border-radius: 8px;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .step-item:hover {
      background-color: #f9fafb;
    }

    .step-item.completed {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
    }

    .step-item.next-step {
      background-color: #f0f9ff;
      border-color: #bfdbfe;
    }

    .step-icon-container {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step-icon {
      font-size: 1.5rem;
      background-color: #f3f4f6;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step-check {
      font-size: 1.5rem;
    }

    .step-content {
      flex: 1;
      min-width: 0;
    }

    .step-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.25rem 0;
    }

    .step-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
      line-height: 1.4;
    }

    .step-action {
      flex-shrink: 0;
    }

    .step-button {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      text-align: center;
      transition: all 0.2s;
      border: 2px solid transparent;
      cursor: pointer;
    }

    .step-button.primary {
      background-color: #047857;
      color: white;
    }

    .step-button.primary:hover {
      background-color: #059669;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(4, 120, 87, 0.2);
    }

    .step-button.secondary {
      background-color: #f3f4f6;
      color: #374151;
    }

    .step-button.secondary:hover {
      background-color: #e5e7eb;
    }

    .step-button.outlined {
      background-color: transparent;
      color: #047857;
      border-color: #d1d5db;
    }

    .step-button.outlined:hover {
      border-color: #047857;
      background-color: #f0fdf4;
    }

    .modal-footer {
      padding: 1.5rem 2rem 2rem 2rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .footer-center {
      display: flex;
      justify-content: center;
    }

    .btn-dismiss {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      background-color: #d1d5db;
      color: #374151;
    }

    .btn-dismiss:hover:not(:disabled) {
      background-color: #9ca3af;
    }

    .btn-dismiss:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .step-completed {
      color: #047857;
      font-weight: 600;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #047857;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 640px) {
      .welcome-modal {
        margin: 0;
        border-radius: 0;
        height: 100vh;
        max-height: 100vh;
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .step-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .step-action {
        align-self: stretch;
      }

      .step-button {
        width: 100%;
        text-align: center;
      }

      .btn-dismiss {
        width: 100%;
      }
    }
  `]
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
          id: 'providers',
          title: 'Add your consignors',
          description: 'Invite the people who consign items with you. They\'ll be able to track their inventory and payouts.',
          completed: false,
          actionText: 'Add Consignors',
          routerLink: '/owner/providers',
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