import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { BusinessSettingsService } from '../../../../services/business-settings.service';
import { Subscription, debounceTime } from 'rxjs';

// Data model interfaces
export interface StoreHoursSettings {
  schedule: {
    [day: string]: {
      isOpen: boolean;
      openTime?: string;
      closeTime?: string;
    };
  };
  specialHours?: Array<{
    date: string;
    hours?: string;
    isClosed: boolean;
    note?: string;
  }>;
  timezone: string;
}


export interface ReturnSettings {
  returnPolicy: 'none' | 'days';
  periodDays: number;
  allowRefunds: boolean;
  allowExchanges: boolean;
  allowStoreCredit: boolean;
  receiptPolicy: 'required' | 'flexible';
  noReceiptStoreCreditOnly: boolean;
}

export interface PaymentSettings {
  acceptedMethods: string[];
  layawayAvailable: boolean;
  layawayTerms?: string;
}




export interface BusinessPolicies {
  storeHours: StoreHoursSettings;
  returns: ReturnSettings;
  payments: PaymentSettings;
  lastUpdated: Date;
}

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './policies.component.html',
  styleUrls: ['./policies.component.css']
})
export class PoliciesComponent implements OnInit, OnDestroy {
  policiesForm = signal<FormGroup | null>(null); // Will be set up in constructor
  policies = signal<BusinessPolicies | null>(null);
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  private formSubscription = new Subscription();

  readonly weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  readonly paymentMethods = ['cash', 'credit', 'debit', 'check', 'mobile'];

  // Character counting for text areas (removed consignorPoliciesLength)

  constructor(
    private fb: FormBuilder,
    private businessSettingsService: BusinessSettingsService
  ) {
    this.policiesForm.set(this.createForm());
  }

  ngOnInit() {
    this.loadPolicies();
    this.setupFormChangeListeners();
  }

  ngOnDestroy() {
    this.formSubscription.unsubscribe();
  }

  private setupFormChangeListeners() {
    const form = this.policiesForm();
    if (form) {
      // Listen to form changes and auto-save with debounce
      this.formSubscription.add(
        form.valueChanges
          .pipe(debounceTime(500)) // Wait 500ms after user stops making changes
          .subscribe(() => {
            if (form.valid && !this.saving()) {
              this.autoSave();
            }
          })
      );
    }
  }

  private async autoSave() {
    const form = this.policiesForm();
    if (!form || form.invalid) return;

    const formValue = form.value;
    const businessPolicies: BusinessPolicies = {
      storeHours: formValue.storeHours,
      returns: formValue.returns,
      payments: {
        acceptedMethods: this.paymentMethods.filter((_, index) =>
          formValue.payments.acceptedMethods[index]
        ),
        layawayAvailable: formValue.payments.layawayAvailable,
        layawayTerms: formValue.payments.layawayTerms
      },
      lastUpdated: new Date()
    };

    this.saving.set(true);
    try {
      await this.businessSettingsService.updateBusinessSettings({ policies: businessPolicies });
      this.policies.set(businessPolicies);
      this.showSuccess('Policies saved automatically');
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error for auto-save failures to avoid annoying the user
    } finally {
      this.saving.set(false);
    }
  }

  private createForm(): FormGroup {
    const form = this.fb.group({
      storeHours: this.fb.group({
        schedule: this.fb.group({}),
        timezone: ['EST']
      }),
      returns: this.fb.group({
        returnPolicy: ['days'],
        periodDays: [30, [Validators.min(1), Validators.max(365)]],
        allowRefunds: [true],
        allowExchanges: [true],
        allowStoreCredit: [true],
        receiptPolicy: ['required'],
        noReceiptStoreCreditOnly: [false]
      }),
      payments: this.fb.group({
        acceptedMethods: this.fb.array([]),
        layawayAvailable: [false],
        layawayTerms: ['', Validators.maxLength(300)]
      })
    });

    // Initialize schedule for each day
    const scheduleGroup = this.fb.group({});
    this.weekDays.forEach(day => {
      scheduleGroup.addControl(day, this.fb.group({
        isOpen: [day === 'Sunday' ? false : true],
        openTime: ['09:00'],
        closeTime: ['18:00']
      }));
    });
    (form.get('storeHours') as FormGroup).setControl('schedule', scheduleGroup);

    // Initialize payment methods
    const methodsArray = form.get('payments.acceptedMethods') as FormArray;
    this.paymentMethods.forEach(method => {
      // Set cash, credit, debit, and check to true by default
      const defaultValue = ['cash', 'credit', 'debit', 'check'].includes(method);
      methodsArray.push(this.fb.control(defaultValue));
    });

    // Set initial disabled state based on default returnPolicy value
    // Since default is 'days', periodDays should be enabled (which it already is)
    // This is mainly for consistency and if the default changes in the future
    setTimeout(() => {
      this.onReturnPolicyChange('days');
    }, 0);

    return form;
  }

