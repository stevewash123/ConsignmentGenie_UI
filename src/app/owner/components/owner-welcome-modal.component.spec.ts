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
      title: 'Choose your storefront',
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
      'dismissOnboarding'
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
      expect(component.dontShowAgain).toBe(false);
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

    it('should show correct action text for steps', () => {
      const stepButtons = fixture.nativeElement.querySelectorAll('.step-button');
      expect(stepButtons[0].textContent.trim()).toBe('View'); // Completed step
      expect(stepButtons[1].textContent.trim()).toBe('Set Up Storefront'); // Incomplete step
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

      expect(component.stepClicked.emit).toHaveBeenCalledWith(mockSteps[0]);
    });

    it('should close modal with Maybe Later button', () => {
      spyOn(component.closed, 'emit');

      const maybeLaterButton = fixture.nativeElement.querySelector('.btn-secondary');
      maybeLaterButton.click();

      expect(component.closed.emit).toHaveBeenCalled();
    });
  });

  describe('Get Started Functionality', () => {
    beforeEach(() => {
      component.onboardingStatus = mockOnboardingStatus;
      component.isVisible = true;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should navigate to next step when Get Started is clicked without dismiss', () => {
      spyOn(component.stepClicked, 'emit');
      spyOn(component.closed, 'emit');

      component.dontShowAgain = false;

      const getStartedButton = fixture.nativeElement.querySelector('.btn-primary');
      getStartedButton.click();

      expect(component.stepClicked.emit).toHaveBeenCalledWith(mockSteps[1]);
      expect(component.closed.emit).toHaveBeenCalled();
    });

    it('should dismiss permanently when dontShowAgain is checked', () => {
      mockOnboardingService.dismissOnboarding.and.returnValue(of({ success: true }));
      spyOn(component.dismissed, 'emit');

      component.dontShowAgain = true;

      const getStartedButton = fixture.nativeElement.querySelector('.btn-primary');
      getStartedButton.click();

      expect(mockOnboardingService.dismissOnboarding).toHaveBeenCalled();
      expect(component.dismissed.emit).toHaveBeenCalled();
    });

    it('should handle dismiss error gracefully', () => {
      mockOnboardingService.dismissOnboarding.and.returnValue(throwError('API Error'));
      spyOn(component.closed, 'emit');
      spyOn(console, 'error');

      component.dontShowAgain = true;

      const getStartedButton = fixture.nativeElement.querySelector('.btn-primary');
      getStartedButton.click();

      expect(console.error).toHaveBeenCalledWith('Error dismissing onboarding:', 'API Error');
      expect(component.closed.emit).toHaveBeenCalled();
      expect(component.isDismissing()).toBe(false);
    });

    it('should show loading state while dismissing', () => {
      const dismissSubject = new Subject<{ success: boolean }>();
      mockOnboardingService.dismissOnboarding.and.returnValue(dismissSubject.asObservable());

      component.dontShowAgain = true;
      component['dismissPermanently']();

      // Should be loading immediately after calling dismissPermanently
      expect(component.isDismissing()).toBe(true);

      // Complete the observable and check loading state is reset
      dismissSubject.next({ success: true });
      dismissSubject.complete();

      expect(component.isDismissing()).toBe(false);
    });

    it('should disable buttons while dismissing', () => {
      component.isDismissing.set(true);
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.btn-secondary, .btn-primary');
      buttons.forEach((button: HTMLButtonElement) => {
        expect(button.disabled).toBe(true);
      });
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