import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PayoutSettingsService, PayoutSettingsDto, UpdatePayoutSettingsRequest } from '../../../services/payout-settings.service';

@Component({
  selector: 'app-payout-clearance-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payout-clearance-settings.component.html',
  styleUrls: ['./payout-clearance-settings.component.scss']
})
export class PayoutClearanceSettingsComponent implements OnInit {
  settingsForm!: FormGroup;
  settings = signal<PayoutSettingsDto | null>(null);
  loading = signal(false);
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  hasChanges = computed(() => {
    if (!this.settings() || !this.settingsForm) return false;
    return this.settingsForm.dirty;
  });

  constructor(
    private fb: FormBuilder,
    private payoutSettingsService: PayoutSettingsService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadSettings();
  }

  private initForm() {
    this.settingsForm = this.fb.group({
      // Clearance days for customer payment methods
      clearanceDaysCash: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
      clearanceDaysDebitCard: [1, [Validators.required, Validators.min(0), Validators.max(30)]],
      clearanceDaysCreditCard: [2, [Validators.required, Validators.min(0), Validators.max(30)]],
      clearanceDaysCheck: [7, [Validators.required, Validators.min(0), Validators.max(30)]],
      clearanceDaysStoreCredit: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
      clearanceDaysGiftCard: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
      clearanceDaysSquare: [2, [Validators.required, Validators.min(0), Validators.max(30)]],
      clearanceDaysVenmo: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
      clearanceDaysPayPal: [0, [Validators.required, Validators.min(0), Validators.max(30)]],
      clearanceDaysOther: [3, [Validators.required, Validators.min(0), Validators.max(30)]],

      // Minimum thresholds for owner-to-consignor payment methods
      minimumPayoutCheck: [25.00, [Validators.required, Validators.min(0), Validators.max(10000)]],
      minimumPayoutCash: [25.00, [Validators.required, Validators.min(0), Validators.max(10000)]],
      minimumPayoutVenmo: [0.00, [Validators.required, Validators.min(0), Validators.max(10000)]],
      minimumPayoutPayPal: [0.00, [Validators.required, Validators.min(0), Validators.max(10000)]],
      minimumPayoutStoreCredit: [0.00, [Validators.required, Validators.min(0), Validators.max(10000)]],
      minimumPayoutBankTransfer: [0.00, [Validators.required, Validators.min(0), Validators.max(10000)]],
      minimumPayoutZelle: [0.00, [Validators.required, Validators.min(0), Validators.max(10000)]]
    });
  }

  async loadSettings() {
    this.loading.set(true);
    try {
      const settings = await this.payoutSettingsService.getPayoutSettings().toPromise();
      if (settings) {
        this.settings.set(settings);
        this.populateForm(settings);
      }
    } catch (error) {
      console.log('Using default payout settings (none exist yet)');
      // Form already has default values, no need to show error
    } finally {
      this.loading.set(false);
    }
  }

  private populateForm(settings: PayoutSettingsDto) {
    this.settingsForm.patchValue({
      clearanceDaysCash: settings.clearanceDaysCash,
      clearanceDaysDebitCard: settings.clearanceDaysDebitCard,
      clearanceDaysCreditCard: settings.clearanceDaysCreditCard,
      clearanceDaysCheck: settings.clearanceDaysCheck,
      clearanceDaysStoreCredit: settings.clearanceDaysStoreCredit,
      clearanceDaysGiftCard: settings.clearanceDaysGiftCard,
      clearanceDaysSquare: settings.clearanceDaysSquare,
      clearanceDaysVenmo: settings.clearanceDaysVenmo,
      clearanceDaysPayPal: settings.clearanceDaysPayPal,
      clearanceDaysOther: settings.clearanceDaysOther,
      minimumPayoutCheck: settings.minimumPayoutCheck,
      minimumPayoutCash: settings.minimumPayoutCash,
      minimumPayoutVenmo: settings.minimumPayoutVenmo,
      minimumPayoutPayPal: settings.minimumPayoutPayPal,
      minimumPayoutStoreCredit: settings.minimumPayoutStoreCredit,
      minimumPayoutBankTransfer: settings.minimumPayoutBankTransfer,
      minimumPayoutZelle: settings.minimumPayoutZelle
    });
    this.settingsForm.markAsPristine();
  }

  async onSave() {
    if (!this.settingsForm.valid) {
      this.showError('Please correct the validation errors before saving');
      return;
    }

    this.saving.set(true);
    try {
      const formValue = this.settingsForm.value;
      const request: UpdatePayoutSettingsRequest = {
        clearanceDaysCash: formValue.clearanceDaysCash,
        clearanceDaysDebitCard: formValue.clearanceDaysDebitCard,
        clearanceDaysCreditCard: formValue.clearanceDaysCreditCard,
        clearanceDaysCheck: formValue.clearanceDaysCheck,
        clearanceDaysStoreCredit: formValue.clearanceDaysStoreCredit,
        clearanceDaysGiftCard: formValue.clearanceDaysGiftCard,
        clearanceDaysSquare: formValue.clearanceDaysSquare,
        clearanceDaysVenmo: formValue.clearanceDaysVenmo,
        clearanceDaysPayPal: formValue.clearanceDaysPayPal,
        clearanceDaysOther: formValue.clearanceDaysOther,
        minimumPayoutCheck: formValue.minimumPayoutCheck,
        minimumPayoutCash: formValue.minimumPayoutCash,
        minimumPayoutVenmo: formValue.minimumPayoutVenmo,
        minimumPayoutPayPal: formValue.minimumPayoutPayPal,
        minimumPayoutStoreCredit: formValue.minimumPayoutStoreCredit,
        minimumPayoutBankTransfer: formValue.minimumPayoutBankTransfer,
        minimumPayoutZelle: formValue.minimumPayoutZelle
      };

      const updatedSettings = await this.payoutSettingsService.updatePayoutSettings(request).toPromise();
      if (updatedSettings) {
        this.settings.set(updatedSettings);
        this.settingsForm.markAsPristine();
        this.showSuccess('Payout clearance settings saved successfully');
      }
    } catch (error: any) {
      this.showError(error.message || 'Failed to save payout clearance settings');
    } finally {
      this.saving.set(false);
    }
  }

  onReset() {
    if (this.settings()) {
      this.populateForm(this.settings()!);
    } else {
      this.settingsForm.reset();
      this.initForm();
    }
    this.clearMessages();
  }

  onRestoreDefaults() {
    this.settingsForm.patchValue({
      clearanceDaysCash: 0,
      clearanceDaysDebitCard: 1,
      clearanceDaysCreditCard: 2,
      clearanceDaysCheck: 7,
      clearanceDaysStoreCredit: 0,
      clearanceDaysGiftCard: 0,
      clearanceDaysSquare: 2,
      clearanceDaysVenmo: 0,
      clearanceDaysPayPal: 0,
      clearanceDaysOther: 3,
      minimumPayoutCheck: 25.00,
      minimumPayoutCash: 25.00,
      minimumPayoutVenmo: 0.00,
      minimumPayoutPayPal: 0.00,
      minimumPayoutStoreCredit: 0.00,
      minimumPayoutBankTransfer: 0.00,
      minimumPayoutZelle: 0.00
    });
    this.settingsForm.markAsDirty();
    this.clearMessages();
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 8000);
  }

  private clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  getFieldError(fieldName: string): string | null {
    const field = this.settingsForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    }
    return null;
  }
}