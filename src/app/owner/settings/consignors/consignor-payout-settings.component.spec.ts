import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsignorPayoutSettingsComponent } from './consignor-payout-settings.component';
import { PayoutSettings, DEFAULT_PAYOUT_SETTINGS } from '../../../models/payout-settings.model';
import { environment } from '../../../../environments/environment';

fdescribe('ConsignorPayoutSettingsComponent', () => {
  let component: ConsignorPayoutSettingsComponent;
  let fixture: ComponentFixture<ConsignorPayoutSettingsComponent>;
  let httpMock: HttpTestingController;

  const mockPayoutSettings: PayoutSettings = {
    schedule: {
      frequency: 'weekly',
      dayOfWeek: 5,
      cutoffTime: '17:00',
      processingDays: 2
    },
    thresholds: {
      minimumAmount: 25.00,
      holdPeriodDays: 14,
      carryoverEnabled: true,
      earlyPayoutForTrusted: false
    },
    paymentMethods: {
      defaultMethod: 'check',
      availableMethods: [
        { method: 'check', enabled: true, displayName: 'Check (by mail)' },
        { method: 'cash', enabled: true, displayName: 'Cash (pickup)' },
        { method: 'store_credit', enabled: true, displayName: 'Store Credit' },
        { method: 'ach', enabled: false, displayName: 'Bank Transfer (ACH)' }
      ],
      checkMailingEnabled: true,
      achIntegrationEnabled: false,
      cashPickupEnabled: true,
      storeCreditEnabled: true
    },
    fees: {
      processingFeePaidBy: 'shop',
      feesByMethod: {
        check: 0.00,
        ach: 0.50,
        cash: 0.00,
        store_credit: 0.00
      },
      feeDisclosureEnabled: true
    },
    automation: {
      autoGeneratePayouts: false,
      autoApproveThreshold: 100.00,
      requireManualReview: true,
      manualReviewThreshold: 500.00
    },
    notifications: {
      notifyConsignorOnCalculation: true,
      notifyConsignorOnPayment: true,
      notifyOwnerOnFailure: true,
      emailStatementsEnabled: true,
      printStatementsEnabled: false,
      statementRetentionDays: 730
    },
    reports: {
      autoGenerateStatements: true,
      includeItemDetails: true,
      includeBranding: true,
      pdfFormat: true,
      emailStatements: true
    },
    lastUpdated: new Date('2025-01-01'),
    organizationId: 'test-org'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ConsignorPayoutSettingsComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsignorPayoutSettingsComponent);
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

    const form = component.payoutForm;
    expect(form.get('schedule.frequency')?.value).toBe('weekly');
    expect(form.get('thresholds.minimumAmount')?.value).toBe(25.00);
    expect(form.get('paymentMethods.defaultMethod')?.value).toBe('check');
    expect(form.get('automation.autoGeneratePayouts')?.value).toBe(false);
  });

  it('should load existing settings on init', async () => {
    component.ngOnInit();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPayoutSettings);

    expect(component.settings()).toEqual(mockPayoutSettings);
    expect(component.payoutForm.get('schedule.frequency')?.value).toBe('weekly');
    expect(component.payoutForm.get('thresholds.minimumAmount')?.value).toBe(25.00);
  });

  it('should handle missing settings gracefully and use defaults', async () => {
    component.ngOnInit();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    req.error(new ProgressEvent('error'), { status: 404 });

    // Should use default settings without error
    expect(component.errorMessage()).toBe('');
    expect(component.payoutForm.get('schedule.frequency')?.value).toBe('weekly');
    expect(component.payoutForm.get('thresholds.minimumAmount')?.value).toBe(25.00);
  });

  it('should save payout settings', async () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    await component.onSave();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(jasmine.objectContaining({
      schedule: jasmine.any(Object),
      thresholds: jasmine.any(Object),
      paymentMethods: jasmine.any(Object),
      fees: jasmine.any(Object),
      automation: jasmine.any(Object),
      notifications: jasmine.any(Object),
      reports: jasmine.any(Object),
      lastUpdated: jasmine.any(Date)
    }));
    req.flush({});

    expect(component.successMessage()).toBe('Payout settings saved successfully');
    expect(component.saving()).toBe(false);
  });

  it('should handle save error', async () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    await component.onSave();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    req.error(new ProgressEvent('error'));

    expect(component.errorMessage()).toBe('Failed to save payout settings');
    expect(component.saving()).toBe(false);
  });

  it('should update day selectors when frequency changes', () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    const form = component.payoutForm;

    // Change to monthly
    form.get('schedule.frequency')?.setValue('monthly');
    component.onFrequencyChange();

    expect(form.get('schedule.dayOfMonth')?.value).toBe(1);
    expect(form.get('schedule.dayOfWeek')?.value).toBeNull();

    // Change to weekly
    form.get('schedule.frequency')?.setValue('weekly');
    component.onFrequencyChange();

    expect(form.get('schedule.dayOfWeek')?.value).toBe(5);
    expect(form.get('schedule.dayOfMonth')?.value).toBeNull();
  });

  it('should toggle payment methods correctly', () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    // Test toggling check method
    component.onPaymentMethodToggle(0, false); // Disable check method

    const methodsArray = component.paymentMethodsArray;
    expect(methodsArray.at(0).get('enabled')?.value).toBe(false);
    expect(component.payoutForm.get('paymentMethods.checkMailingEnabled')?.value).toBe(false);
  });

  it('should validate that at least one payment method is enabled', () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    // Disable all payment methods
    const methodsArray = component.paymentMethodsArray;
    for (let i = 0; i < methodsArray.length; i++) {
      component.onPaymentMethodToggle(i, false);
    }

    expect(component.errorMessage()).toBe('At least one payment method must be enabled');
  });

  it('should validate form before saving with invalid data', async () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    // Make form invalid by setting negative minimum amount
    const form = component.payoutForm;
    form.patchValue({
      thresholds: {
        minimumAmount: -10
      }
    });

    await component.onSave();

    expect(component.errorMessage()).toBe('Please correct the validation errors before saving');
    httpMock.expectNone(`${environment.apiUrl}/api/organizations/payout-settings`);
  });

  it('should validate processing days limits', () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    const form = component.payoutForm;

    // Test minimum validation
    form.get('schedule.processingDays')?.setValue(-1);
    expect(form.get('schedule.processingDays')?.valid).toBe(false);

    // Test maximum validation
    form.get('schedule.processingDays')?.setValue(31);
    expect(form.get('schedule.processingDays')?.valid).toBe(false);

    // Test valid value
    form.get('schedule.processingDays')?.setValue(3);
    expect(form.get('schedule.processingDays')?.valid).toBe(true);
  });

  it('should validate hold period days limits', () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    const form = component.payoutForm;

    // Test minimum validation
    form.get('thresholds.holdPeriodDays')?.setValue(-1);
    expect(form.get('thresholds.holdPeriodDays')?.valid).toBe(false);

    // Test maximum validation
    form.get('thresholds.holdPeriodDays')?.setValue(91);
    expect(form.get('thresholds.holdPeriodDays')?.valid).toBe(false);

    // Test valid value
    form.get('thresholds.holdPeriodDays')?.setValue(14);
    expect(form.get('thresholds.holdPeriodDays')?.valid).toBe(true);
  });

  it('should validate minimum payout amount limits', () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    const form = component.payoutForm;

    // Test minimum validation
    form.get('thresholds.minimumAmount')?.setValue(-1);
    expect(form.get('thresholds.minimumAmount')?.valid).toBe(false);

    // Test maximum validation
    form.get('thresholds.minimumAmount')?.setValue(10001);
    expect(form.get('thresholds.minimumAmount')?.valid).toBe(false);

    // Test valid value
    form.get('thresholds.minimumAmount')?.setValue(25);
    expect(form.get('thresholds.minimumAmount')?.valid).toBe(true);
  });

  it('should show automation options when auto-generate is enabled', () => {
    fixture.detectChanges();

    const form = component.payoutForm;
    expect(form.get('automation.autoGeneratePayouts')?.value).toBe(false);

    // Enable auto-generate payouts
    form.get('automation.autoGeneratePayouts')?.setValue(true);
    fixture.detectChanges();

    // Check that automation options are now available
    const autoApproveInput = fixture.nativeElement.querySelector('#autoApproveThreshold');
    expect(autoApproveInput).toBeTruthy();
  });

  it('should properly initialize payment methods array', () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    const methodsArray = component.paymentMethodsArray;
    expect(methodsArray.length).toBe(4);

    // Check that all default payment methods are present
    const methods = methodsArray.controls.map(control => control.get('method')?.value);
    expect(methods).toContain('check');
    expect(methods).toContain('cash');
    expect(methods).toContain('store_credit');
    expect(methods).toContain('ach');
  });

  it('should clear messages after timeout', (done) => {
    component['showSuccess']('Test success');
    expect(component.successMessage()).toBe('Test success');

    setTimeout(() => {
      expect(component.successMessage()).toBe('');
      done();
    }, 5100);
  });

  it('should compute form errors correctly', () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/payout-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    const form = component.payoutForm;

    // Make form invalid
    form.patchValue({
      thresholds: {
        minimumAmount: -10,
        holdPeriodDays: 100
      }
    });

    const errors = component.formErrors();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(error => error.includes('positive'))).toBe(true);
    expect(errors.some(error => error.includes('90 days'))).toBe(true);
  });
});