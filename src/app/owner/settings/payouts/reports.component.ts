import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="reports-section">
      <header class="settings-header">
        <h2>Reports & Statements</h2>
        <p>Configure statement generation, formatting, and delivery options</p>
      </header>

      <form [formGroup]="reportsForm" (ngSubmit)="onSave()">
        <!-- Report Configuration -->
        <section class="form-section" formGroupName="reports">
          <h3>Report Configuration</h3>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="autoGenerateStatements">
              <span class="checkmark"></span>
              Automatically generate payout statements
            </label>

            <label class="checkbox-label">
              <input type="checkbox" formControlName="includeItemDetails">
              <span class="checkmark"></span>
              Include item details in statements
            </label>

            <label class="checkbox-label">
              <input type="checkbox" formControlName="includeBranding">
              <span class="checkmark"></span>
              Include shop branding and logo
            </label>

            <label class="checkbox-label">
              <input type="checkbox" formControlName="pdfFormat">
              <span class="checkmark"></span>
              Generate statements in PDF format
            </label>

            <label class="checkbox-label">
              <input type="checkbox" formControlName="emailStatements">
              <span class="checkmark"></span>
              Email statements automatically
            </label>
          </div>
        </section>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="submit" [disabled]="!reportsForm.valid || saving()" class="btn-primary">
            {{ saving() ? 'Saving...' : 'Save Report Settings' }}
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
    .reports-section {
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
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
export class ReportsComponent implements OnInit {
  reportsForm!: FormGroup;
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
    this.reportsForm = this.fb.group({
      reports: this.fb.group({
        autoGenerateStatements: [true],
        includeItemDetails: [true],
        includeBranding: [true],
        pdfFormat: [true],
        emailStatements: [true]
      })
    });
  }

  async loadSettings() {
    try {
      // TODO: Load from API
      // const response = await this.http.get<any>(`${environment.apiUrl}/api/organizations/report-settings`).toPromise();
      // if (response) {
      //   this.reportsForm.patchValue(response);
      // }
    } catch (error) {
      console.error('Failed to load report settings:', error);
    }
  }

  async onSave() {
    if (this.reportsForm.invalid) return;

    this.saving.set(true);
    this.clearMessages();

    try {
      // TODO: Save to API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      this.successMessage.set('Report settings saved successfully');
    } catch (error) {
      console.error('Failed to save report settings:', error);
      this.errorMessage.set('Failed to save report settings. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}