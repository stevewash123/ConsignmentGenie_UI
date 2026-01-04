import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { BusinessSettingsComponent } from './business-settings.component';
import { ItemSubmissionMode } from '../../../shared/interfaces/business.interfaces';
import { OwnerService, BusinessSettings } from '../../../services/owner.service';

describe('BusinessSettingsComponent', () => {
  let component: BusinessSettingsComponent;
  let fixture: ComponentFixture<BusinessSettingsComponent>;
  let mockOwnerService: jasmine.SpyObj<OwnerService>;

  const mockBusinessSettings: BusinessSettings = {
    commission: {
      defaultSplit: '50/50',
      categoryBasedSplits: false,
      minimumCommission: 5,
      allowCustomSplitsPerConsignor: true,
      allowCustomSplitsPerItem: false
    },
    tax: {
      enabled: true,
      rate: 8.25,
      label: 'Sales Tax',
      salesTaxRate: 8.25,
      taxIncludedInPrice: false,
      taxIncludedInPrices: false,
      chargeTaxOnShipping: true,
      taxIdEin: '12-3456789'
    },
    policies: {
      consignmentPeriod: 90,
      returnPolicy: 'Store Credit Only',
      itemSubmissionMode: 'approval_required',
      autoApproveItems: false
    },
    schedule: {
      businessHours: [
        { day: 'Monday', open: '09:00', close: '17:00', closed: false }
      ],
      timezone: 'America/New_York'
    },
    payouts: {
      schedule: 'monthly',
      minimumAmount: 25,
      holdPeriodDays: 30,
      refundPolicy: 'WithinDays',
      refundWindowDays: 14,
      defaultPayoutMethod: 'Check'
    },
    items: {
      defaultConsignmentPeriodDays: 90,
      enableAutoMarkdowns: true,
      markdownSchedule: {
        after30Days: 10,
        after60Days: 25,
        after90Days: 50,
        after90DaysAction: 'donate'
      }
    },
    consignorPermissions: {
      itemSubmissionMode: ItemSubmissionMode.ApprovalRequired
    }
  };

  beforeEach(async () => {
    mockOwnerService = jasmine.createSpyObj('OwnerService', ['getBusinessSettings', 'updateBusinessSettings']);

    // Mock the service calls
    mockOwnerService.getBusinessSettings.and.returnValue(of(mockBusinessSettings));
    mockOwnerService.updateBusinessSettings.and.returnValue(of(mockBusinessSettings));

    await TestBed.configureTestingModule({
      imports: [BusinessSettingsComponent, FormsModule],
      providers: [
        { provide: OwnerService, useValue: mockOwnerService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BusinessSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load settings on init', fakeAsync(() => {
    fixture.detectChanges();
    tick(); // Wait for async operation

    expect(mockOwnerService.getBusinessSettings).toHaveBeenCalled();
    expect(component.settings()).toEqual(mockBusinessSettings);
  }));

  it('should display settings form when settings loaded', fakeAsync(() => {
    fixture.detectChanges();
    tick(); // Wait for async load
    fixture.detectChanges(); // Trigger template update

    const form = fixture.nativeElement.querySelector('.settings-form');
    const header = fixture.nativeElement.querySelector('.settings-header h2');

    expect(form).toBeTruthy();
    expect(header?.textContent).toContain('Business Settings');
  }));

  it('should handle settings load error', fakeAsync(() => {
    mockOwnerService.getBusinessSettings.and.returnValue(throwError(() => new Error('API Error')));

    fixture.detectChanges();
    tick(); // Wait for async operation

    expect(component.settings()).toBeNull();
    expect(component.errorMessage()).toBe('Failed to load business settings');
  }));

  it('should save settings successfully', fakeAsync(() => {
    fixture.detectChanges();
    tick(); // Wait for initial load

    component.saveSettings();
    tick(); // Wait for save operation

    expect(mockOwnerService.updateBusinessSettings).toHaveBeenCalled();
    expect(component.successMessage()).toBe('Business settings saved successfully');
  }));

  it('should handle save error', fakeAsync(() => {
    mockOwnerService.updateBusinessSettings.and.returnValue(throwError(() => new Error('Save Error')));
    fixture.detectChanges();
    tick(); // Wait for initial load

    component.saveSettings();
    tick(); // Wait for save operation

    expect(component.errorMessage()).toBe('Failed to save business settings');
  }));

  it('should clear messages after timeout', fakeAsync(() => {
    fixture.detectChanges();
    tick(); // Wait for initial load

    // Trigger a successful save to set success message
    component.saveSettings();
    tick(); // Wait for save operation
    expect(component.successMessage()).toBe('Business settings saved successfully');

    // Fast forward through the 5 second timeout
    tick(5100);
    expect(component.successMessage()).toBe('');
  }));
});