import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SettingsService, ConsignorOnboardingSettings } from '../../../../services/settings.service';

@Component({
  selector: 'app-consignor-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './consignor-onboarding.component.html',
  styleUrls: ['./consignor-onboarding.component.scss']
})
export class ConsignorOnboardingComponent implements OnInit {
  settings = signal<ConsignorOnboardingSettings | null>(null);
  loading = signal(false);
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  showConfigureTermsModal = signal(false);
  tempAcknowledgeText = signal('');

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      this.loading.set(true);
      this.errorMessage.set('');

      const response = await this.settingsService.getConsignorOnboardingSettings();

      this.settings.set(response || {
        agreementRequirement: 'upload',
        agreementTemplateId: null,
        acknowledgeTermsText: null,
        approvalMode: 'auto'
      });

    } catch (error: any) {
      console.error('Error loading consignor onboarding settings:', error);
      this.errorMessage.set('Failed to load settings. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async saveSettings(): Promise<void> {
    const currentSettings = this.settings();
    if (!currentSettings) return;

    try {
      this.saving.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      const response = await this.settingsService.updateConsignorOnboardingSettings(currentSettings);

      this.settings.set(response);
      this.successMessage.set('Settings saved successfully');

      // Clear success message after 3 seconds
      setTimeout(() => this.successMessage.set(''), 3000);

    } catch (error: any) {
      console.error('Error saving consignor onboarding settings:', error);

      if (error.error?.error) {
        this.errorMessage.set(error.error.error);
      } else {
        this.errorMessage.set('Failed to save settings. Please try again.');
      }
    } finally {
      this.saving.set(false);
    }
  }

  onAgreementRequirementChange(value: 'none' | 'acknowledge' | 'upload'): void {
    const current = this.settings();
    if (!current) return;

    // Update the agreement requirement
    const updated = { ...current, agreementRequirement: value };

    // Validation Rule 1: If "none", approval mode must be "manual"
    if (value === 'none') {
      updated.approvalMode = 'manual';
    }

    this.settings.set(updated);
  }

  onApprovalModeChange(value: 'auto' | 'manual'): void {
    const current = this.settings();
    if (!current) return;

    this.settings.set({ ...current, approvalMode: value });
  }

  isAutoApprovalDisabled(): boolean {
    const current = this.settings();
    return current?.agreementRequirement === 'none';
  }

  showWarningPanel(): boolean {
    const current = this.settings();
    return current?.agreementRequirement === 'none';
  }

  openConfigureTermsModal(): void {
    const current = this.settings();
    this.tempAcknowledgeText.set(current?.acknowledgeTermsText || '');
    this.showConfigureTermsModal.set(true);
  }

  closeConfigureTermsModal(): void {
    this.showConfigureTermsModal.set(false);
    this.tempAcknowledgeText.set('');
  }

  saveConfigureTerms(): void {
    const current = this.settings();
    if (!current) return;

    this.settings.set({
      ...current,
      acknowledgeTermsText: this.tempAcknowledgeText()
    });

    this.closeConfigureTermsModal();
  }

}