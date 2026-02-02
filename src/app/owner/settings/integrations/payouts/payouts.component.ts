import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-payouts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payouts.component.html',
  styleUrls: ['./payouts.component.scss']
})
export class Payouts {
  connecting = signal(false);
  bankConnected = signal(false);
  connectedBankName = signal('');
  accountLast4 = signal('');

  async connectBankAccount() {
    this.connecting.set(true);

    try {
      // Step 1: Get Plaid link token from our backend
      const response = await fetch(`${environment.apiUrl}/api/owner/settings/payouts/plaid/link-token`, {
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
    }
  }

  private async handlePlaidSuccess(publicToken: string, metadata: any) {
    try {
      // Step 3: Send public token to our backend for exchange
      const response = await fetch(`${environment.apiUrl}/api/owner/settings/payouts/plaid/exchange-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicToken: publicToken,
          accountId: metadata.accounts[0].id
        }),
        // TODO: Add auth headers
      });

      const result = await response.json();

      // Step 4: Update UI with success state
      this.bankConnected.set(true);
      this.connectedBankName.set(result.bankName);
      this.accountLast4.set(result.accountLast4);

    } catch (error) {
      console.error('Failed to complete bank connection:', error);
    } finally {
      this.connecting.set(false);
    }
  }
}