import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-automation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="automation-section">
      <header class="settings-header">
        <h2>Automation Settings</h2>
        <p>Configure automatic payout generation and approval thresholds</p>
      </header>

      <form [formGroup]="automationForm" (ngSubmit)="onSave()">
        <!-- Automation -->
        <section class="form-section" formGroupName="automation">
          <h3>Automation Settings</h3>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="autoGeneratePayouts">
              <span class="checkmark"></span>
              Automatically generate payouts on schedule
            </label>
            <span class="help-text">Payouts will be calculated automatically but may require approval</span>
          </div>

          <div class="automation-options" *ngIf="automationForm.get('automation.autoGeneratePayouts')?.value">
            <div class="form-group">
              <label for="autoApproveThreshold">Auto-approve payouts under</label>
              <div class="input-with-prefix">
                <span class="input-prefix">$</span>
                <input id="autoApproveThreshold" type="number" formControlName="autoApproveThreshold"
                       class="form-input" min="0" step="0.01" placeholder="100.00">
              </div>
              <span class="help-text">Small payouts will be processed automatically</span>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="requireManualReview">
                <span class="checkmark"></span>
                Require manual review for large payouts
              </label>
            </div>

            <div class="form-group" *ngIf="automationForm.get('automation.requireManualReview')?.value">
              <label for="manualReviewThreshold">Manual review threshold</label>
              <div class="input-with-prefix">
                <span class="input-prefix">$</span>
                <input id="manualReviewThreshold" type="number" formControlName="manualReviewThreshold"
                       class="form-input" min="0" step="0.01" placeholder="500.00">
              </div>
              <span class="help-text">Payouts over this amount will require manual approval</span>
            </div>
          </div>
        </section>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="submit" [disabled]="!automationForm.valid || saving()" class="btn-primary">
            {{ saving() ? 'Saving...' : 'Save Automation Settings' }}
          </button>
        </div>
      </form>

      <!-- Messages -->
      <div class="messages" *ngIf="successMessage() || errorMessage()">
        <div *ngIf="successMessage()" class="message success">{{ successMessage() }}</div>
        <div *ngIf="errorMessage()" class="message error">{{ errorMessage() }}</div>
      </div>
    </div>
  `,
  styles: [`
    .automation-section {
      padding: 2rem;
      max-width: 1200px;
    }
    .settings-header {
      margin-bottom: 2rem;
    }
    .settings-header h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    .settings-header p {
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
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
    }
    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
    }
    .checkmark {
      width: 1.125rem;
      height: 1.125rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
    .automation-options {
      margin-left: 1.875rem;
      margin-top: 1rem;
      padding-left: 1rem;
      border-left: 2px solid #e5e7eb;
    }
    .input-with-prefix {
      display: flex;
    }
    .input-prefix {
      background: #f9fafb;
      border: 1px solid #d1d5db;
      border-right: none;
      padding: 0.75rem;
      border-radius: 6px 0 0 6px;
      font-size: 0.875rem;
      color: #6b7280;
    }
    .input-with-prefix input {
      border-radius: 0 6px 6px 0;
    }
    .help-text {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
      display: block;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
    }
    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.75rem 1.5rem;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-primary:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .messages {
      margin-top: 1rem;
    }
    .message {
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .message.success {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .message.error {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }
  `]
})
export class AutomationComponent implements OnInit {
  automationForm!: FormGroup;
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadSettings();
  }

  private initForm() {
    this.automationForm = this.fb.group({
      automation: this.fb.group({
        autoGeneratePayouts: [false],
        autoApproveThreshold: [100.00, [Validators.min(0)]],
        requireManualReview: [true],
        manualReviewThreshold: [500.00, [Validators.min(0)]]
      })
    });
  }

  async loadSettings() {
    try {
      // TODO: Load from API
      // const response = await this.http.get<any>(`${environment.apiUrl}/api/organizations/automation-settings`).toPromise();
      // if (response) {
      //   this.automationForm.patchValue(response);
      // }
    } catch (error) {
      console.error('Failed to load automation settings:', error);
    }
  }

  async onSave() {
    if (this.automationForm.invalid) return;

    this.saving.set(true);
    this.clearMessages();

    try {
      // TODO: Save to API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      this.successMessage.set('Automation settings saved successfully');
    } catch (error) {
      console.error('Failed to save automation settings:', error);
      this.errorMessage.set('Failed to save automation settings. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}