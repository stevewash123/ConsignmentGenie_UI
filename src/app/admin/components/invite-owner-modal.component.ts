import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OwnerInvitationService } from '../../services/owner-invitation.service';
import { CreateOwnerInvitationRequest } from '../../models/owner-invitation.model';
import { LoadingService } from '../../shared/services/loading.service';

@Component({
  selector: 'app-invite-owner-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invite-owner-modal.component.html',
  styleUrls: ['./invite-owner-modal.component.scss']
})
export class InviteOwnerModalComponent {
  @Input() isOpen = signal(false);
  @Output() invitationSent = new EventEmitter<void>();
  @Output() modalClosed = new EventEmitter<void>();

  errorMessage = signal('');
  successMessage = signal('');

  formData: CreateOwnerInvitationRequest = {
    name: '',
    email: ''
  };

  constructor(private ownerInvitationService: OwnerInvitationService, private loadingService: LoadingService) {}

  isComponentLoading(): boolean {
    return this.loadingService.isLoading('invite-owner-modal');
  }

  closeModal() {
    if (!this.isComponentLoading()) {
      this.resetForm();
      this.modalClosed.emit();
    }
  }

  onSubmit() {
    if (this.isComponentLoading()) {
      return;
    }

    this.loadingService.start('invite-owner-modal');
    this.errorMessage.set('');
    this.successMessage.set('');

    this.ownerInvitationService.createInvitation(this.formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage.set('Invitation sent successfully! The owner will receive an email with registration instructions.');
          this.invitationSent.emit();
          // Close modal after a short delay
          setTimeout(() => {
            this.closeModal();
          }, 2000);
        } else {
          this.errorMessage.set(response.message || 'Failed to send invitation. Please try again.');
        }
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'An error occurred while sending the invitation. Please try again.');
      },
      complete: () => {
        this.loadingService.stop('invite-owner-modal');
      }
    });
  }

  private resetForm() {
    this.formData = {
      name: '',
      email: ''
    };
    this.errorMessage.set('');
    this.successMessage.set('');
    this.loadingService.stop('invite-owner-modal');
  }
}