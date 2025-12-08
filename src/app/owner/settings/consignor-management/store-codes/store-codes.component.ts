import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-store-codes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './store-codes.component.html'
})
export class StoreCodesComponent {
  storeCodesForm: FormGroup;
  currentStoreCode = '123456';
  directSignupUrl = 'https://app.consignmentgenie.com/signup?code=123456';

  pendingInvitations = [
    { email: 'artist1@email.com', sentAt: new Date('2023-12-01'), status: 'pending' },
    { email: 'artist2@email.com', sentAt: new Date('2023-12-02'), status: 'pending' },
    { email: 'artist3@email.com', sentAt: new Date('2023-11-28'), status: 'expired' }
  ];

  constructor(private fb: FormBuilder) {
    this.storeCodesForm = this.fb.group({
      newInviteEmail: ['']
    });
  }

  generateNewStoreCode(): void {
    this.currentStoreCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.directSignupUrl = `https://app.consignmentgenie.com/signup?code=${this.currentStoreCode}`;
  }

  copyStoreCode(): void {
    navigator.clipboard.writeText(this.currentStoreCode);
    // TODO: Show success toast
  }

  copySignupUrl(): void {
    navigator.clipboard.writeText(this.directSignupUrl);
    // TODO: Show success toast
  }

  sendInvitation(): void {
    const email = this.storeCodesForm.get('newInviteEmail')?.value;
    if (email) {
      // TODO: Implement invitation sending
      console.log('Sending invitation to:', email);
      this.storeCodesForm.reset();
    }
  }

  resendInvitation(email: string): void {
    // TODO: Implement resend invitation
    console.log('Resending invitation to:', email);
  }

  cancelInvitation(email: string): void {
    // TODO: Implement cancel invitation
    console.log('Cancelling invitation to:', email);
  }

  trackByEmail(index: number, invitation: any): string {
    return invitation.email;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}