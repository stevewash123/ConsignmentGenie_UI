import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';

interface ClerkInvitation {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedByEmail: string;
}

interface ClerkUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './staff-management.component.html',
  styleUrls: ['./staff-management.component.scss']
})
export class StaffManagementComponent implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/api`;

  inviteForm: FormGroup;

  // State signals
  showInviteModal = signal(false);
  isInviting = signal(false);
  isLoadingInvitations = signal(false);
  isLoadingClerks = signal(false);

  // Data signals
  pendingInvitations = signal<ClerkInvitation[]>([]);
  activeClerks = signal<ClerkUser[]>([]);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastr: ToastrService
  ) {
    this.inviteForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadPendingInvitations();
    this.loadActiveClerks();
  }

  // Load pending clerk invitations
  loadPendingInvitations(): void {
    this.isLoadingInvitations.set(true);

    this.http.get<ClerkInvitation[]>(`${this.apiUrl}/owner/clerk-invitations/pending`)
      .subscribe({
        next: (invitations) => {
          console.log('Received invitations:', invitations);
          this.pendingInvitations.set(invitations || []);
          this.isLoadingInvitations.set(false);
        },
        error: (error) => {
          console.error('Error loading pending invitations:', error);
          this.toastr.error('Failed to load pending invitations');
          this.isLoadingInvitations.set(false);
        }
      });
  }

  // Load active clerk users
  loadActiveClerks(): void {
    this.isLoadingClerks.set(true);

    this.http.get<ClerkUser[]>(`${this.apiUrl}/owner/clerks`)
      .subscribe({
        next: (clerks) => {
          console.log('Received clerks:', clerks);
          this.activeClerks.set(clerks || []);
          this.isLoadingClerks.set(false);
        },
        error: (error) => {
          console.error('Error loading active clerks:', error);
          this.toastr.error('Failed to load staff members');
          this.isLoadingClerks.set(false);
        }
      });
  }

  // Open invite modal
  openInviteModal(): void {
    this.inviteForm.reset();
    this.showInviteModal.set(true);
  }

  // Close invite modal
  closeInviteModal(): void {
    this.showInviteModal.set(false);
    this.inviteForm.reset();
  }

  // Send clerk invitation
  sendInvitation(): void {
    if (this.inviteForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isInviting.set(true);

    const invitationData = this.inviteForm.value;

    this.http.post<any>(`${this.apiUrl}/owner/clerk-invitations/invite`, invitationData)
      .subscribe({
        next: (response) => {
          this.isInviting.set(false);
          if (response.success) {
            this.toastr.success(`Invitation sent to ${invitationData.email}`, 'Invitation Sent');
            this.closeInviteModal();
            this.loadPendingInvitations(); // Refresh the list
          } else {
            this.toastr.error(response.message || 'Failed to send invitation');
          }
        },
        error: (error) => {
          this.isInviting.set(false);
          console.error('Error sending invitation:', error);
          const errorMessage = error.error?.message || 'Failed to send invitation';
          this.toastr.error(errorMessage);
        }
      });
  }

  // Resend invitation
  resendInvitation(invitationId: string): void {
    this.http.post<any>(`${this.apiUrl}/owner/clerk-invitations/${invitationId}/resend`, {})
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('Invitation resent successfully');
            this.loadPendingInvitations(); // Refresh to show updated expiry
          } else {
            this.toastr.error(response.message || 'Failed to resend invitation');
          }
        },
        error: (error) => {
          console.error('Error resending invitation:', error);
          this.toastr.error('Failed to resend invitation');
        }
      });
  }

  // Cancel invitation
  cancelInvitation(invitationId: string): void {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return;
    }

    this.http.delete<any>(`${this.apiUrl}/owner/clerk-invitations/${invitationId}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('Invitation cancelled');
            this.loadPendingInvitations(); // Refresh the list
          } else {
            this.toastr.error(response.message || 'Failed to cancel invitation');
          }
        },
        error: (error) => {
          console.error('Error cancelling invitation:', error);
          this.toastr.error('Failed to cancel invitation');
        }
      });
  }

  // Deactivate clerk
  deactivateClerk(clerkId: string, clerkName: string): void {
    if (!confirm(`Are you sure you want to deactivate ${clerkName}? They will no longer be able to access the system.`)) {
      return;
    }

    this.http.put<any>(`${this.apiUrl}/owner/clerks/${clerkId}/deactivate`, {})
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success(`${clerkName} has been deactivated`);
            this.loadActiveClerks(); // Refresh the list
          } else {
            this.toastr.error(response.message || 'Failed to deactivate clerk');
          }
        },
        error: (error) => {
          console.error('Error deactivating clerk:', error);
          this.toastr.error('Failed to deactivate clerk');
        }
      });
  }

  // Form validation helpers
  private markFormGroupTouched(): void {
    Object.keys(this.inviteForm.controls).forEach(key => {
      const control = this.inviteForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.inviteForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    switch (fieldName) {
      case 'name': return 'Name';
      case 'email': return 'Email';
      default: return fieldName;
    }
  }

  // Utility methods
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getFullName(clerk: ClerkUser): string {
    return `${clerk.firstName} ${clerk.lastName}`.trim();
  }

  isInvitationExpired(expiresAt: string): boolean {
    return new Date(expiresAt) < new Date();
  }

  // Track functions for ngFor
  trackClerk(index: number, clerk: ClerkUser): string {
    return clerk.id;
  }

  trackInvitation(index: number, invitation: ClerkInvitation): string {
    return invitation.id;
  }
}