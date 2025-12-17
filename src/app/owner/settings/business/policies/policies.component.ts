import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

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

export interface AppointmentSettings {
  required: boolean;
  walkInsAccepted: boolean;
  leadTimeHours: number;
  bookingInstructions?: string;
}

export interface ReturnSettings {
  periodDays: number;
  requiresReceipt: boolean;
  acceptsExchanges: boolean;
  storeCreditOnly: boolean;
  conditions?: string;
  exceptions?: string;
}

export interface PaymentSettings {
  acceptedMethods: string[];
  layawayAvailable: boolean;
  layawayTerms?: string;
  pricingPolicy?: string;
}

export interface ConsignorPolicySettings {
  itemAcceptanceCriteria?: string;
  brandRestrictions?: string;
  seasonalGuidelines?: string;
  conditionRequirements?: string;
}

export interface CustomerServiceSettings {
  responseTimeHours: number;
  preferredContact: 'phone' | 'email' | 'either';
  socialMediaGuidelines?: string;
}

export interface SafetySettings {
  healthRequirements?: string;
  capacityLimits?: string;
  specialProcedures?: string;
}

export interface BusinessPolicies {
  storeHours: StoreHoursSettings;
  appointments: AppointmentSettings;
  returns: ReturnSettings;
  payments: PaymentSettings;
  consignorPolicies: ConsignorPolicySettings;
  customerService: CustomerServiceSettings;
  safety: SafetySettings;
  lastUpdated: Date;
}

@Component({
  selector: 'app-policies',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './policies.component.html',
  styleUrls: ['./policies.component.css']
})
export class PoliciesComponent implements OnInit {
  policiesForm = signal<FormGroup | null>(null); // Will be set up in constructor
  policies = signal<BusinessPolicies | null>(null);
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  readonly weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  readonly paymentMethods = ['cash', 'credit', 'debit', 'check', 'mobile'];

  // Character counting for text areas
  bookingInstructionsLength = computed(() => {
    const form = this.policiesForm();
    if (!form) return 0;
    const value = form.get('appointments.bookingInstructions')?.value || '';
    return value.length;
  });

  returnConditionsLength = computed(() => {
    const form = this.policiesForm();
    if (!form) return 0;
    const value = form.get('returns.conditions')?.value || '';
    return value.length;
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.policiesForm.set(this.createForm());
  }

  ngOnInit() {
    this.loadPolicies();
  }

  private createForm(): FormGroup {
    const form = this.fb.group({
      storeHours: this.fb.group({
        schedule: this.fb.group({}),
        timezone: ['EST']
      }),
      appointments: this.fb.group({
        required: [false],
        walkInsAccepted: [true],
        leadTimeHours: [24],
        bookingInstructions: ['', Validators.maxLength(300)]
      }),
      returns: this.fb.group({
        periodDays: [30, [Validators.min(0), Validators.max(365)]],
        requiresReceipt: [true],
        acceptsExchanges: [true],
        storeCreditOnly: [false],
        conditions: ['', Validators.maxLength(500)],
        exceptions: ['', Validators.maxLength(300)]
      }),
      payments: this.fb.group({
        acceptedMethods: this.fb.array([]),
        layawayAvailable: [false],
        layawayTerms: ['', Validators.maxLength(300)],
        pricingPolicy: ['', Validators.maxLength(300)]
      }),
      consignorPolicies: this.fb.group({
        itemAcceptanceCriteria: ['', Validators.maxLength(500)],
        brandRestrictions: ['', Validators.maxLength(300)],
        seasonalGuidelines: ['', Validators.maxLength(300)],
        conditionRequirements: ['', Validators.maxLength(300)]
      }),
      customerService: this.fb.group({
        responseTimeHours: [24],
        preferredContact: ['either'],
        socialMediaGuidelines: ['', Validators.maxLength(300)]
      }),
      safety: this.fb.group({
        healthRequirements: ['', Validators.maxLength(300)],
        capacityLimits: ['', Validators.maxLength(200)],
        specialProcedures: ['', Validators.maxLength(400)]
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
      methodsArray.push(this.fb.control(method === 'cash' || method === 'credit'));
    });

    return form;
  }

  async loadPolicies() {
    try {
      const response = await this.http.get<BusinessPolicies>(`${environment.apiUrl}/api/organizations/business-policies`).toPromise();
      if (response) {
        this.policies.set(response);
        this.populateForm(response);
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

    form.patchValue({
      storeHours: {
        schedule: scheduleControls,
        timezone: policies.storeHours.timezone
      },
      appointments: policies.appointments,
      returns: policies.returns,
      payments: {
        layawayAvailable: policies.payments.layawayAvailable,
        layawayTerms: policies.payments.layawayTerms,
        pricingPolicy: policies.payments.pricingPolicy
      },
      consignorPolicies: policies.consignorPolicies,
      customerService: policies.customerService,
      safety: policies.safety
    });

    // Update payment methods checkboxes
    const methodsArray = form.get('payments.acceptedMethods') as FormArray;
    this.paymentMethods.forEach((method, index) => {
      methodsArray.at(index).setValue(policies.payments.acceptedMethods.includes(method));
    });
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

  async onSave() {
    const form = this.policiesForm();
    if (!form) return;

    if (form.invalid) {
      this.showError('Please correct the validation errors before saving');
      return;
    }

    const formValue = form.value;

    // Build schedule object
    const schedule: any = {};
    this.weekDays.forEach(day => {
      schedule[day] = {
        isOpen: formValue.storeHours.schedule[day].isOpen,
        openTime: formValue.storeHours.schedule[day].isOpen ? formValue.storeHours.schedule[day].openTime : undefined,
        closeTime: formValue.storeHours.schedule[day].isOpen ? formValue.storeHours.schedule[day].closeTime : undefined
      };
    });

    const businessPolicies: BusinessPolicies = {
      storeHours: {
        schedule,
        timezone: formValue.storeHours.timezone
      },
      appointments: formValue.appointments,
      returns: formValue.returns,
      payments: {
        ...formValue.payments,
        acceptedMethods: this.getSelectedPaymentMethods()
      },
      consignorPolicies: formValue.consignorPolicies,
      customerService: formValue.customerService,
      safety: formValue.safety,
      lastUpdated: new Date()
    };

    this.saving.set(true);
    try {
      await this.http.put(`${environment.apiUrl}/api/organizations/business-policies`, businessPolicies).toPromise();
      this.policies.set(businessPolicies);
      this.showSuccess('Business policies saved successfully');
    } catch (error) {
      this.showError('Failed to save business policies');
    } finally {
      this.saving.set(false);
    }
  }

  previewPolicies() {
    // For now, just show a message that this would open a preview
    this.showSuccess('Customer policy preview would open here (feature coming soon)');
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