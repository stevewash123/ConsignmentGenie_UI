import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, FormArray } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PoliciesComponent, BusinessPolicies } from './policies.component';
import { environment } from '../../../../../environments/environment';

describe('PoliciesComponent', () => {
  let component: PoliciesComponent;
  let fixture: ComponentFixture<PoliciesComponent>;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/organizations/business-policies`;

  const mockPolicies: BusinessPolicies = {
    storeHours: {
      schedule: {
        Monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        Tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        Wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        Thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        Friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        Saturday: { isOpen: true, openTime: '10:00', closeTime: '16:00' },
        Sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' }
      },
      timezone: 'EST'
    },
    returns: {
      noReturns: false,
      periodDays: 30,
      requiresReceipt: true,
      acceptsExchanges: true,
      storeCreditOnly: false
    },
    payments: {
      acceptedMethods: ['cash', 'credit'],
      layawayAvailable: false
    },
    consignorPolicies: {
      policies: 'We accept gently used items in good condition. No fast fashion brands.',
      notifyOnRegistration: true
    },
    lastUpdated: new Date('2025-01-01')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PoliciesComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ],
      providers: [FormBuilder]
    }).compileComponents();

    fixture = TestBed.createComponent(PoliciesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * Helper to initialize component and flush the initial GET request.
   * Use respondWith: null to simulate 404, or pass data to load.
   */
  function initializeComponent(respondWith: BusinessPolicies | null = null) {
    fixture.detectChanges(); // triggers ngOnInit -> loadPolicies()
    
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    
    if (respondWith) {
      req.flush(respondWith);
    } else {
      req.error(new ProgressEvent('error'), { status: 404 });
    }
    
    tick(); // resolve the promise from toPromise()
    fixture.detectChanges(); // update view with loaded data
  }

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have form initialized in constructor', () => {
      // Form should exist before detectChanges
      const form = component.policiesForm();
      expect(form).toBeTruthy();
    });

    it('should have weekDays array defined', () => {
      expect(component.weekDays).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
    });

    it('should have paymentMethods array defined', () => {
      expect(component.paymentMethods).toEqual(['cash', 'credit', 'debit', 'check', 'mobile']);
    });
  });

  describe('Form Initialization', () => {
    it('should initialize form with default timezone', () => {
      const form = component.policiesForm();
      expect(form?.get('storeHours.timezone')?.value).toBe('EST');
    });

    it('should initialize form with default return settings including noReturns', () => {
      const form = component.policiesForm();
      expect(form?.get('returns.noReturns')?.value).toBe(false);
      expect(form?.get('returns.periodDays')?.value).toBe(30);
      expect(form?.get('returns.requiresReceipt')?.value).toBe(true);
    });

    it('should initialize form with default consignor policy settings', () => {
      const form = component.policiesForm();
      expect(form?.get('consignorPolicies.policies')?.value).toBe('');
      expect(form?.get('consignorPolicies.notifyOnRegistration')?.value).toBe(false);
    });


    it('should initialize schedule with weekdays open and Sunday closed', () => {
      const form = component.policiesForm();
      expect(form?.get('storeHours.schedule.Monday.isOpen')?.value).toBe(true);
      expect(form?.get('storeHours.schedule.Tuesday.isOpen')?.value).toBe(true);
      expect(form?.get('storeHours.schedule.Sunday.isOpen')?.value).toBe(false);
    });

    it('should initialize payment methods array with correct length', () => {
      const form = component.policiesForm();
      const methodsArray = form?.get('payments.acceptedMethods') as FormArray;
      expect(methodsArray?.length).toBe(component.paymentMethods.length);
    });

    it('should have cash and credit selected by default', () => {
      const form = component.policiesForm();
      const methodsArray = form?.get('payments.acceptedMethods') as FormArray;
      expect(methodsArray?.at(0).value).toBe(true); // cash
      expect(methodsArray?.at(1).value).toBe(true); // credit
      expect(methodsArray?.at(2).value).toBe(false); // debit
    });
  });

  describe('Loading Policies', () => {
    it('should load existing policies on init', fakeAsync(() => {
      initializeComponent(mockPolicies);

      expect(component.policies()).toEqual(mockPolicies);
    }));

    it('should handle missing policies gracefully (404)', fakeAsync(() => {
      initializeComponent(null);

      // Should not show error message for missing policies
      expect(component.errorMessage()).toBe('');
      // Policies signal should remain null
      expect(component.policies()).toBeNull();
    }));

    it('should populate form with loaded policies', fakeAsync(() => {
      initializeComponent(mockPolicies);

      const form = component.policiesForm();
      expect(form?.get('storeHours.timezone')?.value).toBe('EST');
      expect(form?.get('returns.noReturns')?.value).toBe(false);
      expect(form?.get('returns.periodDays')?.value).toBe(30);
      expect(form?.get('consignorPolicies.policies')?.value).toBe('We accept gently used items in good condition. No fast fashion brands.');
      expect(form?.get('consignorPolicies.notifyOnRegistration')?.value).toBe(true);
    }));

    it('should update payment methods checkboxes from loaded policies', fakeAsync(() => {
      initializeComponent(mockPolicies);

      const form = component.policiesForm();
      const methodsArray = form?.get('payments.acceptedMethods') as FormArray;
      
      // mockPolicies has ['cash', 'credit'] as accepted methods
      expect(methodsArray?.at(0).value).toBe(true); // cash
      expect(methodsArray?.at(1).value).toBe(true); // credit
      expect(methodsArray?.at(2).value).toBe(false); // debit
      expect(methodsArray?.at(3).value).toBe(false); // check
      expect(methodsArray?.at(4).value).toBe(false); // mobile
    }));

    it('should update schedule from loaded policies', fakeAsync(() => {
      initializeComponent(mockPolicies);

      const form = component.policiesForm();
      expect(form?.get('storeHours.schedule.Monday.isOpen')?.value).toBe(true);
      expect(form?.get('storeHours.schedule.Monday.openTime')?.value).toBe('09:00');
      expect(form?.get('storeHours.schedule.Sunday.isOpen')?.value).toBe(false);
    }));
  });

  describe('Saving Policies', () => {
    it('should save business policies', fakeAsync(() => {
      initializeComponent(null);

      component.onSave();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(jasmine.objectContaining({
        storeHours: jasmine.any(Object),
        returns: jasmine.any(Object),
        payments: jasmine.any(Object),
        consignorPolicies: jasmine.any(Object),
        lastUpdated: jasmine.any(Date)
      }));
      req.flush({});
      tick();

      expect(component.successMessage()).toBe('Business policies saved successfully');
      expect(component.saving()).toBe(false);
    }));

    it('should handle save error', fakeAsync(() => {
      initializeComponent(null);

      component.onSave();

      const req = httpMock.expectOne(apiUrl);
      req.error(new ProgressEvent('error'));
      tick();

      expect(component.errorMessage()).toBe('Failed to save business policies');
      expect(component.saving()).toBe(false);
    }));

    it('should set saving flag during save operation', fakeAsync(() => {
      initializeComponent(null);

      expect(component.saving()).toBe(false);

      component.onSave();
      
      // Should be true immediately after calling onSave
      expect(component.saving()).toBe(true);

      const req = httpMock.expectOne(apiUrl);
      req.flush({});
      tick();

      expect(component.saving()).toBe(false);
    }));

    it('should update policies signal on successful save', fakeAsync(() => {
      initializeComponent(null);

      component.onSave();

      const req = httpMock.expectOne(apiUrl);
      req.flush({});
      tick();

      const savedPolicies = component.policies();
      expect(savedPolicies).toBeTruthy();
      expect(savedPolicies?.lastUpdated).toBeTruthy();
    }));

    it('should validate form before saving', fakeAsync(() => {
      initializeComponent(null);

      const form = component.policiesForm();
      form?.patchValue({
        returns: {
          periodDays: -1 // Invalid value (min is 0)
        }
      });

      component.onSave();
      tick();

      expect(component.errorMessage()).toBe('Please correct the validation errors before saving');
      // No PUT request should be made
      httpMock.expectNone(req => req.method === 'PUT');
    }));

    it('should not save if form is null', fakeAsync(() => {
      component.policiesForm.set(null);

      component.onSave();
      tick();

      httpMock.expectNone(apiUrl);
    }));
  });

  describe('Format Hours', () => {
    it('should format AM hours correctly', () => {
      const form = component.policiesForm();
      form?.get('storeHours.schedule.Monday.openTime')?.setValue('09:00');
      form?.get('storeHours.schedule.Monday.closeTime')?.setValue('11:30');

      const formatted = component.formatHours('Monday');
      expect(formatted).toBe('9:00 AM - 11:30 AM');
    });

    it('should format PM hours correctly', () => {
      const form = component.policiesForm();
      form?.get('storeHours.schedule.Monday.openTime')?.setValue('13:00');
      form?.get('storeHours.schedule.Monday.closeTime')?.setValue('21:00');

      const formatted = component.formatHours('Monday');
      expect(formatted).toBe('1:00 PM - 9:00 PM');
    });

    it('should format mixed AM/PM hours correctly', () => {
      const form = component.policiesForm();
      form?.get('storeHours.schedule.Monday.openTime')?.setValue('09:00');
      form?.get('storeHours.schedule.Monday.closeTime')?.setValue('17:30');

      const formatted = component.formatHours('Monday');
      expect(formatted).toBe('9:00 AM - 5:30 PM');
    });

    it('should handle noon correctly', () => {
      const form = component.policiesForm();
      form?.get('storeHours.schedule.Monday.openTime')?.setValue('12:00');
      form?.get('storeHours.schedule.Monday.closeTime')?.setValue('12:30');

      const formatted = component.formatHours('Monday');
      expect(formatted).toBe('12:00 PM - 12:30 PM');
    });

    it('should handle midnight correctly', () => {
      const form = component.policiesForm();
      form?.get('storeHours.schedule.Monday.openTime')?.setValue('00:00');
      form?.get('storeHours.schedule.Monday.closeTime')?.setValue('00:30');

      const formatted = component.formatHours('Monday');
      expect(formatted).toBe('12:00 AM - 12:30 AM');
    });

    it('should return empty string for empty times', () => {
      const form = component.policiesForm();
      form?.get('storeHours.schedule.Monday.openTime')?.setValue('');
      form?.get('storeHours.schedule.Monday.closeTime')?.setValue('');

      const formatted = component.formatHours('Monday');
      expect(formatted).toBe('');
    });
  });

  describe('Character Counts', () => {
    it('should compute return conditions length correctly', () => {
      const form = component.policiesForm();
      form?.patchValue({
        returns: {
          conditions: 'Must be clean'
        }
      });

      // returnConditionsLength method was removed
    });

    it('should compute consignor policies length correctly', () => {
      const form = component.policiesForm();
      form?.patchValue({
        consignorPolicies: {
          policies: 'We accept quality items only'
        }
      });

      expect(component.consignorPoliciesLength()).toBe(28);
    });

    it('should return 0 for character counts when form is null', () => {
      component.policiesForm.set(null);

      // returnConditionsLength method was removed
      expect(component.consignorPoliciesLength()).toBe(0);
    });

    it('should return 0 for empty values', () => {
      const form = component.policiesForm();
      form?.patchValue({
        returns: {
          conditions: ''
        },
        consignorPolicies: {
          policies: ''
        }
      });

      // returnConditionsLength method was removed
      expect(component.consignorPoliciesLength()).toBe(0);
    });
  });

  describe('Payment Methods', () => {
    it('should get selected payment methods', () => {
      const form = component.policiesForm();
      const methodsArray = form?.get('payments.acceptedMethods') as FormArray;

      methodsArray?.at(0).setValue(true); // cash
      methodsArray?.at(1).setValue(true); // credit
      methodsArray?.at(2).setValue(false); // debit
      methodsArray?.at(3).setValue(false); // check
      methodsArray?.at(4).setValue(false); // mobile

      const selected = component.getSelectedPaymentMethods();
      expect(selected).toEqual(['cash', 'credit']);
    });

    it('should return empty array when no methods selected', () => {
      const form = component.policiesForm();
      const methodsArray = form?.get('payments.acceptedMethods') as FormArray;

      // Set all to false
      for (let i = 0; i < methodsArray.length; i++) {
        methodsArray.at(i).setValue(false);
      }

      const selected = component.getSelectedPaymentMethods();
      expect(selected).toEqual([]);
    });

    it('should return empty array when form is null', () => {
      component.policiesForm.set(null);

      const selected = component.getSelectedPaymentMethods();
      expect(selected).toEqual([]);
    });

    it('should return all methods when all selected', () => {
      const form = component.policiesForm();
      const methodsArray = form?.get('payments.acceptedMethods') as FormArray;

      // Set all to true
      for (let i = 0; i < methodsArray.length; i++) {
        methodsArray.at(i).setValue(true);
      }

      const selected = component.getSelectedPaymentMethods();
      expect(selected).toEqual(['cash', 'credit', 'debit', 'check', 'mobile']);
    });
  });

  describe('Preview Policies', () => {
    it('should show preview message', () => {
      component.previewPolicies();
      expect(component.successMessage()).toContain('Customer policy preview would open here');
    });
  });

  // NEW FUNCTIONALITY TESTS
  describe('No Returns Functionality', () => {
    it('should initialize with noReturns false by default', () => {
      const form = component.policiesForm();
      expect(form?.get('returns.noReturns')?.value).toBe(false);
    });

    it('should handle noReturns true in saved policies', fakeAsync(() => {
      const noReturnsPolicies = {
        ...mockPolicies,
        returns: {
          ...mockPolicies.returns,
          noReturns: true
        }
      };

      initializeComponent(noReturnsPolicies);

      const form = component.policiesForm();
      expect(form?.get('returns.noReturns')?.value).toBe(true);
    }));

    it('should save noReturns setting correctly', fakeAsync(() => {
      initializeComponent(null);

      const form = component.policiesForm();
      form?.patchValue({
        returns: {
          noReturns: true
        }
      });

      component.onSave();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.body.returns.noReturns).toBe(true);
      req.flush({});
      tick();
    }));
  });

  describe('Simplified Consignor Policies', () => {
    it('should have single policies text field by default', () => {
      const form = component.policiesForm();
      expect(form?.get('consignorPolicies.policies')?.value).toBe('');
      expect(form?.get('consignorPolicies.policies')?.hasError('maxlength')).toBeFalsy();
    });

    it('should validate policies text length (max 1000 chars)', () => {
      const form = component.policiesForm();
      const longText = 'a'.repeat(1001);

      form?.patchValue({
        consignorPolicies: {
          policies: longText
        }
      });

      expect(form?.get('consignorPolicies.policies')?.hasError('maxlength')).toBe(true);
    });

    it('should accept policies text within limit', () => {
      const form = component.policiesForm();
      const validText = 'We accept quality items in good condition.';

      form?.patchValue({
        consignorPolicies: {
          policies: validText
        }
      });

      expect(form?.get('consignorPolicies.policies')?.hasError('maxlength')).toBeFalsy();
    });
  });

  describe('Consignor Notification Feature', () => {
    it('should initialize notifyOnRegistration as false by default', () => {
      const form = component.policiesForm();
      expect(form?.get('consignorPolicies.notifyOnRegistration')?.value).toBe(false);
    });

    it('should toggle notification setting correctly', () => {
      const form = component.policiesForm();

      // Toggle on
      form?.patchValue({
        consignorPolicies: {
          notifyOnRegistration: true
        }
      });
      expect(form?.get('consignorPolicies.notifyOnRegistration')?.value).toBe(true);

      // Toggle off
      form?.patchValue({
        consignorPolicies: {
          notifyOnRegistration: false
        }
      });
      expect(form?.get('consignorPolicies.notifyOnRegistration')?.value).toBe(false);
    });

    it('should save notification setting with policies', fakeAsync(() => {
      initializeComponent(null);

      const form = component.policiesForm();
      form?.patchValue({
        consignorPolicies: {
          policies: 'Test policies text',
          notifyOnRegistration: true
        }
      });

      component.onSave();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.body.consignorPolicies.policies).toBe('Test policies text');
      expect(req.request.body.consignorPolicies.notifyOnRegistration).toBe(true);
      req.flush({});
      tick();
    }));

    it('should load notification setting from saved policies', fakeAsync(() => {
      const policiesWithNotification = {
        ...mockPolicies,
        consignorPolicies: {
          policies: 'Saved policies text',
          notifyOnRegistration: true
        }
      };

      initializeComponent(policiesWithNotification);

      const form = component.policiesForm();
      expect(form?.get('consignorPolicies.policies')?.value).toBe('Saved policies text');
      expect(form?.get('consignorPolicies.notifyOnRegistration')?.value).toBe(true);
    }));
  });

  describe('Messages', () => {
    it('should clear success message after timeout', fakeAsync(() => {
      component['showSuccess']('Test success');
      expect(component.successMessage()).toBe('Test success');
      expect(component.errorMessage()).toBe('');

      tick(5100);

      expect(component.successMessage()).toBe('');
    }));

    it('should clear error message after timeout', fakeAsync(() => {
      component['showError']('Test error');
      expect(component.errorMessage()).toBe('Test error');
      expect(component.successMessage()).toBe('');

      tick(5100);

      expect(component.errorMessage()).toBe('');
    }));

    it('should clear error when showing success', () => {
      component.errorMessage.set('Previous error');
      component['showSuccess']('New success');

      expect(component.successMessage()).toBe('New success');
      expect(component.errorMessage()).toBe('');
    });

    it('should clear success when showing error', () => {
      component.successMessage.set('Previous success');
      component['showError']('New error');

      expect(component.errorMessage()).toBe('New error');
      expect(component.successMessage()).toBe('');
    });
  });
});

// FOCUSED TEST FOR SPECIFIC FUNCTIONALITY
describe('PoliciesComponent - New Features Only', () => {
  let component: PoliciesComponent;
  let fixture: ComponentFixture<PoliciesComponent>;

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
  });

  it('should create component with new simplified structure', () => {
    expect(component).toBeTruthy();
    const form = component.policiesForm();

    // Verify new structure exists
    expect(form?.get('returns.noReturns')).toBeTruthy();
    expect(form?.get('consignorPolicies.policies')).toBeTruthy();
    expect(form?.get('consignorPolicies.notifyOnRegistration')).toBeTruthy();

    // Verify old structure is removed
    expect(form?.get('appointments')).toBeFalsy();
    expect(form?.get('safety')).toBeFalsy();
    expect(form?.get('consignorPolicies.itemAcceptanceCriteria')).toBeFalsy();
  });

  it('should calculate consignor policies character count', () => {
    const form = component.policiesForm();
    const testText = 'We accept vintage clothing and accessories';

    form?.patchValue({
      consignorPolicies: {
        policies: testText
      }
    });

    expect(component.consignorPoliciesLength()).toBe(testText.length);
  });

  it('should handle no returns policy correctly', () => {
    const form = component.policiesForm();

    // Initially no returns should be false
    expect(form?.get('returns.noReturns')?.value).toBe(false);

    // Set no returns to true
    form?.patchValue({
      returns: {
        noReturns: true
      }
    });

    expect(form?.get('returns.noReturns')?.value).toBe(true);
  });

  it('should handle consignor notification setting', () => {
    const form = component.policiesForm();

    // Initially should be false
    expect(form?.get('consignorPolicies.notifyOnRegistration')?.value).toBe(false);

    // Set to true
    form?.patchValue({
      consignorPolicies: {
        notifyOnRegistration: true
      }
    });

    expect(form?.get('consignorPolicies.notifyOnRegistration')?.value).toBe(true);
  });
});