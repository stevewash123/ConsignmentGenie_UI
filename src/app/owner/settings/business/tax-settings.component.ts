import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OwnerService, TaxSettings } from '../../../services/owner.service';


@Component({
  selector: 'app-tax-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tax-settings.component.html',
  styleUrls: ['./tax-settings.component.css']
})
export class TaxSettingsComponent implements OnInit {
  taxForm!: FormGroup;
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private ownerService: OwnerService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadTaxSettings();
  }

  private initializeForm() {
    this.taxForm = this.fb.group({
      collectionEnabled: [true],
      rates: this.fb.group({
        defaultRate: [0, [Validators.min(0), Validators.max(100)]],
        isInclusive: [false],
        effectiveDate: [new Date()]
      }),
      business: this.fb.group({
        taxId: [''],
        stateTaxId: [''],
        showTaxIdOnReceipts: [false]
      }),
      display: this.fb.group({
        showBreakdownOnReceipt: [true],
        lineItemTax: [false]
      }),
      calculation: this.fb.group({
        applyToCommission: ['before']
      }),
      reporting: this.fb.group({
        period: ['monthly'],
        autoGenerate: [true],
        exportFormat: ['csv']
      })
    });
  }

  async loadTaxSettings() {
    try {
      const response = await this.ownerService.getTaxSettings().toPromise();
      if (response) {
        this.populateForm(response);
      }
    } catch (error) {
      // If tax settings don't exist yet, use defaults
      console.log('Using default tax settings');
    }
  }

  private populateForm(settings: TaxSettings) {
    this.taxForm.patchValue({
      collectionEnabled: settings.collection.enabled,
      rates: {
        defaultRate: settings.rates.defaultRate * 100, // Convert to percentage
        isInclusive: settings.rates.isInclusive,
        effectiveDate: settings.rates.effectiveDate
      },
      business: {
        taxId: settings.business.taxId || '',
        stateTaxId: settings.business.stateTaxId || '',
        showTaxIdOnReceipts: settings.display.showTaxIdOnReceipt
      },
      display: {
        showBreakdownOnReceipt: settings.display.showBreakdownOnReceipt,
        lineItemTax: settings.display.lineItemTax
      },
      calculation: {
        applyToCommission: settings.calculation.applyToCommission
      },
      reporting: {
        period: settings.reporting.period,
        autoGenerate: settings.reporting.autoGenerate,
        exportFormat: settings.reporting.exportFormat
      }
    });
  }

  calculateTax(amount: number): string {
    const rate = this.taxForm.get('rates.defaultRate')?.value || 0;
    return (amount * rate / 100).toFixed(2);
  }

  calculateTotal(amount: number): string {
    const rate = this.taxForm.get('rates.defaultRate')?.value || 0;
    return (amount + (amount * rate / 100)).toFixed(2);
  }

  calculateIncludedTax(amount: number): string {
    const rate = this.taxForm.get('rates.defaultRate')?.value || 0;
    return (amount * rate / (100 + rate)).toFixed(2);
  }

  getCommissionAfterTax(): string {
    const total = parseFloat(this.calculateTotal(100));
    return (total * 0.5).toFixed(2);
  }

  calculateConsignmentPayout(amount: number): string {
    // Always calculate payout on pre-tax amount (BeforeTax only)
    return (amount * 0.5).toFixed(2);
  }

  calculateInclusiveConsignmentPayout(amount: number): string {
    // For tax-inclusive, extract the pre-tax amount first, then calculate 50%
    const rate = this.taxForm.get('rates.defaultRate')?.value || 0;
    const preTaxAmount = amount / (1 + rate / 100);
    return (preTaxAmount * 0.5).toFixed(2);
  }

  previewTaxCalculation() {
    this.showSuccess('Tax calculation preview is displayed above for a $100 item');
  }

  async onSave() {
    if (!this.taxForm.valid) {
      this.showError('Please correct the form errors before saving');
      return;
    }

    this.saving.set(true);
    try {
      const formValue = this.taxForm.value;

      const taxSettings: TaxSettings = {
        taxEnabled: formValue.taxEnabled || false,
        defaultTaxRate: formValue.defaultTaxRate || 0,
        taxLabel: formValue.taxLabel || 'Tax',
        taxCalculationMethod: formValue.taxCalculationMethod || 'exclusive',
        exemptCategories: formValue.exemptCategories || [],
        collection: {
          enabled: formValue.collectionEnabled,
          acknowledgmentDate: formValue.collectionEnabled ? new Date() : undefined
        },
        rates: {
          defaultRate: formValue.rates.defaultRate / 100, // Convert to decimal
          isInclusive: formValue.rates.isInclusive,
          effectiveDate: formValue.rates.effectiveDate || new Date()
        },
        display: {
          showBreakdownOnReceipt: formValue.display.showBreakdownOnReceipt,
          showTaxIdOnReceipt: formValue.business.showTaxIdOnReceipts,
          lineItemTax: formValue.display.lineItemTax
        },
        business: {
          taxId: formValue.business.taxId,
          stateTaxId: formValue.business.stateTaxId,
          taxIdVerified: false
        },
        calculation: {
          applyToCommission: formValue.calculation.applyToCommission,
          exemptCategories: []
        },
        reporting: {
          period: formValue.reporting.period,
          autoGenerate: formValue.reporting.autoGenerate,
          exportFormat: formValue.reporting.exportFormat
        },
        lastUpdated: new Date()
      };

      await this.ownerService.updateTaxSettings(taxSettings).toPromise();
      this.showSuccess('Tax settings saved successfully');
    } catch (error) {
      this.showError('Failed to save tax settings. Please try again.');
    } finally {
      this.saving.set(false);
    }
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