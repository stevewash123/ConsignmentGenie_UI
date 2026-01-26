import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-automation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './automation.component.html',
  styleUrls: ['./automation.component.scss']
})
export class AutomationComponent implements OnInit {
  automationForm!: FormGroup;
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService
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
      await this.settingsService.loadBusinessSettings();
      const settings = this.settingsService.getCurrentBusinessSettings();
      if (settings?.payouts) {
        this.automationForm.patchValue({
          automation: {
            autoGeneratePayouts: settings.payouts.autoProcessing || false,
            autoApproveThreshold: 100.00,
            requireManualReview: true,
            manualReviewThreshold: 500.00
          }
        });
      }
    } catch (error) {
      console.error('Failed to load automation settings:', error);
    }
  }

  async onSave() {
    if (this.automationForm.invalid) return;

    this.saving.set(true);
    this.clearMessages();

    try {
      const formValue = this.automationForm.value;
      const payoutSettings = {
        autoProcessing: formValue.automation.autoGeneratePayouts
      };
      await this.settingsService.updateBusinessSettings({ payouts: payoutSettings });
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