import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PayoutSettingsService } from '../../../services/payout-settings.service';
import { ScheduleThresholdSettings } from '../../../models/payout-settings.model';

@Component({
  selector: 'app-schedule-thresholds',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './schedule-thresholds.component.html',
  styleUrls: ['./schedule-thresholds.component.scss']
})
export class ScheduleThresholdsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private payoutSettingsService = inject(PayoutSettingsService);

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
    try {
      await this.payoutSettingsService.loadPayoutSettings();
      const payoutSettings = this.payoutSettingsService.getCurrentPayoutSettings();
      if (payoutSettings?.scheduleThresholds) {
        this.settingsForm.patchValue(payoutSettings.scheduleThresholds);
      }
    } catch (error) {
      console.log('Using default schedule threshold settings');
    }
  }

  async onSave() {
    if (this.settingsForm.invalid) return;

    this.saving.set(true);
    this.clearMessages();

    try {
      const currentSettings = this.payoutSettingsService.getCurrentPayoutSettings();
      if (currentSettings) {
        const formValue = this.settingsForm.value;
        const updatedSettings = {
          ...currentSettings,
          scheduleThresholds: formValue,
          lastUpdated: new Date()
        };
        await this.payoutSettingsService.updatePayoutSettings(updatedSettings);
      }
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