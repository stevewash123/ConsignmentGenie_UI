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
  styleUrls: ['./settings-layout.component.scss']
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
          id: 'onboarding',
          label: 'Consignor Onboarding',
          route: 'consignors/onboarding',
          description: 'Agreement requirements and approval settings'
        },
        {
          id: 'defaults',
          label: 'Default Terms',
          route: 'consignors',
          description: 'Commission rates, time periods'
        },
        {
          id: 'permissions',
          label: 'Default Permissions',
          route: 'consignor-management/permissions',
          description: 'Default inventory and analytics permissions for all consignors'
        }
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