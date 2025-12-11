import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaxSettingsComponent } from './tax-settings.component';
import { environment } from '../../../../environments/environment';

describe('TaxSettingsComponent', () => {
  let component: TaxSettingsComponent;
  let fixture: ComponentFixture<TaxSettingsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxSettingsComponent, ReactiveFormsModule, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TaxSettingsComponent);
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

    expect(component.taxForm).toBeDefined();
    expect(component.taxForm.get('collectionEnabled')?.value).toBe(true);
    expect(component.taxForm.get('rates.defaultRate')?.value).toBe(0);
    expect(component.taxForm.get('rates.isInclusive')?.value).toBe(false);
    expect(component.taxForm.get('calculation.applyToCommission')?.value).toBe('before');
    expect(component.taxForm.get('reporting.period')?.value).toBe('monthly');
  });

  it('should load tax settings from API on init', () => {
    const mockTaxSettings = {
      collection: { enabled: true },
      rates: { defaultRate: 0.0825, isInclusive: false, effectiveDate: new Date() },
      display: { showBreakdownOnReceipt: true, showTaxIdOnReceipt: false, lineItemTax: false },
      business: { taxId: '12-3456789', stateTaxId: 'TX123456', taxIdVerified: false },
      calculation: { applyToCommission: 'before', exemptCategories: [] },
      reporting: { period: 'quarterly', autoGenerate: true, exportFormat: 'pdf' },
      lastUpdated: new Date()
    };

    component.ngOnInit();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organization/tax-settings`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTaxSettings);

    // Verify form is populated with API data
    expect(component.taxForm.get('collectionEnabled')?.value).toBe(true);
    expect(component.taxForm.get('rates.defaultRate')?.value).toBe(8.25); // Converted to percentage
    expect(component.taxForm.get('rates.isInclusive')?.value).toBe(false);
    expect(component.taxForm.get('business.taxId')?.value).toBe('12-3456789');
    expect(component.taxForm.get('reporting.period')?.value).toBe('quarterly');
  });

  it('should handle API error when loading tax settings', () => {
    spyOn(console, 'log');
    component.ngOnInit();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organization/tax-settings`);
    req.error(new ErrorEvent('Network error'));

    expect(console.log).toHaveBeenCalledWith('Using default tax settings');
  });

  it('should calculate tax correctly', () => {
    component.ngOnInit();
    component.taxForm.get('rates.defaultRate')?.setValue(8.25);

    const tax = component.calculateTax(100);
    expect(tax).toBe('8.25');
  });

  it('should calculate total with tax correctly', () => {
    component.ngOnInit();
    component.taxForm.get('rates.defaultRate')?.setValue(8.25);

    const total = component.calculateTotal(100);
    expect(total).toBe('108.25');
  });

  it('should calculate included tax correctly', () => {
    component.ngOnInit();
    component.taxForm.get('rates.defaultRate')?.setValue(8.25);

    const includedTax = component.calculateIncludedTax(100);
    expect(includedTax).toBe('7.62');
  });

  it('should validate tax rate within limits', () => {
    component.ngOnInit();
    const rateControl = component.taxForm.get('rates.defaultRate');

    // Valid rate
    rateControl?.setValue(8.25);
    expect(rateControl?.hasError('min')).toBe(false);
    expect(rateControl?.hasError('max')).toBe(false);

    // Rate too low
    rateControl?.setValue(-1);
    expect(rateControl?.hasError('min')).toBe(true);

    // Rate too high
    rateControl?.setValue(101);
    expect(rateControl?.hasError('max')).toBe(true);
  });

  it('should save tax settings successfully', async () => {
    component.ngOnInit();

    // Fill form with valid data
    component.taxForm.patchValue({
      collectionEnabled: true,
      rates: {
        defaultRate: 8.25,
        isInclusive: false
      },
      business: {
        taxId: '12-3456789',
        stateTaxId: 'TX123456',
        showTaxIdOnReceipts: true
      },
      display: {
        showBreakdownOnReceipt: true,
        lineItemTax: false
      },
      calculation: {
        applyToCommission: 'before'
      },
      reporting: {
        period: 'monthly',
        autoGenerate: false,
        exportFormat: 'csv'
      }
    });

    component.onSave();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organization/tax-settings`);
    expect(req.request.method).toBe('PUT');

    const expectedData = req.request.body;
    expect(expectedData.collection.enabled).toBe(true);
    expect(expectedData.rates.defaultRate).toBe(0.0825); // Converted to decimal
    expect(expectedData.rates.isInclusive).toBe(false);
    expect(expectedData.business.taxId).toBe('12-3456789');
    expect(expectedData.business.stateTaxId).toBe('TX123456');
    expect(expectedData.display.showTaxIdOnReceipt).toBe(true);

    req.flush({});

    expect(component.successMessage()).toBe('Tax settings saved successfully');
    expect(component.saving()).toBe(false);
  });

  it('should not save invalid form', () => {
    component.ngOnInit();

    // Make form invalid by setting tax rate out of bounds
    component.taxForm.get('rates.defaultRate')?.setValue(-1);

    component.onSave();

    // No HTTP request should be made
    httpMock.expectNone(`${environment.apiUrl}/api/organization/tax-settings`);

    expect(component.errorMessage()).toBe('Please correct the form errors before saving');
  });

  it('should handle save errors', () => {
    component.ngOnInit();

    // Fill form with valid data
    component.taxForm.patchValue({
      collectionEnabled: true,
      rates: { defaultRate: 8.25, isInclusive: false },
      business: { taxId: '12-3456789' }
    });

    component.onSave();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organization/tax-settings`);
    req.error(new ErrorEvent('Network error'));

    expect(component.errorMessage()).toBe('Failed to save tax settings. Please try again.');
    expect(component.saving()).toBe(false);
  });

  it('should show preview message', () => {
    component.previewTaxCalculation();
    expect(component.successMessage()).toBe('Tax calculation preview is displayed above for a $100 item');
  });

  it('should clear messages after timeout', (done) => {
    component['showSuccess']('Test message');
    expect(component.successMessage()).toBe('Test message');

    setTimeout(() => {
      expect(component.successMessage()).toBe('');
      done();
    }, 5100);
  });

  it('should show compliance warning when tax collection is disabled', () => {
    component.ngOnInit();
    fixture.detectChanges();

    // Enable tax collection initially
    component.taxForm.get('collectionEnabled')?.setValue(true);
    fixture.detectChanges();

    let warningElement = fixture.nativeElement.querySelector('.compliance-warning');
    expect(warningElement).toBeFalsy();

    // Disable tax collection
    component.taxForm.get('collectionEnabled')?.setValue(false);
    fixture.detectChanges();

    warningElement = fixture.nativeElement.querySelector('.compliance-warning');
    expect(warningElement).toBeTruthy();
    expect(warningElement.textContent).toContain('Important:');
  });

  it('should hide tax rate section when collection is disabled', () => {
    component.ngOnInit();
    fixture.detectChanges();

    // Disable tax collection
    component.taxForm.get('collectionEnabled')?.setValue(false);
    fixture.detectChanges();

    const taxRatesSection = fixture.nativeElement.querySelector('[formGroupName="rates"]');
    expect(taxRatesSection).toBeFalsy();
  });

  it('should show tax rate section when collection is enabled', () => {
    component.ngOnInit();
    fixture.detectChanges();

    // Enable tax collection
    component.taxForm.get('collectionEnabled')?.setValue(true);
    fixture.detectChanges();

    const taxRatesSection = fixture.nativeElement.querySelector('[formGroupName="rates"]');
    expect(taxRatesSection).toBeTruthy();
  });

  it('should update calculation preview when tax rate changes', () => {
    component.ngOnInit();
    fixture.detectChanges();

    // Set tax rate
    component.taxForm.get('rates.defaultRate')?.setValue(10);
    fixture.detectChanges();

    const previewSection = fixture.nativeElement.querySelector('.calculation-preview');
    expect(previewSection.textContent).toContain('10');
    expect(previewSection.textContent).toContain('$10.00');
  });
});