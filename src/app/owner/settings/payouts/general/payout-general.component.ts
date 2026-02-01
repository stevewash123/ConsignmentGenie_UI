import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { PayoutSettingsService } from '../../../../services/payout-settings.service';
import { PayoutSettings, UpdatePayoutSettingsRequest } from '../../../../models/payout-settings.model';

interface PayoutMethod {
  id: string;
  label: string;
  enabled: boolean;
  isManual?: boolean;
}

interface PayoutSettingsForm {
  payoutMethods: PayoutMethod[];
  holdPeriodDays: number;
  minimumThreshold: number;
}

@Component({
  selector: 'app-payout-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payout-general.component.html',
  styleUrls: ['./payout-general.component.scss']
})
export class PayoutGeneralComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  private pendingChanges: Partial<PayoutSettingsForm> = {};
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private isSaving = false;
  private readonly DEBOUNCE_MS = 800;

  payoutMethods = signal<PayoutMethod[]>([
    { id: 'check', label: 'Check', enabled: false },
    { id: 'cash', label: 'Cash', enabled: false },
    { id: 'storeCredit', label: 'Store Credit', enabled: false },
    { id: 'paypal', label: 'PayPal (manual)', enabled: false, isManual: true },
    { id: 'venmo', label: 'Venmo (manual)', enabled: false, isManual: true },
    { id: 'ach', label: 'Direct Deposit (ACH)', enabled: false }
  ]);

  holdPeriodDays = signal(30);
  minimumThreshold = signal(25.00);

  isLoading = signal(false);
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Auto-save status computed from form state
  autoSaveStatus = computed(() => {
    return this.saving() ? 'Saving...' : 'Saved automatically';
  });

  constructor(
    private payoutSettingsService: PayoutSettingsService
  ) {}

  ngOnInit() {
    this.loadSettings();
    this.setupChangeListeners();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  private setupChangeListeners(): void {
    // Watch for changes to trigger auto-save
    // This would be more elegant with reactive forms, but keeping current signal approach
  }

  async loadSettings() {
    this.isLoading.set(true);
    try {
      const settings = await firstValueFrom(this.payoutSettingsService.getPayoutSettings());
      if (settings) {
        this.updateFormFromSettings(settings);
        this.showSuccess('Settings loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load payout settings:', error);
      // Create default settings if none exist
      try {
        await this.createDefaultSettings();
      } catch (createError) {
        console.error('Failed to create default payout settings:', createError);
        this.showError('Failed to load or create payout settings');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  private async createDefaultSettings() {
    const defaultRequest = {
      payoutMethodCheck: false,
      payoutMethodCash: false,
      payoutMethodStoreCredit: false,
      payoutMethodPayPal: false,
      payoutMethodVenmo: false,
      payoutMethodACH: false,
      holdPeriodDays: 30,
      minimumPayoutThreshold: 25.00,
      minimumBalanceProtection: 100.00,
      autoPayEnabled: false
    };

    const settings = await this.payoutSettingsService.createPayoutSettings(defaultRequest);
    if (settings) {
      this.updateFormFromSettings(settings);
    }
  }

  private updateFormFromSettings(settings: PayoutSettings) {
    // Update payout methods based on API data
    const methods = this.payoutMethods();
    methods.forEach(method => {
      switch (method.id) {
        case 'check':
          method.enabled = settings.payoutMethodCheck;
          break;
        case 'cash':
          method.enabled = settings.payoutMethodCash;
          break;
        case 'storeCredit':
          method.enabled = settings.payoutMethodStoreCredit;
          break;
        case 'paypal':
          method.enabled = settings.payoutMethodPayPal;
          break;
        case 'venmo':
          method.enabled = settings.payoutMethodVenmo;
          break;
        case 'ach':
          method.enabled = settings.payoutMethodACH;
          break;
      }
    });
    this.payoutMethods.set([...methods]);
    this.holdPeriodDays.set(settings.holdPeriodDays);
    this.minimumThreshold.set(settings.minimumPayoutThreshold);
  }

  onMethodToggle(methodId: string) {
    const methods = this.payoutMethods();
    const method = methods.find(m => m.id === methodId);
    if (method) {
      method.enabled = !method.enabled;
      this.payoutMethods.set([...methods]);
      this.pendingChanges.payoutMethods = [...methods];
      this.scheduleSave();
    }
  }

  onHoldPeriodChange(value: string) {
    const days = parseInt(value, 10);
    if (!isNaN(days) && days >= 0) {
      this.holdPeriodDays.set(days);
      this.pendingChanges.holdPeriodDays = days;
      this.scheduleSave();
    }
  }

  onThresholdChange(value: string) {
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount >= 0) {
      this.minimumThreshold.set(amount);
      this.pendingChanges.minimumThreshold = amount;
      this.scheduleSave();
    }
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.autoSave(), this.DEBOUNCE_MS);
  }

  private async autoSave(): Promise<void> {
    if (this.isSaving || Object.keys(this.pendingChanges).length === 0) {
      return;
    }

    this.isSaving = true;
    this.saving.set(true);
    const changesToSave = { ...this.pendingChanges };
    this.pendingChanges = {};

    // Convert form changes to API format
    const updateRequest: UpdatePayoutSettingsRequest = {};

    if (changesToSave.payoutMethods) {
      const methods = changesToSave.payoutMethods;
      methods.forEach(method => {
        switch (method.id) {
          case 'check':
            updateRequest.payoutMethodCheck = method.enabled;
            break;
          case 'cash':
            updateRequest.payoutMethodCash = method.enabled;
            break;
          case 'storeCredit':
            updateRequest.payoutMethodStoreCredit = method.enabled;
            break;
          case 'paypal':
            updateRequest.payoutMethodPayPal = method.enabled;
            break;
          case 'venmo':
            updateRequest.payoutMethodVenmo = method.enabled;
            break;
          case 'ach':
            updateRequest.payoutMethodACH = method.enabled;
            break;
        }
      });
    }

    if (changesToSave.holdPeriodDays !== undefined) {
      updateRequest.holdPeriodDays = changesToSave.holdPeriodDays;
    }

    if (changesToSave.minimumThreshold !== undefined) {
      updateRequest.minimumPayoutThreshold = changesToSave.minimumThreshold;
    }

    try {
      await this.payoutSettingsService.updatePayoutSettings(updateRequest);
      this.saving.set(false);
      this.isSaving = false;

      // If more changes came in while saving, save again
      if (Object.keys(this.pendingChanges).length > 0) {
        this.scheduleSave();
      }
    } catch (error) {
      this.showError('Failed to save payout settings');
      this.saving.set(false);
      this.isSaving = false;

      // Retry by putting changes back
      Object.assign(this.pendingChanges, changesToSave);
      this.scheduleSave();
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

  get enabledMethods(): string[] {
    return this.payoutMethods()
      .filter(method => method.enabled)
      .map(method => method.label);
  }

  get isDirectDepositEnabled(): boolean {
    return this.payoutMethods().some(m => m.id === 'ach' && m.enabled);
  }
}