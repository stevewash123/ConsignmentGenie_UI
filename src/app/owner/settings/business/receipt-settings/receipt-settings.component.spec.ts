import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReceiptSettingsComponent, ReceiptSettings } from './receipt-settings.component';
import { environment } from '../../../../../environments/environment';

describe('ReceiptSettingsComponent', () => {
  let component: ReceiptSettingsComponent;
  let fixture: ComponentFixture<ReceiptSettingsComponent>;
  let httpMock: HttpTestingController;

  const mockReceiptSettings: ReceiptSettings = {
    header: {
      includeLogo: true,
      showStoreInfo: true,
      showAddress: true,
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h'
    },
    content: {
      layoutStyle: 'detailed',
      showItemDescriptions: true,
      descriptionLength: 50,
      showTaxBreakdown: true,
      showPaymentMethod: true
    },
    footer: {
      customMessage: 'Thank you for shopping with us!',
      includeReturnPolicy: false,
      includeWebsite: true
    },
    digital: {
      autoEmailReceipts: false,
      emailFormat: 'html',
      promptForEmail: false,
      emailSubject: 'Your receipt from [Store Name]',
      includePromoContent: false
    },
    print: {
      autoPrint: true,
      printerWidth: 80,
      copies: 1,
      printDensity: 'medium',
      logoSize: 'medium'
    },
    lastUpdated: new Date('2025-01-01')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReceiptSettingsComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiptSettingsComponent);
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

    const form = component.receiptForm();
    expect(form.get('header.includeLogo')?.value).toBe(true);
    expect(form.get('content.layoutStyle')?.value).toBe('detailed');
    expect(form.get('print.autoPrint')?.value).toBe(true);
  });

  it('should load existing settings on init', async () => {
    component.ngOnInit();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/receipt-settings`);
    expect(req.request.method).toBe('GET');
    req.flush(mockReceiptSettings);

    expect(component.settings()).toEqual(mockReceiptSettings);
  });

  it('should handle missing settings gracefully', async () => {
    component.ngOnInit();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/receipt-settings`);
    req.error(new ProgressEvent('error'), { status: 404 });

    // Should not show error message for missing settings
    expect(component.errorMessage()).toBe('');
  });

  it('should save receipt settings', async () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/receipt-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    await component.onSave();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/receipt-settings`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(jasmine.objectContaining({
      header: jasmine.any(Object),
      content: jasmine.any(Object),
      footer: jasmine.any(Object),
      digital: jasmine.any(Object),
      print: jasmine.any(Object),
      lastUpdated: jasmine.any(Date)
    }));
    req.flush({});

    expect(component.successMessage()).toBe('Receipt settings saved successfully');
    expect(component.saving()).toBe(false);
  });

  it('should handle save error', async () => {
    component.ngOnInit();

    // Skip the initial load request
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/api/organizations/receipt-settings`);
    loadReq.error(new ProgressEvent('error'), { status: 404 });

    await component.onSave();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/organizations/receipt-settings`);
    req.error(new ProgressEvent('error'));

    expect(component.errorMessage()).toBe('Failed to save receipt settings');
    expect(component.saving()).toBe(false);
  });

  it('should compute character counts correctly', () => {
    const form = component.receiptForm();

    form.patchValue({
      footer: {
        customMessage: 'Test message',
        returnPolicyText: 'Return policy'
      },
      digital: {
        promoContent: 'Promo content'
      }
    });

    expect(component.customMessageLength()).toBe(12);
    expect(component.returnPolicyLength()).toBe(13);
    expect(component.promoContentLength()).toBe(13);
  });

  it('should show preview message', () => {
    component.previewReceipt();
    expect(component.successMessage()).toContain('Receipt preview would open here');
  });

  it('should validate form before saving', async () => {
    // Make form invalid by exceeding character limits
    const form = component.receiptForm();
    form.patchValue({
      footer: {
        customMessage: 'x'.repeat(201) // Exceeds 200 character limit
      }
    });

    await component.onSave();

    expect(component.errorMessage()).toBe('Please correct the validation errors before saving');
    httpMock.expectNone(`${environment.apiUrl}/api/organizations/receipt-settings`);
  });
});