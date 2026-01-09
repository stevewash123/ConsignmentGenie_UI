import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService, ConsignorOnboardingSettings } from '../../../../services/settings.service';

@Component({
  selector: 'app-consignor-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        agreementRequirement: 'none',
        agreementTemplateId: null,
        acknowledgeTermsText: null,
        approvalMode: 'manual'
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

  onTemplateUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.includes('pdf')) {
      this.errorMessage.set('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage.set('File size must be less than 10MB');
      return;
    }

    // TODO: Implement file upload to server and get template ID
    console.log('Template file selected:', file);
    this.errorMessage.set('Template upload functionality coming soon');
  }

  downloadCurrentTemplate(): void {
    const current = this.settings();
    if (!current?.agreementTemplateId) {
      this.errorMessage.set('No template available to download');
      return;
    }

    // TODO: Implement template download
    console.log('Download template:', current.agreementTemplateId);
    this.errorMessage.set('Template download functionality coming soon');
  }

  hasTemplate(): boolean {
    const current = this.settings();
    return !!current?.agreementTemplateId;
  }
}