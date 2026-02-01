import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AccountingSettings } from '../models/business.models';

@Injectable({
  providedIn: 'root'
})
export class AccountingSettingsService {
  // Accounting settings state
  private accountingSettings$ = new BehaviorSubject<AccountingSettings | null>(null);

  // Observable for components to subscribe to
  readonly accountingSettings = this.accountingSettings$.asObservable();

  constructor(private http: HttpClient) {}

  // ===== ACCOUNTING SETTINGS METHODS =====

  async loadAccountingSettings(): Promise<void> {
    try {
      // TODO: Verify this endpoint exists - may need to be moved to different controller
      const response = await firstValueFrom(
        this.http.get<AccountingSettings>(`${environment.apiUrl}/api/settings/accounting/general`)
      );
      this.accountingSettings$.next(response);
    } catch (error) {
      console.error('Failed to load accounting settings:', error);
      this.accountingSettings$.next(null);
      throw error;
    }
  }

  updateAccountingSettings(settings: AccountingSettings): void {
    this.accountingSettings$.next(settings);
    // Auto-save to server
    // TODO: Verify this endpoint exists - may need to be moved to different controller
    this.http.patch<{success: boolean, data: AccountingSettings}>(`${environment.apiUrl}/api/settings/accounting/general`, settings)
      .subscribe({
        next: (response) => {
          // Update with server response (authoritative)
          this.accountingSettings$.next(response.data);
        },
        error: (error) => {
          console.error('Failed to save accounting settings:', error);
          // Could revert state here or show error to user
        }
      });
  }

  getCurrentAccountingSettings(): AccountingSettings | null {
    return this.accountingSettings$.value;
  }
}