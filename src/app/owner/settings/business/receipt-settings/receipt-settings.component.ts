import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '../../../../services/settings.service';
import { Subscription, debounceTime } from 'rxjs';

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
export class ReceiptSettingsComponent implements OnInit, OnDestroy {
  receiptForm = signal<FormGroup | null>(null); // Will be set up in constructor
  settings = signal<ReceiptSettings | null>(null);
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  private formSubscription = new Subscription();

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
    private settingsService: SettingsService
  ) {
    this.receiptForm.set(this.createForm());
  }

  ngOnInit() {
    this.loadSettings();
    this.setupFormChangeListeners();
  }

  ngOnDestroy() {
    this.formSubscription.unsubscribe();
  }

  private setupFormChangeListeners() {
    const form = this.receiptForm();
    if (form) {
      // Listen to form changes and auto-save with debounce
      this.formSubscription.add(
        form.valueChanges
          .pipe(debounceTime(500)) // Wait 500ms after user stops typing
          .subscribe(() => {
            if (form.valid && !this.saving()) {
              this.autoSave();
            }
          })
      );
    }
  }

  private async autoSave() {
    const form = this.receiptForm();
    if (!form || form.invalid) return;

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
      await this.settingsService.updateBusinessSettings({ receipts: receiptSettings });
      this.settings.set(receiptSettings);
      this.showSuccess('Settings saved automatically');
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error for auto-save failures to avoid annoying the user
    } finally {
      this.saving.set(false);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      header: this.fb.group({
        includeLogo: [false], // Set to FALSE per requirements
        showStoreInfo: [true], // Always TRUE per requirements
        showAddress: [true], // Always TRUE per requirements
        dateFormat: ['MM/dd/yyyy'],
        timeFormat: ['12h']
      }),
      content: this.fb.group({
        layoutStyle: ['simple'], // Simple layout always
        showItemDescriptions: [true], // Always show descriptions
        descriptionLength: [50], // Always 50 characters
        showTaxBreakdown: [true], // Always TRUE per requirements
        showPaymentMethod: [true] // Always TRUE per requirements
      }),
      footer: this.fb.group({
        customMessage: ['', Validators.maxLength(200)],
        includeReturnPolicy: [false],
        returnPolicyText: ['', Validators.maxLength(300)],
        thankYouMessage: [''],
        includeWebsite: [false] // Set to FALSE per requirements
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
        logoSize: ['medium'] // Keep this for data consistency even though UI option removed
      })
    });
  }

  async loadSettings() {
    try {
      await this.settingsService.loadBusinessSettings();
      const businessSettings = this.settingsService.getCurrentBusinessSettings();
      if (businessSettings?.receipts) {
        this.settings.set(businessSettings.receipts);
        this.populateForm(businessSettings.receipts);
      }
    } catch (error) {
      // If settings don't exist, use defaults - no error message needed
      console.log('Using default receipt settings');
    }
  }

  private populateForm(settings: ReceiptSettings) {
    const form = this.receiptForm();
    if (!form) return;

    // Use emitEvent: false to prevent triggering change listeners during initial population
    form.patchValue({
      header: settings.header,
      content: settings.content,
      footer: settings.footer,
      digital: settings.digital,
      print: settings.print
    }, { emitEvent: false });
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