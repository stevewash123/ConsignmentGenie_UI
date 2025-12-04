import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { BusinessSettingsComponent } from './business-settings.component';

describe('BusinessSettingsComponent', () => {
  let component: BusinessSettingsComponent;
  let fixture: ComponentFixture<BusinessSettingsComponent>;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  const mockBusinessSettings = {
    Commission: {
      DefaultSplit: '60/40',
      AllowCustomSplitsPerConsignor: true,
      AllowCustomSplitsPerItem: false
    },
    Tax: {
      SalesTaxRate: 8.25,
      TaxIncludedInPrices: false,
      ChargeTaxOnShipping: false,
      TaxIdEin: '12-3456789'
    },
    Payouts: {
      Schedule: 'monthly',
      MinimumAmount: 25.00,
      HoldPeriodDays: 14
    },
    Items: {
      DefaultConsignmentPeriodDays: 90,
      EnableAutoMarkdowns: true,
      MarkdownSchedule: {
        After30Days: 10,
        After60Days: 20,
        After90DaysAction: 'return' as 'donate' | 'return'
      }
    }
  };

  beforeEach(async () => {
    const httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'put']);

    await TestBed.configureTestingModule({
      imports: [BusinessSettingsComponent, CommonModule, FormsModule],
      providers: [
        { provide: HttpClient, useValue: httpClientSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BusinessSettingsComponent);
    component = fixture.componentInstance;
    mockHttpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('Happy Path Tests', () => {
    beforeEach(() => {
      mockHttpClient.get.calls.reset();
      mockHttpClient.put.calls.reset();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load business settings on init', fakeAsync(() => {
      // Arrange
      mockHttpClient.get.and.returnValue(of(mockBusinessSettings));

      // Act
      fixture.detectChanges(); // triggers ngOnInit
      tick(); // resolve promises

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5000/api/organization/business-settings');
      expect(component.settings()).toEqual(mockBusinessSettings);
    }));

    it('should display commission settings in template', fakeAsync(() => {
      // Arrange
      mockHttpClient.get.and.returnValue(of(mockBusinessSettings));

      // Act
      fixture.detectChanges(); // triggers ngOnInit and loads settings
      tick(); // resolve the HTTP promise
      fixture.detectChanges(); // update view with loaded settings
      tick(); // allow ngModel to sync
      fixture.detectChanges(); // final view update

      // Assert
      const compiled = fixture.nativeElement;
      const defaultSplitSelect = compiled.querySelector('select[name="defaultSplit"]') as HTMLSelectElement;
      const customConsignorCheckbox = compiled.querySelector('input[name="allowCustomConsignor"]') as HTMLInputElement;
      const customItemCheckbox = compiled.querySelector('input[name="allowCustomItem"]') as HTMLInputElement;

      expect(defaultSplitSelect.value).toBe('60/40');
      expect(customConsignorCheckbox.checked).toBe(true);
      expect(customItemCheckbox.checked).toBe(false);
    }));

    it('should display tax settings in template', fakeAsync(() => {
      // Arrange
      mockHttpClient.get.and.returnValue(of(mockBusinessSettings));

      // Act
      fixture.detectChanges(); // triggers ngOnInit and loads settings
      tick(); // resolve the HTTP promise
      fixture.detectChanges(); // update view with loaded settings
      tick(); // allow ngModel to sync
      fixture.detectChanges(); // final view update

      // Assert
      const compiled = fixture.nativeElement;
      const taxRateInput = compiled.querySelector('input[name="salesTaxRate"]') as HTMLInputElement;
      const taxIncludedCheckbox = compiled.querySelector('input[name="taxIncluded"]') as HTMLInputElement;
      const taxOnShippingCheckbox = compiled.querySelector('input[name="taxOnShipping"]') as HTMLInputElement;
      const einInput = compiled.querySelector('input[name="taxIdEin"]') as HTMLInputElement;

      expect(taxRateInput.value).toBe('8.25');
      expect(taxIncludedCheckbox.checked).toBe(false);
      expect(taxOnShippingCheckbox.checked).toBe(false);
      expect(einInput.value).toBe('12-3456789');
    }));

    it('should display payout settings in template', fakeAsync(() => {
      // Arrange
      component.settings.set(mockBusinessSettings);

      // Act
      fixture.detectChanges();
      tick(); // Allow ngModel to process bindings
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const scheduleSelect = compiled.querySelector('select[name="payoutSchedule"]') as HTMLSelectElement;
      const minimumInput = compiled.querySelector('input[name="minimumPayout"]') as HTMLInputElement;
      const holdPeriodSelect = compiled.querySelector('select[name="holdPeriod"]') as HTMLSelectElement;

      expect(scheduleSelect.value).toBe('monthly');
      expect(minimumInput.value).toBe('25');
      expect(holdPeriodSelect.value).toBe('14');
    }));

    it('should display item policy settings in template', fakeAsync(() => {
      // Arrange
      component.settings.set(mockBusinessSettings);

      // Act
      fixture.detectChanges();
      tick(); // Allow ngModel to process bindings
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const consignmentPeriodSelect = compiled.querySelector('select[name="consignmentPeriod"]') as HTMLSelectElement;
      const autoMarkdownCheckbox = compiled.querySelector('input[name="enableMarkdowns"]') as HTMLInputElement;

      expect(consignmentPeriodSelect.value).toBe('90');
      expect(autoMarkdownCheckbox.checked).toBe(true);
    }));

    it('should show markdown schedule when auto markdowns are enabled', fakeAsync(() => {
      // Arrange
      component.settings.set(mockBusinessSettings);

      // Act
      fixture.detectChanges();
      tick(); // Allow ngModel to process bindings
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const markdownSchedule = compiled.querySelector('.markdown-schedule');
      const after30Input = compiled.querySelector('input[name="markdown30"]') as HTMLInputElement;
      const after60Input = compiled.querySelector('input[name="markdown60"]') as HTMLInputElement;
      const returnRadio = compiled.querySelector('input[name="after90Action"][value="return"]') as HTMLInputElement;

      expect(markdownSchedule).toBeTruthy();
      expect(after30Input.value).toBe('10');
      expect(after60Input.value).toBe('20');
      expect(returnRadio.checked).toBe(true);
    }));

    it('should hide markdown schedule when auto markdowns are disabled', () => {
      // Arrange
      const settingsWithoutMarkdowns = {
        ...mockBusinessSettings,
        Items: {
          ...mockBusinessSettings.Items,
          EnableAutoMarkdowns: false
        }
      };
      component.settings.set(settingsWithoutMarkdowns);

      // Act
      fixture.detectChanges();

      // Assert
      const compiled = fixture.nativeElement;
      const markdownSchedule = compiled.querySelector('.markdown-schedule');
      expect(markdownSchedule).toBeFalsy();
    });

    it('should save business settings when form is submitted', async () => {
      // Arrange
      component.settings.set(mockBusinessSettings);
      mockHttpClient.put.and.returnValue(of({ success: true, message: 'Settings updated successfully' }));

      // Act
      await component.saveSettings();

      // Assert
      expect(mockHttpClient.put).toHaveBeenCalledWith('http://localhost:5000/api/organization/business-settings', mockBusinessSettings);
      expect(component.successMessage()).toBe('Business settings saved successfully');
      expect(component.errorMessage()).toBe('');
    });

    it('should show success message after successful save', fakeAsync(() => {
      // Arrange
      mockHttpClient.get.and.returnValue(of(mockBusinessSettings));
      mockHttpClient.put.and.returnValue(of({ success: true }));
      fixture.detectChanges(); // triggers ngOnInit
      tick(); // resolve load

      // Act
      component.saveSettings();
      tick(); // resolve save promise
      fixture.detectChanges(); // update view with message signal change
      tick(); // allow *ngIf to process
      fixture.detectChanges(); // render the message element

      // Assert
      const compiled = fixture.nativeElement;
      const successMessage = compiled.querySelector('.message.success');
      expect(successMessage).toBeTruthy();
      expect(successMessage.textContent).toBe('Business settings saved successfully');
    }));

    it('should show error message on save failure', async () => {
      // Arrange
      component.settings.set(mockBusinessSettings);
      mockHttpClient.put.and.returnValue(throwError(() => new Error('Network error')));

      // Act
      await component.saveSettings();

      // Assert
      expect(component.errorMessage()).toBe('Failed to save business settings');
      expect(component.successMessage()).toBe('');
    });

    it('should reload settings data when cancel is clicked', async () => {
      // Arrange
      component.settings.set(mockBusinessSettings);
      const updatedSettings = {
        ...mockBusinessSettings,
        Commission: { ...mockBusinessSettings.Commission, DefaultSplit: '70/30' }
      };
      mockHttpClient.get.and.returnValue(of(updatedSettings));

      // Act
      await component.loadSettings();

      // Assert
      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(component.settings()).toEqual(updatedSettings);
    });

    it('should set saving state during save operation', async () => {
      // Arrange
      component.settings.set(mockBusinessSettings);
      mockHttpClient.put.and.returnValue(of({ success: true }));

      // Act & Assert
      expect(component.isSaving()).toBeFalsy();

      const savePromise = component.saveSettings();
      expect(component.isSaving()).toBeTruthy();

      await savePromise;
      expect(component.isSaving()).toBeFalsy();
    });

    it('should handle missing settings gracefully in saveSettings', async () => {
      // Arrange
      component.settings.set(null);

      // Act
      await component.saveSettings();

      // Assert
      expect(mockHttpClient.put).not.toHaveBeenCalled();
    });

    it('should update commission split when dropdown changes', fakeAsync(() => {
      // Arrange
      component.settings.set(mockBusinessSettings);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      // Act
      const compiled = fixture.nativeElement;
      const defaultSplitSelect = compiled.querySelector('select[name="defaultSplit"]') as HTMLSelectElement;
      defaultSplitSelect.value = '70/30';
      defaultSplitSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      tick();

      // Assert
      expect(component.settings()?.Commission.DefaultSplit).toBe('70/30');
    }));

    it('should toggle custom splits checkbox', fakeAsync(() => {
      // Arrange
      component.settings.set(mockBusinessSettings);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      // Act
      const compiled = fixture.nativeElement;
      const customConsignorCheckbox = compiled.querySelector('input[name="allowCustomConsignor"]') as HTMLInputElement;
      customConsignorCheckbox.click();
      fixture.detectChanges();
      tick();

      // Assert
      expect(component.settings()?.Commission.AllowCustomSplitsPerConsignor).toBe(false);
    }));

    it('should update tax rate input', fakeAsync(() => {
      // Arrange
      component.settings.set(mockBusinessSettings);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      // Act
      const compiled = fixture.nativeElement;
      const taxRateInput = compiled.querySelector('input[name="salesTaxRate"]') as HTMLInputElement;
      taxRateInput.value = '7.5';
      taxRateInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      tick();

      // Assert
      expect(component.settings()?.Tax.SalesTaxRate).toBe(7.5);
    }));

    it('should auto-clear success message after 5 seconds', fakeAsync(async () => {
      // Arrange
      component.settings.set(mockBusinessSettings);
      mockHttpClient.put.and.returnValue(of({ success: true }));

      // Act
      await component.saveSettings();
      tick();

      // Assert
      expect(component.successMessage()).toBe('Business settings saved successfully');

      tick(5000);

      expect(component.successMessage()).toBe('');
    }));
  });

  describe('Error Handling', () => {
    it('should show error message when loading settings fails', fakeAsync(() => {
      // Arrange
      mockHttpClient.get.and.returnValue(throwError(() => new Error('API Error')));

      // Act
      fixture.detectChanges(); // triggers ngOnInit
      tick(); // resolve error promise

      // Assert
      expect(component.errorMessage()).toBe('Failed to load business settings');
      expect(component.settings()).toBeNull();
    }));

    it('should handle empty response when loading settings', fakeAsync(() => {
      // Arrange
      mockHttpClient.get.and.returnValue(of(null));

      // Act
      fixture.detectChanges(); // triggers ngOnInit
      tick(); // resolve promise

      // Assert
      expect(component.settings()).toBeNull();
    }));
  });
});