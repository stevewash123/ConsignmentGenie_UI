import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ConsignorService, ConsignorInvitationRequest, BulkInvitationRequest } from '../../services/consignor.service';
import { ENTITY_LABELS } from '../constants/labels';

interface BulkInviteResult {
  successful: number;
  failed: number;
  errors: { email: string; error: string }[];
}

@Component({
  selector: 'app-bulk-invite-consignor-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bulk-invite-consignor-modal.component.html',
})
export class BulkInviteConsignorModalComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() invitesSent = new EventEmitter<void>();

  labels = ENTITY_LABELS;
  inputMethod: 'csv' | 'text' = 'csv';

  isProcessing = signal(false);
  progressPercent = signal(0);
  currentProcessing = signal('');
  showResults = signal(false);
  results = signal<BulkInviteResult>({ successful: 0, failed: 0, errors: [] });

  emails = signal<string[]>([]);
  invalidEmails = signal<string[]>([]);

  bulkForm = new FormGroup({
    csvFile: new FormControl(null),
    emailText: new FormControl(''),
    personalMessage: new FormControl('')
  });

  constructor(
    private consignorService: ConsignorService,
    private toastr: ToastrService
  ) {}

  close(): void {
    this.closed.emit();
  }

  setInputMethod(method: 'csv' | 'text'): void {
    this.inputMethod = method;
    this.clearEmails();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const csvData = e.target.result;
        this.parseCSV(csvData);
      };
      reader.readAsText(file);
    }
  }

  onTextChanged(): void {
    const text = this.bulkForm.get('emailText')?.value || '';
    const emails = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    this.validateEmails(emails);
  }

  private parseCSV(csvData: string): void {
    const lines = csvData.split('\n');
    const emails: string[] = [];

    // Try to detect if first line is header
    const firstLine = lines[0]?.toLowerCase();
    const startIndex = (firstLine?.includes('email') || firstLine?.includes('mail')) ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        // Handle CSV with multiple columns - try to find email
        const parts = line.split(',');
        for (const part of parts) {
          const cleanPart = part.replace(/['"]/g, '').trim();
          if (this.isValidEmail(cleanPart)) {
            emails.push(cleanPart);
            break; // Take first valid email from the row
          }
        }
      }
    }

    this.validateEmails(emails);
  }

  private validateEmails(emails: string[]): void {
    const valid: string[] = [];
    const invalid: string[] = [];
    const seen = new Set<string>();

    for (const email of emails) {
      const normalizedEmail = email.toLowerCase();

      // Skip duplicates
      if (seen.has(normalizedEmail)) continue;
      seen.add(normalizedEmail);

      if (this.isValidEmail(email)) {
        valid.push(email);
      } else {
        invalid.push(email);
      }
    }

    this.emails.set(valid);
    this.invalidEmails.set(invalid);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private clearEmails(): void {
    this.emails.set([]);
    this.invalidEmails.set([]);
    this.bulkForm.patchValue({ csvFile: null, emailText: '' });
  }

  async submitBulkInvite(): Promise<void> {
    const emailList = this.emails();
    if (emailList.length === 0) {
      this.toastr.error('Please add some valid email addresses', 'No Emails');
      return;
    }

    this.isProcessing.set(true);
    this.progressPercent.set(0);
    this.showResults.set(false);

    const personalMessage = this.bulkForm.get('personalMessage')?.value || '';

    try {
      // Try using the bulk API endpoint first
      await this.sendBulkInvitations(emailList, personalMessage);
    } catch (bulkError: any) {
      // If bulk endpoint fails (not implemented yet), fall back to individual invites
      if (bulkError.status === 404) {
        console.log('Bulk API not available, falling back to individual invites');
        await this.sendIndividualInvitations(emailList, personalMessage);
      } else {
        throw bulkError;
      }
    }

    // Emit event to refresh parent component
    this.invitesSent.emit();
  }

  private async sendBulkInvitations(emailList: string[], personalMessage: string): Promise<void> {
    this.currentProcessing.set('Sending bulk invitations...');

    const invitations: ConsignorInvitationRequest[] = emailList.map(email => ({
      email: email,
      name: email // Use email as name fallback
    }));

    const bulkRequest: BulkInvitationRequest = {
      invitations: invitations,
      personalMessage: personalMessage || undefined
    };

    try {
      const response = await this.consignorService.bulkInviteConsignors(bulkRequest).toPromise();

      if (response?.success) {
        const results = response.results;
        const errors = results.details
          .filter(detail => !detail.success)
          .map(detail => ({ email: detail.email, error: detail.message }));

        this.results.set({
          successful: results.successful,
          failed: results.failed,
          errors: errors
        });

        this.progressPercent.set(100);
        this.isProcessing.set(false);
        this.showResults.set(true);
        this.currentProcessing.set('');

        // Show summary toasts
        if (results.successful > 0) {
          this.toastr.success(
            `Successfully sent ${results.successful} invitation${results.successful > 1 ? 's' : ''}`,
            'Bulk Invite Complete'
          );
        }

        if (results.failed > 0) {
          this.toastr.warning(
            `${results.failed} invitation${results.failed > 1 ? 's' : ''} failed to send`,
            'Some Invitations Failed'
          );
        }
      } else {
        throw new Error(response?.message || 'Bulk invitation failed');
      }
    } catch (error: any) {
      this.isProcessing.set(false);
      throw error;
    }
  }

  private async sendIndividualInvitations(emailList: string[], personalMessage: string): Promise<void> {
    const successful: string[] = [];
    const errors: { email: string; error: string }[] = [];

    // Process invites in batches to avoid overwhelming the server
    const batchSize = 5;
    const totalBatches = Math.ceil(emailList.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, emailList.length);
      const batch = emailList.slice(batchStart, batchEnd);

      // Process batch in parallel
      const batchPromises = batch.map(async (email) => {
        this.currentProcessing.set(`Sending invitation to ${email}...`);

        try {
          const invitation: ConsignorInvitationRequest = {
            email: email,
            name: email // Use email as name fallback
          };

          const response = await this.consignorService.inviteConsignor(invitation).toPromise();

          if (response?.success) {
            successful.push(email);
          } else {
            errors.push({
              email: email,
              error: response?.message || 'Failed to send invitation'
            });
          }
        } catch (error: any) {
          errors.push({
            email: email,
            error: error.error?.message || 'Network error occurred'
          });
        }
      });

      await Promise.allSettled(batchPromises);

      // Update progress
      const completedCount = (batchIndex + 1) * batchSize;
      const progress = Math.min((completedCount / emailList.length) * 100, 100);
      this.progressPercent.set(progress);
    }

    // Set final results
    this.results.set({
      successful: successful.length,
      failed: errors.length,
      errors: errors
    });

    this.isProcessing.set(false);
    this.showResults.set(true);
    this.currentProcessing.set('');

    // Show summary toasts
    if (successful.length > 0) {
      this.toastr.success(
        `Successfully sent ${successful.length} invitation${successful.length > 1 ? 's' : ''}`,
        'Bulk Invite Complete'
      );
    }

    if (errors.length > 0) {
      this.toastr.warning(
        `${errors.length} invitation${errors.length > 1 ? 's' : ''} failed to send`,
        'Some Invitations Failed'
      );
    }
  }

  canSubmit(): boolean {
    return this.emails().length > 0 && !this.isProcessing();
  }

  resetForm(): void {
    this.clearEmails();
    this.bulkForm.reset();
    this.showResults.set(false);
    this.progressPercent.set(0);
    this.currentProcessing.set('');
  }
}