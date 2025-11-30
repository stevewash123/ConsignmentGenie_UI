import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type SalesChannel = 'square' | 'shopify' | 'cg_storefront' | 'in_store_only';

interface StorefrontSettings {
  selectedChannel: SalesChannel;
  square?: {
    connected: boolean;
    businessName?: string;
    locationName?: string;
    connectedAt?: Date;
    syncInventory: boolean;
    importSales: boolean;
    syncCustomers: boolean;
    syncFrequency: string;
    categoryMappings: Array<{ cgCategory: string; squareCategory: string }>;
  };
  shopify?: {
    connected: boolean;
    storeName?: string;
    connectedAt?: Date;
    pushInventory: boolean;
    importOrders: boolean;
    syncImages: boolean;
    autoMarkSold: boolean;
    collectionMappings: Array<{ cgCategory: string; shopifyCollection: string }>;
  };
  cgStorefront?: {
    storeSlug: string;
    customDomain?: string;
    dnsVerified: boolean;
    stripeConnected: boolean;
    stripeAccountName?: string;
    bannerImageUrl?: string;
    primaryColor: string;
    accentColor: string;
    displayStoreHours: boolean;
    storeHours: Array<{ day: string; open: string; close: string; enabled: boolean }>;
    metaTitle: string;
    metaDescription: string;
  };
  inStoreOnly?: {
    defaultPaymentMethod: string;
    requireReceiptNumber: boolean;
    autoGenerateReceipts: boolean;
  };
}

