import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

// Data model interfaces
export interface ReceiptHeaderSettings {
  includeLogo: boolean;
  showStoreInfo: boolean;
  showAddress: boolean;
  dateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
  timeFormat: '12h' | '24h';
}

export interface ReceiptContentSettings {
  layoutStyle: 'compact' | 'detailed';
  showItemDescriptions: boolean;
  descriptionLength: number;
  showTaxBreakdown: boolean;
  showPaymentMethod: boolean;
}

export interface ReceiptFooterSettings {
  customMessage?: string;
  includeReturnPolicy: boolean;
  returnPolicyText?: string;
  thankYouMessage?: string;
  includeWebsite: boolean;
}

export interface DigitalReceiptSettings {
  autoEmailReceipts: boolean;
  emailFormat: 'html' | 'pdf';
  promptForEmail: boolean;
  emailSubject: string;
  includePromoContent: boolean;
  promoContent?: string;
}

export interface PrintReceiptSettings {
  autoPrint: boolean;
  printerWidth: 58 | 80;
  copies: 1 | 2;
  printDensity: 'light' | 'medium' | 'dark';
  logoSize: 'small' | 'medium' | 'large';
}

export interface ReceiptSettings {
  header: ReceiptHeaderSettings;
  content: ReceiptContentSettings;
  footer: ReceiptFooterSettings;
  digital: DigitalReceiptSettings;
  print: PrintReceiptSettings;
  lastUpdated: Date;
}

@Component({
  selector: 'app-receipt-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './receipt-settings.component.html',
  styleUrls: ['./receipt-settings.component.css']
})
export class ReceiptSettingsComponent implements OnInit {
  receiptForm = signal<FormGroup | null>(null); // Will be set up in constructor
  settings = signal<ReceiptSettings | null>(null);
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Character counting
  customMessageLength = computed(() => {
    const form = this.receiptForm();
    if (!form) return 0;
    const value = form.get('footer.customMessage')?.value || '';
    return value.length;
  });

  returnPolicyLength = computed(() => {
    const form = this.receiptForm();
    if (!form) return 0;
    const value = form.get('footer.returnPolicyText')?.value || '';
    return value.length;
  });

  promoContentLength = computed(() => {
    const form = this.receiptForm();
    if (!form) return 0;
    const value = form.get('digital.promoContent')?.value || '';
    return value.length;
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.receiptForm.set(this.createForm());
  }

  ngOnInit() {
    this.loadSettings();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      header: this.fb.group({
        includeLogo: [true],
        showStoreInfo: [true],
        showAddress: [true],
        dateFormat: ['MM/dd/yyyy'],
        timeFormat: ['12h']
      }),
      content: this.fb.group({
        layoutStyle: ['detailed'],
        showItemDescriptions: [true],
        descriptionLength: [50],
        showTaxBreakdown: [true],
        showPaymentMethod: [true]
      }),
      footer: this.fb.group({
        customMessage: ['', Validators.maxLength(200)],
        includeReturnPolicy: [false],
        returnPolicyText: ['', Validators.maxLength(300)],
        thankYouMessage: [''],
        includeWebsite: [true]
      }),
      digital: this.fb.group({
        autoEmailReceipts: [false],
        emailFormat: ['html'],
        promptForEmail: [false],
        emailSubject: ['Your receipt from [Store Name]'],
        includePromoContent: [false],
        promoContent: ['', Validators.maxLength(250)]
      }),
      print: this.fb.group({
        autoPrint: [true],
        printerWidth: [80],
        copies: [1],
        printDensity: ['medium'],
        logoSize: ['medium']
      })
    });
  }

  async loadSettings() {
    try {
      const response = await this.http.get<ReceiptSettings>(`${environment.apiUrl}/api/organizations/receipt-settings`).toPromise();
      if (response) {
        this.settings.set(response);
        this.populateForm(response);
      }
    } catch (error) {
      // If settings don't exist, use defaults - no error message needed
      console.log('Using default receipt settings');
    }
  }

  private populateForm(settings: ReceiptSettings) {
    const form = this.receiptForm();
    if (!form) return;
    form.patchValue({
      header: settings.header,
      content: settings.content,
      footer: settings.footer,
      digital: settings.digital,
      print: settings.print
    });
  }

  async onSave() {
    const form = this.receiptForm();
    if (!form) return;

    if (form.invalid) {
      this.showError('Please correct the validation errors before saving');
      return;
    }

    const formValue = form.value;
    const receiptSettings: ReceiptSettings = {
      header: formValue.header,
      content: formValue.content,
      footer: formValue.footer,
      digital: formValue.digital,
      print: formValue.print,
      lastUpdated: new Date()
    };

    this.saving.set(true);
    try {
      await this.http.put(`${environment.apiUrl}/api/organizations/receipt-settings`, receiptSettings).toPromise();
      this.settings.set(receiptSettings);
      this.showSuccess('Receipt settings saved successfully');
    } catch (error) {
      this.showError('Failed to save receipt settings');
    } finally {
      this.saving.set(false);
    }
  }

  previewReceipt() {
    // For now, just show a message that this would open a preview
    this.showSuccess('Receipt preview would open here (feature coming soon)');
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