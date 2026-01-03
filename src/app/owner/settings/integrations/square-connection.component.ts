import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IntegrationService, SquareConnectionStatus } from '../../../services/integration.service';

@Component({
  selector: 'app-square-connection',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="square-connection">
      <h3 class="text-lg font-semibold mb-4">Square Integration</h3>

      <!-- Loading State -->
      <div *ngIf="loading()" class="flex items-center space-x-2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Connecting to Square...</span>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div class="flex">
          <div class="text-red-600">
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-red-700">{{ error() }}</p>
          </div>
        </div>
      </div>

      <!-- Not Connected State -->
      <div *ngIf="!status()?.connected && !loading()" class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div class="flex">
            <div class="text-blue-600">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-3">
              <h4 class="text-blue-900 font-medium">Connect your Square account</h4>
              <p class="text-blue-700 mt-1">Connect to Square to sync your inventory, transactions, and payments.</p>
            </div>
          </div>
        </div>

        <button
          (click)="connectSquare()"
          [disabled]="loading()"
          class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium">
          Connect Square
        </button>
      </div>

      <!-- Connected State -->
      <div *ngIf="status()?.connected && !loading()" class="space-y-4">
        <div class="bg-green-50 border border-green-200 rounded-md p-4">
          <div class="flex">
            <div class="text-green-600">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-3 flex-1">
              <h4 class="text-green-900 font-medium">Square Connected</h4>
              <div class="mt-2 text-sm text-green-700">
                <p><strong>Merchant:</strong> {{ status()?.merchantName || status()?.merchantId }}</p>
                <p *ngIf="status()?.lastSyncAt"><strong>Last Sync:</strong> {{ formatDate(status()?.lastSyncAt) }}</p>
                <p><strong>Integration Mode:</strong> {{ status()?.integrationMode }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex space-x-3">
          <button
            (click)="disconnectSquare()"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium">
            Disconnect
          </button>
          <button
            (click)="refreshStatus()"
            class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium">
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SquareConnectionComponent implements OnInit {
  loading = signal(false);
  error = signal<string | null>(null);
  status = signal<SquareConnectionStatus | null>(null);

  constructor(
    private integrationService: IntegrationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const connected = this.route.snapshot.queryParams['connected'];
    const error = this.route.snapshot.queryParams['error'];

    if (connected === 'true') {
      this.showSuccessToast('Square connected successfully!');
      this.loadStatus();
      // Clean up URL query params
      this.router.navigate([], { replaceUrl: true });
    } else if (error) {
      this.error.set(this.getErrorMessage(error));
      // Clean up URL query params
      this.router.navigate([], { replaceUrl: true });
    } else {
      this.loadStatus();
    }
  }

  connectSquare(): void {
    this.loading.set(true);
    this.error.set(null);

    this.integrationService.getSquareAuthUrl().subscribe({
      next: (response) => {
        // Redirect to Square OAuth page
        window.location.href = response.authUrl;
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to initiate Square connection. Please try again.');
        console.error('Square auth URL error:', err);
      }
    });
  }

  disconnectSquare(): void {
    if (!confirm('Are you sure you want to disconnect Square? This will switch your integration mode back to ConsignmentGenie native.')) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.integrationService.disconnectSquare().subscribe({
      next: () => {
        this.loading.set(false);
        this.status.set(null);
        this.showSuccessToast('Square disconnected successfully!');
        this.loadStatus();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to disconnect Square. Please try again.');
        console.error('Square disconnect error:', err);
      }
    });
  }

  refreshStatus(): void {
    this.loadStatus();
  }

  private loadStatus(): void {
    this.loading.set(true);
    this.error.set(null);

    this.integrationService.getSquareStatus().subscribe({
      next: (status) => {
        this.loading.set(false);
        this.status.set(status);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Failed to load Square status.');
        console.error('Square status error:', err);
      }
    });
  }

  private getErrorMessage(errorCode: string): string {
    const messages: Record<string, string> = {
      'access_denied': 'You cancelled the Square authorization.',
      'invalid_state': 'Authorization session expired. Please try again.',
      'token_exchange_failed': 'Failed to complete Square connection. Please try again.',
      'merchant_fetch_failed': 'Connected but couldn\'t fetch your Square account info.',
      'default': 'Something went wrong connecting to Square. Please try again.'
    };
    return messages[errorCode] || messages['default'];
  }

  private showSuccessToast(message: string): void {
    // In a real app, this would trigger a toast notification service
    console.log('Success:', message);
    // TODO: Integrate with toast/notification service
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  }
}