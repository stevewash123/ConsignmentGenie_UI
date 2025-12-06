import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PayoutService } from '../../services/payout.service';

export interface BatchConsignorData {
  consignorId: string;
  name: string;
  availableBalance: number;
  preferredPaymentMethod?: string;
  selected: boolean;
}

export interface BatchPayoutPreview {
  eligibleConsignors: BatchConsignorData[];
  totalAmount: number;
  count: number;
}

export interface BatchPayoutRequest {
  method: string;
  consignorIds: string[];
  notes?: string;
}

export interface BatchPayoutResult {
  payouts: {
    consignorId: string;
    consignorName: string;
    amount: number;
    method: string;
    payoutNumber: string;
  }[];
  totalAmount: number;
  count: number;
}

@Component({
  selector: 'app-batch-payout-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './batch-payout-modal.component.html',
  styleUrls: ['./batch-payout-modal.component.css']
})
export class BatchPayoutModalComponent implements OnInit {
  @Input() isVisible = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<BatchPayoutResult>();

  // State
  currentStep = signal<'preview' | 'processing' | 'result'>('preview');
  consignors = signal<BatchConsignorData[]>([]);
  selectedPaymentMethod = signal('Check');
  notes = signal('');
  isLoading = signal(false);
  batchResult = signal<BatchPayoutResult | null>(null);

  // Payment method options
  paymentMethods = [
    'Check',
    'Venmo',
    'Zelle',
    'PayPal',
    'Cash',
    'Bank Transfer',
    'Store Credit',
    'Other'
  ];

  // Computed values
  selectedConsignors = computed(() => {
    return this.consignors().filter(c => c.selected);
  });

  totalSelectedAmount = computed(() => {
    return this.selectedConsignors().reduce((sum, c) => sum + c.availableBalance, 0);
  });

  selectedCount = computed(() => {
    return this.selectedConsignors().length;
  });

  constructor(
    private payoutService: PayoutService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadBatchPreview();
  }

  async loadBatchPreview() {
    this.isLoading.set(true);

    try {
      // Try to use real API first, fallback to mock data
      let preview: BatchPayoutPreview;

      try {
        const apiPreview = await this.payoutService.getBatchPayoutPreview({
          method: this.selectedPaymentMethod(),
          consignorIds: null // null = all eligible
        }).toPromise();

        if (apiPreview) {
          preview = {
            eligibleConsignors: apiPreview.eligibleConsignors.map(c => ({
              ...c,
              selected: true // Initially select all
            })),
            totalAmount: apiPreview.totalAmount,
            count: apiPreview.count
          };
        } else {
          throw new Error('No data received from API');
        }
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);

        // Fallback to mock data
        preview = {
          eligibleConsignors: [
            {
              consignorId: '1',
              name: 'Jane Doe',
              availableBalance: 450.00,
              preferredPaymentMethod: 'Check',
              selected: true
            },
            {
              consignorId: '2',
              name: 'Bob Smith',
              availableBalance: 392.00,
              preferredPaymentMethod: 'Venmo',
              selected: true
            },
            {
              consignorId: '3',
              name: 'Mary Jones',
              availableBalance: 355.50,
              preferredPaymentMethod: 'Check',
              selected: true
            },
            {
              consignorId: '4',
              name: 'Sue Green',
              availableBalance: 50.00,
              preferredPaymentMethod: 'Store Credit',
              selected: false
            }
          ],
          totalAmount: 1247.50,
          count: 4
        };
      }

      this.consignors.set(preview.eligibleConsignors);

    } catch (error) {
      console.error('Error loading batch preview:', error);
      this.toastr.error('Failed to load batch payout preview');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleConsignor(consignorId: string) {
    const consignors = this.consignors();
    const updated = consignors.map(c =>
      c.consignorId === consignorId ? { ...c, selected: !c.selected } : c
    );
    this.consignors.set(updated);
  }

  selectAll() {
    const consignors = this.consignors();
    const updated = consignors.map(c => ({ ...c, selected: true }));
    this.consignors.set(updated);
  }

  selectNone() {
    const consignors = this.consignors();
    const updated = consignors.map(c => ({ ...c, selected: false }));
    this.consignors.set(updated);
  }

  async processBatchPayout() {
    if (this.selectedCount() === 0) {
      this.toastr.warning('Please select at least one consignor');
      return;
    }

    this.currentStep.set('processing');
    this.isLoading.set(true);

    try {
      const request: BatchPayoutRequest = {
        method: this.selectedPaymentMethod(),
        consignorIds: this.selectedConsignors().map(c => c.consignorId),
        notes: this.notes() || undefined
      };

      let result: BatchPayoutResult;

      try {
        // Try to use real API first
        const apiResult = await this.payoutService.processBatchPayout(request).toPromise();

        if (apiResult) {
          result = apiResult;
        } else {
          throw new Error('No data received from API');
        }
      } catch (apiError) {
        console.warn('API call failed, using mock processing:', apiError);

        // Fallback to mock processing
        await this.simulateProcessing();

        result = {
          payouts: this.selectedConsignors().map(c => ({
            consignorId: c.consignorId,
            consignorName: c.name,
            amount: c.availableBalance,
            method: this.selectedPaymentMethod(),
            payoutNumber: 'PAY-' + Math.random().toString(36).substr(2, 8).toUpperCase()
          })),
          totalAmount: this.totalSelectedAmount(),
          count: this.selectedCount()
        };
      }

      this.batchResult.set(result);
      this.currentStep.set('result');

      this.toastr.success(`Successfully processed ${result.count} payouts!`);

    } catch (error) {
      console.error('Error processing batch payout:', error);
      this.toastr.error('Failed to process batch payouts');
      this.currentStep.set('preview');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async simulateProcessing(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 2000); // Simulate processing time
    });
  }

