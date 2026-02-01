import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { StorefrontSettingsService } from '../../../services/storefront-settings.service';
import { StorefrontSettings } from '../../../models/storefront.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-storefront-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './storefront-settings.component.html',
  styleUrls: ['./storefront-settings.component.scss']
})
export class StorefrontSettingsComponent implements OnInit, OnDestroy {
  storefrontSettings = signal<StorefrontSettings | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  private subscriptions = new Subscription();

  // Auto-save status computed from settings state
  autoSaveStatus = computed(() => {
    const settings = this.storefrontSettings();
    return settings ? 'Saved automatically' : 'Loading...';
  });

  channelOptions = [
    {
      id: 'cg-storefront',
      title: 'ConsignmentGenie Storefront',
      description: 'Built-in online store with payment processing and shipping options'
    },
    {
      id: 'square',
      title: 'Square',
      description: 'POS and online sales through Square'
    },
    {
      id: 'in-store-only',
      title: 'In-Store Only',
      description: 'No online sales, manual transaction entry'
    }
  ];

  constructor(private storefrontSettingsService: StorefrontSettingsService) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadStorefrontSettings();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupSubscriptions(): void {
    // Subscribe to storefront settings changes from the service
    this.subscriptions.add(
      this.storefrontSettingsService.storefrontSettings.subscribe(settings => {
        this.storefrontSettings.set(settings);
      })
    );
  }

  async loadStorefrontSettings(): Promise<void> {
    try {
      await this.storefrontSettingsService.loadStorefrontSettings();
    } catch (error) {
      console.error('Error loading storefront settings:', error);
      this.showError('Failed to load storefront settings');
    }
  }

  // Individual change handlers for debounced auto-save
  onStoreSlugChange(value: string): void {
    this.storefrontSettingsService.updateStorefrontSetting('storeSlug', value);
  }

  onBannerImageUrlChange(value: string): void {
    this.storefrontSettingsService.updateStorefrontSetting('bannerImageUrl', value);
  }

  onStripeConnectedChange(value: boolean): void {
    this.storefrontSettingsService.updateStorefrontSetting('stripeConnected', value);
  }

  // Payment settings handlers
  onEnableCreditCardsChange(value: boolean): void {
    this.storefrontSettingsService.updateStorefrontSetting('paymentSettings.enableCreditCards', value);
  }

  onEnableBuyNowChange(value: boolean): void {
    this.storefrontSettingsService.updateStorefrontSetting('paymentSettings.enableBuyNow', value);
  }

  onEnableLayawayChange(value: boolean): void {
    this.storefrontSettingsService.updateStorefrontSetting('paymentSettings.enableLayaway', value);
  }

  onLayawayDepositPercentageChange(value: number): void {
    this.storefrontSettingsService.updateStorefrontSetting('paymentSettings.layawayDepositPercentage', value);
  }

  onLayawayTermsInDaysChange(value: number): void {
    this.storefrontSettingsService.updateStorefrontSetting('paymentSettings.layawayTermsInDays', value);
  }

  // Shipping settings handlers
  onEnableShippingChange(value: boolean): void {
    this.storefrontSettingsService.updateStorefrontSetting('shippingSettings.enableShipping', value);
  }

  onFlatRateChange(value: number): void {
    this.storefrontSettingsService.updateStorefrontSetting('shippingSettings.flatRate', value);
  }

  onFreeShippingThresholdChange(value: number): void {
    this.storefrontSettingsService.updateStorefrontSetting('shippingSettings.freeShippingThreshold', value);
  }

  onShipsFromZipCodeChange(value: string): void {
    this.storefrontSettingsService.updateStorefrontSetting('shippingSettings.shipsFromZipCode', value);
  }

  // Sales settings handlers
  onEnableBestOfferChange(value: boolean): void {
    this.storefrontSettingsService.updateStorefrontSetting('salesSettings.enableBestOffer', value);
  }

