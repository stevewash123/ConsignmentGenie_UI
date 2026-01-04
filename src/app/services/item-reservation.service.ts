import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReservationResult {
  success: boolean;
  reservationId?: string;
  expiresAt?: Date;
  remainingTimeMs?: number;
  errorMessage?: string;
  conflictType?: 'already_sold' | 'reserved_elsewhere' | 'api_error';
}

export interface ReservationStatus {
  isReserved: boolean;
  reservedBy?: string;
  expiresAt?: Date;
  remainingTimeMs?: number;
}

export interface CartItemReservation {
  itemId: string;
  isActive: boolean;
  expiresAt: Date;
  reservedAt: Date;
  reservationId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ItemReservationService {
  private readonly apiUrl = `${environment.apiUrl}/api/items`;
  private http = inject(HttpClient);

  /**
   * Reserve an item for POS transaction
   */
  async reserveItem(itemId: string, reservedBy: string = 'POS-Terminal'): Promise<ReservationResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<ReservationResult>(`${this.apiUrl}/${itemId}/reserve`, { reservedBy })
      );
      return response;
    } catch (error) {
      console.error('Failed to reserve item:', error);
      return {
        success: false,
        errorMessage: 'Network error occurred while reserving item',
        conflictType: 'api_error'
      };
    }
  }

  /**
   * Release an item reservation
   */
  async releaseReservation(itemId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/${itemId}/reserve`)
      );
    } catch (error) {
      console.error('Failed to release reservation:', error);
      throw error;
    }
  }

  /**
   * Get current reservation status for an item
   */
  async getReservationStatus(itemId: string): Promise<ReservationStatus> {
    try {
      const response = await firstValueFrom(
        this.http.get<ReservationStatus>(`${this.apiUrl}/${itemId}/reservation-status`)
      );
      return response;
    } catch (error) {
      console.error('Failed to get reservation status:', error);
      return {
        isReserved: false
      };
    }
  }

  /**
   * Calculate remaining time for a reservation
   */
  calculateRemainingTime(expiresAt?: Date): number {
    if (!expiresAt) return 0;

    const now = Date.now();
    const expiration = new Date(expiresAt).getTime();
    return Math.max(0, expiration - now);
  }

  /**
   * Format time in MM:SS format
   */
  formatTime(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Check if a reservation is about to expire (within threshold)
   */
  isExpiringWarning(remainingMs: number, warningThresholdMs: number = 2 * 60 * 1000): boolean {
    return remainingMs > 0 && remainingMs <= warningThresholdMs;
  }

  /**
   * Create a reservation for an item
   */
  async createReservation(itemId: string, durationMinutes: number = 5): Promise<ReservationResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<ReservationResult>(`${this.apiUrl}/${itemId}/reserve`, {
          durationMinutes,
          reservedBy: 'cart-system'
        })
      );
      return response;
    } catch (error) {
      console.error('Failed to create reservation:', error);
      return {
        success: false,
        errorMessage: 'Failed to create reservation',
        conflictType: 'api_error'
      };
    }
  }
}