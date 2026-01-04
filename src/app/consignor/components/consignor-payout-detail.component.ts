import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { ConsignorPayoutDetail } from '../models/consignor.models';
import { LoadingService } from '../../shared/services/loading.service';
import { LOADING_KEYS } from '../constants/loading-keys';

@Component({
  selector: 'app-consignor-payout-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './consignor-payout-detail.component.html',
  styleUrls: ['./consignor-payout-detail.component.scss']
})
export class ConsignorPayoutDetailComponent implements OnInit {
  payoutDetail: ConsignorPayoutDetail | null = null;
  error: string | null = null;
  payoutId: string;

  // Expose for template
  readonly KEYS = LOADING_KEYS;

  constructor(
    private consignorService: ConsignorPortalService,
    private route: ActivatedRoute,
    public loadingService: LoadingService
  ) {
    this.payoutId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit() {
    if (this.payoutId) {
      this.loadPayoutDetail();
    }
  }

  loadPayoutDetail() {
    this.loadingService.start(LOADING_KEYS.PAYOUT_DETAIL);
    this.error = null;

    this.consignorService.getMyPayout(this.payoutId).subscribe({
      next: (response: any) => {
        this.payoutDetail = response.success ? response.data : response;
      },
      error: (err) => {
        this.error = 'Failed to load payout details. Please try again.';
        console.error('Payout detail error:', err);
        this.loadingService.stop(LOADING_KEYS.PAYOUT_DETAIL);
      },
      complete: () => {
        this.loadingService.stop(LOADING_KEYS.PAYOUT_DETAIL);
      }
    });
  }

  getTotalSalePrice(): number {
    if (!this.payoutDetail) return 0;
    return this.payoutDetail.items.reduce((sum, item) => sum + item.salePrice, 0);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  formatFullDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  printPayout() {
    window.print();
  }

  downloadReceipt() {
    if (!this.payoutDetail) return;

    // For now, just print the receipt since we don't have a receipt download endpoint
    // In the future, this could be implemented as a separate API endpoint
    this.printPayout();
  }
}