import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

export interface MarkClearedRequest {
  transactionIds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CheckClearanceService {
  private apiUrl = `${environment.apiUrl}/api/transactions`;

  constructor(private http: HttpClient) {}

  getPendingChecks(): Observable<PendingCheck[]> {
    if (!environment.production) {
      // Return mock data for development
      return this.getMockPendingChecks();
    }

    return this.http.get<PendingCheck[]>(`${this.apiUrl}/pending-checks`);
  }

  markChecksAsCleared(transactionIds: string[]): Observable<any> {
    if (!environment.production) {
      // Mock API response for development
      return of({ success: true, clearedCount: transactionIds.length }).pipe(
        delay(1000) // Simulate API delay
      );
    }

    const request: MarkClearedRequest = { transactionIds };
    return this.http.post(`${this.apiUrl}/mark-cleared`, request);
  }

  private getMockPendingChecks(): Observable<PendingCheck[]> {
    const today = new Date();

    const mockChecks: PendingCheck[] = [
      {
        id: '1',
        transactionId: 'txn-a1b2c3d4',
        transactionNumber: 'TXN-A1B2C3D4',
        customerName: 'John Smith',
        amount: 127.50,
        saleDate: this.getDaysAgo(5),
        daysPending: 5,
        isOverdue: false
      },
      {
        id: '2',
        transactionId: 'txn-c3d4e5f6',
        transactionNumber: 'TXN-C3D4E5F6',
        customerName: 'Mary Jones',
        amount: 200.00,
        saleDate: this.getDaysAgo(8),
        daysPending: 8,
        isOverdue: false
      },
      {
        id: '3',
        transactionId: 'txn-e5f6g7h8',
        transactionNumber: 'TXN-E5F6G7H8',
        customerName: 'Bob Wilson',
        amount: 75.00,
        saleDate: this.getDaysAgo(13),
        daysPending: 13,
        isOverdue: true
      },
      {
        id: '4',
        transactionId: 'txn-g7h8i9j0',
        transactionNumber: 'TXN-G7H8I9J0',
        customerName: 'Sue Brown',
        amount: 150.00,
        saleDate: this.getDaysAgo(4),
        daysPending: 4,
        isOverdue: false
      },
      {
        id: '5',
        transactionId: 'txn-i9j0k1l2',
        transactionNumber: 'TXN-I9J0K1L2',
        customerName: 'Tom Green',
        amount: 75.00,
        saleDate: this.getDaysAgo(3),
        daysPending: 3,
        isOverdue: false
      },
      {
        id: '6',
        transactionId: 'txn-k1l2m3n4',
        transactionNumber: 'TXN-K1L2M3N4',
        customerName: 'Lisa Davis',
        amount: 88.25,
        saleDate: this.getDaysAgo(11),
        daysPending: 11,
        isOverdue: true
      },
      {
        id: '7',
        transactionId: 'txn-m3n4o5p6',
        transactionNumber: 'TXN-M3N4O5P6',
        customerName: 'Mike Johnson',
        amount: 245.75,
        saleDate: this.getDaysAgo(7),
        daysPending: 7,
        isOverdue: false
      }
    ];

    return of(mockChecks).pipe(delay(500)); // Simulate API delay
  }

  private getDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
}