import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { EarningsSummary } from '../models/consignor.models';

@Injectable({
  providedIn: 'root'
})
export class MockEarningsService {

  private minimumPayoutAmount = 25.00;

  getEarningsSummary(): Observable<EarningsSummary> {
    const pendingAmount = 127.50;
    const paidThisMonth = 485.00;
    const payoutCountThisMonth = 2;

    // Calculate next payout date (15th of next month)
    const today = new Date();
    const nextPayoutDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);

    // Determine tooltip logic based on story requirements
    let pendingTooltip: string;
    if (pendingAmount < this.minimumPayoutAmount) {
      pendingTooltip = `Minimum payout amount is ${this.minimumPayoutAmount.toFixed(2)}`;
    } else if (nextPayoutDate) {
      pendingTooltip = `Expected payout date ${nextPayoutDate.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      })}`;
    } else {
      pendingTooltip = "Payout Date TBD";
    }

    const summary: EarningsSummary = {
      pending: pendingAmount,
      pendingTooltip,
      paidThisMonth,
      payoutCountThisMonth,
      nextPayoutDate
    };

    // Add a small delay to simulate network request
    return of(summary).pipe(delay(300));
  }

  getEmptyEarningsSummary(): Observable<EarningsSummary> {
    const summary: EarningsSummary = {
      pending: 0,
      pendingTooltip: "No pending earnings",
      paidThisMonth: 0,
      payoutCountThisMonth: 0,
      nextPayoutDate: null
    };

    return of(summary).pipe(delay(300));
  }

  // Alternative scenarios for testing
  getBelowMinimumEarnings(): Observable<EarningsSummary> {
    const pendingAmount = 12.50; // Below minimum
    const nextPayoutDate = new Date(2025, 1, 2); // Feb 2, 2025

    const summary: EarningsSummary = {
      pending: pendingAmount,
      pendingTooltip: `Minimum payout amount is ${this.minimumPayoutAmount.toFixed(2)}`,
      paidThisMonth: 245.00,
      payoutCountThisMonth: 1,
      nextPayoutDate
    };

    return of(summary).pipe(delay(300));
  }

  getUndeterminedPayoutDate(): Observable<EarningsSummary> {
    const summary: EarningsSummary = {
      pending: 89.50,
      pendingTooltip: "Payout Date TBD",
      paidThisMonth: 0,
      payoutCountThisMonth: 0,
      nextPayoutDate: null
    };

    return of(summary).pipe(delay(300));
  }
}