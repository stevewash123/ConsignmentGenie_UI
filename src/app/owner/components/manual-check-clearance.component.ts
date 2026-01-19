import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CheckClearanceService } from '../../services/check-clearance.service';

export interface PendingCheck {
  id: string;
  transactionId: string;
  transactionNumber: string;
  customerName: string;
  amount: number;
  saleDate: Date;
  daysPending: number;
  isOverdue: boolean;
}

@Component({
  selector: 'app-manual-check-clearance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manual-check-clearance.component.html',
  styleUrls: ['./manual-check-clearance.component.css']
})
export class ManualCheckClearanceComponent implements OnInit {
  // State
  pendingChecks = signal<PendingCheck[]>([]);
  selectedCheckIds = signal<Set<string>>(new Set());
  isLoading = signal(false);
  isClearing = signal(false);

  // Computed values
  totalPendingAmount = computed(() => {
    return this.pendingChecks().reduce((sum, check) => sum + check.amount, 0);
  });

  selectedChecks = computed(() => {
    const selectedIds = this.selectedCheckIds();
    return this.pendingChecks().filter(check => selectedIds.has(check.id));
  });

  selectedAmount = computed(() => {
    return this.selectedChecks().reduce((sum, check) => sum + check.amount, 0);
  });

  allSelected = computed(() => {
    const checks = this.pendingChecks();
    const selected = this.selectedCheckIds();
    return checks.length > 0 && checks.every(check => selected.has(check.id));
  });

  someSelected = computed(() => {
    const selected = this.selectedCheckIds();
    return selected.size > 0 && !this.allSelected();
  });

  hasOverdueChecks = computed(() => {
    return this.pendingChecks().some(check => check.isOverdue);
  });

  constructor(
    private checkClearanceService: CheckClearanceService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadPendingChecks();
  }

  async loadPendingChecks() {
    this.isLoading.set(true);

    try {
      const checks = await this.checkClearanceService.getPendingChecks().toPromise();
      this.pendingChecks.set(checks || []);
      this.selectedCheckIds.set(new Set()); // Clear selection when reloading
    } catch (error) {
      console.error('Error loading pending checks:', error);
      this.toastr.error('Failed to load pending checks');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleCheckSelection(checkId: string) {
    const currentSelected = new Set(this.selectedCheckIds());

    if (currentSelected.has(checkId)) {
      currentSelected.delete(checkId);
    } else {
      currentSelected.add(checkId);
    }

    this.selectedCheckIds.set(currentSelected);
  }

  toggleAllSelection() {
    const checks = this.pendingChecks();
    const currentSelected = this.selectedCheckIds();

    if (this.allSelected()) {
      // Deselect all
      this.selectedCheckIds.set(new Set());
    } else {
      // Select all
      this.selectedCheckIds.set(new Set(checks.map(check => check.id)));
    }
  }

  async markSelectedAsCleared() {
    const selected = this.selectedChecks();

    if (selected.length === 0) {
      this.toastr.warning('Please select at least one check to clear');
      return;
    }

    if (!confirm(`Are you sure you want to mark ${selected.length} check(s) as cleared?`)) {
      return;
    }

    this.isClearing.set(true);

    try {
      const transactionIds = selected.map(check => check.transactionId);
      await this.checkClearanceService.markChecksAsCleared(transactionIds).toPromise();

      this.toastr.success(`Successfully marked ${selected.length} check(s) as cleared`);

      // Refresh the list
      await this.loadPendingChecks();

    } catch (error) {
      console.error('Error marking checks as cleared:', error);
      this.toastr.error('Failed to mark checks as cleared');
    } finally {
      this.isClearing.set(false);
    }
  }

  async markAllAsCleared() {
    const checks = this.pendingChecks();

    if (checks.length === 0) {
      return;
    }

    if (!confirm(`Are you sure you want to mark ALL ${checks.length} checks as cleared?`)) {
      return;
    }

    this.isClearing.set(true);

    try {
      const transactionIds = checks.map(check => check.transactionId);
      await this.checkClearanceService.markChecksAsCleared(transactionIds).toPromise();

      this.toastr.success(`Successfully marked all ${checks.length} checks as cleared`);

      // Refresh the list
      await this.loadPendingChecks();

    } catch (error) {
      console.error('Error marking all checks as cleared:', error);
      this.toastr.error('Failed to mark all checks as cleared');
    } finally {
      this.isClearing.set(false);
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStatusDisplay(check: PendingCheck): string {
    if (check.isOverdue) {
      return `⚠️ ${check.daysPending}d`;
    }
    return `⏳ ${check.daysPending}d`;
  }

  getStatusClass(check: PendingCheck): string {
    return check.isOverdue ? 'overdue' : 'normal';
  }
}