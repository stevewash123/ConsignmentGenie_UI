import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ConsignorService } from '../../services/consignor.service';
import { Consignor } from '../../models/consignor.model';
import { LoadingService } from '../../shared/services/loading.service';
import { OwnerLayoutComponent } from './owner-layout.component';

@Component({
  selector: 'app-consignor-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, OwnerLayoutComponent],
  templateUrl: './consignor-detail.component.html',
  styleUrls: ['./consignor-detail.component.scss']
})
export class ConsignorDetailComponent implements OnInit {
  consignor = signal<Consignor | null>(null);
  providerId = signal<string>('');
  isSubmitting = signal(false);
  errorMessage = signal('');

  stats = signal({
    totalItems: 0,
    activeItems: 0,
    soldItems: 0,
    totalEarnings: 0,
    pendingPayout: 0
  });

  recentActivity = signal<any[]>([]);

  isProviderLoading(): boolean {
    return this.loadingService.isLoading('consignor-detail');
  }

  constructor(
    private ConsignorService: ConsignorService,
    private route: ActivatedRoute,
    private router: Router,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.providerId.set(id);
      this.loadProvider();
      this.loadStats();
      this.loadRecentActivity();
    }
  }

  loadProvider(): void {
    this.loadingService.start('consignor-detail');
    this.ConsignorService.getConsignor(this.providerId()).subscribe({
      next: (consignor) => {
        this.consignor.set(consignor);
      },
      error: (error) => {
        console.error('Error loading consignor:', error);
        this.errorMessage.set('Failed to load consignor details');
      },
      complete: () => {
        this.loadingService.stop('consignor-detail');
      }
    });
  }

  loadStats(): void {
    this.ConsignorService.getConsignorStats(this.providerId()).subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (error) => {
        console.error('Error loading consignor stats:', error);
        // Fall back to zeros if API fails
        this.stats.set({
          totalItems: 0,
          activeItems: 0,
          soldItems: 0,
          totalEarnings: 0,
          pendingPayout: 0
        });
      }
    });
  }

  loadRecentActivity(): void {
    // This would call an API to get recent activity
    // For now, using mock data
    this.recentActivity.set([
      {
        type: 'sale',
        description: 'Item "Vintage Vase" sold',
        date: new Date('2024-11-20'),
        amount: 35.00
      },
      {
        type: 'item',
        description: 'Added new item "Handmade Jewelry"',
        date: new Date('2024-11-18'),
        amount: null
      },
      {
        type: 'payout',
        description: 'Payout processed',
        date: new Date('2024-11-15'),
        amount: 250.00
      }
    ]);
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'sale': return '💰';
      case 'item': return '📦';
      case 'payout': return '💳';
      default: return '📋';
    }
  }

  deactivateProvider(): void {
    if (!this.consignor()) return;

    this.isSubmitting.set(true);
    this.ConsignorService.deactivateConsignor(this.consignor()!.id).subscribe({
      next: (updated) => {
        this.consignor.set(updated);
      },
      error: (error) => {
        console.error('Error deactivating consignor:', error);
        this.errorMessage.set('Failed to deactivate consignor');
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  activateProvider(): void {
    if (!this.consignor()) return;

    this.isSubmitting.set(true);
    this.ConsignorService.activateConsignor(this.consignor()!.id).subscribe({
      next: (updated) => {
        this.consignor.set(updated);
      },
      error: (error) => {
        console.error('Error activating consignor:', error);
        this.errorMessage.set('Failed to activate consignor');
      },
      complete: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}