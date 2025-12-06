import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SquareIntegrationService } from '../../../services/square-integration.service';

export interface SquareStatus {
  isConnected: boolean;
  merchantId?: string;
  merchantName?: string;
  connectedAt?: Date;
  lastSync?: Date;
  itemCount?: number;
  error?: string;
}

@Component({
  selector: 'app-integrations-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './integrations-settings.component.html',
  styleUrls: ['./integrations-settings.component.css']
})
export class IntegrationsSettingsComponent implements OnInit {
  private squareService = inject(SquareIntegrationService);

  squareStatus = signal<SquareStatus>({
    isConnected: false
  });

  isLoading = signal(false);

  ngOnInit() {
    this.loadSquareStatus();
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
      // Redirect to Square OAuth
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
      // Refresh status to get updated sync time
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
}