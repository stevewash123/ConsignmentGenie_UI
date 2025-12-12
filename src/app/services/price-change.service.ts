import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { PriceChangeRequest, PriceChangeResponse } from '../models/price-change.model';
import { PriceChangeNotificationService } from './price-change-notification.service';
import { PriceChangeNotification } from '../models/price-change-notification.model';

@Injectable({
  providedIn: 'root'
})
export class PriceChangeService {

  constructor(private notificationService: PriceChangeNotificationService) {}

  submitPriceChange(request: PriceChangeRequest): Observable<PriceChangeResponse> {
    // Mock validation
    if (request.newPrice <= 0) {
      return throwError(() => ({
        status: 400,
        error: { message: 'Price must be greater than 0' }
      }));
    }

    // For demonstration purposes, let's assume we need the current price to determine direction
    // In a real app, this would come from the backend
    const isIncrease = this.isPriceIncrease(request);

    const response: PriceChangeResponse = {
      success: true,
      message: isIncrease
        ? 'Price updated immediately'
        : 'Price change request sent to consignor for approval',
      immediateUpdate: isIncrease,
      requiresApproval: !isIncrease
    };

    // For price decreases, create notification and send email
    if (!isIncrease) {
      this.createPriceChangeNotification(request);
    }

    // Simulate network delay
    return of(response).pipe(delay(1000));
  }

  private isPriceIncrease(request: PriceChangeRequest): boolean {
    return request.newPrice > request.currentPrice;
  }

  private createPriceChangeNotification(request: PriceChangeRequest): void {
    // Generate a mock notification for the consignor
    // In a real app, this would fetch consignor details and create the notification in the backend

    const commissionRate = 60; // Mock commission rate
    const consignorCurrentEarnings = request.currentPrice * (commissionRate / 100);
    const consignorProposedEarnings = request.newPrice * (commissionRate / 100);

    const notification: PriceChangeNotification = {
      id: `pcn-${Date.now()}`,
      itemId: request.itemId,
      itemName: 'Mock Item Name', // Would come from item lookup
      consignorId: '1', // Would come from item's consignor
      consignorName: 'Mock Consignor', // Would come from consignor lookup
      consignorEmail: 'consignor@example.com', // Would come from consignor lookup
      currentPrice: request.currentPrice,
      proposedPrice: request.newPrice,
      consignorCurrentEarnings,
      consignorProposedEarnings,
      commissionRate,
      updatedMarketPrice: request.updatedMarketPrice,
      ownerNote: request.noteToConsignor,
      daysListed: 30, // Would come from item data
      status: 'pending',
      createdAt: new Date(),
      emailToken: `token-${Date.now()}-secure`
    };

    // Send the notification via email
    this.notificationService.sendEmailNotification(notification).subscribe({
      next: (result) => {
        console.log('Price change notification sent:', result);
      },
      error: (error) => {
        console.error('Failed to send price change notification:', error);
      }
    });
  }
}