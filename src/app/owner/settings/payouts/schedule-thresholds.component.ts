import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ScheduleThresholdSettings {
  schedule: {
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'manual';
    dayOfWeek?: number;
    dayOfMonth?: number;
    cutoffTime?: string;
    processingDays?: number;
  };
  thresholds: {
    minimumAmount?: number;
    holdPeriodDays?: number;
    carryoverEnabled?: boolean;
    earlyPayoutForTrusted?: boolean;
  };
}

@Component({
  selector: 'app-schedule-thresholds',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="schedule-thresholds-section">
      <header class="settings-header">
        <h2>Payout Schedule & Thresholds</h2>
        <p>Configure when and how payouts are calculated</p>
      </header>

      <form [formGroup]="settingsForm" (ngSubmit)="onSave()" class="settings-form">

        <!-- Payout Schedule -->
        <section class="form-section" formGroupName="schedule">
          <h3>Payout Schedule</h3>

          <div class="form-group">
            <label for="frequency">How often do you pay consignors?</label>
            <select id="frequency" formControlName="frequency" class="form-select" (change)="onFrequencyChange()">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="manual">Manual only (no automatic payouts)</option>
            </select>
          </div>

          <div class="form-group" *ngIf="settingsForm.get('schedule.frequency')?.value === 'weekly'">
            <label for="dayOfWeek">Day of week for payouts</label>
            <select id="dayOfWeek" formControlName="dayOfWeek" class="form-select">
              <option *ngFor="let day of weekDays" [value]="day.value">{{ day.label }}</option>
            </select>
            <span class="help-text">Recommended: Friday for weekend processing</span>
          </div>

          <div class="form-group" *ngIf="settingsForm.get('schedule.frequency')?.value === 'monthly'">
            <label for="dayOfMonth">Day of month for payouts</label>
            <select id="dayOfMonth" formControlName="dayOfMonth" class="form-select">
              <option *ngFor="let day of monthDays" [value]="day.value">{{ day.label }}</option>
            </select>
            <span class="help-text">Note: Payouts on 29-31 will occur on the last day of shorter months</span>
          </div>

          <div class="form-row" *ngIf="settingsForm.get('schedule.frequency')?.value !== 'manual'">
            <div class="form-group">
              <label for="cutoffTime">Daily cut-off time</label>
              <input id="cutoffTime" type="time" formControlName="cutoffTime" class="form-input">
              <span class="help-text">Sales after this time are included in the next payout cycle</span>
            </div>

            <div class="form-group">
              <label for="processingDays">Processing lead time (days)</label>
              <input id="processingDays" type="number" formControlName="processingDays"
                     class="form-input" min="0" max="30" step="1">
              <span class="help-text">Days between payout calculation and payment processing</span>
            </div>
          </div>
        </section>

        <!-- Minimum Thresholds -->
        <section class="form-section" formGroupName="thresholds">
          <h3>Payout Thresholds & Hold Periods</h3>

          <div class="form-group">
            <label for="minimumAmount">Minimum payout amount</label>
            <div class="input-with-prefix">
              <span class="input-prefix">$</span>
              <input id="minimumAmount" type="number" formControlName="minimumAmount"
                     class="form-input" min="0" max="10000" step="0.01" placeholder="25.00">
            </div>
            <span class="help-text">Consignors won't receive payouts until they reach this threshold</span>
          </div>

          <div class="form-group">
            <label for="holdPeriodDays">Hold period after sale (days)</label>
            <input id="holdPeriodDays" type="number" formControlName="holdPeriodDays"
                   class="form-input" min="0" max="90" step="1" placeholder="14">
            <span class="help-text">Buffer time for returns and refunds before funds are released</span>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="carryoverEnabled">
              <span class="checkmark"></span>
              Automatically carry over small amounts to next payout
            </label>
            <span class="help-text">When enabled, amounts below minimum will be saved for the next payout cycle</span>

            <label class="checkbox-label">
              <input type="checkbox" formControlName="earlyPayoutForTrusted">
              <span class="checkmark"></span>
              Allow early payouts for trusted consignors
            </label>
            <span class="help-text">Enables bypassing hold period for established consignors</span>
          </div>
        </section>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="submit" [disabled]="!settingsForm.valid || saving()" class="btn-primary">
            {{ saving() ? 'Saving...' : 'Save Settings' }}
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
    .schedule-thresholds-section {
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
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-select, .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
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
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      cursor: pointer;
    }
    .checkmark {
      width: 1rem;
      height: 1rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      margin-top: 0.125rem;
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
export class ScheduleThresholdsComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  settingsForm: FormGroup;
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  weekDays = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' }
  ];

  monthDays = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}${this.getOrdinalSuffix(i + 1)}`
  }));

  constructor() {
    this.settingsForm = this.fb.group({
      schedule: this.fb.group({
        frequency: ['weekly', Validators.required],
        dayOfWeek: [5], // Default to Friday
        dayOfMonth: [1],
        cutoffTime: ['18:00'],
        processingDays: [1]
      }),
      thresholds: this.fb.group({
        minimumAmount: [25.00],
        holdPeriodDays: [14],
        carryoverEnabled: [true],
        earlyPayoutForTrusted: [false]
      })
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  onFrequencyChange() {
    // Additional logic when frequency changes
  }

  async loadSettings() {
    // TODO: Load from API
  }

  async onSave() {
    if (this.settingsForm.invalid) return;

    this.saving.set(true);
    this.clearMessages();

    try {
      // TODO: Save to API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      this.successMessage.set('Schedule and threshold settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.errorMessage.set('Failed to save settings. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  private getOrdinalSuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  private clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}