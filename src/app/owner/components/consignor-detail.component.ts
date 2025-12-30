import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ConsignorService } from '../../services/consignor.service';
import { Consignor } from '../../models/consignor.model';
import { LoadingService } from '../../shared/services/loading.service';

@Component({
  selector: 'app-consignor-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './consignor-detail.component.html',
  styles: [`
    .consignor-detail-container {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .breadcrumb a {
      color: #007bff;
      text-decoration: none;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .consignor-detail-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .consignor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .status {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 500;
    }

    .status.active {
      background: #d4edda;
      color: #155724;
    }

    .status.inactive {
      background: #f8d7da;
      color: #721c24;
    }

    .consignor-info {
      padding: 2rem;
    }

    .info-section {
      margin-bottom: 2rem;
    }

    .info-section h3 {
      margin-bottom: 1rem;
      color: #212529;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-item label {
      font-weight: 500;
      color: #6c757d;
      margin-bottom: 0.25rem;
    }

    .info-item span {
      color: #212529;
    }

    .notes {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 4px;
      border-left: 4px solid #007bff;
      margin: 0;
    }

    .consignor-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      padding: 2rem;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
    }

    .stat-card {
      text-align: center;
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-number {
      font-size: 2rem;
      font-weight: 600;
      color: #007bff;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: #6c757d;
      font-size: 0.875rem;
    }

    .recent-activity {
      padding: 2rem;
      border-top: 1px solid #e9ecef;
    }

    .recent-activity h3 {
      margin-bottom: 1rem;
      color: #212529;
    }

    .activity-list {
      space-y: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      background: #007bff;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .activity-content {
      flex: 1;
    }

    .activity-description {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .activity-date {
      color: #6c757d;
      font-size: 0.875rem;
    }

    .activity-amount {
      font-weight: 500;
      color: #28a745;
    }

    .no-activity {
      text-align: center;
      color: #6c757d;
      padding: 2rem;
    }

    .btn-primary, .btn-secondary, .btn-danger, .btn-success {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      text-align: center;
      font-size: 0.875rem;
      transition: all 0.15s ease-in-out;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-primary:hover, .btn-secondary:hover, .btn-danger:hover, .btn-success:hover {
      opacity: 0.85;
    }

    .btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled, .btn-success:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading, .error-message {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
    }

    .error-message {
      color: #dc3545;
    }
  `]
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
    // This would call an API to get consignor statistics
    // For now, using mock data
    this.stats.set({
      totalItems: 25,
      activeItems: 18,
      soldItems: 7,
      totalEarnings: 1250.75,
      pendingPayout: 450.50
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