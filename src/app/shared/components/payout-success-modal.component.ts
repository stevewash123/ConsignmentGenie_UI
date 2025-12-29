import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { SinglePayoutResponse } from './process-single-payout-modal.component';

@Component({
  selector: 'app-payout-success-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payout-success-modal.component.html',
  styleUrls: ['./payout-success-modal.component.css']
})
export class PayoutSuccessModalComponent {
  @Input() isVisible = false;
  @Input() payoutData: SinglePayoutResponse | null = null;
  @Output() onClose = new EventEmitter<void>();

  constructor(private toastr: ToastrService) {}

  closeModal() {
    this.onClose.emit();
  }

  handleOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  printReceipt() {
    if (!this.payoutData) return;

    // Create a simple receipt for printing
    const receiptContent = this.generateReceiptContent();
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }

    this.toastr.success('Receipt sent to printer');
  }

  emailToConsignor() {
    if (!this.payoutData) return;

    // TODO: Implement email functionality
    this.toastr.info(`Email to ${this.payoutData.consignorName} - Coming soon`);
  }

  private generateReceiptContent(): string {
    if (!this.payoutData) return '';

    const date = new Date(this.payoutData.createdAt).toLocaleDateString('en-US', {
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
        <title>Payout Receipt - ${this.payoutData.payoutNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
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
          .content {
            margin: 20px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 5px 0;
          }
          .row.highlight {
            font-weight: bold;
            font-size: 18px;
            border-top: 1px solid #ddd;
            border-bottom: 1px solid #ddd;
            padding: 15px 0;
            margin: 20px 0;
          }
          .label {
            color: #555;
          }
          .value {
            font-weight: 500;
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
          <div class="title">✓ PAYOUT COMPLETE</div>
          <div class="subtitle">Payment Receipt</div>
        </div>

        <div class="content">
          <div class="row highlight">
            <span class="label">Paid:</span>
            <span class="value amount">${this.payoutData.amount.toFixed(2)} to ${this.payoutData.consignorName}</span>
          </div>

          <div class="row">
            <span class="label">Payout ID:</span>
            <span class="value">${this.payoutData.payoutNumber}</span>
          </div>

          <div class="row">
            <span class="label">Payment Method:</span>
            <span class="value">${this.payoutData.method}</span>
          </div>

          <div class="row">
            <span class="label">Date:</span>
            <span class="value">${date}</span>
          </div>

          <div class="row">
            <span class="label">Consignor:</span>
            <span class="value">${this.payoutData.consignorName}</span>
          </div>
        </div>

        <div class="footer">
          <p>This receipt was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>ConsignmentGenie - Payout Management System</p>
        </div>
      </body>
      </html>
    `;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}