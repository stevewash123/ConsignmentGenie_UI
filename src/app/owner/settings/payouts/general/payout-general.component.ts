import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PayoutMethod {
  id: string;
  label: string;
  enabled: boolean;
  isManual?: boolean;
}

@Component({
  selector: 'app-payout-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payout-general.component.html',
  styleUrls: ['./payout-general.component.scss']
})
export class PayoutGeneralComponent implements OnInit {
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
  isSaving = signal(false);

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    this.isLoading.set(true);
    try {
      // TODO: Load settings from API
      await this.simulateApiCall();
    } catch (error) {
      console.error('Failed to load payout settings:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onMethodToggle(methodId: string) {
    const methods = this.payoutMethods();
    const method = methods.find(m => m.id === methodId);
    if (method) {
      method.enabled = !method.enabled;
      this.payoutMethods.set([...methods]);
      this.autoSave();
    }
  }

  onHoldPeriodChange(value: string) {
    const days = parseInt(value, 10);
    if (!isNaN(days) && days >= 0) {
      this.holdPeriodDays.set(days);
      this.autoSave();
    }
  }

  onThresholdChange(value: string) {
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount >= 0) {
      this.minimumThreshold.set(amount);
      this.autoSave();
    }
  }

  private async autoSave() {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    try {
      // TODO: Save to API
      await this.simulateApiCall();
    } catch (error) {
      console.error('Failed to save payout settings:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private async simulateApiCall(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500));
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