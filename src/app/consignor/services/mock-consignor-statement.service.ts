import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { StatementListDto, StatementDto, StatementSaleLineDto, StatementPayoutLineDto } from '../models/consignor.models';

@Injectable({
  providedIn: 'root'
})
export class MockConsignorStatementService {

  private mockStatements: StatementListDto[] = [
    {
      statementId: 'stmt_2024_12',
      statementNumber: 'ST-2024-12',
      periodStart: new Date('2024-12-01'),
      periodEnd: new Date('2024-12-31'),
      periodLabel: 'December 2024',
      itemsSold: 12,
      totalEarnings: 485.00,
      payoutCount: 1,
      closingBalance: 172.50,
      status: 'Generated',
      hasPdf: true,
      generatedAt: new Date('2025-01-02')
    },
    {
      statementId: 'stmt_2024_11',
      statementNumber: 'ST-2024-11',
      periodStart: new Date('2024-11-01'),
      periodEnd: new Date('2024-11-30'),
      periodLabel: 'November 2024',
      itemsSold: 8,
      totalEarnings: 312.50,
      payoutCount: 2,
      closingBalance: 67.50,
      status: 'Generated',
      hasPdf: true,
      generatedAt: new Date('2024-12-01')
    },
    {
      statementId: 'stmt_2024_10',
      statementNumber: 'ST-2024-10',
      periodStart: new Date('2024-10-01'),
      periodEnd: new Date('2024-10-31'),
      periodLabel: 'October 2024',
      itemsSold: 15,
      totalEarnings: 198.75,
      payoutCount: 1,
      closingBalance: 42.00,
      status: 'Generated',
      hasPdf: true,
      generatedAt: new Date('2024-11-01')
    },
    {
      statementId: 'stmt_2024_09',
      statementNumber: 'ST-2024-09',
      periodStart: new Date('2024-09-01'),
      periodEnd: new Date('2024-09-30'),
      periodLabel: 'September 2024',
      itemsSold: 6,
      totalEarnings: 267.00,
      payoutCount: 3,
      closingBalance: 0.00,
      status: 'Generated',
      hasPdf: true,
      generatedAt: new Date('2024-10-01')
    },
    {
      statementId: 'stmt_2024_08',
      statementNumber: 'ST-2024-08',
      periodStart: new Date('2024-08-01'),
      periodEnd: new Date('2024-08-31'),
      periodLabel: 'August 2024',
      itemsSold: 9,
      totalEarnings: 143.25,
      payoutCount: 1,
      closingBalance: 0.00,
      status: 'Generated',
      hasPdf: true,
      generatedAt: new Date('2024-09-01')
    }
  ];