  onAutoAcceptPercentageChange(value: number): void {
    this.storefrontSettingsService.updateStorefrontSetting('salesSettings.autoAcceptPercentage', value);
  }

  onMinimumOfferPercentageChange(value: number): void {
    this.storefrontSettingsService.updateStorefrontSetting('salesSettings.minimumOfferPercentage', value);
  }

  onChannelChange(selectedChannel: string): void {
    // Handle channel changes - this would require updating the selectedChannel in settings
    // For now, we'll focus on CG Storefront settings which is the main channel
    console.log('Channel changed to:', selectedChannel);
  }

  hasConfigurableSettings(): boolean {
    const channel = this.storefrontSettings()?.selectedChannel;
    // Only CG Storefront has configurable settings that require saving
    return channel === 'cg-storefront';
  }

  onBannerSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const bannerUrl = e.target?.result as string;
        this.onBannerImageUrlChange(bannerUrl);
      };
      reader.readAsDataURL(file);
    }
  }

  // Helper methods for template
  getStoreSlug(): string {
    return this.storefrontSettings()?.cgStorefront?.storeSlug || '';
  }

  getBannerImageUrl(): string {
    return this.storefrontSettings()?.cgStorefront?.bannerImageUrl || '';
  }

  getStripeConnected(): boolean {
    return this.storefrontSettings()?.cgStorefront?.stripeConnected || false;
  }

  // Payment settings getters
  getEnableCreditCards(): boolean {
    return this.storefrontSettings()?.cgStorefront?.paymentSettings?.enableCreditCards || true;
  }

  getEnableBuyNow(): boolean {
    return this.storefrontSettings()?.cgStorefront?.paymentSettings?.enableBuyNow || true;
  }

  getEnableLayaway(): boolean {
    return this.storefrontSettings()?.cgStorefront?.paymentSettings?.enableLayaway || false;
  }

  getLayawayDepositPercentage(): number {
    return this.storefrontSettings()?.cgStorefront?.paymentSettings?.layawayDepositPercentage || 25;
  }

  getLayawayTermsInDays(): number {
    return this.storefrontSettings()?.cgStorefront?.paymentSettings?.layawayTermsInDays || 30;
  }

  // Shipping settings getters
  getEnableShipping(): boolean {
    return this.storefrontSettings()?.cgStorefront?.shippingSettings?.enableShipping || false;
  }

  getFlatRate(): number {
    return this.storefrontSettings()?.cgStorefront?.shippingSettings?.flatRate || 0;
  }

  getFreeShippingThreshold(): number {
    return this.storefrontSettings()?.cgStorefront?.shippingSettings?.freeShippingThreshold || 0;
  }

  getShipsFromZipCode(): string {
    return this.storefrontSettings()?.cgStorefront?.shippingSettings?.shipsFromZipCode || '';
  }

  // Sales settings getters
  getEnableBestOffer(): boolean {
    return this.storefrontSettings()?.cgStorefront?.salesSettings?.enableBestOffer || false;
  }

  getAutoAcceptPercentage(): number {
    return this.storefrontSettings()?.cgStorefront?.salesSettings?.autoAcceptPercentage || 0;
  }

  getMinimumOfferPercentage(): number {
    return this.storefrontSettings()?.cgStorefront?.salesSettings?.minimumOfferPercentage || 0;
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

  // Stripe integration methods
  connectToStripe(): void {
    this.showSuccess('Redirecting to Stripe...');
    // TODO: Implement Stripe OAuth connection flow
    console.log('Connect to Stripe initiated');
  }

  disconnectFromStripe(): void {
    // TODO: Implement Stripe disconnection
    this.onStripeConnectedChange(false);
    this.showSuccess('Disconnected from Stripe');
    console.log('Disconnect from Stripe initiated');
  }

  configureStripe(): void {
    // TODO: Implement Stripe configuration modal/page
    console.log('Configure Stripe settings initiated');
    this.showSuccess('Stripe configuration opened');
  }
}