import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule, FormArray } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PoliciesComponent, BusinessPolicies } from './policies.component';
import { environment } from '../../../../../environments/environment';

describe('PoliciesComponent', () => {
  let component: PoliciesComponent;
  let fixture: ComponentFixture<PoliciesComponent>;
  let httpMock: HttpTestingController;

  const mockPolicies: BusinessPolicies = {
    storeHours: {
      schedule: {
        Monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        Tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        Wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        Thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        Friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        Saturday: { isOpen: true, openTime: '10:00', closeTime: '16:00' },
        Sunday: { isOpen: false }
      },
      timezone: 'EST'
    },
    appointments: {
      required: false,
      walkInsAccepted: true,
      leadTimeHours: 24,
      bookingInstructions: 'Call us to schedule'
    },
    returns: {
      periodDays: 30,
      requiresReceipt: true,
      acceptsExchanges: true,
      storeCreditOnly: false,
      conditions: 'Items must be in original condition'
    },
    payments: {
      acceptedMethods: ['cash', 'credit'],
      layawayAvailable: false,
      pricingPolicy: 'All sales final'
    },
    consignorPolicies: {
      itemAcceptanceCriteria: 'Gently used items only',
      conditionRequirements: 'Clean and odor-free'
    },
    customerService: {
      responseTimeHours: 24,
      preferredContact: 'email'
    },
    safety: {
      healthRequirements: 'Masks encouraged'
    },
    lastUpdated: new Date('2025-01-01')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PoliciesComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PoliciesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    component.ngOnInit();

    const form = component.policiesForm();
    expect(form.get('storeHours.timezone')?.value).toBe('EST');
    expect(form.get('appointments.required')?.value).toBe(false);
    expect(form.get('returns.periodDays')?.value).toBe(30);
    expect(form.get('customerService.responseTimeHours')?.value).toBe(24);

    // Check that weekdays are initialized as open, Sunday as closed
    expect(form.get('storeHours.schedule.Monday.isOpen')?.value).toBe(true);
    expect(form.get('storeHours.schedule.Sunday.isOpen')?.value).toBe(false);

    // Check payment methods array
    const methodsArray = form.get('payments.acceptedMethods') as FormArray;
    expect(methodsArray.length).toBe(component.paymentMethods.length);
  });

  it('should load existing policies on init', async () => {
    component.ngOnInit();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/business-policies`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPolicies);

    expect(component.policies()).toEqual(mockPolicies);
  });

  it('should handle missing policies gracefully', async () => {
    component.ngOnInit();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/business-policies`);
    req.error(new ProgressEvent('error'), { status: 404 });

    // Should not show error message for missing policies
    expect(component.errorMessage()).toBe('');
  });

  it('should save business policies', async () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/business-policies`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    await component.onSave();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/business-policies`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(jasmine.objectContaining({
      storeHours: jasmine.any(Object),
      appointments: jasmine.any(Object),
      returns: jasmine.any(Object),
      payments: jasmine.any(Object),
      consignorPolicies: jasmine.any(Object),
      customerService: jasmine.any(Object),
      safety: jasmine.any(Object),
      lastUpdated: jasmine.any(Date)
    }));
    req.flush({});

    expect(component.successMessage()).toBe('Business policies saved successfully');
    expect(component.saving()).toBe(false);
  });

  it('should handle save error', async () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/business-policies`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    await component.onSave();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/business-policies`);
    req.error(new ProgressEvent('error'));

    expect(component.errorMessage()).toBe('Failed to save business policies');
    expect(component.saving()).toBe(false);
  });

  it('should format hours correctly', () => {
    const form = component.policiesForm();
    form.get('storeHours.schedule.Monday.openTime')?.setValue('09:00');
    form.get('storeHours.schedule.Monday.closeTime')?.setValue('17:30');

    const formatted = component.formatHours('Monday');
    expect(formatted).toBe('9:00 AM - 5:30 PM');
  });

  it('should compute character counts correctly', () => {
    const form = component.policiesForm();

    form.patchValue({
      appointments: {
        bookingInstructions: 'Call us'
      },
      returns: {
        conditions: 'Must be clean'
      }
    });

    expect(component.bookingInstructionsLength()).toBe(7);
    expect(component.returnConditionsLength()).toBe(13);
  });

  it('should get selected payment methods', () => {
    const form = component.policiesForm();
    const methodsArray = form.get('payments.acceptedMethods') as FormArray;

    // Set cash and credit as selected
    methodsArray.at(0).setValue(true); // cash
    methodsArray.at(1).setValue(true); // credit
    methodsArray.at(2).setValue(false); // debit
    methodsArray.at(3).setValue(false); // check
    methodsArray.at(4).setValue(false); // mobile

    const selected = component.getSelectedPaymentMethods();
    expect(selected).toEqual(['cash', 'credit']);
  });

  it('should show preview message', () => {
    component.previewPolicies();
    expect(component.successMessage()).toContain('Customer policy preview would open here');
  });

  it('should validate form before saving', async () => {
    const form = component.policiesForm();
    form.patchValue({
      returns: {
        periodDays: -1 // Invalid value
      }
    });

    await component.onSave();

    expect(component.errorMessage()).toBe('Please correct the validation errors before saving');
    httpMock.expectNone(`${environment.apiUrl}/api/organizations/business-policies`);
  });

  it('should populate form with loaded policies', () => {
    component.policies.set(mockPolicies);
    component['populateForm'](mockPolicies);

    const form = component.policiesForm();
    expect(form.get('storeHours.timezone')?.value).toBe('EST');
    expect(form.get('appointments.required')?.value).toBe(false);
    expect(form.get('returns.periodDays')?.value).toBe(30);

    // Check schedule values
    expect(form.get('storeHours.schedule.Monday.isOpen')?.value).toBe(true);
    expect(form.get('storeHours.schedule.Sunday.isOpen')?.value).toBe(false);

    // Check payment methods
    const methodsArray = form.get('payments.acceptedMethods') as FormArray;
    expect(methodsArray.at(0).value).toBe(true); // cash
    expect(methodsArray.at(1).value).toBe(true); // credit
    expect(methodsArray.at(2).value).toBe(false); // debit
  });
});