import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { OwnerLayoutComponent } from '../components/owner-layout.component';
import { filter } from 'rxjs/operators';

interface SettingsSubMenuItem {
  id: string;
  label: string;
  route: string;
  description: string;
}

interface SettingsMenuItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  description: string;
  children?: SettingsSubMenuItem[];
}

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, OwnerLayoutComponent],
  templateUrl: './settings-layout.component.html',
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

    .menu-item .expand-icon {
      margin-left: auto;
      transition: transform 0.2s ease;
    }

    .menu-item .expand-icon.expanded {
      transform: rotate(90deg);
    }

    .submenu {
      background: #f8fafc;
      border-left: 2px solid #e5e7eb;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .submenu.expanded {
      max-height: 500px;
    }

    .submenu-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem 0.75rem 2rem;
      color: #6b7280;
      text-decoration: none;
      border-bottom: 1px solid #f3f4f6;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .submenu-item:last-child {
      border-bottom: none;
    }

    .submenu-item:hover {
      background: #f1f5f9;
      color: #374151;
    }

    .submenu-item.active {
      background: #dbeafe;
      color: #1d4ed8;
      border-left: 2px solid #3b82f6;
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
export class SettingsLayoutComponent implements OnInit {
  expandedSections: Set<string> = new Set();

  menuItems: SettingsMenuItem[] = [
    {
      id: 'store-profile',
      label: 'Store Profile',
      icon: '🏪',
      description: 'Shop branding, contact info, domain',
      children: [
        {
          id: 'basic-info',
          label: 'Basic Information',
          route: 'store-profile/basic-info',
          description: 'Shop name, address, contact details'
        },
        {
          id: 'branding',
          label: 'Branding',
          route: 'profile/branding',
          description: 'Logo, colors, shop description'
        },
        {
          id: 'online-storefront',
          label: 'Online Storefront',
          route: 'storefront',
          description: 'Online store configuration and integrations'
        }
      ]
    },
    {
      id: 'business-settings',
      label: 'Business Settings',
      icon: '⚙️',
      description: 'Tax rates, receipts, policies',
      children: [
        {
          id: 'tax-settings',
          label: 'Tax Settings',
          route: 'business/tax-settings',
          description: 'Tax rates and calculations'
        },
        {
          id: 'receipt-settings',
          label: 'Receipt Settings',
          route: 'business/receipt-settings',
          description: 'Receipt templates and formatting'
        },
        {
          id: 'policies',
          label: 'Shop Policies',
          route: 'business/policies',
          description: 'Return, refund, and general policies'
        }
      ]
    },
    {
      id: 'consignor-settings',
      label: 'Consignor Settings',
      icon: '👥',
      description: 'Default permissions and terms for consignors',
      children: [
        {
          id: 'permissions',
          label: 'Default Permissions',
          route: 'consignor-management/permissions',
          description: 'Default inventory and analytics permissions for all consignors'
        },
        {
          id: 'defaults',
          label: 'Default Terms',
          route: 'consignors',
          description: 'Commission rates, time periods'
        },
      ]
    },
    {
      id: 'payouts',
      label: 'Payout Settings',
      icon: '💰',
      description: 'Configure payout schedules, methods, and automation',
      children: [
        {
          id: 'schedule-thresholds',
          label: 'Schedule & Thresholds',
          route: 'payouts/schedule-thresholds',
          description: 'Payout frequency, minimum amounts, and hold periods'
        },
        {
          id: 'payment-methods',
          label: 'Payment Methods',
          route: 'payouts/payment-methods',
          description: 'Available payment options and processing fees'
        },
        {
          id: 'automation',
          label: 'Automation',
          route: 'payouts/automation',
          description: 'Automatic payout generation and approval settings'
        },
        {
          id: 'reports',
          label: 'Reports & Statements',
          route: 'payouts/reports',
          description: 'Statement generation and formatting options'
        }
      ]
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: '🔗',
      description: 'External services and connections',
      children: [
        {
          id: 'inventory',
          label: 'Inventory',
          route: 'integrations/inventory',
          description: 'Item management and tracking setup'
        },
        {
          id: 'sales',
          label: 'Sales',
          route: 'integrations/sales',
          description: 'POS systems and online storefronts'
        },
        {
          id: 'accounting',
          label: 'Accounting',
          route: 'integrations/accounting',
          description: 'QuickBooks, Xero integrations'
        },
        {
          id: 'payments',
          label: 'Payment Processing',
          route: 'integrations/payments',
          description: 'Stripe, Square payment setup'
        },
        {
          id: 'payouts',
          label: 'Payouts',
          route: 'integrations/payouts',
          description: 'Configure payout methods and banking integrations'
        }
      ]
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      route: 'notifications',
      description: 'SMS and email notification preferences for all events'
    },
    {
      id: 'account-settings',
      label: 'Account',
      icon: '👤',
      description: 'Account profile and subscription information',
      children: [
        {
          id: 'billing',
          label: 'Billing & Subscription',
          route: 'account/billing',
          description: 'Subscription management and billing portal'
        },
        {
          id: 'owner-contact-info',
          label: 'Owner Contact Information',
          route: 'account/owner-contact-info',
          description: 'Business and personal contact information'
        }
      ]
    }
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Initialize expanded sections based on current route
    this.updateExpandedSectionFromRoute();

    // Listen for route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateExpandedSectionFromRoute();
    });
  }

  toggleSection(sectionId: string): void {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
  }

  isExpanded(sectionId: string): boolean {
    return this.expandedSections.has(sectionId);
  }

  navigateToSubItem(subItem: SettingsSubMenuItem): void {
    this.router.navigate([subItem.route], { relativeTo: this.activatedRoute });
  }

  private updateExpandedSectionFromRoute(): void {
    const currentUrl = this.router.url;

    // Clear previous state
    this.expandedSections.clear();

    // Find which section should be expanded based on current route
    for (const item of this.menuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (currentUrl.includes(child.route)) {
            this.expandedSections.add(item.id);
            break;
          }
        }
      }
    }
  }
}