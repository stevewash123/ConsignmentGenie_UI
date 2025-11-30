import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-subscription-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="subscription-settings">
      <div class="settings-header">
        <h2>Subscription & Billing</h2>
        <p>Manage your ConsignmentGenie plan, payment method, and billing history</p>
      </div>

      <div class="coming-soon">
        <h3>🚧 Coming Soon</h3>
        <p>Subscription management features are currently under development. This page will include:</p>
        <ul>
          <li>Current plan details and features</li>
          <li>Plan upgrade/downgrade options</li>
          <li>Payment method management</li>
          <li>Billing history and invoices</li>
          <li>Usage statistics and limits</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .subscription-settings {
      padding: 2rem;
      max-width: 800px;
    }

    .settings-header {
      margin-bottom: 2rem;
    }

    .settings-header h2 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .settings-header p {
      color: #6b7280;
      font-size: 1rem;
    }

    .coming-soon {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 3rem;
      text-align: center;
    }

    .coming-soon h3 {
      font-size: 1.5rem;
      color: #111827;
      margin-bottom: 1rem;
    }

    .coming-soon p {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .coming-soon ul {
      list-style: none;
      padding: 0;
      max-width: 400px;
      margin: 0 auto;
      text-align: left;
    }

    .coming-soon li {
      padding: 0.5rem 0;
      color: #374151;
      position: relative;
      padding-left: 1.5rem;
    }

    .coming-soon li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
  `]
})
export class SubscriptionSettingsComponent implements OnInit {

  ngOnInit() {
    // Implementation coming soon
  }
}