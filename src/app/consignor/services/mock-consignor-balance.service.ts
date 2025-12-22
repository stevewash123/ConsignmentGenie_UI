import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ConsignorBalance, PayoutRequestStatus, SubmitPayoutRequest, PayoutRequest } from '../models/consignor.models';

@Injectable({
  providedIn: 'root'
})
export class MockConsignorBalanceService {
  private pendingPayoutRequest: PayoutRequest | null = null;

  getConsignorBalance(): Observable<ConsignorBalance> {
    // Mock data representing different scenarios
    const mockBalance: ConsignorBalance = {
      pending: {
        amount: 45.00,
        itemCount: 2
      },
      available: {
        amount: 187.50,
        itemCount: 5
      },
      inTransit: {
        amount: 95.00,
        payoutId: 'payout_1043',
        payoutNumber: 1043,
        sentDate: new Date('2025-12-10'),
        paymentMethod: 'Check mailed to address on file',
        paymentReference: 'CHK-1043-2025'
      },
      lifetimeEarned: 1542.00,
      lifetimeReceived: 1214.50,
      nextPayoutDate: new Date('2026-01-01'),
      payoutScheduleDescription: 'Shop pays monthly on the 1st',
      canRequestPayout: true,
      minimumPayoutAmount: 50.00,
      pendingRequest: this.pendingPayoutRequest
    };

    return of(mockBalance);
  }

  // Alternative mock data for testing different states
  getEmptyBalance(): Observable<ConsignorBalance> {
    const emptyBalance: ConsignorBalance = {
      pending: { amount: 0, itemCount: 0 },
      available: { amount: 0, itemCount: 0 },
      inTransit: null,
      lifetimeEarned: 1542.00,
      lifetimeReceived: 1542.00,
      nextPayoutDate: new Date('2026-01-01'),
      payoutScheduleDescription: 'Shop pays monthly on the 1st',
      canRequestPayout: false,
      minimumPayoutAmount: 50.00,
      pendingRequest: null
    };

    return of(emptyBalance);
  }

  confirmPayoutReceived(payoutId: string): Observable<void> {
    // Mock confirmation - in real implementation this would call the API
    console.log(`Confirming payout ${payoutId} as received`);
    return of();
  }

  requestPayout(): Observable<{ success: boolean; message: string }> {
    // Mock payout request - in real implementation this would call the API
    return of({
      success: true,
      message: 'Payout request submitted successfully. You will receive confirmation within 24 hours.'
    });
  }

  getPayoutRequestStatus(): Observable<PayoutRequestStatus> {
    // For demo purposes, simulate different states
    const available = 187.50;
    const minimum = 50.00;

    // Check if there's already a pending request
    if (this.pendingPayoutRequest) {
      return of({
        canRequest: false,
        reason: 'pending_request',
        pendingRequestDate: this.pendingPayoutRequest.requestedAt,
        availableAmount: available
      });
    }

    // Check minimum amount requirement
    if (available < minimum) {
      return of({
        canRequest: false,
        reason: 'below_minimum',
        minimumAmount: minimum,
        availableAmount: available
      });
    }

    // Can request
    return of({
      canRequest: true,
      availableAmount: available
    });
  }

  submitPayoutRequest(request: SubmitPayoutRequest): Observable<PayoutRequest> {
    const newRequest: PayoutRequest = {
      requestId: `req_${Date.now()}`,
      amount: 187.50,
      itemCount: 5,
      requestedAt: new Date(),
      status: 'pending',
      note: request.note
    };

    // Store the pending request
    this.pendingPayoutRequest = newRequest;

    return of(newRequest).pipe(delay(500));
  }

  cancelPayoutRequest(requestId: string): Observable<void> {
    // Clear the pending request
    this.pendingPayoutRequest = null;
    return of(void 0).pipe(delay(300));
  }
}