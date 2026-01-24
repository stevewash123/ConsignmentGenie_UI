import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PayoutBatchItem {
  payoutNumber: string;
  consignorName: string;
  itemCount: number;
  amount: number;
  paymentMethod: string;
}

export interface PayoutBatchReport {
  batchId: string;
  totalPayouts: number;
  totalAmount: number;
  payouts: PayoutBatchItem[];
  createdAt: Date;
}

@Component({
  selector: 'app-payout-batch-report-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" *ngIf="isOpen">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">Payouts Created</h2>
          </div>
          <button
            (click)="close()"
            class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 flex-1 overflow-hidden">
          <!-- Summary -->
          <div class="mb-6">
            <p class="text-lg text-gray-700">
              {{ batchReport.totalPayouts }} payouts totaling
              <span class="font-semibold">{{ batchReport.totalAmount | currency }}</span>
            </p>
            <p class="text-sm text-gray-500 mt-1">
              Batch: {{ batchReport.batchId }} • {{ batchReport.createdAt | date:'MMM d, y h:mm a' }}
            </p>
          </div>

          <!-- Payouts Table -->
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <div class="overflow-y-auto max-h-96">
              <table class="w-full">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payout #
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consignor
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr *ngFor="let payout of batchReport.payouts; trackBy: trackByPayoutNumber"
                      class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm font-medium text-gray-900">
                      {{ payout.payoutNumber }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      {{ payout.consignorName }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700 text-center">
                      {{ payout.itemCount }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      {{ payout.amount | currency }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            [ngClass]="{
                              'bg-green-100 text-green-800': payout.paymentMethod === 'ACH',
                              'bg-blue-100 text-blue-800': payout.paymentMethod === 'Check',
                              'bg-yellow-100 text-yellow-800': payout.paymentMethod === 'Cash'
                            }">
                        {{ payout.paymentMethod }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            (click)="downloadCsv()"
            [disabled]="isExporting"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
            <span *ngIf="isExporting && exportType === 'csv'" class="inline-flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </span>
            <span *ngIf="!(isExporting && exportType === 'csv')">Download CSV</span>
          </button>

          <button
            (click)="downloadPdf()"
            [disabled]="isExporting"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
            <span *ngIf="isExporting && exportType === 'pdf'" class="inline-flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </span>
            <span *ngIf="!(isExporting && exportType === 'pdf')">Download PDF</span>
          </button>

          <button
            (click)="close()"
            class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Close
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: []
})
export class PayoutBatchReportModalComponent {
  @Input() isOpen = false;
  @Input() batchReport!: PayoutBatchReport;
  @Output() closeModal = new EventEmitter<void>();
  @Output() exportCsv = new EventEmitter<PayoutBatchReport>();
  @Output() exportPdf = new EventEmitter<PayoutBatchReport>();

  isExporting = false;
  exportType: 'csv' | 'pdf' | null = null;

  close() {
    this.closeModal.emit();
  }

  async downloadCsv() {
    this.isExporting = true;
    this.exportType = 'csv';
    try {
      this.exportCsv.emit(this.batchReport);
    } finally {
      // Reset after a delay to show the loading state
      setTimeout(() => {
        this.isExporting = false;
        this.exportType = null;
      }, 1000);
    }
  }

  async downloadPdf() {
    this.isExporting = true;
    this.exportType = 'pdf';
    try {
      this.exportPdf.emit(this.batchReport);
    } finally {
      // Reset after a delay to show the loading state
      setTimeout(() => {
        this.isExporting = false;
        this.exportType = null;
      }, 1000);
    }
  }

  trackByPayoutNumber(index: number, payout: PayoutBatchItem): string {
    return payout.payoutNumber;
  }
}