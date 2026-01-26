import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { SettingsService } from '../../../services/settings.service';
import { PayoutSettings, PayoutMethodOption, DEFAULT_PAYOUT_SETTINGS, validatePayoutSettings } from '../../../models/payout-settings.model';

@Component({
  selector: 'app-consignor-payout-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consignor-payout-settings.component.html',
  styleUrls: ['./consignor-payout-settings.component.css']
})
export class ConsignorPayoutSettingsComponent implements OnInit {
  payoutForm!: FormGroup;
  settings = signal<PayoutSettings | null>(null);
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Form validation state
  formErrors = computed(() => {
    if (!this.payoutForm || this.payoutForm.valid) return [];

    const settings = this.buildSettingsFromForm();
    if (!settings) return [];

    const validation = validatePayoutSettings(settings);
    return validation.errors;
  });

  // Available days for different frequencies
  weekDays = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' }
  ];

  monthDays = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: (i + 1).toString()
  }));

  // Available payment methods
  allPaymentMethods: PayoutMethodOption[] = [
    {
      method: 'check',
      enabled: true,
      displayName: 'Check (by mail)',
      description: 'Physical checks mailed to consignor address'
    },
    {
      method: 'cash',
      enabled: true,
      displayName: 'Cash (pickup)',
      description: 'Cash payment for pickup at store'
    },
    {
      method: 'store_credit',
      enabled: true,
      displayName: 'Store Credit',
      description: 'Credit applied to consignor account for future purchases'
    },
    {
      method: 'ach',
      enabled: false,
      displayName: 'Bank Transfer (ACH)',
      description: 'Direct deposit to consignor bank account (requires integration)'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadSettings();
  }

  private initForm() {
    this.payoutForm = this.fb.group({
      // Schedule settings
      schedule: this.fb.group({
        frequency: ['weekly', [Validators.required]],
        dayOfWeek: [5], // Friday default
        dayOfMonth: [1],
        biweeklyDays: [[]],
        cutoffTime: ['17:00', [Validators.required]],
        processingDays: [2, [Validators.required, Validators.min(0), Validators.max(30)]]
      }),

      // Threshold settings
      thresholds: this.fb.group({
        minimumAmount: [25.00, [Validators.required, Validators.min(0), Validators.max(10000)]],
        holdPeriodDays: [14, [Validators.required, Validators.min(0), Validators.max(90)]],
        carryoverEnabled: [true],
        earlyPayoutForTrusted: [false]
      }),

      // Payment method settings
      paymentMethods: this.fb.group({
        defaultMethod: ['check', [Validators.required]],
        availableMethods: this.fb.array([]),
        checkMailingEnabled: [true],
        achIntegrationEnabled: [false],
        cashPickupEnabled: [true],
        storeCreditEnabled: [true]
      }),

      // Fee structure
      fees: this.fb.group({
        processingFeePaidBy: ['shop', [Validators.required]],
        feesByMethod: this.fb.group({
          check: [0.00, [Validators.min(0)]],
          ach: [0.50, [Validators.min(0)]],
          cash: [0.00, [Validators.min(0)]],
          store_credit: [0.00, [Validators.min(0)]]
        }),
        feeDisclosureEnabled: [true]
      }),

      // Automation settings
      automation: this.fb.group({
        autoGeneratePayouts: [false],
        autoApproveThreshold: [100.00, [Validators.min(0)]],
        requireManualReview: [true],
        manualReviewThreshold: [500.00, [Validators.min(0)]]
      }),

      // Notification settings
      notifications: this.fb.group({
        notifyConsignorOnCalculation: [true],
        notifyConsignorOnPayment: [true],
        notifyOwnerOnFailure: [true],
        emailStatementsEnabled: [true],
        printStatementsEnabled: [false],
        statementRetentionDays: [730, [Validators.min(30), Validators.max(2555)]] // 30 days to 7 years
      }),

      // Report configuration
      reports: this.fb.group({
        autoGenerateStatements: [true],
        includeItemDetails: [true],
        includeBranding: [true],
        pdfFormat: [true],
        emailStatements: [true]
      })
    });

    this.initPaymentMethodsArray();
  }

  private initPaymentMethodsArray() {
    const methodsArray = this.payoutForm.get('paymentMethods.availableMethods') as FormArray;
    methodsArray.clear();

    this.allPaymentMethods.forEach(method => {
      methodsArray.push(this.fb.group({
        method: [method.method],
        enabled: [method.enabled],
        displayName: [method.displayName],
        description: [method.description]
      }));
    });
  }

  get paymentMethodsArray(): FormArray {
    return this.payoutForm.get('paymentMethods.availableMethods') as FormArray;
  }

  async loadSettings() {
    try {
      await this.settingsService.loadPayoutSettings();
      const settings = this.settingsService.getCurrentPayoutSettings();
      if (settings) {
        this.settings.set(settings);
        this.populateForm(settings);
      } else {
        // Use default settings if none exist
        const defaultSettings = { ...DEFAULT_PAYOUT_SETTINGS } as PayoutSettings;
        defaultSettings.lastUpdated = new Date();
        defaultSettings.organizationId = 'current';
        this.populateForm(defaultSettings);
      }
    } catch (error) {
      // If settings don't exist, use defaults - no error message needed
      console.log('Using default payout settings');
      const defaultSettings = { ...DEFAULT_PAYOUT_SETTINGS } as PayoutSettings;
      defaultSettings.lastUpdated = new Date();
      defaultSettings.organizationId = 'current';
      this.populateForm(defaultSettings);
    }
  }

  private populateForm(settings: PayoutSettings) {
    this.payoutForm.patchValue({
      schedule: settings.schedule,
      thresholds: settings.thresholds,
      paymentMethods: {
        defaultMethod: settings.paymentMethods.defaultMethod,
        checkMailingEnabled: settings.paymentMethods.checkMailingEnabled,
        achIntegrationEnabled: settings.paymentMethods.achIntegrationEnabled,
        cashPickupEnabled: settings.paymentMethods.cashPickupEnabled,
        storeCreditEnabled: settings.paymentMethods.storeCreditEnabled
      },
      fees: settings.fees,
      automation: settings.automation,
      notifications: settings.notifications,
      reports: settings.reports
    });

    // Update payment methods array
    if (settings.paymentMethods.availableMethods) {
      const methodsArray = this.paymentMethodsArray;
      settings.paymentMethods.availableMethods.forEach((method, index) => {
        if (methodsArray.at(index)) {
          methodsArray.at(index).patchValue(method);
        }
      });
    }
  }

  private buildSettingsFromForm(): PayoutSettings | null {
    if (!this.payoutForm.valid) return null;

    const formValue = this.payoutForm.value;

    return {
      schedule: formValue.schedule,
      thresholds: formValue.thresholds,
      paymentMethods: {
        ...formValue.paymentMethods,
        availableMethods: formValue.paymentMethods.availableMethods
      },
      fees: formValue.fees,
      automation: formValue.automation,
      notifications: formValue.notifications,
      reports: formValue.reports,
      lastUpdated: new Date(),
      organizationId: this.settings()?.organizationId || 'current'
    };
  }

  async onSave() {
    if (!this.payoutForm.valid) {
      this.showError('Please correct the validation errors before saving');
      return;
    }

    const settings = this.buildSettingsFromForm();
    if (!settings) {
      this.showError('Unable to build settings from form data');
      return;
    }

    // Validate settings
    const validation = validatePayoutSettings(settings);
    if (!validation.isValid) {
      this.showError('Settings validation failed: ' + validation.errors.join(', '));
      return;
    }

    this.saving.set(true);
    try {
      await this.settingsService.updatePayoutSettings(settings);
      this.settings.set(settings);
    } catch (error) {
      this.showError('Failed to save payout settings');
    } finally {
      this.saving.set(false);
    }
  }

  onFrequencyChange() {
    const frequency = this.payoutForm.get('schedule.frequency')?.value;

    // Reset conditional fields when frequency changes
    if (frequency !== 'weekly') {
      this.payoutForm.get('schedule.dayOfWeek')?.setValue(null);
    }
    if (frequency !== 'monthly') {
      this.payoutForm.get('schedule.dayOfMonth')?.setValue(null);
    }
    if (frequency !== 'biweekly') {
      this.payoutForm.get('schedule.biweeklyDays')?.setValue([]);
    }

    // Set appropriate defaults
    if (frequency === 'weekly') {
      this.payoutForm.get('schedule.dayOfWeek')?.setValue(5); // Friday
    } else if (frequency === 'monthly') {
      this.payoutForm.get('schedule.dayOfMonth')?.setValue(1); // 1st of month
    }
  }

  onPaymentMethodToggle(index: number, enabled: boolean) {
    const methodsArray = this.paymentMethodsArray;
    const method = methodsArray.at(index);
    method.get('enabled')?.setValue(enabled);

    // Update corresponding capability flags
    const methodType = method.get('method')?.value;
    if (methodType === 'check') {
      this.payoutForm.get('paymentMethods.checkMailingEnabled')?.setValue(enabled);
    } else if (methodType === 'ach') {
      this.payoutForm.get('paymentMethods.achIntegrationEnabled')?.setValue(enabled);
    } else if (methodType === 'cash') {
      this.payoutForm.get('paymentMethods.cashPickupEnabled')?.setValue(enabled);
    } else if (methodType === 'store_credit') {
      this.payoutForm.get('paymentMethods.storeCreditEnabled')?.setValue(enabled);
    }

    // Validate that at least one method is enabled
    this.validatePaymentMethods();
  }

  private validatePaymentMethods() {
    const methodsArray = this.paymentMethodsArray;
    const enabledMethods = methodsArray.controls.filter(control => control.get('enabled')?.value);

    if (enabledMethods.length === 0) {
      this.showError('At least one payment method must be enabled');
      return false;
    }

    // Ensure default method is enabled
    const defaultMethod = this.payoutForm.get('paymentMethods.defaultMethod')?.value;
    const defaultMethodEnabled = methodsArray.controls.find(control =>
      control.get('method')?.value === defaultMethod && control.get('enabled')?.value
    );

    if (!defaultMethodEnabled) {
      this.showError('Default payment method must be enabled');
      return false;
    }

    return true;
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
}