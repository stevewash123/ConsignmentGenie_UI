import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayoutService } from '../../services/payout.service';
import { Subject, takeUntil } from 'rxjs';

interface PayoutDetail {
  id: string;
  payoutNumber: string;
  date: Date;
  consignorId: string;
  consignorName: string;
  consignorEmail?: string;
  consignorPhone?: string;
  amount: number;
  method: string;
  status: string;
  notes?: string;
  processedBy: string;
  processedDate: Date;
  voidedBy?: string;
  voidedDate?: Date;
  voidReason?: string;
  items: PayoutItemDetail[];
}

interface PayoutItemDetail {
  id: string;
  itemId: string;
  title: string;
  category: string;
  saleDate: Date;
  salePrice: number;
  consignorCut: number;
  commission: number;
  transactionId: string;
}

@Component({
  selector: 'app-payout-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payout-detail-modal.component.html',
  styleUrl: './payout-detail-modal.component.css'
})
export class PayoutDetailModalComponent implements OnInit, OnDestroy {
  @Input() payoutId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() payoutUpdated = new EventEmitter<void>();

  payout: PayoutDetail | null = null;
  loading = false;
  error: string | null = null;

  // Edit mode
  isEditing = false;
  editForm: {
    method: string;
    notes: string;
  } = {
    method: '',
    notes: ''
  };

  // Void modal
  showVoidModal = false;
  voidReason = '';
  voiding = false;

  private destroy$ = new Subject<void>();

  constructor(private payoutService: PayoutService) {}

  ngOnInit() {
    this.loadPayoutDetail();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadPayoutDetail() {
    if (!this.payoutId) return;

    this.loading = true;
    this.error = null;

    try {
      this.payout = await this.payoutService.getPayoutDetail(this.payoutId);
      this.initializeEditForm();
    } catch (error) {
      console.error('Error loading payout detail:', error);
      this.error = 'Failed to load payout details. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  initializeEditForm() {
    if (this.payout) {
      this.editForm = {
        method: this.payout.method,
        notes: this.payout.notes || ''
      };
    }
  }

  onClose() {
    this.close.emit();
  }

  onOverlayClick(event: MouseEvent) {
    // Close modal if clicked outside the modal content
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  startEdit() {
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
    this.initializeEditForm();
  }

  async saveEdit() {
    if (!this.payout) return;

    try {
      await this.payoutService.updatePayout(this.payout.id, {
        method: this.editForm.method,
        notes: this.editForm.notes
      });

      // Update local data
      this.payout.method = this.editForm.method;
      this.payout.notes = this.editForm.notes;

      this.isEditing = false;
      this.payoutUpdated.emit();
    } catch (error) {
      console.error('Error updating payout:', error);
      alert('Failed to update payout. Please try again.');
    }
  }

  showVoidConfirmation() {
    if (!this.payout || this.payout.status === 'Voided') return;
    this.showVoidModal = true;
    this.voidReason = '';
  }

  hideVoidConfirmation() {
    this.showVoidModal = false;
    this.voidReason = '';
  }

  async confirmVoid() {
    if (!this.payout || !this.voidReason.trim()) return;

    this.voiding = true;
    try {
      await this.payoutService.voidPayout(this.payout.id, this.voidReason.trim());

      // Update local data
      this.payout.status = 'Voided';
      this.payout.voidReason = this.voidReason.trim();
      this.payout.voidedDate = new Date();

      this.hideVoidConfirmation();
      this.payoutUpdated.emit();
    } catch (error) {
      console.error('Error voiding payout:', error);
      alert('Failed to void payout. Please try again.');
    } finally {
      this.voiding = false;
    }
  }

  async downloadReceipt() {
    if (!this.payout) return;

    try {
      const blob = await this.payoutService.downloadPayoutReceipt(this.payout.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payout-receipt-${this.payout.payoutNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again.');
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canEdit(): boolean {
    return this.payout?.status === 'Pending' || this.payout?.status === 'Completed';
  }

  canVoid(): boolean {
    return this.payout?.status === 'Pending' || this.payout?.status === 'Completed';
  }
}