@Component({
  selector: 'app-storefront-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="storefront-settings">
      <div class="settings-header">
        <h2>Storefront & Sales Channels</h2>
        <p>Configure how you sell to customers and manage your online presence</p>
      </div>

      <div class="settings-form" *ngIf="settings()">
        <!-- Channel Selection -->
        <div class="form-section">
          <h3>How do you sell to customers?</h3>

          <div class="channel-options">
            <label
              *ngFor="let option of channelOptions"
              class="channel-option"
              [class.selected]="settings()?.selectedChannel === option.id">
              <input
                type="radio"
                [value]="option.id"
                [(ngModel)]="settings()!.selectedChannel"
                name="salesChannel"
                (change)="onChannelChange()">
              <div class="option-content">
                <div class="option-header">
                  <span class="option-title">{{ option.title }}</span>
                </div>
                <div class="option-description">{{ option.description }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Square Settings -->
        <div class="form-section" *ngIf="settings()?.selectedChannel === 'square'">
          <h3>Square Integration</h3>

          <div *ngIf="!settings()?.square?.connected" class="integration-setup">
            <div class="setup-info">
              <h4>Connect to Square</h4>
              <p>Integrate with your Square POS system for unified inventory and payment processing.</p>
              <button class="btn-primary" (click)="connectSquare()">Connect to Square</button>
            </div>
          </div>

          <div *ngIf="settings()?.square?.connected" class="integration-connected">
            <div class="connection-status">
              <h4>✅ Connected</h4>
              <div class="connection-details">
                <div><strong>Business:</strong> {{ settings()?.square?.businessName }}</div>
                <div><strong>Location:</strong> {{ settings()?.square?.locationName }}</div>
                <div><strong>Connected:</strong> {{ settings()?.square?.connectedAt | date:'mediumDate' }}</div>
              </div>
              <button class="btn-danger-outline" (click)="disconnectSquare()">Disconnect Square</button>
            </div>

            <div class="sync-settings">
              <h4>Sync Settings</h4>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="settings()!.square!.syncInventory" name="squareSyncInventory">
                  <span class="checkmark"></span>
                  Sync inventory to Square
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="settings()!.square!.importSales" name="squareImportSales">
                  <span class="checkmark"></span>
                  Import sales from Square automatically
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="settings()!.square!.syncCustomers" name="squareSyncCustomers">
                  <span class="checkmark"></span>
                  Sync customer data
                </label>
              </div>

              <div class="form-group">
                <label for="squareSyncFreq">Sync Frequency</label>
                <select id="squareSyncFreq" [(ngModel)]="settings()!.square!.syncFrequency" class="form-select">
                  <option value="5min">Every 5 minutes</option>
                  <option value="15min">Every 15 minutes</option>
                  <option value="30min">Every 30 minutes</option>
                  <option value="1hour">Every hour</option>
                </select>
              </div>
            </div>

            <div class="sync-log">
              <h4>Recent Sync Activity</h4>
              <div class="activity-log">
                <div class="log-entry">Today 2:45 PM - ✓ 12 items synced</div>
                <div class="log-entry">Today 2:30 PM - ✓ 3 sales imported</div>
                <div class="log-entry">Today 2:15 PM - ✓ 8 items synced</div>
                <div class="log-entry">Today 2:00 PM - ⚠ 1 item failed (no image)</div>
              </div>
              <div class="sync-actions">
                <button class="btn-secondary" (click)="viewSyncLog()">View Full Sync Log</button>
                <button class="btn-primary" (click)="syncNow()">Sync Now</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Shopify Settings -->
        <div class="form-section" *ngIf="settings()?.selectedChannel === 'shopify'">
          <h3>Shopify Integration</h3>

          <div *ngIf="!settings()?.shopify?.connected" class="integration-setup">
            <div class="setup-info">
              <h4>Connect to Shopify</h4>
              <p>Sync your inventory with your Shopify store for seamless online sales.</p>
              <button class="btn-primary" (click)="connectShopify()">Connect to Shopify</button>
            </div>
          </div>

          <div *ngIf="settings()?.shopify?.connected" class="integration-connected">
            <div class="connection-status">
              <h4>✅ Connected</h4>
              <div class="connection-details">
                <div><strong>Store:</strong> {{ settings()?.shopify?.storeName }}</div>
                <div><strong>Connected:</strong> {{ settings()?.shopify?.connectedAt | date:'mediumDate' }}</div>
              </div>
              <div class="connection-actions">
                <button class="btn-secondary" (click)="openShopifyStore()">View Shopify Store ↗</button>
                <button class="btn-danger-outline" (click)="disconnectShopify()">Disconnect</button>
              </div>
            </div>

            <div class="sync-settings">
              <h4>Sync Settings</h4>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="settings()!.shopify!.pushInventory" name="shopifyPushInventory">
                  <span class="checkmark"></span>
                  Push inventory to Shopify
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="settings()!.shopify!.importOrders" name="shopifyImportOrders">
                  <span class="checkmark"></span>
                  Import orders from Shopify automatically
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="settings()!.shopify!.syncImages" name="shopifySyncImages">
                  <span class="checkmark"></span>
                  Sync product images
                </label>
              </div>

              <div class="radio-group">
                <span class="radio-label-header">When item sells in Shopify:</span>
                <label class="radio-label">
                  <input type="radio" [value]="true" [(ngModel)]="settings()!.shopify!.autoMarkSold" name="shopifyAutoMark">
                  <span class="radio-mark"></span>
                  Automatically mark sold in ConsignmentGenie
                </label>
                <label class="radio-label">
                  <input type="radio" [value]="false" [(ngModel)]="settings()!.shopify!.autoMarkSold" name="shopifyAutoMark">
                  <span class="radio-mark"></span>
                  Create pending sale for review
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- CG Storefront Settings -->
        <div class="form-section" *ngIf="settings()?.selectedChannel === 'cg_storefront'">
          <h3>ConsignmentGenie Storefront</h3>

          <div class="form-group">
            <label for="storeUrl">Your Store URL</label>
            <div class="url-input">
              <span class="url-prefix">consignmentgenie.com/shop/</span>
              <input
                type="text"
                id="storeUrl"
                [(ngModel)]="settings()!.cgStorefront!.storeSlug"
                name="storeSlug"
                class="form-input url-slug"
                placeholder="your-store-name">
              <span class="url-status">✓ Available</span>
            </div>
          </div>

          <div class="form-group">
            <label for="customDomain">Custom Domain (optional)</label>
            <input
              type="url"
              id="customDomain"
              [(ngModel)]="settings()!.cgStorefront!.customDomain"
              name="customDomain"
              class="form-input"
              placeholder="shop.yourstore.com">
            <div class="domain-status" [class.verified]="settings()?.cgStorefront?.dnsVerified">
              {{ settings()?.cgStorefront?.dnsVerified ? '✅ DNS verified' : '⚠️ DNS not verified' }}
              <button *ngIf="!settings()?.cgStorefront?.dnsVerified" class="btn-link" (click)="verifyDns()">Verify DNS</button>
            </div>
          </div>

          <div class="stripe-section">
            <h4>Payment Processing (Stripe)</h4>
            <div *ngIf="!settings()?.cgStorefront?.stripeConnected" class="stripe-setup">
              <div class="setup-warning">
                <span class="warning-icon">⚠️</span>
                <div>
                  <strong>Stripe Required</strong>
                  <p>To accept payments on your CG storefront, you need to connect a Stripe account.</p>
                </div>
              </div>
              <button class="btn-primary" (click)="connectStripe()">Connect Stripe</button>
            </div>

            <div *ngIf="settings()?.cgStorefront?.stripeConnected" class="stripe-connected">
              <div class="stripe-status">
                <span class="status-icon">✅</span>
                <div>
                  <strong>Stripe Connected</strong>
                  <div>Account: {{ settings()?.cgStorefront?.stripeAccountName }}</div>
                  <div>Accepting: Visa, MC, Amex, Apple Pay</div>
                </div>
              </div>
              <div class="stripe-actions">
                <button class="btn-secondary" (click)="openStripeDashboard()">View Stripe Dashboard ↗</button>
                <button class="btn-danger-outline" (click)="disconnectStripe()">Disconnect</button>
              </div>
            </div>
          </div>

          <div class="branding-section">
            <h4>Store Branding</h4>
            <div class="form-group">
              <label for="bannerImage">Banner Image</label>
              <div class="image-upload">
                <div class="image-preview" *ngIf="settings()?.cgStorefront?.bannerImageUrl; else noBanner">
                  <img [src]="settings()?.cgStorefront?.bannerImageUrl" alt="Banner">
                </div>
                <ng-template #noBanner>
                  <div class="image-placeholder">No banner image</div>
                </ng-template>
                <input type="file" #bannerInput (change)="onBannerSelect($event)" accept="image/*" style="display: none;">
                <button type="button" class="btn-secondary" (click)="bannerInput.click()">Upload Banner</button>
                <div class="upload-hint">Recommended: 1200x300px</div>
              </div>
            </div>

            <div class="color-settings">
              <div class="form-group">
                <label for="primaryColor">Primary Color</label>
                <input
                  type="color"
                  id="primaryColor"
                  [(ngModel)]="settings()!.cgStorefront!.primaryColor"
                  name="primaryColor"
                  class="color-input">
              </div>
              <div class="form-group">
                <label for="accentColor">Accent Color</label>
                <input
                  type="color"
                  id="accentColor"
                  [(ngModel)]="settings()!.cgStorefront!.accentColor"
                  name="accentColor"
                  class="color-input">
              </div>
            </div>

            <div class="seo-settings">
              <h4>SEO Settings</h4>
              <div class="form-group">
                <label for="metaTitle">Meta Title</label>
                <input
                  type="text"
                  id="metaTitle"
                  [(ngModel)]="settings()!.cgStorefront!.metaTitle"
                  name="metaTitle"
                  class="form-input"
                  placeholder="Your Store - Best Consignment in Town">
              </div>
              <div class="form-group">
                <label for="metaDescription">Meta Description</label>
                <textarea
                  id="metaDescription"
                  [(ngModel)]="settings()!.cgStorefront!.metaDescription"
                  name="metaDescription"
                  class="form-textarea"
                  placeholder="Shop curated vintage and antique items..."
                  rows="3"></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- In-Store Only Settings -->
        <div class="form-section" *ngIf="settings()?.selectedChannel === 'in_store_only'">
          <h3>In-Store Only</h3>

          <div class="info-box">
            <span class="info-icon">ℹ️</span>
            <div>
              <strong>No online storefront</strong>
              <p>You've chosen to manage sales manually. Record transactions in the POS section.</p>
              <p>Want to sell online? Choose Square, Shopify, or CG Storefront above.</p>
            </div>
          </div>

          <div class="manual-settings">
            <h4>Manual Transaction Entry</h4>

            <div class="form-group">
              <label for="defaultPayment">Default payment method for manual sales:</label>
              <select id="defaultPayment" [(ngModel)]="settings()!.inStoreOnly!.defaultPaymentMethod" class="form-select">
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="credit_card">Credit Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="settings()!.inStoreOnly!.requireReceiptNumber" name="requireReceipt">
                <span class="checkmark"></span>
                Require receipt number for manual entries
              </label>
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="settings()!.inStoreOnly!.autoGenerateReceipts" name="autoReceipts">
                <span class="checkmark"></span>
                Auto-generate receipt numbers
              </label>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" (click)="loadSettings()">Cancel</button>
          <button type="button" class="btn-primary" (click)="saveSettings()" [disabled]="isSaving()">
            {{ isSaving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages" *ngIf="successMessage() || errorMessage()">
        <div *ngIf="successMessage()" class="message success">{{ successMessage() }}</div>
        <div *ngIf="errorMessage()" class="message error">{{ errorMessage() }}</div>
      </div>
    </div>
  `,
  styles: [`
    .storefront-settings {
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

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
      padding-bottom: 2rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .form-section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .form-section h3, h4 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1.5rem;
    }

    h4 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }

    /* Channel Options */
    .channel-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .channel-option {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .channel-option:hover {
      border-color: #3b82f6;
    }

    .channel-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .channel-option input[type="radio"] {
      margin-top: 0.25rem;
    }

    .option-content {
      flex: 1;
    }

    .option-title {
      font-weight: 600;
      color: #111827;
      display: block;
      margin-bottom: 0.5rem;
    }

    .option-description {
      color: #6b7280;
      font-size: 0.875rem;
    }

    /* Integration Sections */
    .integration-setup, .integration-connected {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .setup-info h4, .connection-status h4 {
      margin-bottom: 0.5rem;
    }

    .setup-info p {
      color: #6b7280;
      margin-bottom: 1rem;
    }

    .connection-details {
      margin: 1rem 0;
      padding: 1rem;
      background: white;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .connection-details > div {
      margin-bottom: 0.5rem;
    }

    .connection-details > div:last-child {
      margin-bottom: 0;
    }

    .connection-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    /* Sync Settings */
    .sync-settings {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: #374151;
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .radio-label-header {
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      display: block;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      color: #374151;
    }

    /* Activity Log */
    .activity-log {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .log-entry {
      padding: 0.5rem 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 0.875rem;
    }

    .log-entry:last-child {
      border-bottom: none;
    }

    .sync-actions {
      display: flex;
      gap: 1rem;
    }

    /* URL Input */
    .url-input {
      display: flex;
      align-items: center;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      overflow: hidden;
      background: white;
    }

    .url-prefix {
      padding: 0.75rem;
      background: #f9fafb;
      color: #6b7280;
      font-size: 0.875rem;
      border-right: 1px solid #e5e7eb;
    }

    .url-slug {
      border: none;
      flex: 1;
    }

    .url-status {
      padding: 0.75rem;
      color: #059669;
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Domain Status */
    .domain-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      font-size: 0.875rem;
    }

    .domain-status.verified {
      color: #059669;
    }

    .btn-link {
      color: #3b82f6;
      background: none;
      border: none;
      text-decoration: underline;
      cursor: pointer;
      font-size: inherit;
    }

    /* Stripe Section */
    .stripe-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .stripe-setup, .stripe-connected {
      background: #fffbeb;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .stripe-connected {
      background: #ecfdf5;
      border-color: #10b981;
    }

    .setup-warning {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .warning-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .setup-warning p {
      margin: 0;
      color: #92400e;
    }

    .stripe-status {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .status-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .stripe-actions {
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
    }

    /* Branding Section */
    .branding-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .image-upload {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .image-preview {
      width: 300px;
      height: 75px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }

    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-placeholder {
      width: 300px;
      height: 75px;
      border: 2px dashed #d1d5db;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      background: #f9fafb;
    }

    .upload-hint {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .color-settings {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin: 1rem 0;
    }

    .color-input {
      width: 60px;
      height: 40px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
    }

    /* Info Box */
    .info-box {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      margin-bottom: 2rem;
    }

    .info-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .info-box p {
      margin: 0.5rem 0;
      color: #1e40af;
    }

    .info-box strong {
      color: #1e3a8a;
    }

    /* Manual Settings */
    .manual-settings {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
    }

    /* Form Elements */
    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input, .form-textarea, .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
    }

    .form-input:focus, .form-textarea:focus, .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }

    /* Buttons */
    .btn-primary, .btn-secondary, .btn-danger-outline {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: 1px solid;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      border-color: #2563eb;
    }

    .btn-primary:disabled {
      background: #9ca3af;
      border-color: #9ca3af;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border-color: #d1d5db;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-danger-outline {
      background: white;
      color: #dc2626;
      border-color: #dc2626;
    }

    .btn-danger-outline:hover {
      background: #fef2f2;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }

    /* Messages */
    .messages {
      margin-top: 2rem;
    }

    .message {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .message.success {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    .message.error {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .storefront-settings {
        padding: 1rem;
      }

      .color-settings {
        grid-template-columns: 1fr;
      }

      .connection-actions, .stripe-actions, .sync-actions {
        flex-direction: column;
      }

      .form-actions {
        flex-direction: column;
      }

      .url-input {
        flex-direction: column;
      }

      .url-prefix {
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
      }
    }
  `]
})
export class StorefrontSettingsComponent implements OnInit {
  settings = signal<StorefrontSettings | null>(null);
  isSaving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  channelOptions = [
    {
      id: 'square' as SalesChannel,
      title: 'Square',
      description: 'POS and online sales through Square'
    },
    {
      id: 'shopify' as SalesChannel,
      title: 'Shopify',
      description: 'Online store powered by Shopify'
    },
    {
      id: 'cg_storefront' as SalesChannel,
      title: 'ConsignmentGenie Storefront',
      description: 'Built-in online store (requires Stripe)'
    },
    {
      id: 'in_store_only' as SalesChannel,
      title: 'In-Store Only',
      description: 'No online sales, manual transaction entry'
    }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSettings();
  }

  async loadSettings() {
    try {
      // Mock data - replace with actual API call
      const mockSettings: StorefrontSettings = {
        selectedChannel: 'square',
        square: {
          connected: true,
          businessName: 'Vintage Treasures',
          locationName: 'Austin - Main St',
          connectedAt: new Date('2024-11-15'),
          syncInventory: true,
          importSales: true,
          syncCustomers: false,
          syncFrequency: '15min',
          categoryMappings: []
        },
        cgStorefront: {
          storeSlug: 'vintage-treasures',
          customDomain: 'shop.vintagetreasures.com',
          dnsVerified: false,
          stripeConnected: false,
          bannerImageUrl: undefined,
          primaryColor: '#8B4513',
          accentColor: '#D4A574',
          displayStoreHours: true,
          storeHours: [],
          metaTitle: 'Vintage Treasures - Austin Consignment',
          metaDescription: 'Shop curated vintage and antique items...'
        }
      };

      this.settings.set(mockSettings);
    } catch (error) {
      this.showError('Failed to load storefront settings');
    }
  }

  async saveSettings() {
    if (!this.settings()) return;

    this.isSaving.set(true);
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

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