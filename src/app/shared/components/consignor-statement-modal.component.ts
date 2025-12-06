import { Component, Input, Output, EventEmitter, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

export interface ConsignorOption {
  id: string;
  name: string;
  email?: string;
}

export interface StatementSale {
  date: Date;
  itemName: string;
  salePrice: number;
  consignorShare: number;
  commissionRate: number;
}

export interface StatementAdjustment {
  date: Date;
  description: string;
  amount: number;
}

export interface StatementPayout {
  date: Date;
  method: string;
  reference?: string;
  amount: number;
}

export interface StatementData {
  id: string;
  consignorName: string;
  consignorEmail?: string;
  accountNumber: string;
  fromDate: Date;
  toDate: Date;
  openingBalance: number;
  sales: StatementSale[];
  adjustments: StatementAdjustment[];
  payouts: StatementPayout[];
  closingBalance: number;
  totalSales: number;
  totalAdjustments: number;
  totalPayouts: number;
  generatedDate: Date;
}

@Component({
  selector: 'app-consignor-statement-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consignor-statement-modal.component.html',
  styleUrls: ['./consignor-statement-modal.component.css']
})
export class ConsignorStatementModalComponent implements OnInit {
  @Input() isVisible = false;
  @Input() availableConsignors: ConsignorOption[] = [];
  @Output() onClose = new EventEmitter<void>();

  // State
  currentStep = signal<'select' | 'preview' | 'processing'>('select');
  selectedConsignorId = signal('');
  fromDate = signal('');
  toDate = signal('');
  isLoading = signal(false);
  statementData = signal<StatementData | null>(null);

  // Computed values
  selectedConsignor = computed(() => {
    const id = this.selectedConsignorId();
    return this.availableConsignors.find(c => c.id === id);
  });

  canGenerateStatement = computed(() => {
    return this.selectedConsignorId() && this.fromDate() && this.toDate();
  });

  constructor(private toastr: ToastrService) {}

  ngOnInit() {
    this.initializeDates();
  }

  private initializeDates() {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.fromDate.set(this.formatDateForInput(firstOfMonth));
    this.toDate.set(this.formatDateForInput(lastOfMonth));
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  async generateStatement() {
    if (!this.canGenerateStatement()) {
      this.toastr.warning('Please select a consignor and date range');
      return;
    }

    this.currentStep.set('processing');
    this.isLoading.set(true);

    try {
      // Mock API call - replace with actual service call
      const mockStatement = await this.generateMockStatement();

      this.statementData.set(mockStatement);
      this.currentStep.set('preview');

      this.toastr.success('Statement generated successfully');

    } catch (error) {
      console.error('Error generating statement:', error);
      this.toastr.error('Failed to generate statement');
      this.currentStep.set('select');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async generateMockStatement(): Promise<StatementData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const consignor = this.selectedConsignor()!;
    const fromDate = new Date(this.fromDate());
    const toDate = new Date(this.toDate());

    // Mock data based on the story spec
    const mockStatement: StatementData = {
      id: 'stmt-' + Date.now(),
      consignorName: consignor.name,
      consignorEmail: consignor.email,
      accountNumber: 'CON-' + Math.random().toString().substr(2, 6),
      fromDate,
      toDate,
      openingBalance: 125.00,
      sales: [
        {
          date: new Date('2025-11-05'),
          itemName: 'Vintage Lamp',
          salePrice: 45.00,
          consignorShare: 27.00,
          commissionRate: 0.4
        },
        {
          date: new Date('2025-11-12'),
          itemName: 'Oak Dresser',
          salePrice: 200.00,
          consignorShare: 120.00,
          commissionRate: 0.4
        },
        {
          date: new Date('2025-11-18'),
          itemName: 'Set of Plates',
          salePrice: 35.00,
          consignorShare: 21.00,
          commissionRate: 0.4
        },
        {
          date: new Date('2025-11-22'),
          itemName: 'Brass Candlesticks',
          salePrice: 60.00,
          consignorShare: 36.00,
          commissionRate: 0.4
        },
        {
          date: new Date('2025-11-28'),
          itemName: 'Antique Mirror',
          salePrice: 150.00,
          consignorShare: 90.00,
          commissionRate: 0.4
        }
      ],
      adjustments: [
        {
          date: new Date('2025-11-15'),
          description: 'Return - Vintage Lamp',
          amount: -27.00
        }
      ],
      payouts: [
        {
          date: new Date('2025-11-15'),
          method: 'Check',
          reference: '#1234',
          amount: -125.00
        }
      ],
      totalSales: 294.00,
      totalAdjustments: -27.00,
      totalPayouts: -125.00,
      closingBalance: 267.00,
      generatedDate: new Date()
    };

    return mockStatement;
  }

  async printStatement() {
    const statement = this.statementData();
    if (!statement) return;

    const printContent = this.generatePrintableStatement(statement);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }

    this.toastr.success('Statement sent to printer');
  }

  async emailStatement() {
    const statement = this.statementData();
    if (!statement) return;

    // TODO: Implement email functionality
    const email = statement.consignorEmail || 'consignor@email.com';
    this.toastr.info(`Statement will be emailed to ${email} - Coming soon`);
  }

  private generatePrintableStatement(statement: StatementData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Consignor Statement - ${statement.consignorName}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.4;
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .shop-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .statement-type {
            font-size: 16px;
            font-weight: bold;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
          }
          .section {
            margin: 20px 0;
          }
          .section-title {
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .line-item {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
          }
          .separator {
            border-top: 2px double #000;
            margin: 20px 0;
            padding-top: 10px;
          }
          .total-line {
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 10px;
          }
          .balance-section {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            border: 2px solid #000;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-style: italic;
          }
          .amount {
            text-align: right;
            width: 100px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 2px 5px;
            vertical-align: top;
          }
          .date-col { width: 80px; }
          .desc-col { width: auto; }
          .price-col { width: 100px; text-align: right; }
          .share-col { width: 100px; text-align: right; }
          @media print {
            body { margin: 0; padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">JANE'S VINTAGE CONSIGNMENT</div>
          <div class="statement-type">CONSIGNOR STATEMENT</div>
        </div>

        <div class="info-section">
          <div>
            <div>Consignor: ${statement.consignorName}</div>
            <div>Account #: ${statement.accountNumber}</div>
          </div>
          <div style="text-align: right;">
            <div>Statement Date: ${statement.generatedDate.toLocaleDateString()}</div>
            <div>Period: ${statement.fromDate.toLocaleDateString()} - ${statement.toDate.toLocaleDateString()}</div>
          </div>
        </div>

        <div class="separator">
          <div class="line-item">
            <span>OPENING BALANCE (${statement.fromDate.toLocaleDateString()})</span>
            <span class="amount">$${statement.openingBalance.toFixed(2)}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">SALES</div>
          <table>
            <tr>
              <td class="date-col"><strong>Date</strong></td>
              <td class="desc-col"><strong>Item</strong></td>
              <td class="price-col"><strong>Sale Price</strong></td>
              <td class="share-col"><strong>Your Share (60%)</strong></td>
            </tr>
            ${statement.sales.map(sale => `
              <tr>
                <td>${sale.date.toLocaleDateString()}</td>
                <td>${sale.itemName}</td>
                <td class="amount">$${sale.salePrice.toFixed(2)}</td>
                <td class="amount">$${sale.consignorShare.toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
          <div class="total-line">
            <div class="line-item">
              <span>TOTAL SALES (${statement.sales.length} items)</span>
              <span class="amount">$${statement.totalSales.toFixed(2)}</span>
            </div>
          </div>
        </div>

        ${statement.adjustments.length > 0 ? `
          <div class="section">
            <div class="section-title">ADJUSTMENTS</div>
            ${statement.adjustments.map(adj => `
              <div class="line-item">
                <span>${adj.date.toLocaleDateString()} ${adj.description}</span>
                <span class="amount">$${adj.amount.toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="total-line">
              <div class="line-item">
                <span>TOTAL ADJUSTMENTS</span>
                <span class="amount">$${statement.totalAdjustments.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ` : ''}

        ${statement.payouts.length > 0 ? `
          <div class="section">
            <div class="section-title">PAYOUTS</div>
            ${statement.payouts.map(payout => `
              <div class="line-item">
                <span>${payout.date.toLocaleDateString()} ${payout.method} ${payout.reference || ''}</span>
                <span class="amount">$${payout.amount.toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="total-line">
              <div class="line-item">
                <span>TOTAL PAYOUTS</span>
                <span class="amount">$${statement.totalPayouts.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="balance-section">
          CLOSING BALANCE (${statement.toDate.toLocaleDateString()}): $${statement.closingBalance.toFixed(2)}
        </div>

        <div class="footer">
          Thank you for consigning with us!
        </div>
      </body>
      </html>
    `;
  }

  goBackToSelection() {
    this.currentStep.set('select');
    this.statementData.set(null);
  }

  closeModal() {
    this.currentStep.set('select');
    this.selectedConsignorId.set('');
    this.statementData.set(null);
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

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}