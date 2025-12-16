import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReceiptSettingsComponent, ReceiptSettings } from './receipt-settings.component';
import { environment } from '../../../../../environments/environment';

describe('ReceiptSettingsComponent', () => {
  let component: ReceiptSettingsComponent;
  let fixture: ComponentFixture<ReceiptSettingsComponent>;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/organizations/receipt-settings`;

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
      ],
      providers: [
        FormBuilder
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiptSettingsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * Helper function to flush the initial GET request triggered by ngOnInit
   */
  function flushInitialLoad(mockData: ReceiptSettings | null = null) {
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    if (mockData) {
      req.flush(mockData);
    } else {
      req.error(new ProgressEvent('error'), { status: 404 });
    }
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    fixture.detectChanges();
    flushInitialLoad();

    const form = component.receiptForm();
    expect(form).toBeTruthy();
    expect(form!.get('header.includeLogo')?.value).toBe(true);
    expect(form!.get('content.layoutStyle')?.value).toBe('detailed');
    expect(form!.get('print.autoPrint')?.value).toBe(true);
  });

  it('should load existing settings on init', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad(mockReceiptSettings);
    tick();

    expect(component.settings()).toEqual(mockReceiptSettings);
  }));

  it('should handle missing settings gracefully', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    // Should not show error message for missing settings
    expect(component.errorMessage()).toBe('');
  }));

  it('should save receipt settings', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    // Start save operation (don't await - we need to flush the request)
    component.onSave();
    tick();

    const req = httpMock.expectOne(apiUrl);
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
    tick();

    expect(component.successMessage()).toBe('Receipt settings saved successfully');
    expect(component.saving()).toBe(false);
  }));

  it('should handle save error', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    // Start save operation
    component.onSave();
    tick();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('PUT');
    req.error(new ProgressEvent('error'));
    tick();

    expect(component.errorMessage()).toBe('Failed to save receipt settings');
    expect(component.saving()).toBe(false);
  }));

  it('should compute character counts correctly', () => {
    const form = component.receiptForm();
    expect(form).toBeTruthy();

    form!.patchValue({
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

  it('should validate form before saving', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    // Make form invalid by exceeding character limits
    const form = component.receiptForm();
    form!.patchValue({
      footer: {
        customMessage: 'x'.repeat(201) // Exceeds 200 character limit
      }
    });

    component.onSave();
    tick();

    expect(component.errorMessage()).toBe('Please correct the validation errors before saving');
    // No PUT request should be made
    httpMock.expectNone(req => req.method === 'PUT');
  }));

  it('should populate form when settings are loaded', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad(mockReceiptSettings);
    tick();

    const form = component.receiptForm();
    expect(form!.get('footer.customMessage')?.value).toBe('Thank you for shopping with us!');
    expect(form!.get('header.dateFormat')?.value).toBe('MM/dd/yyyy');
    expect(form!.get('print.printerWidth')?.value).toBe(80);
  }));

  it('should clear success message after timeout', fakeAsync(() => {
    component['showSuccess']('Test message');
    expect(component.successMessage()).toBe('Test message');

    tick(5100);
    expect(component.successMessage()).toBe('');
  }));

  it('should clear error message after timeout', fakeAsync(() => {
    component['showError']('Test error');
    expect(component.errorMessage()).toBe('Test error');

    tick(5100);
    expect(component.errorMessage()).toBe('');
  }));
});