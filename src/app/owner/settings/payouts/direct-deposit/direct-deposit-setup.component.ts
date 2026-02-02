import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { PayoutSettingsService } from '../../../../services/payout-settings.service';
import { PayoutSettings } from '../../../../models/payout-settings.model';
import { AchSettingsService } from '../../../../services/ach-settings.service';
import { PlaidLinkService, PlaidLinkConfig } from '../../../../services/plaid-link.service';
import { IntegrationPricingService } from '../../../../shared/services/integration-pricing.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-direct-deposit-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './direct-deposit-setup.component.html',
  styleUrls: ['./direct-deposit-setup.component.scss']
})
export class DirectDepositSetupComponent implements OnInit, OnDestroy {
  payoutSettings = signal<PayoutSettings | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  connecting = signal(false);
  plaidReady = signal(false);
  private subscriptions = new Subscription();

  // Computed properties for easier template use
  achEnabled = computed(() => this.payoutSettings()?.payoutMethodACH || false);
  bankConnected = computed(() => this.payoutSettings()?.bankAccountConnected || false);
  connectedBank = computed(() => {
    const settings = this.payoutSettings();
    if (!settings || !settings.bankAccountConnected) return null;
    return {
      id: settings.plaidAccountId || '',
      bankName: settings.bankName || 'Connected Bank',
      accountType: 'checking', // Default type
      accountNumberMask: settings.bankAccountLast4 ? `••••${settings.bankAccountLast4}` : '••••****',
      status: 'connected',
      isDefault: true,
      connectedAt: settings.updatedAt || settings.createdAt
    };
  });

  constructor(
    private payoutSettingsService: PayoutSettingsService,
    private achSettingsService: AchSettingsService,
    private plaidLinkService: PlaidLinkService,
    private integrationPricingService: IntegrationPricingService
  ) {
    console.log('DirectDepositSetupComponent: Constructor - Services injected (HYBRID COMPONENT)', {
      payoutSettingsService: !!this.payoutSettingsService,
      achSettingsService: !!this.achSettingsService,
      plaidLinkService: !!this.plaidLinkService
    });
  }

