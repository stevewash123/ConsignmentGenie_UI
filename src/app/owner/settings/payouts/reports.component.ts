import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PayoutSettingsService } from '../../../services/payout-settings.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  reportsForm!: FormGroup;
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private payoutSettingsService: PayoutSettingsService
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
      await this.payoutSettingsService.loadPayoutSettings();
      const settings = this.payoutSettingsService.getCurrentPayoutSettings();
      if (settings?.reports) {
        this.reportsForm.patchValue({
          reports: settings.reports
        });
      }
    } catch (error) {
      console.error('Failed to load report settings:', error);
    }
  }

  async onSave() {
    if (this.reportsForm.invalid) return;

    this.saving.set(true);
    this.clearMessages();

    try {
      const currentSettings = this.payoutSettingsService.getCurrentPayoutSettings();
      if (currentSettings) {
        const formValue = this.reportsForm.value;
        const updatedSettings = {
          ...currentSettings,
          reports: formValue.reports,
          lastUpdated: new Date()
        };
        await this.payoutSettingsService.updatePayoutSettings(updatedSettings);
      }
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