import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SquareIntegrationService } from '../../../../services/square-integration.service';
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
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  private squareService = inject(SquareIntegrationService);
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

  selectChoice(choice: 'consignment-genie' | 'square'): void {
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
      this.performInventorySync(choice);
    } else {
      console.log('🔧 [Inventory] selectChoice - Skipping sync - choice unchanged or Square not connected');
    }

    // Check if we need to disconnect when no Square options are selected
    this.checkForDisconnect();
  }

  onProviderChange(provider: string): void {
    this.configForm.patchValue({ provider });
  }

  private loadSquareStatus() {
    console.log('🔧 [Inventory] loadSquareStatus - Starting to load status...');
    this.isLoading.set(true);
    this.squareService.getStatus().subscribe({
      next: (status) => {
        console.log('🔧 [Inventory] loadSquareStatus - Raw API response:', status);
        console.log('🔧 [Inventory] loadSquareStatus - isConnected value:', status.isConnected);
        console.log('🔧 [Inventory] loadSquareStatus - Processed isConnected:', status.isConnected || false);

        const processedStatus = {
          isConnected: status.isConnected || false,
          merchantId: status.merchantId,
          merchantName: status.merchantName,
          connectedAt: status.connectedAt,
          lastSync: status.lastSync,
          itemCount: status.itemCount || 0
        };

        console.log('🔧 [Inventory] loadSquareStatus - Final status object:', processedStatus);
        this.squareStatus.set(processedStatus);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('🔧 [Inventory] loadSquareStatus - ERROR loading status:', error);
        console.error('🔧 [Inventory] loadSquareStatus - Error details:', error.error);
        this.squareStatus.set({
          isConnected: false,
          error: 'Failed to load status'
        });
        this.isLoading.set(false);
      }
    });
  }

  connectSquare() {
    if (this.squareStatus().isConnected) {
      return;
    }

    this.isLoading.set(true);
    this.squareService.initiateConnection().subscribe({
      next: (response) => {
        if (response?.authUrl) {
          window.location.href = response.authUrl;
        } else {
          throw new Error('Failed to get OAuth URL');
        }
      },
      error: (error) => {
        console.error('Failed to initiate Square connection:', error);
        this.squareStatus.update(status => ({
          ...status,
          error: 'Failed to start connection'
        }));
        this.isLoading.set(false);
      }
    });
  }

  disconnectSquare() {
    if (!this.squareStatus().isConnected) {
      return;
    }

    if (!confirm('Are you sure you want to disconnect from Square? This will stop syncing inventory and sales data.')) {
      return;
    }

    this.isLoading.set(true);
    this.squareService.disconnect().subscribe({
      next: () => {
        this.squareStatus.set({
          isConnected: false
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to disconnect from Square:', error);
        this.squareStatus.update(status => ({
          ...status,
          error: 'Failed to disconnect'
        }));
        this.isLoading.set(false);
      }
    });
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
      await this.squareService.updateSettings(settings);
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

  refreshCatalog() {
    this.isLoading.set(true);
    this.squareService.refreshCatalog().subscribe({
      next: () => {
        this.loadSquareStatus();
      },
      error: (error) => {
        console.error('Failed to refresh catalog:', error);
        this.squareStatus.update(status => ({
          ...status,
          error: 'Failed to refresh catalog'
        }));
        this.isLoading.set(false);
      }
    });
  }

  importSalesNow() {
    this.isLoading.set(true);
    this.squareService.importSales().subscribe({
      next: (response) => {
        this.squareStatus.update(status => ({
          ...status,
          lastSalesImport: new Date(),
          lastSalesImportCount: response.data?.itemsImported || 0
        }));
        this.loadSquareStatus();
      },
      error: (error) => {
        console.error('Failed to import sales:', error);
        this.squareStatus.update(status => ({
          ...status,
          error: 'Failed to import sales'
        }));
        this.isLoading.set(false);
      }
    });
  }

  private handleSquareCallback() {
    const code = this.route.snapshot.queryParams['code'];
    const state = this.route.snapshot.queryParams['state'];
    const fromSquare = this.route.snapshot.queryParams['fromSquare'];
    const allParams = this.route.snapshot.queryParams;

    console.log('🔧 [Inventory] handleSquareCallback - ALL query params:', allParams);
    console.log('🔧 [Inventory] handleSquareCallback - code:', !!code, 'state:', !!state, 'fromSquare:', fromSquare);
    console.log('🔧 [Inventory] handleSquareCallback - Raw code:', code, 'Raw state:', state);

    if (code && state) {
      console.log('🔧 [Inventory] handleSquareCallback - Processing OAuth callback...');
      this.isLoading.set(true);

      this.squareService.handleCallback(code, state).subscribe({
        next: (response) => {
          console.log('🔧 [Inventory] handleSquareCallback - SUCCESS! Callback response:', response);
          console.log('🔧 [Inventory] handleSquareCallback - About to reload status...');
          this.loadSquareStatus();
        },
        error: (error) => {
          console.error('🔧 [Inventory] handleSquareCallback - ERROR handling OAuth callback:', error);
          console.error('🔧 [Inventory] handleSquareCallback - Error details:', error.error);
          this.isLoading.set(false);
        }
      });

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
      console.log('🔧 [Inventory] handleSquareCallback - Navigating to clean URL...');
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

  connectToSquare() {
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

    this.squareService.initiateConnection().subscribe({
      next: (response) => {
        console.log('🔧 [Inventory] connectToSquare - Got auth URL, redirecting to Square...');
        clearTimeout(timeout);
        // Note: We don't set isConnecting to false here because we're navigating away
        if (response?.authUrl) {
          window.location.href = response.authUrl;
        } else {
          throw new Error('Failed to get OAuth URL');
        }
      },
      error: (error) => {
        clearTimeout(timeout);
        console.error('Failed to initiate Square connection:', error);
        this.isConnecting.set(false);
        // TODO: Show user-friendly error message
      }
    });
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

  private performInventorySync(choice: 'consignment-genie' | 'square'): void {
    console.log('🔧 [Inventory] performInventorySync - Starting sync for choice:', choice);
    this.isLoading.set(true);

    // Both choices sync FROM Square to ensure data is current
    // The choice affects which system is the source of truth for display/editing
    this.squareService.syncFromSquare().subscribe({
      next: () => {
        console.log('🔧 [Inventory] performInventorySync - Sync completed successfully');
        // Update status to reflect the sync
        this.loadSquareStatus();
      },
      error: (error) => {
        console.error('Failed to sync inventory:', error);
        this.squareStatus.update(status => ({
          ...status,
          error: `Failed to sync inventory for ${choice === 'square' ? 'Square' : 'ConsignmentGenie'} choice`
        }));
        this.isLoading.set(false);
      }
    });
  }
}