  private mockStatementDetails: { [key: string]: StatementDto } = {
    'stmt_2024_12': {
      id: 'stmt_2024_12',
      statementNumber: 'ST-2024-12',
      periodStart: '2024-12-01',
      periodEnd: '2024-12-31',
      periodLabel: 'December 2024',
      providerName: 'Jane Smith',
      shopName: 'Main Street Consignment',
      openingBalance: 0.00,
      totalSales: 808.00,
      itemsSold: 12,
      totalEarnings: 485.00,
      totalPayouts: 312.50,
      closingBalance: 172.50,
      payoutCount: 1,
      sales: [
        {
          date: new Date('2024-12-01'),
          itemSku: 'JS-001',
          itemTitle: 'Vintage Coach Handbag',
          salePrice: 125.00,
          commissionRate: 60,
          earningsAmount: 75.00
        },
        {
          date: new Date('2024-12-03'),
          itemSku: 'JS-002',
          itemTitle: 'Leather Jacket',
          salePrice: 89.00,
          commissionRate: 60,
          earningsAmount: 53.40
        },
        {
          date: new Date('2024-12-05'),
          itemSku: 'JS-003',
          itemTitle: 'Blue Ceramic Vase',
          salePrice: 45.00,
          commissionRate: 60,
          earningsAmount: 27.00
        },
        {
          date: new Date('2024-12-08'),
          itemSku: 'JS-004',
          itemTitle: 'Silver Picture Frame',
          salePrice: 35.00,
          commissionRate: 60,
          earningsAmount: 21.00
        },
        {
          date: new Date('2024-12-10'),
          itemSku: 'JS-005',
          itemTitle: 'Wool Scarf',
          salePrice: 28.00,
          commissionRate: 60,
          earningsAmount: 16.80
        },
        {
          date: new Date('2024-12-12'),
          itemSku: 'JS-006',
          itemTitle: 'Antique Clock',
          salePrice: 150.00,
          commissionRate: 60,
          earningsAmount: 90.00
        },
        {
          date: new Date('2024-12-15'),
          itemSku: 'JS-007',
          itemTitle: 'Designer Shoes',
          salePrice: 95.00,
          commissionRate: 60,
          earningsAmount: 57.00
        },
        {
          date: new Date('2024-12-18'),
          itemSku: 'JS-008',
          itemTitle: 'Kitchen Mixer',
          salePrice: 75.00,
          commissionRate: 60,
          earningsAmount: 45.00
        },
        {
          date: new Date('2024-12-20'),
          itemSku: 'JS-009',
          itemTitle: 'Art Painting',
          salePrice: 65.00,
          commissionRate: 60,
          earningsAmount: 39.00
        },
        {
          date: new Date('2024-12-22'),
          itemSku: 'JS-010',
          itemTitle: 'Crystal Glasses Set',
          salePrice: 42.00,
          commissionRate: 60,
          earningsAmount: 25.20
        },
        {
          date: new Date('2024-12-24'),
          itemSku: 'JS-011',
          itemTitle: 'Vintage Jewelry Box',
          salePrice: 55.00,
          commissionRate: 60,
          earningsAmount: 33.00
        },
        {
          date: new Date('2024-12-28'),
          itemSku: 'JS-012',
          itemTitle: 'Decorative Lamp',
          salePrice: 38.00,
          commissionRate: 60,
          earningsAmount: 22.80
        }
      ],
      payouts: [
        {
          date: new Date('2024-12-02'),
          payoutNumber: 'PO-1018',
          paymentMethod: 'Check',
          amount: 312.50
        }
      ],
      status: 'Generated',
      hasPdf: true,
      pdfUrl: undefined,
      viewedAt: undefined,
      generatedAt: new Date('2025-01-02')
    }
  };

  getStatements(): Observable<StatementListDto[]> {
    // Sort by period start date (newest first)
    const sortedStatements = [...this.mockStatements].sort((a, b) =>
      new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime()
    );

    // Add a small delay to simulate network request
    return of(sortedStatements).pipe(delay(300));
  }

  getEmptyStatements(): Observable<StatementListDto[]> {
    return of([]).pipe(delay(300));
  }

  getStatement(statementId: string): Observable<StatementDto> {
    const statement = this.mockStatementDetails[statementId];

    if (statement) {
      return of(statement).pipe(delay(500));
    } else {
      // Generate a basic statement for unknown IDs based on the list data
      const listItem = this.mockStatements.find(s => s.statementId === statementId);
      if (listItem) {
        const mockDetail: StatementDto = {
          id: listItem.statementId,
          statementNumber: listItem.statementNumber,
          periodStart: listItem.periodStart.toISOString().split('T')[0],
          periodEnd: listItem.periodEnd.toISOString().split('T')[0],
          periodLabel: listItem.periodLabel,
          providerName: 'Jane Smith',
          shopName: 'Main Street Consignment',
          openingBalance: 0.00,
          totalSales: parseFloat((listItem.totalEarnings / 0.6).toFixed(2)), // Assuming 60% commission rate
          itemsSold: listItem.itemsSold,
          totalEarnings: listItem.totalEarnings,
          totalPayouts: parseFloat((listItem.totalEarnings * 0.8).toFixed(2)), // Estimate payouts as 80% of earnings
          closingBalance: listItem.closingBalance,
          payoutCount: 1, // Default to 1 payout
          sales: this.generateMockSales(listItem.itemsSold, listItem.totalEarnings),
          payouts: this.generateMockPayouts(1, parseFloat((listItem.totalEarnings * 0.8).toFixed(2))),
          status: listItem.status,
          hasPdf: listItem.hasPdf,
          pdfUrl: undefined,
          viewedAt: undefined,
          generatedAt: listItem.generatedAt
        };
        return of(mockDetail).pipe(delay(500));
      }
    }

    throw new Error(`Statement ${statementId} not found`);
  }

