import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ConsignorPayoutSummary, ConsignorPayoutDetail, PayoutListQuery, PagedResult } from '../models/consignor.models';

@Injectable({
  providedIn: 'root'
})
export class MockConsignorPayoutService {

  private mockPayouts: ConsignorPayoutSummary[] = [
    {
      payoutId: 'payout_1042',
      payoutNumber: 1042,
      paymentDate: new Date('2025-12-15'),
      amount: 187.50,
      itemCount: 5,
      paymentMethod: 'Check',
      status: 'received'
    },
    {
      payoutId: 'payout_1018',
      payoutNumber: 1018,
      paymentDate: new Date('2025-11-15'),
      amount: 245.00,
      itemCount: 8,
      paymentMethod: 'Check',
      status: 'received'
    },
    {
      payoutId: 'payout_994',
      payoutNumber: 994,
      paymentDate: new Date('2025-10-15'),
      amount: 312.00,
      itemCount: 12,
      paymentMethod: 'Cash',
      status: 'received'
    },
    {
      payoutId: 'payout_975',
      payoutNumber: 975,
      paymentDate: new Date('2025-09-15'),
      amount: 156.75,
      itemCount: 6,
      paymentMethod: 'Check',
      status: 'received'
    },
    {
      payoutId: 'payout_951',
      payoutNumber: 951,
      paymentDate: new Date('2025-08-15'),
      amount: 298.25,
      itemCount: 9,
      paymentMethod: 'Direct Deposit',
      status: 'received'
    },
    {
      payoutId: 'payout_928',
      payoutNumber: 928,
      paymentDate: new Date('2025-07-15'),
      amount: 134.50,
      itemCount: 4,
      paymentMethod: 'Check',
      status: 'received'
    },
    {
      payoutId: 'payout_905',
      payoutNumber: 905,
      paymentDate: new Date('2025-06-15'),
      amount: 421.00,
      itemCount: 14,
      paymentMethod: 'Direct Deposit',
      status: 'received'
    },
    {
      payoutId: 'payout_881',
      payoutNumber: 881,
      paymentDate: new Date('2025-05-15'),
      amount: 89.75,
      itemCount: 3,
      paymentMethod: 'Check',
      status: 'received'
    },
    {
      payoutId: 'payout_858',
      payoutNumber: 858,
      paymentDate: new Date('2025-04-15'),
      amount: 267.80,
      itemCount: 7,
      paymentMethod: 'Cash',
      status: 'received'
    },
    {
      payoutId: 'payout_835',
      payoutNumber: 835,
      paymentDate: new Date('2025-03-15'),
      amount: 345.25,
      itemCount: 11,
      paymentMethod: 'Direct Deposit',
      status: 'received'
    },
    {
      payoutId: 'payout_812',
      payoutNumber: 812,
      paymentDate: new Date('2025-02-15'),
      amount: 123.60,
      itemCount: 4,
      paymentMethod: 'Check',
      status: 'received'
    },
    {
      payoutId: 'payout_789',
      payoutNumber: 789,
      paymentDate: new Date('2025-01-15'),
      amount: 198.90,
      itemCount: 6,
      paymentMethod: 'Direct Deposit',
      status: 'received'
    }
  ];

  getPayoutHistory(query: PayoutListQuery = {}): Observable<PagedResult<ConsignorPayoutSummary>> {
    let filteredPayouts = [...this.mockPayouts];

    // Apply date filtering
    if (query.dateFrom) {
      filteredPayouts = filteredPayouts.filter(p => p.paymentDate >= query.dateFrom!);
    }
    if (query.dateTo) {
      filteredPayouts = filteredPayouts.filter(p => p.paymentDate <= query.dateTo!);
    }

    // Sort by payment date (newest first)
    filteredPayouts.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());

    // Apply pagination
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = filteredPayouts.slice(startIndex, endIndex);

