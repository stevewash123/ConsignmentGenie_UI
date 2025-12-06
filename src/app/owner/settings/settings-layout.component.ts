import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AppLayoutComponent } from '../../shared/components/app-layout.component';

interface SettingsMenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  description: string;
}

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AppLayoutComponent],
  template: `
    <app-layout>
      <div class="settings-layout">
        <!-- Header -->
        <div class="settings-header">
          <h1>Settings</h1>
          <p>Manage your shop configuration and preferences</p>
        </div>

        <!-- Main Content -->
        <div class="settings-container">
          <!-- Sidebar Navigation -->
          <nav class="settings-sidebar">
            <div class="sidebar-menu">
              <a
                *ngFor="let item of menuItems"
                [routerLink]="['/owner/settings', item.route]"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{exact: item.route === ''}"
                class="menu-item">
                <span class="menu-icon">{{ item.icon }}</span>
                <span class="menu-label">{{ item.label }}</span>
              </a>
            </div>
          </nav>

          <!-- Content Area -->
          <main class="settings-content">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .settings-layout {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .settings-header {
      margin-bottom: 2rem;
      text-align: center;
    }

    .settings-header h1 {
      font-size: 2.25rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .settings-header p {
      color: #6b7280;
      font-size: 1.1rem;
    }

    .settings-container {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 2rem;
      align-items: start;
    }

    .settings-sidebar {
      position: sticky;
      top: 2rem;
    }

    .sidebar-menu {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      text-decoration: none;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .menu-item:last-child {
      border-bottom: none;
    }

    .menu-item:hover {
      background: #f9fafb;
      color: #111827;
    }

    .menu-item.active {
      background: #eff6ff;
      color: #1d4ed8;
      border-left: 3px solid #3b82f6;
    }

    .menu-icon {
      font-size: 1.25rem;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .menu-label {
      font-weight: 500;
      font-size: 0.95rem;
    }

    .settings-content {
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      min-height: 600px;
    }

    /* Mobile Responsive */
    @media (max-width: 968px) {
      .settings-layout {
        padding: 1rem;
      }

      .settings-container {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .settings-sidebar {
        position: static;
        order: 2;
      }

      .sidebar-menu {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0;
      }

      .menu-item {
        justify-content: center;
        text-align: center;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem;
        border-bottom: 1px solid #f3f4f6;
        border-right: 1px solid #f3f4f6;
      }

      .menu-item:last-child {
        border-right: none;
      }

      .settings-content {
        order: 1;
      }
    }

    @media (max-width: 640px) {
      .sidebar-menu {
        grid-template-columns: 1fr;
      }

      .menu-item {
        flex-direction: row;
        justify-content: flex-start;
        text-align: left;
      }
    }
  `]
})
export class SettingsLayoutComponent {
  menuItems: SettingsMenuItem[] = [
    {
      id: 'hub',
      label: 'Overview',
      icon: '🏠',
      route: '',
      description: 'Settings overview'
    },
    {
      id: 'profile',
      label: 'Shop Profile',
      icon: '🏪',
      route: 'profile',
      description: 'Shop identity & contact info'
    },
    {
      id: 'business',
      label: 'Business',
      icon: '💼',
      route: 'business',
      description: 'Commission, tax, payouts'
    },
    {
      id: 'storefront',
      label: 'Storefront',
      icon: '🛒',
      route: 'storefront',
      description: 'Sales channels'
    },
    {
      id: 'accounting',
      label: 'Accounting',
      icon: '📊',
      route: 'accounting',
      description: 'QuickBooks & reports'
    },
    {
      id: 'consignors',
      label: 'Consignors',
      icon: '👥',
      route: 'consignors',
      description: 'Store code & invites'
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: '💳',
      route: 'subscription',
      description: 'Plan & billing'
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: '🔗',
      route: 'integrations',
      description: 'Square, QuickBooks & more'
    },
    {
      id: 'account',
      label: 'Account',
      icon: '👤',
      route: 'account',
      description: 'Profile & security'
    }
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}
}