  getStatementByPeriod(year: number, month: number): Observable<StatementDto> {
    // Find statement by matching year and month
    const statement = this.mockStatements.find(s => {
      const periodStart = new Date(s.periodStart);
      return periodStart.getFullYear() === year && periodStart.getMonth() === month - 1;
    });

    if (statement) {
      return this.getStatement(statement.statementId);
    }

    throw new Error(`Statement for ${year}-${month} not found`);
  }

  downloadStatementPdf(statementId: string): Observable<Blob> {
    // Mock PDF generation - in real app this would call the API
    const pdfContent = this.generateStatementPDF(statementId);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return of(blob).pipe(delay(1000));
  }

  downloadStatementPdfByPeriod(year: number, month: number): Observable<Blob> {
    // Mock PDF generation by period
    const pdfContent = this.generateStatementPDF(`${year}-${month}`);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return of(blob).pipe(delay(1000));
  }

  regenerateStatement(statementId: string): Observable<StatementDto> {
    // Mock regeneration - just return the existing statement with updated generated date
    return this.getStatement(statementId).pipe(
      delay(2000) // Longer delay for regeneration
    );
  }

  private generateMockSales(itemCount: number, totalEarnings: number): StatementSaleLineDto[] {
    const sales: StatementSaleLineDto[] = [];
    let remainingEarnings = totalEarnings;

    for (let i = 0; i < itemCount; i++) {
      const isLast = i === itemCount - 1;
      const earningsAmount = isLast
        ? remainingEarnings
        : parseFloat((remainingEarnings / (itemCount - i) * (0.8 + Math.random() * 0.4)).toFixed(2));

      const salePrice = parseFloat((earningsAmount / 0.6).toFixed(2)); // Assuming 60% commission rate

      sales.push({
        date: new Date(2024, 11, Math.floor(Math.random() * 30) + 1), // Random date in December
        itemSku: `JS-${String(i + 1).padStart(3, '0')}`,
        itemTitle: this.getRandomItemName(),
        salePrice: salePrice,
        commissionRate: 60,
        earningsAmount: earningsAmount
      });

      remainingEarnings -= earningsAmount;
    }

    return sales.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private generateMockPayouts(payoutCount: number, totalPayouts: number): StatementPayoutLineDto[] {
    const payouts: StatementPayoutLineDto[] = [];
    let remainingAmount = totalPayouts;

    for (let i = 0; i < payoutCount; i++) {
      const isLast = i === payoutCount - 1;
      const amount = isLast
        ? remainingAmount
        : parseFloat((remainingAmount / (payoutCount - i) * (0.8 + Math.random() * 0.4)).toFixed(2));

      payouts.push({
        date: new Date(2024, 11, Math.floor(Math.random() * 30) + 1), // Random date in December
        payoutNumber: `PO-${1000 + i}`,
        paymentMethod: Math.random() > 0.5 ? 'Check' : 'Direct Deposit',
        amount: amount
      });

      remainingAmount -= amount;
    }

    return payouts.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private getRandomItemName(): string {
    const items = [
      'Vintage Handbag', 'Leather Jacket', 'Ceramic Vase', 'Picture Frame',
      'Wool Scarf', 'Antique Clock', 'Designer Shoes', 'Kitchen Mixer',
      'Art Painting', 'Crystal Glasses', 'Jewelry Box', 'Decorative Lamp',
      'Silver Candlesticks', 'Porcelain Figurine', 'Wooden Chair', 'Glass Bowl',
      'Metal Sculpture', 'Fabric Cushion', 'Persian Rug', 'Table Lamp'
    ];
    return items[Math.floor(Math.random() * items.length)];
  }

  private generateStatementPDF(statementId: string): string {
    // This is a mock - in reality you'd use a PDF generation library
    return `MONTHLY STATEMENT - ${statementId.toUpperCase()}

Main Street Consignment
123 Main Street, Anytown, USA 12345
(555) 123-4567

Statement For: Jane Smith (Code: JS-1234)
Period: December 1-31, 2024
Generated: January 2, 2025

Mock PDF content would be generated here in a real implementation.
This would include all sales details, payout information, and totals.`;
  }
}