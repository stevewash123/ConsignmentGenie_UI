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
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #047857;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0.25rem;
      line-height: 1;
    }

    .close-btn:hover {
      color: #dc2626;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .description {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .input-methods {
      margin-bottom: 1.5rem;
    }

    .method-tabs {
      display: flex;
      background: #f9fafb;
      border-radius: 8px;
      padding: 0.25rem;
      margin-bottom: 1rem;
    }

    .method-tab {
      flex: 1;
      background: none;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      color: #6b7280;
    }

    .method-tab.active {
      background: white;
      color: #047857;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-input, .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.875rem;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: #047857;
    }

    .file-input {
      padding: 0.5rem;
    }

    .email-preview {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .email-preview h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .email-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .email-tag {
      background: #047857;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .email-tag.error {
      background: #dc2626;
    }

    .progress-section {
      background: #eff6ff;
      border: 1px solid #c7d2fe;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .progress-bar {
      background: #e5e7eb;
      border-radius: 8px;
      height: 8px;
      margin: 0.5rem 0;
      overflow: hidden;
    }

    .progress-fill {
      background: #047857;
      height: 100%;
      transition: width 0.3s ease;
    }

    .results-section {
      background: #f9fafb;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .result-summary {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .result-stat {
      text-align: center;
    }

    .result-stat .number {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .result-stat .success .number {
      color: #047857;
    }

    .result-stat .error .number {
      color: #dc2626;
    }

    .result-stat .label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 500;
    }

    .error-list {
      max-height: 150px;
      overflow-y: auto;
    }

    .error-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 4px;
      margin-bottom: 0.25rem;
      font-size: 0.75rem;
    }

    .error-email {
      font-weight: 600;
      color: #dc2626;
    }

    .error-message {
      color: #7f1d1d;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #047857, #10b981);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #065f46, #047857);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f9fafb;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #f3f4f6;
    }

    .help-text {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
      line-height: 1.4;
    }
  `]
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