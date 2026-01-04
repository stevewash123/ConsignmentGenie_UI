import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OwnerService, StorefrontSettings, SalesChannel } from '../../../services/owner.service';

@Component({
  selector: 'app-storefront-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './storefront-settings.component.html',
  styleUrls: ['./storefront-settings.component.scss']
})
export class StorefrontSettingsComponent implements OnInit {
  settings = signal<StorefrontSettings | null>({
    selectedChannel: 'cg_storefront',
    cgStorefront: {
      storeSlug: '',
      useCustomDomain: "false",
      dnsVerified: false,
      stripeConnected: false,
      primaryColor: '#3b82f6',
      accentColor: '#10b981',
      displayStoreHours: false,
      storeHours: [],
      metaTitle: '',
      metaDescription: ''
    }
  });
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  channelOptions = [
    {
      id: 'cg_storefront' as SalesChannel,
      title: 'ConsignmentGenie Storefront',
      description: 'Built-in online store (requires Stripe for accepting online payments)'
    },
    {
      id: 'square' as SalesChannel,
      title: 'Square',
      description: 'POS and online sales through Square'
    },
    {
      id: 'in_store_only' as SalesChannel,
      title: 'In-Store Only',
      description: 'No online sales, manual transaction entry'
    }
  ];

  constructor(private ownerService: OwnerService) {}

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const response = await this.ownerService.getStorefrontSettings().toPromise();
      if (response) {
        // Ensure backward compatibility for useCustomDomain
        if (response.cgStorefront && response.cgStorefront.useCustomDomain === undefined) {
          response.cgStorefront.useCustomDomain = "false";
        }
        this.settings.set(response);
      } else {
        // Set default to ConsignmentGenie Storefront for new settings
        this.settings.set({
          selectedChannel: 'cg_storefront',
          cgStorefront: {
            storeSlug: '',
            useCustomDomain: "false", // Default to ConsignmentGenie subdomain
            dnsVerified: false,
            stripeConnected: false,
            primaryColor: '#3b82f6',
            accentColor: '#10b981',
            displayStoreHours: false,
            storeHours: [],
            metaTitle: '',
            metaDescription: ''
          }
        });
      }
    } catch (error) {
      this.showError('Failed to load storefront settings');
      // Set default even on error
      this.settings.set({
        selectedChannel: 'cg_storefront',
        cgStorefront: {
          storeSlug: '',
          useCustomDomain: "false", // Default to ConsignmentGenie subdomain
          dnsVerified: false,
          stripeConnected: false,
          primaryColor: '#3b82f6',
          accentColor: '#10b981',
          displayStoreHours: false,
          storeHours: [],
          metaTitle: '',
          metaDescription: ''
        }
      });
    }
  }

  async saveSettings() {
    if (!this.settings()) return;

    this.isSaving.set(true);
    try {
      const response = await this.ownerService.updateStorefrontSettings(this.settings()!).toPromise();
      this.showSuccess('Storefront settings saved successfully');
    } catch (error) {
      this.showError('Failed to save storefront settings');
    } finally {
      this.isSaving.set(false);
    }
  }

  onChannelChange() {
    // Handle any channel-specific initialization
  }

  hasConfigurableSettings(): boolean {
    const channel = this.settings()?.selectedChannel;
    // Only CG Storefront has configurable settings that require saving
    return channel === 'cg_storefront';
  }

  // Square methods
  async connectSquare() {
    try {
      this.showSuccess('Square connection functionality not yet implemented');
    } catch (error) {
      this.showError('Failed to connect to Square');
    }
  }

  async disconnectSquare() {
    try {
      this.showSuccess('Square disconnect functionality not yet implemented');
    } catch (error) {
      this.showError('Failed to disconnect Square');
    }
  }

  async syncNow() {
    try {
      this.showSuccess('Manual sync functionality not yet implemented');
    } catch (error) {
      this.showError('Sync failed');
    }
  }

  viewSyncLog() {
    this.showSuccess('Sync log view not yet implemented');
  }

  // Shopify methods
  async connectShopify() {
    try {
      this.showSuccess('Shopify connection functionality not yet implemented');
    } catch (error) {
      this.showError('Failed to connect to Shopify');
    }
  }

  async disconnectShopify() {
    try {
      this.showSuccess('Shopify disconnect functionality not yet implemented');
    } catch (error) {
      this.showError('Failed to disconnect Shopify');
    }
  }

  openShopifyStore() {
    window.open('https://your-store.myshopify.com', '_blank');
  }

  // CG Storefront methods
  verifyDns() {
    this.showSuccess('DNS verification functionality not yet implemented');
  }

  async connectStripe() {
    try {
      this.showSuccess('Stripe connection functionality not yet implemented');
    } catch (error) {
      this.showError('Failed to connect to Stripe');
    }
  }

  async disconnectStripe() {
    try {
      this.showSuccess('Stripe disconnect functionality not yet implemented');
    } catch (error) {
      this.showError('Failed to disconnect Stripe');
    }
  }

  openStripeDashboard() {
    window.open('https://dashboard.stripe.com', '_blank');
  }

  onBannerSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.settings()?.cgStorefront) {
          const settings = this.settings()!;
          settings.cgStorefront!.bannerImageUrl = e.target?.result as string;
          this.settings.set({ ...settings });
        }
      };
      reader.readAsDataURL(file);
    }
  }

  private showSuccess(message: string) {
    this.successMessage.set(message);
    this.errorMessage.set('');
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  private showError(message: string) {
    this.errorMessage.set(message);
    this.successMessage.set('');
    setTimeout(() => this.errorMessage.set(''), 5000);
  }
}