import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from '../../shared/services/loading.service';
import { Transaction, TransactionItem } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction.service';
import { ConfirmationDialogService } from '../../shared/services/confirmation-dialog.service';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sale-detail.component.html',
  styleUrls: ['./sale-detail.component.scss']
})
export class SaleDetailComponent implements OnInit {
  transaction = signal<Transaction | null>(null);
  transactionId = signal<string>('');
  error = signal<string>('');

  // Edit modal states
  showEditModal = signal(false);
  isUpdating = signal(false);
  editForm_salePrice = 0;
  editForm_paymentType = '';
  editForm_notes = '';

  isLoading(): boolean {
    return this.loadingService.isLoading('sale-detail');
  }

  constructor(
    private transactionService: TransactionService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private loadingService: LoadingService,
    private http: HttpClient,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.transactionId.set(id);
      this.loadTransaction();
    }
  }

  loadTransaction(): void {
    this.loadingService.start('sale-detail');

    this.transactionService.getTransaction(this.transactionId()).subscribe({
      next: (transaction: Transaction) => {
        this.transaction.set(transaction);
      },
      error: (error) => {
        console.error('Error loading transaction:', error);
        this.error.set('Failed to load sale details');
      },
      complete: () => {
        this.loadingService.stop('sale-detail');
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  editTransaction(): void {
    const transaction = this.transaction();
    if (transaction) {
      // Pre-fill edit form
      this.editForm_salePrice = transaction.subtotal;
      this.editForm_paymentType = transaction.paymentType;
      this.editForm_notes = transaction.notes || '';
      this.showEditModal.set(true);
    }
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  async updateTransaction(): Promise<void> {
    const transaction = this.transaction();
    if (!transaction) return;

    this.isUpdating.set(true);

    try {
      // TODO: Implement transaction update API call
      // For now, just update the local state
      const updatedTransaction = {
        ...transaction,
        subtotal: this.editForm_salePrice,
        paymentType: this.editForm_paymentType,
        notes: this.editForm_notes
      };
      this.transaction.set(updatedTransaction);

      this.closeEditModal();
      console.log('Transaction updated successfully');
    } catch (error) {
      console.error('Error updating transaction:', error);
      this.error.set('Failed to update transaction');
    } finally {
      this.isUpdating.set(false);
    }
  }

  voidTransaction(): void {
    const transaction = this.transaction();
    if (!transaction) return;

    this.confirmationDialog.confirmAction(
      'Void Transaction',
      `Are you sure you want to void this sale? This action cannot be undone.`,
      'Void Sale'
    ).subscribe(result => {
      if (result.confirmed) {
        this.performVoidTransaction();
      }
    });
  }

  private async performVoidTransaction(): Promise<void> {
    const transaction = this.transaction();
    if (!transaction) return;

    try {
      // TODO: Implement void transaction API call
      console.log('Transaction voided successfully');
      this.goBack(); // Return to sales list after voiding
    } catch (error) {
      console.error('Error voiding transaction:', error);
      this.error.set('Failed to void transaction');
    }
  }

  canVoidTransaction(): boolean {
    const transaction = this.transaction();
    if (!transaction) return false;

    // Check if transaction is recent enough to void (e.g., within 24 hours)
    const saleDate = new Date(transaction.saleDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60);

    return hoursDiff <= 24; // Can void within 24 hours
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getPaymentMethodClass(paymentType: string): string {
    const type = paymentType?.toLowerCase();
    if (type?.includes('cash')) return 'badge-success';
    if (type?.includes('card') || type?.includes('credit') || type?.includes('debit')) return 'badge-info';
    if (type?.includes('online') || type?.includes('check')) return 'badge-warn';
    return 'badge-neutral';
  }

  getDaysSinceSale(): number {
    const transaction = this.transaction();
    if (!transaction) return 0;

    const saleDate = new Date(transaction.saleDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - saleDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getTransactionShortId(): string {
    const transaction = this.transaction();
    return transaction ? transaction.id.substring(0, 8).toUpperCase() : '';
  }

  viewConsignor(): void {
    const transaction = this.transaction();
    const consignorId = transaction?.items[0]?.consignor?.id;
    if (consignorId) {
      this.router.navigate(['/owner/consignors', consignorId]);
    }
  }

  viewItem(): void {
    const transaction = this.transaction();
    const itemId = transaction?.items[0]?.item?.id;
    if (itemId) {
      this.router.navigate(['/owner/inventory', itemId]);
    }
  }
}