  async loadPolicies() {
    try {
      await this.businessSettingsService.loadBusinessSettings();
      const businessSettings = this.businessSettingsService.getCurrentBusinessSettings();
      if (businessSettings?.policies) {
        this.policies.set(businessSettings.policies);
        this.populateForm(businessSettings.policies);
      }
    } catch (error) {
      // If policies don't exist, use defaults - no error message needed
      console.log('Using default business policies');
    }
  }

  private populateForm(policies: BusinessPolicies) {
    const form = this.policiesForm();

    // Populate store hours schedule
    const scheduleControls: any = {};
    this.weekDays.forEach(day => {
      const dayPolicy = policies.storeHours.schedule[day];
      scheduleControls[day] = {
        isOpen: dayPolicy?.isOpen ?? true,
        openTime: dayPolicy?.openTime ?? '09:00',
        closeTime: dayPolicy?.closeTime ?? '18:00'
      };
    });

    // Map legacy return settings to new structure
    const legacyReturns = policies.returns as any;
    const returnSettings = {
      returnPolicy: legacyReturns.noReturns ? 'none' : 'days',
      periodDays: legacyReturns.periodDays || 30,
      allowRefunds: !legacyReturns.storeCreditOnly,
      allowExchanges: legacyReturns.acceptsExchanges ?? true,
      allowStoreCredit: legacyReturns.storeCreditOnly ?? true,
      receiptPolicy: legacyReturns.requiresReceipt ? 'required' : 'flexible',
      noReceiptStoreCreditOnly: false
    };

    form.patchValue({
      storeHours: {
        schedule: scheduleControls,
        timezone: policies.storeHours.timezone
      },
      returns: returnSettings,
      payments: {
        layawayAvailable: policies.payments.layawayAvailable,
        layawayTerms: policies.payments.layawayTerms
      }
    });

    // Update payment methods checkboxes
    const methodsArray = form.get('payments.acceptedMethods') as FormArray;
    this.paymentMethods.forEach((method, index) => {
      methodsArray.at(index).setValue(policies.payments.acceptedMethods.includes(method));
    });

    // Set initial disabled state for periodDays based on return policy
    this.onReturnPolicyChange(returnSettings.returnPolicy);
  }

  formatHours(day: string): string {
    const form = this.policiesForm();
    const openTime = form.get(`storeHours.schedule.${day}.openTime`)?.value;
    const closeTime = form.get(`storeHours.schedule.${day}.closeTime`)?.value;

    if (openTime && closeTime) {
      return `${this.formatTime(openTime)} - ${this.formatTime(closeTime)}`;
    }
    return '';
  }

  private formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getSelectedPaymentMethods(): string[] {
    const form = this.policiesForm();
    if (!form) return [];
    const methodsArray = form.get('payments.acceptedMethods') as FormArray;
    const selected: string[] = [];
    this.paymentMethods.forEach((method, index) => {
      if (methodsArray.at(index).value) {
        selected.push(method);
      }
    });
    return selected;
  }


  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  onReturnPolicyChange(policy: string) {
    const form = this.policiesForm();
    if (form) {
      // Enable/disable period days based on policy
      const periodDaysControl = form.get('returns.periodDays');
      if (policy === 'none') {
        periodDaysControl?.disable();
      } else {
        periodDaysControl?.enable();
      }
    }
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}