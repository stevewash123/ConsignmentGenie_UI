import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SquareIntegrationService } from '../../../../services/square-integration.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';

export interface SquareStatus {
  isConnected: boolean;
  merchantId?: string;
  merchantName?: string;
  connectedAt?: Date;
  lastSync?: Date;
  itemCount?: number;
  lastCatalogSync?: Date;
  lastSalesImport?: Date;
  lastSalesImportCount?: number;
  itemLinkSummary?: {
    total: number;
    linked: number;
    shopOwned: number;
    skipped: number;
    unlinked: number;
  };
  error?: string;
}

export interface SquareIntegrationSettings {
  inventorySource: 'cg' | 'square' | 'hybrid';
  posMode: 'cg' | 'square';
  hasSquareOnline: boolean;
  salesImportMode: 'manual' | 'scheduled' | 'realtime';
  selectedLocationId?: string;
  selectedLocationName?: string;
  useSquarePayments: boolean;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './inventory.component.html',
  styles: [`
    .section {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
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
    .choice-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .choice-title {
      font-weight: 600;
      margin-bottom: 1rem;
      color: #374151;
      font-size: 1.125rem;
    }

    /* New card-based choice layout */
    .choice-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
      .choice-grid {
        grid-template-columns: 1fr;
      }
    }

    .choice-card {
      position: relative;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      background: white;
      min-height: 200px;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .choice-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .choice-card.selected {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    .choice-radio {
      width: 20px;
      height: 20px;
      margin: 0.25rem 0 0 0;
      flex-shrink: 0;
    }

    .choice-main-content {
      display: flex;
      flex: 1;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .choice-text-section {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .choice-icon {
      font-size: 4rem;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 0.5rem;
    }

    .choice-label {
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 1rem;
      color: #111827;
      line-height: 1.4;
      text-align: center;
    }

    .choice-benefits {
      margin-top: auto;
    }

    .benefit-item {
      color: #374151;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }

    /* Value proposition panel */
    .value-panel {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 1.5rem;
      margin-top: 2rem;
    }

    .value-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .value-icon {
      color: #10b981;
      font-size: 1.25rem;
    }

    .value-title {
      font-weight: 600;
      color: #1e40af;
      font-size: 1.125rem;
    }

    .value-description {
      color: #1e40af;
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
    }

    .value-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .value-list li {
      color: #1e40af;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
      line-height: 1.4;
    }
    .radio-group {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .radio-option {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      flex: 1;
      min-width: 200px;
    }
    .radio-option:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }
    .radio-option.selected {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #1d4ed8;
    }
    .square-options {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1.5rem;
      margin-top: 1rem;
    }
    .square-options.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
    .placeholder {
      background: #f9fafb;
      border: 2px dashed #d1d5db;
      border-radius: 6px;
      padding: 2rem;
      text-align: center;
      color: #6b7280;
      margin-top: 1rem;
    }
    .integration-option {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 1rem;
    }
    .integration-option:hover {
      background: #f9fafb;
    }
    .tooltip-text {
      margin-top: 0.25rem;
    }

    .integration-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .integration-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .integration-icon {
      font-size: 2rem;
    }

    .integration-info h4 {
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .integration-info p {
      color: #6b7280;
      margin: 0;
      font-size: 0.875rem;
    }

    .connect-button {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.75rem 1.5rem;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: background-color 0.2s;
    }

    .connect-button:hover:not(:disabled) {
      background: #2563eb;
    }

    .connect-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .disconnect-button {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.75rem 1.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .disconnect-button:hover {
      background: #dc2626;
    }
    .status-indicator {
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      margin-top: 0.5rem;
      display: inline-block;
    }
    .status-indicator.connected {
      background: #dcfce7;
      color: #166534;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class InventoryComponent implements OnInit {
  private squareService = inject(SquareIntegrationService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  configForm: FormGroup;

  squareStatus = signal<SquareStatus>({
    isConnected: false
  });

  squareSettings = signal<SquareIntegrationSettings>({
    inventorySource: 'cg',
    posMode: 'cg',
    hasSquareOnline: false,
    salesImportMode: 'manual',
    useSquarePayments: false
  });

  isLoading = signal(false);
  isSaving = signal(false);
  isConnecting = signal(false);
  selectedChoice: 'consignment-genie' | 'square' = 'consignment-genie';

  constructor(private fb: FormBuilder) {
    this.configForm = this.fb.group({
      provider: ['consignment-genie'], // Default to ConsignmentGenie
      importSquareInventory: [false],
      syncSalesToSquare: [false],
      realTimeUpdates: [false],
      importCategories: [false]
    });
  }

  ngOnInit() {
    console.log('🔧 [Inventory] ngOnInit - Loading page');
    this.loadSquareStatus();
    this.handleSquareCallback();

    // Load current choice from shared settings
    const savedSettings = this.squareService.getSquareUsageSettings();
    this.selectedChoice = savedSettings.inventoryChoice;

    // Restore pending choice if user navigated back without completing OAuth
    const pendingChoice = localStorage.getItem('pendingInventoryChoice');
    const hasOAuthCode = this.route.snapshot.queryParams['code'];
    console.log('🔧 [Inventory] ngOnInit - pendingChoice:', pendingChoice, 'hasOAuthCode:', !!hasOAuthCode);

    if (pendingChoice && !hasOAuthCode) {
      console.log('🔧 [Inventory] ngOnInit - Restoring choice from localStorage:', pendingChoice);
      this.selectedChoice = pendingChoice as 'consignment-genie' | 'square';
      // Keep it in localStorage until OAuth completes or user makes a different choice
    }
  }

  get isSquareSelected(): boolean {
    return this.selectedChoice === 'square';
  }

  async selectChoice(choice: 'consignment-genie' | 'square'): Promise<void> {
    console.log('🔧 [Inventory] selectChoice - User selected:', choice);
    const previousChoice = this.selectedChoice;
    this.selectedChoice = choice;
    this.configForm.patchValue({ provider: choice });

    // Update shared Square usage settings
    this.squareService.updateSquareUsageSettings({
      inventoryChoice: choice
    });

    // Clear any pending choice since user made a new selection
    localStorage.removeItem('pendingInventoryChoice');
    console.log('🔧 [Inventory] selectChoice - Cleared pendingInventoryChoice from localStorage');

    // Trigger automatic sync if choice changed and Square is connected
    console.log('🔧 [Inventory] selectChoice - Previous choice:', previousChoice);
    console.log('🔧 [Inventory] selectChoice - New choice:', choice);
    console.log('🔧 [Inventory] selectChoice - Square connected:', this.squareStatus().isConnected);
    console.log('🔧 [Inventory] selectChoice - Choice changed:', previousChoice !== choice);

    if (previousChoice !== choice && this.squareStatus().isConnected) {
      console.log('🔧 [Inventory] selectChoice - Triggering automatic sync');
      await this.performInventorySync(choice);
    } else {
      console.log('🔧 [Inventory] selectChoice - Skipping sync - choice unchanged or Square not connected');
    }

    // Check if we need to disconnect when no Square options are selected
    this.checkForDisconnect();
  }

  onProviderChange(provider: string): void {
    this.configForm.patchValue({ provider });
  }

  private async loadSquareStatus() {
    this.isLoading.set(true);
    try {
      const status = await this.squareService.getStatus();
      this.squareStatus.set(status);
    } catch (error) {
      console.error('Failed to load Square status:', error);
      this.squareStatus.set({
        isConnected: false,
        error: 'Failed to load status'
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  async connectSquare() {
    if (this.squareStatus().isConnected) {
      return;
    }

    this.isLoading.set(true);
    try {
      const oauthUrl = await this.squareService.initiateConnection();
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('Failed to initiate Square connection:', error);
      this.squareStatus.update(status => ({
        ...status,
        error: 'Failed to start connection'
      }));
      this.isLoading.set(false);
    }
  }

  async disconnectSquare() {
    if (!this.squareStatus().isConnected) {
      return;
    }

    if (!confirm('Are you sure you want to disconnect from Square? This will stop syncing inventory and sales data.')) {
      return;
    }

    this.isLoading.set(true);
    try {
      await this.squareService.disconnect();
      this.squareStatus.set({
        isConnected: false
      });
    } catch (error) {
      console.error('Failed to disconnect from Square:', error);
      this.squareStatus.update(status => ({
        ...status,
        error: 'Failed to disconnect'
      }));
    } finally {
      this.isLoading.set(false);
    }
  }

  async syncNow() {
    if (!this.squareStatus().isConnected) {
      return;
    }

    this.isLoading.set(true);
    try {
      await this.squareService.syncNow();
      await this.loadSquareStatus();
    } catch (error) {
      console.error('Failed to sync Square data:', error);
      this.squareStatus.update(status => ({
        ...status,
        error: 'Sync failed'
      }));
    } finally {
      this.isLoading.set(false);
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }

  getTimeSinceSync(): string {
    const lastSync = this.squareStatus().lastSync;
    if (!lastSync) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  onSettingChange() {
    console.log('Square settings changed:', this.squareSettings());
  }

  async saveSquareSettings() {
    this.isSaving.set(true);
    try {
      const settings = this.squareSettings();
      await this.http.put(`${environment.apiUrl}/api/integrations/square/settings`, settings).toPromise();
      await this.loadSquareStatus();
    } catch (error) {
      console.error('Failed to save Square settings:', error);
      this.squareStatus.update(status => ({
        ...status,
        error: 'Failed to save settings'
      }));
    } finally {
      this.isSaving.set(false);
    }
  }

  async manageCatalogLinks() {
    alert('Catalog linking interface will be implemented in the next phase');
  }

  async refreshCatalog() {
    this.isLoading.set(true);
    try {
      await this.http.post(`${environment.apiUrl}/api/integrations/square/catalog/refresh`, {}).toPromise();
      await this.loadSquareStatus();
    } catch (error) {
      console.error('Failed to refresh catalog:', error);
      this.squareStatus.update(status => ({
        ...status,
        error: 'Failed to refresh catalog'
      }));
    } finally {
      this.isLoading.set(false);
    }
  }

  async importSalesNow() {
    this.isLoading.set(true);
    try {
      const response = await this.http.post<any>(`${environment.apiUrl}/api/integrations/square/sales/import`, {}).toPromise();
      this.squareStatus.update(status => ({
        ...status,
        lastSalesImport: new Date(),
        lastSalesImportCount: response.data?.itemsImported || 0
      }));
      await this.loadSquareStatus();
    } catch (error) {
      console.error('Failed to import sales:', error);
      this.squareStatus.update(status => ({
        ...status,
        error: 'Failed to import sales'
      }));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async handleSquareCallback() {
    const code = this.route.snapshot.queryParams['code'];
    const state = this.route.snapshot.queryParams['state'];

    console.log('🔧 [Inventory] handleSquareCallback - code:', !!code, 'state:', !!state);
    console.log('🔧 [Inventory] handleSquareCallback - Raw code:', code, 'Raw state:', state);

    if (code && state) {
      console.log('🔧 [Inventory] handleSquareCallback - Processing OAuth callback...');
      try {
        this.isLoading.set(true);
        await this.squareService.handleCallback(code, state);
        await this.loadSquareStatus();
      } catch (error) {
        console.error('Failed to handle Square OAuth callback:', error);
      } finally {
        this.isLoading.set(false);
      }

      // Restore the user's inventory choice from before OAuth redirect
      // This happens whether the API call succeeded or failed
      const pendingChoice = localStorage.getItem('pendingInventoryChoice');
      console.log('🔧 [Inventory] handleSquareCallback - pendingChoice from localStorage:', pendingChoice);

      if (pendingChoice) {
        console.log('🔧 [Inventory] handleSquareCallback - Restoring choice:', pendingChoice);
        this.selectedChoice = pendingChoice as 'consignment-genie' | 'square';
        localStorage.removeItem('pendingInventoryChoice');
        console.log('🔧 [Inventory] handleSquareCallback - Choice restored and localStorage cleared');
      }

      // Navigate back to the inventory page without the callback params
      this.router.navigate(['/owner/settings/integrations/inventory'], { replaceUrl: true });
    } else {
      console.log('🔧 [Inventory] handleSquareCallback - No valid OAuth callback detected');

      // If we have query params but they're not OAuth, still try to restore the choice
      const pendingChoice = localStorage.getItem('pendingInventoryChoice');
      if (pendingChoice) {
        console.log('🔧 [Inventory] handleSquareCallback - Restoring choice from localStorage anyway:', pendingChoice);
        this.selectedChoice = pendingChoice as 'consignment-genie' | 'square';
        localStorage.removeItem('pendingInventoryChoice');
      }
    }
  }

  async connectToSquare() {
    console.log('🔧 [Inventory] connectToSquare - Starting connection, current choice:', this.selectedChoice);
    this.isConnecting.set(true);

    // Save current selection before OAuth redirect
    localStorage.setItem('pendingInventoryChoice', this.selectedChoice);
    console.log('🔧 [Inventory] connectToSquare - Saved to localStorage:', this.selectedChoice);

    // Set a timeout to prevent indefinite loading state
    const timeout = setTimeout(() => {
      this.isConnecting.set(false);
      console.error('Connection timeout - resetting button state');
    }, 10000); // 10 second timeout

    try {
      const authUrl = await this.squareService.initiateConnection();
      console.log('🔧 [Inventory] connectToSquare - Got auth URL, redirecting to Square...');
      clearTimeout(timeout);
      // Note: We don't set isConnecting to false here because we're navigating away
      window.location.href = authUrl;
    } catch (error) {
      clearTimeout(timeout);
      console.error('Failed to initiate Square connection:', error);
      this.isConnecting.set(false);
      // TODO: Show user-friendly error message
    }
  }

  async disconnectFromSquare() {
    const confirmed = confirm('Are you sure you want to disconnect from Square? This will stop syncing your Square inventory data.');
    if (!confirmed) return;

    try {
      await this.squareService.disconnect();
      await this.loadSquareStatus();
      console.log('🔧 [Inventory] Successfully disconnected from Square');
    } catch (error) {
      console.error('Failed to disconnect from Square:', error);
      // TODO: Show user-friendly error message
    }
  }

  private async checkForDisconnect() {
    // If Square is connected but no longer being used anywhere, offer to disconnect
    if (this.squareStatus().isConnected && !this.squareService.isSquareInUse()) {
      const confirmed = confirm(
        'You\'ve deselected all Square options (inventory, online sales, and POS). Would you like to disconnect from Square entirely? ' +
        '(You can always reconnect later if needed)'
      );

      if (confirmed) {
        await this.disconnectFromSquare();
      }
    }
  }

  private async performInventorySync(choice: 'consignment-genie' | 'square'): Promise<void> {
    console.log('🔧 [Inventory] performInventorySync - Starting sync for choice:', choice);
    this.isLoading.set(true);

    try {
      const endpoint = choice === 'square'
        ? `${environment.apiUrl}/api/owner/integrations/square/inventory/sync`
        : `${environment.apiUrl}/api/owner/integrations/square/inventory/sync-to-cg`;

      await this.http.post(endpoint, {}).toPromise();

      console.log('🔧 [Inventory] performInventorySync - Sync completed successfully');

      // Update status to reflect the sync
      await this.loadSquareStatus();

    } catch (error) {
      console.error('Failed to sync inventory:', error);
      this.squareStatus.update(status => ({
        ...status,
        error: `Failed to sync inventory to ${choice === 'square' ? 'Square' : 'ConsignmentGenie'}`
      }));
    } finally {
      this.isLoading.set(false);
    }
  }
}
