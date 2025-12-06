import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { OwnerLayoutComponent } from './owner-layout.component';
import { LoadingService } from '../../shared/services/loading.service';
import { ProcessSinglePayoutModalComponent, ConsignorPayoutData, SinglePayoutResponse } from '../../shared/components/process-single-payout-modal.component';
import { PayoutSuccessModalComponent } from '../../shared/components/payout-success-modal.component';
import { BatchPayoutModalComponent, BatchPayoutResult } from '../../shared/components/batch-payout-modal.component';
import { BalanceAdjustmentModalComponent } from '../../shared/components/balance-adjustment-modal.component';

// Interfaces for the Balance Dashboard
export interface ConsignorBalanceSummary {
  totalPending: number;
  totalAvailable: number;
  totalOwed: number;
  consignorCount: number;
}

export interface ConsignorBalance {
  consignorId: string;
  name: string;
  email?: string;
  pendingBalance: number;
  availableBalance: number;
  totalOwed: number;
  lastPayoutDate?: Date;
  canPay: boolean;
}

export interface BalanceFilter {
  type: 'all' | 'ready' | 'pending';
  label: string;
}

export interface BalanceSort {
  field: 'name' | 'available' | 'lastPayout';
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-consignor-balance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, OwnerLayoutComponent, ProcessSinglePayoutModalComponent, PayoutSuccessModalComponent, BatchPayoutModalComponent, BalanceAdjustmentModalComponent],
  templateUrl: './consignor-balance-dashboard.component.html',
  styleUrls: ['./consignor-balance-dashboard.component.css']
})
export class ConsignorBalanceDashboardComponent implements OnInit {
  // State signals
  summary = signal<ConsignorBalanceSummary>({
    totalPending: 0,
    totalAvailable: 0,
    totalOwed: 0,
    consignorCount: 0
  });

  balances = signal<ConsignorBalance[]>([]);

  // Filter and sort state
  currentFilter = signal<BalanceFilter['type']>('all');
  currentSort = signal<BalanceSort>({ field: 'available', direction: 'desc' });

  // Modal state
  showPayoutModal = signal(false);
  showSuccessModal = signal(false);
  showBatchModal = signal(false);
  showBalanceAdjustmentModal = signal(false);
  selectedConsignorData = signal<ConsignorPayoutData | null>(null);
  selectedConsignorForAdjustment = signal<ConsignorBalance | null>(null);
  lastPayoutResult = signal<SinglePayoutResponse | null>(null);

  // Available filter options
  filterOptions: BalanceFilter[] = [
    { type: 'all', label: 'All Consignors' },
    { type: 'ready', label: 'Ready to Pay' },
    { type: 'pending', label: 'Has Pending' }
  ];

  // Sort options
  sortOptions = [
    { value: 'name-asc', label: 'Name A-Z' },
    { value: 'name-desc', label: 'Name Z-A' },
    { value: 'available-desc', label: 'Available Balance (High to Low)' },
    { value: 'available-asc', label: 'Available Balance (Low to High)' },
    { value: 'lastPayout-desc', label: 'Last Payout (Recent)' },
    { value: 'lastPayout-asc', label: 'Last Payout (Oldest)' }
  ];

