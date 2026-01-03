import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-payouts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="section">
      <h2 class="section-title">Bank Account Setup</h2>
      <p class="section-description">Connect bank accounts for automated consignor payouts</p>

      <!-- Banking Setup Card -->
      <div class="integration-card">
        <div class="integration-header">
          <div class="integration-title">
            <div class="integration-logo">🏦</div>
            <h3>Bank Account Verification</h3>
          </div>
        </div>
        <div class="integration-content">
          <p class="integration-description">
            Connect your shop's bank account securely using Plaid to enable automated ACH transfers to consignors.
            This replaces manual check writing and cash payments.
          </p>

          <div class="setup-actions">
            <button class="setup-btn primary" (click)="connectBankAccount()" [disabled]="connecting()">
              <span class="btn-icon">🔗</span>
              {{ connecting() ? 'Connecting...' : 'Connect Bank Account' }}
            </button>
            <p class="help-text">Opens secure Plaid modal to verify your bank account</p>
          </div>

          <div class="connection-status" *ngIf="bankConnected()">
            <div class="status-success">
              <span class="status-icon">✅</span>
              <div class="status-details">
                <strong>{{connectedBankName()}}</strong>
                <span class="account-mask">Account ending in {{accountLast4()}}</span>
              </div>
            </div>
          </div>

          <div class="info-box">
            <h4>What you'll get with bank account verification:</h4>
            <ul>
              <li>Secure bank account connection via Plaid</li>
              <li>Automated ACH transfers to verified accounts</li>
              <li>Lower processing fees than checks or cash</li>
              <li>Faster payments to consignors</li>
              <li>Built-in fraud protection and compliance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .section {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      max-width: 800px;
    }
    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #111827;
    }
    .section-description {
      color: #6b7280;
      margin-bottom: 2rem;
    }
    .integration-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
    }
    .integration-header {
      margin-bottom: 1rem;
    }
    .integration-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .integration-title h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }
    .integration-logo {
      width: 2.5rem;
      height: 2.5rem;
      background: #3b82f6;
      color: white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .integration-content {
      margin-top: 1rem;
    }
    .integration-description {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
    .setup-actions {
      margin-bottom: 1.5rem;
    }
    .connection-status {
      margin-bottom: 1.5rem;
    }
    .status-success {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #dcfce7;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
    }
    .status-icon {
      font-size: 1.25rem;
    }
    .status-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .status-details strong {
      color: #166534;
    }
    .account-mask {
      font-size: 0.875rem;
      color: #166534;
    }
    .setup-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }
    .setup-btn.primary {
      background: #3b82f6;
      color: white;
    }
    .setup-btn.primary:hover {
      background: #2563eb;
    }
    .btn-icon {
      font-size: 1.1rem;
    }
    .help-text {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.5rem;
      margin-bottom: 0;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 1rem;
      margin-top: 1.5rem;
    }
    .info-box h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.75rem;
    }
    .info-box ul {
      margin: 0;
      padding-left: 1rem;
      color: #6b7280;
      font-size: 0.875rem;
    }
    .info-box li {
      margin-bottom: 0.25rem;
    }
  `]
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