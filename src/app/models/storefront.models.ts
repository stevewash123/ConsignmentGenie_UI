import { PaymentSettings } from './business.models';

export interface ShippingSettings {
  enableShipping: boolean;
  flatRate: number;
  freeShippingThreshold: number;
  shipsFromZipCode: string;
}

export interface SalesSettings {
  enableBestOffer: boolean;
  autoAcceptPercentage: number;
  minimumOfferPercentage: number;
}

export interface CgStorefrontSettings {
  storeSlug: string;
  bannerImageUrl: string;
  stripeConnected: boolean;
  paymentSettings: PaymentSettings;
  shippingSettings: ShippingSettings;
  salesSettings: SalesSettings;
}

export interface StorefrontSettings {
  selectedChannel: string;
  cgStorefront: CgStorefrontSettings;
}