  // Computed filtered and sorted balances
  filteredBalances = computed(() => {
    let filtered = this.balances();
    const filter = this.currentFilter();

    switch (filter) {
      case 'ready':
        filtered = filtered.filter(b => b.canPay && b.availableBalance > 0);
        break;
      case 'pending':
        filtered = filtered.filter(b => b.pendingBalance > 0);
        break;
      default:
        filtered = filtered.filter(b => b.totalOwed > 0);
        break;
    }

    const sort = this.currentSort();
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sort.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'available':
          aValue = a.availableBalance;
          bValue = b.availableBalance;
          break;
        case 'lastPayout':
          aValue = a.lastPayoutDate ? new Date(a.lastPayoutDate).getTime() : 0;
          bValue = b.lastPayoutDate ? new Date(b.lastPayoutDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sort.direction === 'desc' ? -comparison : comparison;
    });
  });

  // Convert ConsignorBalance[] to Consignor[] for the balance adjustment modal
  consignorsForModal = computed(() => {
    return this.balances().map(balance => ({
      id: parseInt(balance.consignorId, 10) || 0, // Convert string to number for compatibility
      name: balance.name,
      email: balance.email
    }));
  });

  private loadingService = inject(LoadingService);

  isComponentLoading(): boolean {
    return this.loadingService.isLoading('balance-dashboard');
  }

  constructor(
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadBalanceData();
  }

  loadBalanceData() {
    this.loadingService.start('balance-dashboard');

    try {
      // Mock data for MVP - replace with actual service calls later
      const mockSummary: ConsignorBalanceSummary = {
        totalPending: 892.00,
        totalAvailable: 1247.50,
        totalOwed: 2139.50,
        consignorCount: 4
      };

      const mockBalances: ConsignorBalance[] = [
        {
          consignorId: '1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          pendingBalance: 127.00,
          availableBalance: 450.00,
          totalOwed: 577.00,
          lastPayoutDate: new Date('2024-11-15'),
          canPay: true
        },
        {
          consignorId: '2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          pendingBalance: 0,
          availableBalance: 392.00,
          totalOwed: 392.00,
          lastPayoutDate: new Date('2024-11-20'),
          canPay: true
        },
        {
          consignorId: '3',
          name: 'Mary Jones',
          email: 'mary@example.com',
          pendingBalance: 265.00,
          availableBalance: 50.00,
          totalOwed: 315.00,
          lastPayoutDate: new Date('2024-10-30'),
          canPay: true
        },
        {
          consignorId: '4',
          name: 'Tom Brown',
          email: 'tom@example.com',
          pendingBalance: 500.00,
          availableBalance: 0,
          totalOwed: 500.00,
          lastPayoutDate: undefined,
          canPay: false
        }
      ];

      this.summary.set(mockSummary);
      this.balances.set(mockBalances);

    } catch (error) {
      console.error('Error loading balance data:', error);
      this.toastr.error('Failed to load balance data');
    } finally {
      this.loadingService.stop('balance-dashboard');
    }
  }

  onFilterChange(filterType: BalanceFilter['type']) {
    this.currentFilter.set(filterType);
  }

  onSortChange(sortValue: string) {
    const [field, direction] = sortValue.split('-') as [BalanceSort['field'], BalanceSort['direction']];
    this.currentSort.set({ field, direction });
  }

  payConsignor(consignor: ConsignorBalance) {
    if (!consignor.canPay || consignor.availableBalance <= 0) {
      this.toastr.warning(`${consignor.name} has no available balance to pay`);
      return;
    }

    const payoutData: ConsignorPayoutData = {
      consignorId: consignor.consignorId,
      consignorName: consignor.name,
      availableBalance: consignor.availableBalance,
      pendingBalance: consignor.pendingBalance
    };

    this.selectedConsignorData.set(payoutData);
    this.showPayoutModal.set(true);
  }

  payAllDue() {
    const readyToPay = this.balances().filter(b => b.canPay && b.availableBalance > 0);
    if (readyToPay.length === 0) {
      this.toastr.warning('No consignors ready for payment');
      return;
    }

    this.showBatchModal.set(true);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  refreshData() {
    this.loadBalanceData();
  }

  onPayoutModalClose() {
    this.showPayoutModal.set(false);
    this.selectedConsignorData.set(null);
  }

  onPayoutSuccess(payoutResult: SinglePayoutResponse) {
    this.showPayoutModal.set(false);
    this.lastPayoutResult.set(payoutResult);
    this.showSuccessModal.set(true);

    // Update the balance data to reflect the payout
    this.updateConsignorBalance(payoutResult.consignorName, payoutResult.amount);
  }

  onSuccessModalClose() {
    this.showSuccessModal.set(false);
    this.lastPayoutResult.set(null);
    this.selectedConsignorData.set(null);
  }

  onBatchModalClose() {
    this.showBatchModal.set(false);
  }

  onBatchSuccess(batchResult: BatchPayoutResult) {
    this.showBatchModal.set(false);

    // Update balances for all consignors in the batch
    batchResult.payouts.forEach(payout => {
      this.updateConsignorBalance(payout.consignorName, payout.amount);
    });

    this.toastr.success(`Successfully processed ${batchResult.count} payouts totaling ${this.formatCurrency(batchResult.totalAmount)}`);
  }

  private updateConsignorBalance(consignorName: string, paidAmount: number) {
    const balances = this.balances();
    const updatedBalances = balances.map(balance => {
      if (balance.name === consignorName) {
        return {
          ...balance,
          availableBalance: Math.max(0, balance.availableBalance - paidAmount),
          totalOwed: Math.max(0, balance.totalOwed - paidAmount),
          lastPayoutDate: new Date(),
          canPay: (balance.availableBalance - paidAmount) > 0
        };
      }
      return balance;
    });

    this.balances.set(updatedBalances);

    // Update summary
    const summary = this.summary();
    this.summary.set({
      ...summary,
      totalAvailable: Math.max(0, summary.totalAvailable - paidAmount),
      totalOwed: Math.max(0, summary.totalOwed - paidAmount)
    });
  }

  // Balance Adjustment Modal Methods
  openBalanceAdjustmentModal(consignor: ConsignorBalance) {
    this.selectedConsignorForAdjustment.set(consignor);
    this.showBalanceAdjustmentModal.set(true);
  }

  onBalanceAdjustmentModalClose() {
    this.showBalanceAdjustmentModal.set(false);
    this.selectedConsignorForAdjustment.set(null);
  }

  onBalanceAdjustmentCreated() {
    this.showBalanceAdjustmentModal.set(false);
    this.selectedConsignorForAdjustment.set(null);

    // Refresh the data to show updated balances
    this.refreshData();

    this.toastr.success('Balance adjustment created successfully');
  }
}