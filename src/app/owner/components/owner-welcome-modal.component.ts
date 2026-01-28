import { Component, OnInit, OnDestroy, OnChanges, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { OnboardingService } from '../../shared/services/onboarding.service';
import { OnboardingStatus } from '../../shared/models/onboarding.models';

@Component({
  selector: 'app-owner-welcome-modal',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './owner-welcome-modal.component.html',
  styleUrls: ['./owner-welcome-modal.component.scss']
})
export class OwnerWelcomeModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() shopName: string = 'Your Shop';
  @Input() onboardingStatus: OnboardingStatus | null = null;
  @Input() isManualOpen: boolean = false; // Controls button text ("Close" vs "No thanks...")
  @Output() closed = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  isDismissing = signal(false);

  constructor(
    private onboardingService: OnboardingService,
    private router: Router
  ) {}

  ngOnInit() {
    // No setup needed - template uses shopName directly
  }

  ngOnChanges() {
    // No setup needed - template uses shopName directly
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Navigate to owner settings and close modal
   */
  goToSettings(): void {
    this.closed.emit();
    this.router.navigate(['/owner/settings']);
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