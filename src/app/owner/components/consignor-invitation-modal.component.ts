import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsignorService } from '../../services/consignor.service';

@Component({
  selector: 'app-consignor-invitation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consignor-invitation-modal.component.html',
  styleUrls: ['./consignor-invitation-modal.component.scss']
})
export class ConsignorInvitationModalComponent {
  @Input() isVisible!: () => boolean;
  @Output() close = new EventEmitter<void>();
  @Output() invitationSent = new EventEmitter<void>();

  invitation = {
    name: '',
    email: ''
  };

  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(private ConsignorService: ConsignorService) {}

  onOverlayClick(event: Event): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.ConsignorService.inviteConsignor(this.invitation).subscribe({
      next: (response) => {
        this.successMessage.set('Invitation sent successfully!');
        this.resetForm();
        this.invitationSent.emit();

        // Auto-close after 2 seconds
        setTimeout(() => {
          this.close.emit();
        }, 2000);
      },
      error: (error) => {
        console.error('Error sending invitation:', error);
        let errorMsg = 'Failed to send invitation. Please try again.';

        if (error.status === 405) {
          errorMsg = 'consignor invitation feature is not currently available. Please contact support.';
        } else if (error.status === 404) {
          errorMsg = 'consignor invitation endpoint not found. Please contact support.';
        } else if (error.status === 400) {
          errorMsg = error.error?.message || 'Invalid invitation data. Please check the email address.';
        } else if (error.status === 401) {
          errorMsg = 'You are not authorized to send invitations. Please log in again.';
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        }

        this.errorMessage.set(errorMsg);
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  private resetForm(): void {
    this.invitation = {
      name: '',
      email: ''
    };
  }
}