    const result: PagedResult<ConsignorPayoutSummary> = {
      items,
      totalCount: filteredPayouts.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredPayouts.length / pageSize),
      hasNext: endIndex < filteredPayouts.length,
      hasPrevious: page > 1
    };

    // Add a small delay to simulate network request
    return of(result).pipe(delay(300));
  }

  getEmptyPayoutHistory(): Observable<PagedResult<ConsignorPayoutSummary>> {
    const result: PagedResult<ConsignorPayoutSummary> = {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false
    };

    return of(result).pipe(delay(300));
  }

  // Mock detail data for specific payouts
  private mockPayoutDetails: { [key: string]: ConsignorPayoutDetail } = {
    'payout_1042': {
      payoutId: 'payout_1042',
      payoutNumber: 1042,
      paymentDate: new Date('2025-12-15'),
      amount: 187.50,
      paymentMethod: 'Check',
      paymentReference: 'Check #4521',
      status: 'received',
      // Summary breakdown fields
      grossSales: 313.00,
      consignorSplitPercent: 60,
      consignorShare: 187.80,
      fees: 0.30,
      feeDescription: 'Check processing fee',
      netPayout: 187.50,
      items: [
        {
          itemId: 'item_001',
          itemName: 'Vintage Coach Handbag',
          soldDate: new Date('2025-11-25'),
          salePrice: 65.00,
          consignorEarnings: 39.00
        },
        {
          itemId: 'item_002',
          itemName: 'Mid-Century Table Lamp',
          soldDate: new Date('2025-11-28'),
          salePrice: 75.00,
          consignorEarnings: 45.00
        },
        {
          itemId: 'item_003',
          itemName: 'Wool Scarf',
          soldDate: new Date('2025-12-01'),
          salePrice: 30.00,
          consignorEarnings: 18.00
        },
        {
          itemId: 'item_004',
          itemName: 'Brass Candlesticks',
          soldDate: new Date('2025-12-03'),
          salePrice: 54.00,
          consignorEarnings: 32.40
        },
        {
          itemId: 'item_005',
          itemName: 'Ceramic Vase',
          soldDate: new Date('2025-12-05'),
          salePrice: 89.00,
          consignorEarnings: 53.10
        }
      ]
    },
    'payout_1018': {
      payoutId: 'payout_1018',
      payoutNumber: 1018,
      paymentDate: new Date('2025-11-15'),
      amount: 245.00,
      paymentMethod: 'Check',
      paymentReference: 'Check #4487',
      status: 'received',
      // Summary breakdown fields
      grossSales: 408.33,
      consignorSplitPercent: 60,
      consignorShare: 245.00,
      fees: 0.00,
      feeDescription: undefined,
      netPayout: 245.00,
      items: [
        {
          itemId: 'item_011',
          itemName: 'Art Deco Mirror',
          soldDate: new Date('2025-10-22'),
          salePrice: 125.00,
          consignorEarnings: 75.00
        },
        {
          itemId: 'item_012',
          itemName: 'Silver Tea Set',
          soldDate: new Date('2025-10-28'),
          salePrice: 95.00,
          consignorEarnings: 57.00
        },
        {
          itemId: 'item_013',
          itemName: 'Crystal Wine Glasses',
          soldDate: new Date('2025-11-02'),
          salePrice: 42.00,
          consignorEarnings: 24.75
        },
        {
          itemId: 'item_014',
          itemName: 'Leather Bound Books',
          soldDate: new Date('2025-11-05'),
          salePrice: 68.00,
          consignorEarnings: 40.80
        },
        {
          itemId: 'item_015',
          itemName: 'Porcelain Figurine',
          soldDate: new Date('2025-11-08'),
          salePrice: 38.00,
          consignorEarnings: 22.80
        },
        {
          itemId: 'item_016',
          itemName: 'Vintage Jewelry Box',
          soldDate: new Date('2025-11-10'),
          salePrice: 45.00,
          consignorEarnings: 24.65
        }
      ]
    }
  };

  getPayoutDetail(payoutId: string): Observable<ConsignorPayoutDetail> {
    const detail = this.mockPayoutDetails[payoutId];

    if (detail) {
      return of(detail).pipe(delay(500));
    } else {
      // Generate mock detail for any payout ID not in our detailed data
      const summary = this.mockPayouts.find(p => p.payoutId === payoutId);
      if (summary) {
        const grossSales = parseFloat((summary.amount / 0.6).toFixed(2)); // Assuming 60% commission rate
        const consignorShare = parseFloat((grossSales * 0.6).toFixed(2));
        const fees = summary.paymentMethod === 'Direct Deposit' ? parseFloat((consignorShare * 0.005).toFixed(2)) :
                    summary.paymentMethod === 'Check' ? 0.50 : 0;
        const netPayout = parseFloat((consignorShare - fees).toFixed(2));

        const mockDetail: ConsignorPayoutDetail = {
          payoutId: summary.payoutId,
          payoutNumber: summary.payoutNumber,
          paymentDate: summary.paymentDate,
          amount: summary.amount,
          paymentMethod: summary.paymentMethod,
          paymentReference: summary.paymentMethod === 'Check' ? `Check #${4000 + summary.payoutNumber}` :
                          summary.paymentMethod === 'Direct Deposit' ? 'ACH Transfer' : undefined,
          status: summary.status,
          // Summary breakdown fields
          grossSales: grossSales,
          consignorSplitPercent: 60,
          consignorShare: consignorShare,
          fees: fees,
          feeDescription: summary.paymentMethod === 'Direct Deposit' ? 'ACH fee (0.5%)' :
                         summary.paymentMethod === 'Check' ? 'Check processing fee' : undefined,
          netPayout: netPayout,
          items: this.generateMockItems(summary.itemCount, summary.amount)
        };
        return of(mockDetail).pipe(delay(500));
      }
    }

    // Fallback for unknown payout ID
    throw new Error(`Payout ${payoutId} not found`);
  }

  downloadPayoutReceipt(payoutId: string): Observable<Blob> {
    // Mock PDF generation - in real app this would call the API
    const pdfContent = this.generateReceiptPDF(payoutId);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return of(blob).pipe(delay(1000));
  }

  private generateMockItems(itemCount: number, totalAmount: number): any[] {
    const itemNames = [
      'Vintage Jewelry', 'Antique Clock', 'Persian Rug', 'Crystal Vase',
      'Silver Candlesticks', 'Ceramic Bowl', 'Wooden Chair', 'Glass Lamp',
      'Metal Sculpture', 'Fabric Cushion', 'Leather Bag', 'Porcelain Plate'
    ];

    const items = [];
    let remainingAmount = totalAmount;

    for (let i = 0; i < itemCount; i++) {
      const isLast = i === itemCount - 1;
      const earnings = isLast ? remainingAmount : parseFloat((remainingAmount / (itemCount - i) * (0.8 + Math.random() * 0.4)).toFixed(2));
      const salePrice = parseFloat((earnings / 0.6).toFixed(2)); // Assuming 60% commission rate

      items.push({
        itemId: `item_${Date.now()}_${i}`,
        itemName: itemNames[i % itemNames.length],
        soldDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
        salePrice: salePrice,
        consignorEarnings: earnings
      });

      remainingAmount -= earnings;
    }

    return items;
  }

  private generateReceiptPDF(payoutId: string): string {
    // This is a mock - in reality you'd use a PDF generation library
    return `PAYOUT RECEIPT - PAYOUT ${payoutId}

Mock PDF content would be generated here in a real implementation.
This would include all payout details and item listings.`;
  }
}