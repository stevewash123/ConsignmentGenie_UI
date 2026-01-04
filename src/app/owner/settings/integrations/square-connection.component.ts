import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IntegrationService, SquareConnectionStatus } from '../../../services/integration.service';

@Component({
  selector: 'app-square-connection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './square-connection.component.html',
  styleUrls: ['./square-connection.component.scss']
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