import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ConsignorDefaults {
  defaultSplitPercent: number;
  consignmentPeriodDays: number;
  retrievalPeriodDays: number;
  unsoldItemPolicy: string;
}

interface ConsignorAgreementSettings {
  autoSendAgreementOnRegistration: boolean;
  requireAgreementBeforeItems: boolean;
  agreementTemplateCustomized: boolean; // Read-only
}

interface ConsignorSettings extends ConsignorDefaults, ConsignorAgreementSettings {}

@Component({
  selector: 'app-consignor-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './consignor-settings.component.html'
})
export class ConsignorSettingsComponent implements OnInit {
  activeTab = signal<'defaults' | 'agreements'>('defaults');
  settings = signal<ConsignorSettings | null>(null);
  defaultsForm!: FormGroup;
  agreementsForm!: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  readonly unsoldItemPolicyOptions = [
    { value: 'become property of the shop', label: 'Become property of the shop' },
    { value: 'must be picked up by consignor', label: 'Must be picked up by consignor' },
    { value: 'donated to charity', label: 'Donated to charity' },
    { value: 'discarded at shop discretion', label: 'Discarded at shop discretion' }
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.loadSettings();
  }

  private initializeForms() {
    this.defaultsForm = this.fb.group({
      defaultSplitPercent: [60, [Validators.required, Validators.min(1), Validators.max(99)]],
      consignmentPeriodDays: [90, [Validators.required, Validators.min(1), Validators.max(365)]],
      retrievalPeriodDays: [14, [Validators.required, Validators.min(1), Validators.max(90)]],
      unsoldItemPolicy: ['become property of the shop', [Validators.required]]
    });

    this.agreementsForm = this.fb.group({
      autoSendAgreementOnRegistration: [false],
      requireAgreementBeforeItems: [false]
    });
  }

  async loadSettings() {
    this.isLoading.set(true);
    try {
      const response = await this.http.get<ConsignorSettings>(
        `${environment.apiUrl}/api/owner/settings/consignors`
      ).toPromise();

      if (response) {
        this.settings.set(response);
        this.updateForms(response);
      }
    } catch (error) {
      console.error('Error loading consignor settings:', error);

      // Fallback to mock data for development
      const mockSettings: ConsignorSettings = {
        defaultSplitPercent: 60,
        consignmentPeriodDays: 90,
        retrievalPeriodDays: 14,
        unsoldItemPolicy: 'become property of the shop',
        autoSendAgreementOnRegistration: false,
        requireAgreementBeforeItems: false,
        agreementTemplateCustomized: false
      };

      this.settings.set(mockSettings);
      this.updateForms(mockSettings);
      this.showError('Using default settings. API endpoint not yet implemented.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private updateForms(settings: ConsignorSettings) {
    this.defaultsForm.patchValue({
      defaultSplitPercent: settings.defaultSplitPercent,
      consignmentPeriodDays: settings.consignmentPeriodDays,
      retrievalPeriodDays: settings.retrievalPeriodDays,
      unsoldItemPolicy: settings.unsoldItemPolicy
    });

    this.agreementsForm.patchValue({
      autoSendAgreementOnRegistration: settings.autoSendAgreementOnRegistration,
      requireAgreementBeforeItems: settings.requireAgreementBeforeItems
    });
  }

  setActiveTab(tab: 'defaults' | 'agreements') {
    this.activeTab.set(tab);
  }

  async saveDefaults() {
    if (this.defaultsForm.invalid) {
      this.showError('Please fix the validation errors before saving.');
      return;
    }

    this.isSaving.set(true);
    try {
      const formData = this.defaultsForm.value;
      const currentSettings = this.settings();

      if (currentSettings) {
        const updatedSettings = { ...currentSettings, ...formData };

        const response = await this.http.put<ConsignorSettings>(
          `${environment.apiUrl}/api/owner/settings/consignors`,
          updatedSettings
        ).toPromise();

        if (response) {
          this.settings.set(response);
          this.showSuccess('Default settings saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving defaults:', error);
      this.showError('Failed to save default settings. API endpoint not yet implemented.');

      // Update local state for development
      const currentSettings = this.settings();
      if (currentSettings) {
        this.settings.set({ ...currentSettings, ...this.defaultsForm.value });
        this.showSuccess('Default settings updated locally (development mode)');
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  async saveAgreements() {
    if (this.agreementsForm.invalid) {
      this.showError('Please fix the validation errors before saving.');
      return;
    }

    this.isSaving.set(true);
    try {
      const formData = this.agreementsForm.value;
      const currentSettings = this.settings();

      if (currentSettings) {
        const updatedSettings = { ...currentSettings, ...formData };

        const response = await this.http.put<ConsignorSettings>(
          `${environment.apiUrl}/api/owner/settings/consignors`,
          updatedSettings
        ).toPromise();

        if (response) {
          this.settings.set(response);
          this.showSuccess('Agreement settings saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving agreement settings:', error);
      this.showError('Failed to save agreement settings. API endpoint not yet implemented.');

      // Update local state for development
      const currentSettings = this.settings();
      if (currentSettings) {
        this.settings.set({ ...currentSettings, ...this.agreementsForm.value });
        this.showSuccess('Agreement settings updated locally (development mode)');
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  editTemplate() {
    // TODO: Navigate to template editor when implemented
    this.showSuccess('Template editor not yet implemented');
  }

  downloadTemplate() {
    // TODO: Download template when implemented
    this.showSuccess('Template download not yet implemented');
  }

  getAgreementFlowStatus(): 'configured' | 'template-not-ready' | 'not-configured' {
    const settings = this.settings();
    if (!settings) return 'not-configured';

    if (settings.autoSendAgreementOnRegistration && settings.requireAgreementBeforeItems) {
      return settings.agreementTemplateCustomized ? 'configured' : 'template-not-ready';
    }

    return 'not-configured';
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}