  ngOnInit() {
    console.log('DirectDepositSetupComponent: ngOnInit called');
    this.loadSettings();

    // Monitor Plaid readiness
    this.subscriptions.add(
      this.plaidLinkService.plaidReady$.subscribe(ready => {
        console.log('DirectDepositSetupComponent: Plaid ready state changed:', ready);
        this.plaidReady.set(ready);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadSettings() {
    console.log('DirectDepositSetupComponent: loadSettings called');
    try {
      console.log('DirectDepositSetupComponent: Making API call to loadPayoutSettings');
      await this.payoutSettingsService.loadPayoutSettings();
      const settings = this.payoutSettingsService.getCurrentPayoutSettings();
      console.log('DirectDepositSetupComponent: Received payout settings:', settings);
      this.payoutSettings.set(settings);
      console.log('DirectDepositSetupComponent: Settings signal updated. Current state:', {
        achEnabled: this.achEnabled(),
        bankConnected: this.bankConnected(),
        connectedBank: this.connectedBank()
      });
    } catch (error) {
      console.error('DirectDepositSetupComponent: Error loading payout settings:', error);
      // Try to create default settings if none exist
      try {
        await this.createDefaultSettings();
      } catch (createError) {
        console.error('DirectDepositSetupComponent: Failed to create default settings:', createError);
        this.showError('Failed to load or create payout settings');
      }
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
      this.payoutSettings.set(settings);
    }
  }

  async onToggleAch() {
    try {
      const currentSettings = this.payoutSettings();
      if (!currentSettings) return;

      const newEnabled = !currentSettings.payoutMethodACH;

      // Show pricing impact confirmation
      const confirmed = await this.integrationPricingService.showPricingConfirmation(
        'plaid',
        newEnabled,
        '⚠️ Pricing Impact',
        newEnabled ? 'Enable Bank Integration' : 'Disable Bank Integration'
      );

      if (!confirmed) {
        console.log('User cancelled the ACH integration change');
        return;
      }

      await this.payoutSettingsService.updatePayoutSettings({
        payoutMethodACH: newEnabled
      });

      // Reload settings to get updated data
      await this.loadSettings();

      this.showSuccess(newEnabled ? 'ACH payouts enabled' : 'ACH payouts disabled');
    } catch (error) {
      console.error('Error updating ACH setting:', error);
      this.showError('Failed to update ACH setting');
    }
  }

  // Bank connection using Plaid Link CDN
  async onConnectBank() {
    if (!this.plaidReady()) {
      this.showError('Plaid is not ready yet. Please wait a moment and try again.');
      return;
    }

    if (!this.achEnabled()) {
      this.showError('ACH must be enabled before connecting a bank account');
      return;
    }

    this.connecting.set(true);

    try {
      // Step 1: Get Plaid link token from our backend
      const linkTokenResponse = await firstValueFrom(this.achSettingsService.createPlaidLinkToken());

      if (!linkTokenResponse) {
        throw new Error('Failed to get Plaid link token');
      }

      // Step 2: Configure Plaid Link
      const linkConfig: PlaidLinkConfig = {
        token: linkTokenResponse.linkToken,
        onSuccess: (publicToken: string, metadata: any) => {
          this.handlePlaidSuccess(publicToken, metadata);
        },
        onExit: (error: any, metadata: any) => {
          this.handlePlaidExit(error, metadata);
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log('Plaid event:', eventName, metadata);
        },
        onLoad: () => {
          console.log('Plaid Link loaded');
        }
      };

      // Step 3: Open Plaid Link
      this.plaidLinkService.openPlaidLink(linkConfig);

    } catch (error) {
      console.error('Failed to connect bank account:', error);
      this.connecting.set(false);
      this.showError('Failed to connect bank account');
    }
  }

  private async handlePlaidSuccess(publicToken: string, metadata: any) {
    try {
      console.log('Plaid success:', { publicToken, metadata });

      // Get the first checking or savings account
      const selectedAccount = metadata.accounts.find((acc: any) =>
        acc.subtype === 'checking' || acc.subtype === 'savings'
      ) || metadata.accounts[0];

      if (!selectedAccount) {
        throw new Error('No suitable bank account found');
      }

      // Step 3: Exchange public token with AchSettings backend (this creates funding source in DB)
      const exchangeRequest = {
        publicToken: publicToken,
        accountId: selectedAccount.id,
        accountName: selectedAccount.name,
        institutionName: metadata.institution?.name,
        accountType: selectedAccount.subtype,
        accountMask: selectedAccount.mask
      };

      const result = await firstValueFrom(this.achSettingsService.exchangePlaidToken(exchangeRequest));

      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to exchange public token');
      }

      // Step 4: Update PayoutSettings with bank connection info
      await this.payoutSettingsService.updatePayoutSettings({
        bankAccountConnected: true,
        plaidAccountId: selectedAccount.id,
        bankName: metadata.institution?.name || 'Connected Bank',
        bankAccountLast4: selectedAccount.mask || ''
      });

      // Step 5: Reload settings to get updated bank information
      await this.loadSettings();

      this.showSuccess('Bank account connected successfully!');

    } catch (error) {
      console.error('Failed to complete bank connection:', error);
      this.showError('Failed to complete bank connection');
    } finally {
      this.connecting.set(false);
    }
  }

  private handlePlaidExit(error: any, metadata: any) {
    console.log('Plaid exit:', { error, metadata });

    this.connecting.set(false);

    if (error) {
      console.error('Plaid Link error:', error);
      this.showError('Bank connection was cancelled or failed');
    } else {
      // User cancelled without error
      console.log('User cancelled Plaid Link');
    }
  }

  async onDisconnectBank() {
    try {
      const connectedBank = this.connectedBank();
      if (!connectedBank) {
        this.showError('No bank account connected');
        return;
      }

      // Show pricing impact confirmation for disabling the integration
      const confirmed = await this.integrationPricingService.showPricingConfirmation(
        'plaid',
        false, // disabling
        '⚠️ Pricing Impact',
        'Disconnect Bank'
      );

      if (!confirmed) {
        console.log('User cancelled the bank disconnection');
        return;
      }

      // Step 1: Disconnect from Dwolla/Plaid via AchSettings
      await firstValueFrom(this.achSettingsService.disconnectFundingSource({
        fundingSourceId: connectedBank.id
      }));

      // Step 2: Update PayoutSettings to mark bank as disconnected
      await this.payoutSettingsService.updatePayoutSettings({
        bankAccountConnected: false,
        plaidAccessToken: '',
        plaidAccountId: '',
        bankName: '',
        bankAccountLast4: ''
      });

      // Step 3: Reload settings to get updated information
      await this.loadSettings();

      this.showSuccess('Bank account disconnected');
    } catch (error) {
      console.error('Error disconnecting bank:', error);
      this.showError('Failed to disconnect bank account');
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