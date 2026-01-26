import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService, BusinessSettings } from '../../../services/settings.service';


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
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService
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
  }

  async loadTaxSettings() {
    try {
      await this.settingsService.loadBusinessSettings();
      const settings = this.settingsService.getCurrentBusinessSettings();
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

  async onSave() {
    if (!this.taxForm.valid) {
      this.showError('Please correct the form errors before saving');
      return;
    }

    this.saving.set(true);
    try {
      const taxSettings = this.taxForm.value;
      this.settingsService.updateBusinessSettings({ tax: taxSettings });
    } catch (error) {
      this.showError('Failed to save tax settings. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }


  private showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}