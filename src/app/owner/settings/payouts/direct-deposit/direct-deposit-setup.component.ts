import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PayoutSettingsService, NewPayoutSettings } from '../../../../services/payout-settings.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-direct-deposit-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './direct-deposit-setup.component.html',
  styleUrls: ['./direct-deposit-setup.component.scss']
})
export class DirectDepositSetupComponent implements OnInit, OnDestroy {
  settings = signal<NewPayoutSettings | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  connecting = signal(false);
  private subscriptions = new Subscription();

  // Auto-save status computed from settings state
  autoSaveStatus = computed(() => {
    const settings = this.settings();
    return settings ? 'Saved automatically' : 'Loading...';
  });

  // Computed properties for easier template use
  achEnabled = computed(() => this.settings()?.payoutMethodACH || false);
  bankConnected = computed(() => this.settings()?.bankAccountConnected || false);
  autoPayEnabled = computed(() => this.settings()?.autoPayEnabled || false);

  constructor(private payoutSettingsService: PayoutSettingsService) {}

  ngOnInit() {
    this.loadSettings();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadSettings() {
    try {
      const settings = await this.payoutSettingsService.getNewPayoutSettings().toPromise();
      this.settings.set(settings);
    } catch (error) {
      console.error('Error loading payout settings:', error);
      this.showError('Failed to load payout settings');
    }
  }

  // Bank connection methods (moved from integrations/payouts component)
  async onConnectBank() {
    this.connecting.set(true);

    try {
      // Step 1: Get Plaid link token from our backend
      const response = await fetch(`${environment.apiUrl}/api/settings/payments/ach/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // TODO: Add auth headers
      });

      const { plaidLinkToken } = await response.json();

      // Step 2: Initialize Plaid Link (would require @plaid/link SDK)
      // For now, simulate the flow
      console.log('Would initialize Plaid Link with token:', plaidLinkToken);

      // Simulate successful connection
      setTimeout(() => {
        this.handlePlaidSuccess('public-token-123', {
          accounts: [{ id: 'account-123' }]
        });
      }, 2000);

    } catch (error) {
      console.error('Failed to connect bank account:', error);
      this.connecting.set(false);
      this.showError('Failed to connect bank account');
    }
  }

  private async handlePlaidSuccess(publicToken: string, metadata: any) {
    try {
      // Step 3: Send public token to our backend for exchange
      const response = await fetch(`${environment.apiUrl}/api/settings/payments/ach/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicToken: publicToken,
          accountId: metadata.accounts[0].id
        }),
        // TODO: Add auth headers
      });

      const result = await response.json();

      // Step 4: Update settings with bank connection info
      await this.updateSetting('bankAccountConnected', true);
      await this.updateSetting('bankName', result.bankName);
      await this.updateSetting('bankAccountLast4', result.accountLast4);
      await this.updateSetting('plaidAccessToken', result.accessToken);
      await this.updateSetting('plaidAccountId', result.accountId);

      this.showSuccess('Bank account connected successfully');

    } catch (error) {
      console.error('Failed to complete bank connection:', error);
      this.showError('Failed to complete bank connection');
    } finally {
      this.connecting.set(false);
    }
  }

  async onDisconnectBank() {
    try {
      await this.updateSetting('bankAccountConnected', false);
      await this.updateSetting('plaidAccessToken', '');
      await this.updateSetting('plaidAccountId', '');
      await this.updateSetting('bankName', '');
      await this.updateSetting('bankAccountLast4', '');
      this.showSuccess('Bank account disconnected');
    } catch (error) {
      console.error('Error disconnecting bank:', error);
      this.showError('Failed to disconnect bank account');
    }
  }

  // Balance protection
  onMinimumBalanceChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && this.settings()?.minimumBalanceProtection !== numValue) {
      this.updateSetting('minimumBalanceProtection', numValue);
    }
  }

  // Auto-pay toggle
  onAutoPayEnabledChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('autoPayEnabled', checked);
  }

  // Day of week handlers
  onMondayChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('autoPayMonday', checked);
  }

  onTuesdayChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('autoPayTuesday', checked);
  }

  onWednesdayChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('autoPayWednesday', checked);
  }

  onThursdayChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('autoPayThursday', checked);
  }

  onFridayChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('autoPayFriday', checked);
  }

  onSaturdayChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('autoPaySaturday', checked);
  }

  onSundayChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateSetting('autoPaySunday', checked);
  }

  private async updateSetting<T extends keyof NewPayoutSettings>(field: T, value: NewPayoutSettings[T]) {
    try {
      const currentSettings = this.settings();
      if (!currentSettings) return;

      const updateRequest = { [field]: value };
      const updatedSettings = await this.payoutSettingsService.updateNewPayoutSettings(updateRequest).toPromise();
      this.settings.set(updatedSettings);

      // Brief success indication
      this.showSuccess('Settings updated');
    } catch (error) {
      console.error(`Error updating ${String(field)}:`, error);
      this.showError(`Failed to update ${String(field)}`);
    }
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 2000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}