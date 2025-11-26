import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-role-selection',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="role-selection-page">
      <!-- Header -->
      <header class="header">
        <div class="container">
          <h1 class="logo">Consignment Genie</h1>
          <nav class="nav">
            <a routerLink="/login" class="nav-link">Sign In</a>
          </nav>
        </div>
      </header>

      <!-- Role Selection -->
      <main class="selection-main">
        <div class="container">
          <div class="selection-header">
            <h2>Create Your Account</h2>
            <p>Choose how you want to get started with Consignment Genie</p>
          </div>

          <div class="role-options">
            <!-- Owner Option -->
            <a routerLink="/signup/owner" class="role-card owner-card">
              <div class="role-icon">🏪</div>
              <h3>Open a Consignment Shop</h3>
              <p>Start your own consignment business. Manage providers, track inventory, and process sales all in one place.</p>
              <ul class="feature-list">
                <li>Set up your shop instantly</li>
                <li>Manage consignors and inventory</li>
                <li>Process sales and payouts</li>
                <li>Full business dashboard</li>
              </ul>
              <div class="cta-button">Get Started</div>
            </a>

            <!-- Provider Option -->
            <a routerLink="/signup/provider" class="role-card provider-card">
              <div class="role-icon">🎨</div>
              <h3>Consign Items at a Shop</h3>
              <p>Join an existing consignment shop to sell your items. Track your inventory and earnings with ease.</p>
              <ul class="feature-list">
                <li>Quick and easy signup</li>
                <li>Submit items for consignment</li>
                <li>Track your sales and earnings</li>
                <li>Get paid automatically</li>
              </ul>
              <div class="cta-button">Join a Shop</div>
            </a>
          </div>

          <!-- Login Link -->
          <div class="login-section">
            <p>Already have an account? <a routerLink="/login">Sign in here</a></p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .role-selection-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .header {
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 1rem 0;
    }

    .header .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      color: #047857;
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0;
    }

    .nav-link {
      color: #6b7280;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .nav-link:hover {
      color: #047857;
    }

    .selection-main {
      padding: 3rem 0 4rem;
    }

    .selection-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .selection-header h2 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .selection-header p {
      font-size: 1.25rem;
      color: #6b7280;
      margin: 0;
    }

    .role-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .role-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border: 2px solid transparent;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .role-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      transition: all 0.3s;
    }

    .owner-card::before {
      background: linear-gradient(90deg, #047857, #059669);
    }

    .provider-card::before {
      background: linear-gradient(90deg, #7c3aed, #8b5cf6);
    }

    .role-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .owner-card:hover {
      border-color: #047857;
    }

    .provider-card:hover {
      border-color: #7c3aed;
    }

    .role-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      line-height: 1;
    }

    .role-card h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .role-card p {
      font-size: 1.1rem;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0 0 2rem 0;
      width: 100%;
    }

    .feature-list li {
      padding: 0.5rem 0;
      color: #374151;
      font-weight: 500;
      position: relative;
      padding-left: 1.5rem;
    }

    .feature-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #059669;
      font-weight: 700;
    }

    .provider-card .feature-list li::before {
      color: #7c3aed;
    }

    .cta-button {
      background: #047857;
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1.125rem;
      transition: all 0.2s;
      margin-top: auto;
      min-width: 160px;
    }

    .provider-card .cta-button {
      background: #7c3aed;
    }

    .role-card:hover .cta-button {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }

    .owner-card:hover .cta-button {
      background: #065f46;
    }

    .provider-card:hover .cta-button {
      background: #6b21a8;
    }

    .login-section {
      text-align: center;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    .login-section p {
      color: #6b7280;
      font-size: 1.1rem;
      margin: 0;
    }

    .login-section a {
      color: #047857;
      text-decoration: none;
      font-weight: 600;
    }

    .login-section a:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .selection-main {
        padding: 2rem 0;
      }

      .selection-header h2 {
        font-size: 2rem;
      }

      .selection-header p {
        font-size: 1.1rem;
      }

      .role-options {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .role-card {
        padding: 2rem;
      }

      .role-icon {
        font-size: 3rem;
      }

      .role-card h3 {
        font-size: 1.25rem;
      }

      .role-card p {
        font-size: 1rem;
      }
    }
  `]
})
export class RoleSelectionComponent {
}