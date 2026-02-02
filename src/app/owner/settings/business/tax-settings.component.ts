import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BusinessSettingsService } from '../../../services/business-settings.service';
import { BusinessSettings } from '../../../models/business.models';


@Component({
  selector: 'app-tax-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tax-settings.component.html',
  styleUrls: ['./tax-settings.component.css']
})
export class TaxSettingsComponent implements OnInit {
  taxForm!: FormGroup;
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private businessSettingsService: BusinessSettingsService
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.loadTaxSettings();
  }

  private initializeForm() {
    this.taxForm = this.fb.group({
      salesTaxRate: [0, [Validators.min(0), Validators.max(1)]],
      taxIncludedInPrices: [false],
      chargeTaxOnShipping: [false],
      taxIdEin: ['']
    });

    // Set up auto-save on form changes
    this.taxForm.valueChanges.subscribe((formValue) => {
      if (this.taxForm.valid) {
        // Map form values to API format and trigger auto-save
        Object.entries(formValue).forEach(([key, value]) => {
          this.businessSettingsService.updateBusinessSetting(key, value);
        });
      }
    });
  }

  async loadTaxSettings() {
    try {
      await this.businessSettingsService.loadBusinessSettings();
      const settings = this.businessSettingsService.getCurrentBusinessSettings();
      if (settings?.tax) {
        this.taxForm.patchValue(settings.tax);
      }
    } catch (error) {
      console.log('Using default tax settings');
    }
  }


  calculateTax(amount: number): string {
    const rate = this.taxForm.get('salesTaxRate')?.value || 0;
    return (amount * rate).toFixed(2);
  }

  calculateTotal(amount: number): string {
    const rate = this.taxForm.get('salesTaxRate')?.value || 0;
    return (amount + (amount * rate)).toFixed(2);
  }

  calculateIncludedTax(amount: number): string {
    const rate = this.taxForm.get('salesTaxRate')?.value || 0;
    return (amount * rate / (1 + rate)).toFixed(2);
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
    const rate = this.taxForm.get('salesTaxRate')?.value || 0;
    const preTaxAmount = amount / (1 + rate);
    return (preTaxAmount * 0.5).toFixed(2);
  }

  previewTaxCalculation() {
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}