import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { OwnerContact, OwnerAddress } from '../models/owner.models';

@Injectable({
  providedIn: 'root'
})
export class OwnerInformationService {

  constructor(private http: HttpClient) {}

  // ===== OWNER INFORMATION METHODS =====

  /**
   * Load owner contact information from API
   */
  async loadOwnerContact(): Promise<OwnerContact> {
    return await firstValueFrom(
      this.http.get<OwnerContact>(`${environment.apiUrl}/api/owner/settings/profile/owner-contact`)
    );
  }

  /**
   * Load owner address information from API
   */
  async loadOwnerAddress(): Promise<OwnerAddress> {
    return await firstValueFrom(
      this.http.get<OwnerAddress>(`${environment.apiUrl}/api/owner/settings/profile/owner-address`)
    );
  }
}