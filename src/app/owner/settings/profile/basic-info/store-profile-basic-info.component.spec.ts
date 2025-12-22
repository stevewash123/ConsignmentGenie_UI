import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StoreProfileBasicInfoComponent } from './store-profile-basic-info.component';
import { environment } from '../../../../../environments/environment';

describe('StoreProfileBasicInfoComponent', () => {
  let component: StoreProfileBasicInfoComponent;
  let fixture: ComponentFixture<StoreProfileBasicInfoComponent>;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/organization/profile`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreProfileBasicInfoComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [FormBuilder]
    }).compileComponents();

    fixture = TestBed.createComponent(StoreProfileBasicInfoComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * Helper function to flush the initial GET request triggered by ngOnInit
   */
  function flushInitialLoad(mockData: any = null) {
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

  it('should initialize form with validators', () => {
    fixture.detectChanges();
    flushInitialLoad();

    const form = component.basicInfoForm;
    expect(form).toBeDefined();

    // Test required fields
    expect(form.get('storeName')?.hasError('required')).toBe(true);
    expect(form.get('contact.phone')?.hasError('required')).toBe(true);
    expect(form.get('contact.email')?.hasError('required')).toBe(true);
    expect(form.get('address.street1')?.hasError('required')).toBe(true);
    expect(form.get('address.city')?.hasError('required')).toBe(true);
    expect(form.get('address.state')?.hasError('required')).toBe(true);
    expect(form.get('address.zipCode')?.hasError('required')).toBe(true);
  });

  it('should load profile data on init', fakeAsync(() => {
    const mockProfile = {
      ShopName: 'Test Shop',
      ShopDescription: 'A test shop',
      ShopPhone: '555-123-4567',
      ShopEmail: 'test@shop.com',
      ShopWebsite: 'https://testshop.com',
      ShopAddress1: '123 Main St',
      ShopAddress2: 'Suite 100',
      ShopCity: 'Test City',
      ShopState: 'TX',
      ShopZip: '12345'
    };

    fixture.detectChanges();
    flushInitialLoad(mockProfile);
    tick();

    // Verify form is populated
    expect(component.basicInfoForm.get('storeName')?.value).toBe('Test Shop');
    expect(component.basicInfoForm.get('description')?.value).toBe('A test shop');
    expect(component.basicInfoForm.get('contact.phone')?.value).toBe('555-123-4567');
    expect(component.basicInfoForm.get('contact.email')?.value).toBe('test@shop.com');
    expect(component.basicInfoForm.get('contact.website')?.value).toBe('https://testshop.com');
    expect(component.basicInfoForm.get('address.street1')?.value).toBe('123 Main St');
    expect(component.basicInfoForm.get('address.street2')?.value).toBe('Suite 100');
    expect(component.basicInfoForm.get('address.city')?.value).toBe('Test City');
    expect(component.basicInfoForm.get('address.state')?.value).toBe('TX');
    expect(component.basicInfoForm.get('address.zipCode')?.value).toBe('12345');
  }));

  it('should validate phone number format', () => {
    fixture.detectChanges();
    flushInitialLoad();

    const phoneControl = component.basicInfoForm.get('contact.phone');

    // Valid phone numbers
    phoneControl?.setValue('555-123-4567');
    expect(phoneControl?.hasError('pattern')).toBe(false);

    phoneControl?.setValue('(555) 123-4567');
    expect(phoneControl?.hasError('pattern')).toBe(false);

    phoneControl?.setValue('5551234567');
    expect(phoneControl?.hasError('pattern')).toBe(false);

    // Invalid phone numbers
    phoneControl?.setValue('invalid');
    expect(phoneControl?.hasError('pattern')).toBe(true);

    phoneControl?.setValue('123');
    expect(phoneControl?.hasError('pattern')).toBe(true);
  });

  it('should validate email format', () => {
    fixture.detectChanges();
    flushInitialLoad();

    const emailControl = component.basicInfoForm.get('contact.email');

    // Valid emails
    emailControl?.setValue('test@example.com');
    expect(emailControl?.hasError('email')).toBe(false);

    // Invalid emails
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBe(true);
  });

  it('should validate website URL format', () => {
    fixture.detectChanges();
    flushInitialLoad();

    const websiteControl = component.basicInfoForm.get('contact.website');

    // Valid URLs
    websiteControl?.setValue('https://example.com');
    expect(websiteControl?.hasError('pattern')).toBe(false);

    websiteControl?.setValue('http://example.com');
    expect(websiteControl?.hasError('pattern')).toBe(false);

    // Invalid URLs
    websiteControl?.setValue('not-a-url');
    expect(websiteControl?.hasError('pattern')).toBe(true);
  });

  it('should validate ZIP code format', () => {
    fixture.detectChanges();
    flushInitialLoad();

    const zipControl = component.basicInfoForm.get('address.zipCode');

    // Valid ZIP codes
    zipControl?.setValue('12345');
    expect(zipControl?.hasError('pattern')).toBe(false);

    zipControl?.setValue('12345-6789');
    expect(zipControl?.hasError('pattern')).toBe(false);

    // Invalid ZIP codes
    zipControl?.setValue('1234');
    expect(zipControl?.hasError('pattern')).toBe(true);

    zipControl?.setValue('invalid');
    expect(zipControl?.hasError('pattern')).toBe(true);
  });

  it('should calculate character count correctly', () => {
    fixture.detectChanges();
    flushInitialLoad();

    component.basicInfoForm.get('storeName')?.setValue('Test Store');
    expect(component.getCharacterCount('storeName')).toBe(10);

    component.basicInfoForm.get('description')?.setValue('This is a test description');
    expect(component.getCharacterCount('description')).toBe(26);
  });

  it('should enforce character limits', () => {
    fixture.detectChanges();
    flushInitialLoad();

    const longStoreName = 'a'.repeat(101); // Exceeds 100 character limit
    component.basicInfoForm.get('storeName')?.setValue(longStoreName);
    expect(component.basicInfoForm.get('storeName')?.hasError('maxlength')).toBe(true);

    const longDescription = 'a'.repeat(501); // Exceeds 500 character limit
    component.basicInfoForm.get('description')?.setValue(longDescription);
    expect(component.basicInfoForm.get('description')?.hasError('maxlength')).toBe(true);
  });

  it('should save form data successfully', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    // Fill form with valid data
    component.basicInfoForm.patchValue({
      storeName: 'Test Store',
      description: 'Test description',
      contact: {
        phone: '555-123-4567',
        email: 'test@store.com',
        website: 'https://teststore.com'
      },
      address: {
        street1: '123 Main St',
        street2: 'Suite 100',
        city: 'Test City',
        state: 'TX',
        zipCode: '12345',
        showPublicly: true
      }
    });

    component.onSave();
    tick();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('PUT');

    const expectedData = {
      ShopName: 'Test Store',
      ShopDescription: 'Test description',
      ShopPhone: '555-123-4567',
      ShopEmail: 'test@store.com',
      ShopWebsite: 'https://teststore.com',
      ShopAddress1: '123 Main St',
      ShopAddress2: 'Suite 100',
      ShopCity: 'Test City',
      ShopState: 'TX',
      ShopZip: '12345'
    };

    expect(req.request.body).toEqual(expectedData);
    req.flush({});
    tick();

    expect(component.successMessage()).toBe('Basic information saved successfully');
  }));

  it('should not save invalid form', () => {
    fixture.detectChanges();
    flushInitialLoad();

    // Leave required fields empty
    component.onSave();

    // No PUT request should be made (only the initial GET was made)
    httpMock.expectNone(req => req.method === 'PUT');

    // Form should be marked as touched
    expect(component.basicInfoForm.get('storeName')?.touched).toBe(true);
  });

  it('should handle save errors', fakeAsync(() => {
    fixture.detectChanges();
    flushInitialLoad();
    tick();

    // Fill form with valid data
    component.basicInfoForm.patchValue({
      storeName: 'Test Store',
      description: 'Test description',
      contact: {
        phone: '555-123-4567',
        email: 'test@store.com',
        website: 'https://teststore.com'
      },
      address: {
        street1: '123 Main St',
        street2: '',
        city: 'Test City',
        state: 'TX',
        zipCode: '12345',
        showPublicly: true
      }
    });

    component.onSave();
    tick();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('PUT');
    req.error(new ErrorEvent('Network error'));
    tick();

    expect(component.errorMessage()).toBe('Failed to save basic information');
  }));

  it('should display preview message', () => {
    fixture.detectChanges();
    flushInitialLoad();

    component.onPreview();
    expect(component.successMessage()).toBe('Preview functionality will be implemented in a future update');
  });

  it('should clear messages after timeout', fakeAsync(() => {
    component['showSuccess']('Test message');
    expect(component.successMessage()).toBe('Test message');

    tick(5100);
    expect(component.successMessage()).toBe('');
  }));
});