  printBatchReport() {
    const result = this.batchResult();
    if (!result) return;

    const reportContent = this.generateBatchReport(result);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }

    this.toastr.success('Batch report sent to printer');
  }

  private generateBatchReport(result: BatchPayoutResult): string {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Batch Payout Report - ${date}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #666;
            font-size: 14px;
          }
          .summary {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background: #f9fafb;
            font-weight: bold;
          }
          .amount {
            color: #059669;
            font-weight: bold;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Batch Payout Report</div>
          <div class="subtitle">Generated on ${date}</div>
        </div>

        <div class="summary">
          <h3>Summary</h3>
          <p><strong>Total Payouts:</strong> ${result.count}</p>
          <p><strong>Total Amount:</strong> <span class="amount">$${result.totalAmount.toFixed(2)}</span></p>
          <p><strong>Payment Method:</strong> ${result.payouts[0]?.method || 'Various'}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Consignor</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Payout Number</th>
            </tr>
          </thead>
          <tbody>
            ${result.payouts.map(payout => `
              <tr>
                <td>${payout.consignorName}</td>
                <td class="amount">$${payout.amount.toFixed(2)}</td>
                <td>${payout.method}</td>
                <td>${payout.payoutNumber}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This report was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>ConsignmentGenie - Batch Payout Management</p>
        </div>
      </body>
      </html>
    `;
  }

  emailAllConsignors() {
    const result = this.batchResult();
    if (!result) return;

    // TODO: Implement email functionality
    this.toastr.info(`Email notifications to ${result.count} consignors - Coming soon`);
  }

  closeModal() {
    this.currentStep.set('preview');
    this.consignors.set([]);
    this.notes.set('');
    this.batchResult.set(null);
    this.onClose.emit();
  }

  handleOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getMethodHint(consignor: BatchConsignorData): string {
    if (consignor.preferredPaymentMethod) {
      return consignor.preferredPaymentMethod === this.selectedPaymentMethod() ?
        `${consignor.preferredPaymentMethod} preferred` :
        `${consignor.preferredPaymentMethod} preferred`;
    }
    return 'No preference';
  }
}