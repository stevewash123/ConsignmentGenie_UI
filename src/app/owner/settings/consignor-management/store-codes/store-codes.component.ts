import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface ConsignorInvitation {
  id: string;
  email: string;
  sentAt: Date;
  expiresAt: Date;
  status: 'pending' | 'expired' | 'accepted' | 'cancelled';
  invitedBy: string;
}

interface StoreCodeSettings {
  currentCode: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

@Component({
  selector: 'app-store-codes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './store-codes.component.html',
  styles: [`
    .store-codes-section {
      padding: 2rem;
      max-width: 800px;
    }

    .section-header {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .section-description {
      color: #6b7280;
    }

    .form-section {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .form-section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1rem;
    }

    .store-code-display {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .code-value {
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      font-size: 1.5rem;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      align-items: end;
    }

    .form-group {
      flex: 1;
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      border-color: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .invitation-list {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .invitation-header {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
      color: #374151;
    }

    .invitation-item {
      padding: 1rem;
      border-bottom: 1px solid #f3f4f6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .invitation-item:last-child {
      border-bottom: none;
    }

    .invitation-info {
      flex: 1;
    }

    .invitation-email {
      font-weight: 500;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .invitation-meta {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-expired {
      background: #fecaca;
      color: #991b1b;
    }

    .status-accepted {
      background: #d1fae5;
      color: #065f46;
    }

    .status-cancelled {
      background: #f3f4f6;
      color: #374151;
    }

    .invitation-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-small {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .message {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-weight: 500;
    }

    .message.success {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .message.error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .store-codes-section {
        padding: 1rem;
      }

      .form-row {
        flex-direction: column;
        align-items: stretch;
      }

      .invitation-item {
        flex-direction: column;
        align-items: start;
        gap: 0.5rem;
      }

      .invitation-actions {
        width: 100%;
      }
    }
  `]
})
export class StoreCodesComponent implements OnInit {
  storeCodesForm!: FormGroup;
  storeCode = signal<StoreCodeSettings | null>(null);
  invitations = signal<ConsignorInvitation[]>([]);
  isLoading = signal(false);
  isSending = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadStoreCode();
    this.loadInvitations();
  }

  private initializeForm(): void {
    this.storeCodesForm = this.fb.group({
      newInviteEmail: ['', [Validators.required, Validators.email]]
    });
  }

  private async loadStoreCode(): Promise<void> {
    try {
      this.isLoading.set(true);
      const response = await this.http.get<StoreCodeSettings>(`${environment.apiUrl}/api/organization/store-code`).toPromise();
      if (response) {
        this.storeCode.set(response);
      } else {
        // Generate initial store code if none exists
        await this.generateNewStoreCode();
      }
    } catch (error) {
      this.showError('Failed to load store code');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadInvitations(): Promise<void> {
    try {
      const response = await this.http.get<ConsignorInvitation[]>(`${environment.apiUrl}/api/consignor-invitations`).toPromise();
      if (response) {
        this.invitations.set(response);
      }
    } catch (error) {
      this.showError('Failed to load invitations');
    }
  }

  async generateNewStoreCode(): Promise<void> {
    try {
      this.isLoading.set(true);
      const response = await this.http.post<StoreCodeSettings>(`${environment.apiUrl}/api/organization/store-code/regenerate`, {}).toPromise();
      if (response) {
        this.storeCode.set(response);
        this.showSuccess('New store code generated successfully');
      }
    } catch (error) {
      this.showError('Failed to generate new store code');
    } finally {
      this.isLoading.set(false);
    }
  }

  async copyStoreCode(): Promise<void> {
    const code = this.storeCode();
    if (code?.currentCode) {
      try {
        await navigator.clipboard.writeText(code.currentCode);
        this.showSuccess('Store code copied to clipboard');
      } catch (error) {
        this.showError('Failed to copy store code');
      }
    }
  }

  async copySignupUrl(): Promise<void> {
    const code = this.storeCode();
    if (code?.currentCode) {
      const url = `${environment.apiUrl}/signup?code=${code.currentCode}`;
      try {
        await navigator.clipboard.writeText(url);
        this.showSuccess('Signup URL copied to clipboard');
      } catch (error) {
        this.showError('Failed to copy signup URL');
      }
    }
  }

  async sendInvitation(): Promise<void> {
    if (!this.storeCodesForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    const email = this.storeCodesForm.get('newInviteEmail')?.value;
    if (!email) return;

    this.isSending.set(true);
    try {
      const invitation = await this.http.post<ConsignorInvitation>(`${environment.apiUrl}/api/consignor-invitations`, { email }).toPromise();
      if (invitation) {
        // Add the new invitation to the list
        const currentInvitations = this.invitations();
        this.invitations.set([...currentInvitations, invitation]);
        this.storeCodesForm.reset();
        this.showSuccess(`Invitation sent to ${email}`);
      }
    } catch (error) {
      this.showError(`Failed to send invitation to ${email}`);
    } finally {
      this.isSending.set(false);
    }
  }

  async resendInvitation(invitation: ConsignorInvitation): Promise<void> {
    try {
      await this.http.post(`${environment.apiUrl}/api/consignor-invitations/${invitation.id}/resend`, {}).toPromise();

      // Update the invitation in the list
      const updatedInvitations = this.invitations().map(inv =>
        inv.id === invitation.id
          ? { ...inv, sentAt: new Date(), status: 'pending' as const }
          : inv
      );
      this.invitations.set(updatedInvitations);
      this.showSuccess(`Invitation resent to ${invitation.email}`);
    } catch (error) {
      this.showError(`Failed to resend invitation to ${invitation.email}`);
    }
  }

  async cancelInvitation(invitation: ConsignorInvitation): Promise<void> {
    if (!confirm(`Are you sure you want to cancel the invitation to ${invitation.email}?`)) {
      return;
    }

    try {
      await this.http.delete(`${environment.apiUrl}/api/consignor-invitations/${invitation.id}`).toPromise();

      // Remove the invitation from the list
      const updatedInvitations = this.invitations().filter(inv => inv.id !== invitation.id);
      this.invitations.set(updatedInvitations);
      this.showSuccess(`Invitation to ${invitation.email} cancelled`);
    } catch (error) {
      this.showError(`Failed to cancel invitation to ${invitation.email}`);
    }
  }

  trackByInvitationId(index: number, invitation: ConsignorInvitation): string {
    return invitation.id;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-badge status-pending';
      case 'expired':
        return 'status-badge status-expired';
      case 'accepted':
        return 'status-badge status-accepted';
      case 'cancelled':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge status-cancelled';
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.storeCodesForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(): void {
    Object.keys(this.storeCodesForm.controls).forEach(key => {
      const control = this.storeCodesForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}