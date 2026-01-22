import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BankAccount {
  connected: boolean;
  bankName?: string;
  accountLast4?: string;
}

@Component({
  selector: 'app-payout-direct-deposit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payout-direct-deposit.component.html',
  styleUrls: ['./payout-direct-deposit.component.scss']
})
export class PayoutDirectDepositComponent implements OnInit {
  isLoading = signal(false);
  isSaving = signal(false);

  bankAccount = signal<BankAccount>({ connected: false });
  minimumBalanceProtection = signal(1000.00);
  autoPayEnabled = signal(false);

  selectedDays = signal({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  });

  isConnecting = signal(false);
  directDepositEnabled = signal(true); // TODO: Get from payout general settings

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    this.isLoading.set(true);
    try {
      // TODO: Load settings from API
      await this.simulateApiCall();

      // Mock data for demonstration
      this.bankAccount.set({
        connected: false,
        bankName: 'First National Bank',
        accountLast4: '4567'
      });
    } catch (error) {
      console.error('Failed to load direct deposit settings:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async connectBankAccount() {
    this.isConnecting.set(true);
    try {
      // TODO: Implement Plaid Link integration
      await this.simulateApiCall(2000);

      // Mock successful connection
      this.bankAccount.set({
        connected: true,
        bankName: 'First National Bank',
        accountLast4: '4567'
      });

      this.autoSave();
    } catch (error) {
      console.error('Failed to connect bank account:', error);
    } finally {
      this.isConnecting.set(false);
    }
  }

  async disconnectBankAccount() {
    try {
      // TODO: Disconnect via API
      await this.simulateApiCall();

      this.bankAccount.set({ connected: false });
      this.autoPayEnabled.set(false);
      this.autoSave();
    } catch (error) {
      console.error('Failed to disconnect bank account:', error);
    }
  }

  onMinimumBalanceChange(value: string) {
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount >= 0) {
      this.minimumBalanceProtection.set(amount);
      this.autoSave();
    }
  }

  onAutoPayToggle() {
    const newValue = !this.autoPayEnabled();
    this.autoPayEnabled.set(newValue);

    // If enabling auto-pay, ensure at least one day is selected
    if (newValue && !this.hasSelectedDays()) {
      const days = this.selectedDays();
      days.monday = true;
      this.selectedDays.set({ ...days });
    }

    this.autoSave();
  }

  onDayToggle(day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday') {
    const days = this.selectedDays();
    days[day] = !days[day];
    this.selectedDays.set({ ...days });

    // If no days selected and auto-pay is enabled, disable auto-pay
    if (this.autoPayEnabled() && !this.hasSelectedDays()) {
      this.autoPayEnabled.set(false);
    }

    this.autoSave();
  }

  private hasSelectedDays(): boolean {
    const days = this.selectedDays();
    return Object.values(days).some(selected => selected);
  }

  private async autoSave() {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    try {
      // TODO: Save to API
      await this.simulateApiCall();
    } catch (error) {
      console.error('Failed to save direct deposit settings:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private async simulateApiCall(delay = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  get selectedDaysDisplay(): string {
    const days = this.selectedDays();
    const selected = Object.entries(days)
      .filter(([, isSelected]) => isSelected)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3));

    return selected.join(', ');
  }

  get canEnableAutoPay(): boolean {
    return this.bankAccount().connected;
  }
}