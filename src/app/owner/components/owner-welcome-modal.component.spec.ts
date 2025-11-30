import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { OwnerWelcomeModalComponent } from './owner-welcome-modal.component';
import { OnboardingService } from '../../shared/services/onboarding.service';
import { OnboardingStatus, OnboardingStep } from '../../shared/models/onboarding.models';

describe('OwnerWelcomeModalComponent', () => {
  let component: OwnerWelcomeModalComponent;
  let fixture: ComponentFixture<OwnerWelcomeModalComponent>;
  let mockOnboardingService: jasmine.SpyObj<OnboardingService>;

  const mockOnboardingStatus: OnboardingStatus = {
    dismissed: false,
    welcomeGuideCompleted: false,
    showModal: true,
    steps: {
      hasProviders: true,
      storefrontConfigured: false,
      hasInventory: true,
      quickBooksConnected: false
    }
  };

  const mockSteps: OnboardingStep[] = [
    {
      id: 'providers',
      title: 'Add your providers',
      description: 'Invite the people who consign items with you.',
      completed: true,
      actionText: 'Add Providers',
      routerLink: '/owner/providers',
      icon: '👥'
    },
    {
      id: 'storefront',
      title: 'Change your storefront or use ours',
      description: 'Decide how you\'ll sell.',
      completed: false,
      actionText: 'Set Up Storefront',
      routerLink: '/owner/settings/storefront',
      icon: '🛍️'
    }
  ];

  beforeEach(async () => {
    const onboardingServiceSpy = jasmine.createSpyObj('OnboardingService', [
      'getOnboardingSteps',
      'getOnboardingProgress',
      'getWelcomeMessage',
      'getNextIncompleteStep',
      'dismissOnboarding',
      'dismissWelcomeGuide'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        RouterModule.forRoot([]),
        OwnerWelcomeModalComponent
      ],
      providers: [
        { provide: OnboardingService, useValue: onboardingServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OwnerWelcomeModalComponent);
    component = fixture.componentInstance;
    mockOnboardingService = TestBed.inject(OnboardingService) as jasmine.SpyObj<OnboardingService>;

    // Setup default mock returns
    mockOnboardingService.getOnboardingSteps.and.returnValue(mockSteps);
    mockOnboardingService.getOnboardingProgress.and.returnValue({
      totalSteps: 4,
      completedSteps: 2,
      progressPercentage: 50
    });
    mockOnboardingService.getWelcomeMessage.and.returnValue({
      title: 'You\'re making progress! 💪',
      subtitle: 'Here\'s what\'s left to complete your setup:'
    });
    mockOnboardingService.getNextIncompleteStep.and.returnValue(mockSteps[1]);
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.isVisible).toBe(false);
      expect(component.shopName).toBe('Your Shop');
      expect(component.onboardingStatus).toBeNull();
      expect(component.isManualOpen).toBe(false);
      expect(component.isDismissing()).toBe(false);
    });

    it('should setup modal when onboarding status is provided', () => {
      component.onboardingStatus = mockOnboardingStatus;
      component.shopName = 'Test Shop';

      component.ngOnInit();

      expect(mockOnboardingService.getOnboardingSteps).toHaveBeenCalledWith(mockOnboardingStatus);
      expect(mockOnboardingService.getOnboardingProgress).toHaveBeenCalledWith(mockOnboardingStatus);
      expect(mockOnboardingService.getWelcomeMessage).toHaveBeenCalledWith(mockOnboardingStatus, 'Test Shop');
      expect(component.steps).toEqual(mockSteps);
    });
  });

  describe('Modal Visibility', () => {
    beforeEach(() => {
      component.onboardingStatus = mockOnboardingStatus;
      component.isVisible = true;
      fixture.detectChanges();
    });

    it('should show modal when isVisible is true', () => {
      const modalBackdrop = fixture.nativeElement.querySelector('.modal-backdrop');
      expect(modalBackdrop).toBeTruthy();
    });

    it('should hide modal when isVisible is false', () => {
      component.isVisible = false;
      fixture.detectChanges();

      const modalBackdrop = fixture.nativeElement.querySelector('.modal-backdrop');
      expect(modalBackdrop).toBeFalsy();
    });
  });

  describe('Progress Display', () => {
    beforeEach(() => {
      component.onboardingStatus = mockOnboardingStatus;
      component.isVisible = true;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should display progress bar with correct percentage', () => {
      const progressFill = fixture.nativeElement.querySelector('.progress-fill');
      expect(progressFill.style.width).toBe('50%');
    });

    it('should display progress text', () => {
      const progressText = fixture.nativeElement.querySelector('.progress-text');
      expect(progressText.textContent).toContain('2 of 4 completed');
      expect(progressText.textContent).toContain('(50%)');
    });
  });

  describe('Steps Display', () => {
    beforeEach(() => {
      component.onboardingStatus = mockOnboardingStatus;
      component.isVisible = true;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should display all steps', () => {
      const stepItems = fixture.nativeElement.querySelectorAll('.step-item');
      expect(stepItems.length).toBe(2);
    });

    it('should show completed steps with checkmark', () => {
      const completedStep = fixture.nativeElement.querySelector('.step-item.completed');
      expect(completedStep).toBeTruthy();

      const checkmark = completedStep.querySelector('.step-check');
      expect(checkmark.textContent).toBe('✅');
    });

    it('should highlight next step', () => {
      const nextStep = fixture.nativeElement.querySelector('.step-item.next-step');
      expect(nextStep).toBeTruthy();
    });

    it('should show correct action text for incomplete steps and done indicator for completed steps', () => {
      const stepButtons = fixture.nativeElement.querySelectorAll('.step-button');
      const completedIndicators = fixture.nativeElement.querySelectorAll('.step-completed');

      expect(stepButtons.length).toBe(1); // Only incomplete steps have buttons
      expect(stepButtons[0].textContent.trim()).toBe('Set Up Storefront'); // Incomplete step

      expect(completedIndicators.length).toBe(1); // Completed steps have done indicators
      expect(completedIndicators[0].textContent.trim()).toContain('✓ Done');
    });
  });

  describe('Modal Interactions', () => {
    beforeEach(() => {
      component.onboardingStatus = mockOnboardingStatus;
      component.isVisible = true;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should emit closed event when close button is clicked', () => {
      spyOn(component.closed, 'emit');

      const closeButton = fixture.nativeElement.querySelector('.close-btn');
      closeButton.click();

      expect(component.closed.emit).toHaveBeenCalled();
    });

    it('should emit closed event when backdrop is clicked', () => {
      spyOn(component.closed, 'emit');

      const backdrop = fixture.nativeElement.querySelector('.modal-backdrop');
      backdrop.click();

      expect(component.closed.emit).toHaveBeenCalled();
    });

    it('should not close when modal content is clicked', () => {
      spyOn(component.closed, 'emit');

      const modalContent = fixture.nativeElement.querySelector('.welcome-modal');
      modalContent.click();

      expect(component.closed.emit).not.toHaveBeenCalled();
    });

    it('should emit stepClicked event when step is clicked', () => {
      spyOn(component.stepClicked, 'emit');

      const stepButton = fixture.nativeElement.querySelector('.step-button');
      stepButton.click();

      // The first step-button will be for the first incomplete step (storefront)
      expect(component.stepClicked.emit).toHaveBeenCalledWith(mockSteps[1]);
    });

    it('should close modal with dismiss button when manually opened', () => {
      component.isManualOpen = true;
      fixture.detectChanges();
      spyOn(component.closed, 'emit');

      const dismissButton = fixture.nativeElement.querySelector('.btn-dismiss');
      dismissButton.click();

      expect(component.closed.emit).toHaveBeenCalled();
    });

    it('should dismiss welcome guide when auto-shown and dismiss button is clicked', () => {
      mockOnboardingService.dismissWelcomeGuide.and.returnValue(of({ success: true, welcomeGuideCompleted: true }));
      component.isManualOpen = false;
      fixture.detectChanges();
      spyOn(component.dismissed, 'emit');

      const dismissButton = fixture.nativeElement.querySelector('.btn-dismiss');
      dismissButton.click();

      expect(mockOnboardingService.dismissWelcomeGuide).toHaveBeenCalled();
      expect(component.dismissed.emit).toHaveBeenCalled();
    });
  });

  describe('Dismiss or Close Functionality', () => {
    beforeEach(() => {
      component.onboardingStatus = mockOnboardingStatus;
      component.isVisible = true;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should show "Close" button text when manually opened', () => {
      component.isManualOpen = true;
      fixture.detectChanges();

      const dismissButton = fixture.nativeElement.querySelector('.btn-dismiss');
      expect(dismissButton.textContent.trim()).toBe('Close');
    });

    it('should show "No thanks, I can find my own way" button text when auto-shown', () => {
      component.isManualOpen = false;
      fixture.detectChanges();

      const dismissButton = fixture.nativeElement.querySelector('.btn-dismiss');
      expect(dismissButton.textContent.trim()).toBe('No thanks, I can find my own way');
    });

    it('should just close when manually opened', () => {
      spyOn(component.closed, 'emit');
      component.isManualOpen = true;

      component.dismissOrClose();

      expect(component.closed.emit).toHaveBeenCalled();
      expect(mockOnboardingService.dismissWelcomeGuide).not.toHaveBeenCalled();
    });

    it('should dismiss permanently when auto-shown', () => {
      mockOnboardingService.dismissWelcomeGuide.and.returnValue(of({ success: true, welcomeGuideCompleted: true }));
      spyOn(component.dismissed, 'emit');
      component.isManualOpen = false;

      component.dismissOrClose();

      expect(mockOnboardingService.dismissWelcomeGuide).toHaveBeenCalled();
      expect(component.dismissed.emit).toHaveBeenCalled();
    });

    it('should handle dismiss error gracefully', () => {
      mockOnboardingService.dismissWelcomeGuide.and.returnValue(throwError('API Error'));
      spyOn(component.closed, 'emit');
      spyOn(console, 'error');
      component.isManualOpen = false;

      component.dismissOrClose();

      expect(console.error).toHaveBeenCalledWith('Error dismissing welcome guide:', 'API Error');
      expect(component.closed.emit).toHaveBeenCalled();
      expect(component.isDismissing()).toBe(false);
    });

    it('should show loading state while dismissing', () => {
      const dismissSubject = new Subject<{ success: boolean, welcomeGuideCompleted: boolean }>();
      mockOnboardingService.dismissWelcomeGuide.and.returnValue(dismissSubject.asObservable());

      component.isManualOpen = false;
      component['dismissPermanently']();

      // Should be loading immediately after calling dismissPermanently
      expect(component.isDismissing()).toBe(true);

      // Complete the observable and check loading state is reset
      dismissSubject.next({ success: true, welcomeGuideCompleted: true });
      dismissSubject.complete();

      expect(component.isDismissing()).toBe(false);
    });

    it('should disable button while dismissing', () => {
      component.isDismissing.set(true);
      fixture.detectChanges();

      const dismissButton = fixture.nativeElement.querySelector('.btn-dismiss');
      expect(dismissButton.disabled).toBe(true);
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      component.onboardingStatus = mockOnboardingStatus;
      component.ngOnInit();
    });

    it('should track steps by id', () => {
      const step = mockSteps[0];
      const trackResult = component.trackByStepId(0, step);
      expect(trackResult).toBe(step.id);
    });

    it('should identify next step correctly', () => {
      const result = component.isNextStep(mockSteps[1]);
      expect(result).toBe(true);
      expect(mockOnboardingService.getNextIncompleteStep).toHaveBeenCalledWith(mockOnboardingStatus);
    });

    it('should return false for isNextStep when no next step exists', () => {
      mockOnboardingService.getNextIncompleteStep.and.returnValue(null);

      const result = component.isNextStep(mockSteps[0]);
      expect(result).toBe(false);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      component.onboardingStatus = mockOnboardingStatus;
      component.isVisible = true;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should have proper ARIA labels', () => {
      const closeButton = fixture.nativeElement.querySelector('.close-btn');
      expect(closeButton.getAttribute('aria-label')).toBe('Close modal');
    });

    it('should have proper modal structure', () => {
      const modal = fixture.nativeElement.querySelector('.welcome-modal');
      expect(modal).toBeTruthy();

      const header = modal.querySelector('.modal-header');
      const body = modal.querySelector('.modal-body');
      const footer = modal.querySelector('.modal-footer');

      expect(header).toBeTruthy();
      expect(body).toBeTruthy();
      expect(footer).toBeTruthy();
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      component.onboardingStatus = mockOnboardingStatus;
      component.isVisible = true;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should have responsive classes for mobile', () => {
      const stylesheet = document.head.querySelector('style');
      const hasResponsiveStyles = stylesheet?.textContent?.includes('@media (max-width: 640px)');
      expect(hasResponsiveStyles).toBe(true);
    });
  });
});