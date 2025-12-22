import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StatusOption {
  value: string;
  label: string;
}

export interface ItemStatusDto {
  itemId: string;
  name: string;
  status: string;
  statusLabel: string;
  statusChangedAt: string;
}

export interface StatusAction {
  action: string;
  label: string;
  confirm: boolean;
  requireReason?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ItemStatusService {
  private apiUrl = `${environment.apiUrl}/api/items`;

  constructor(private http: HttpClient) {}

  changeStatus(itemId: string, status: string, reason?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${itemId}/status`, {
      status,
      reason
    });
  }

  getStatuses(): Observable<StatusOption[]> {
    return this.http.get<StatusOption[]>(`${this.apiUrl}/statuses`);
  }
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'Available': 'green',
    'Sold': 'blue',
    'Returned': 'gray',
    'Removed': 'red',
    'Expired': 'orange'
  };
  return colors[status] || 'gray';
}

export function getAvailableActions(status: string): StatusAction[] {
  const actions: Record<string, StatusAction[]> = {
    'Available': [
      { action: 'Returned', label: 'Mark as Returned', confirm: true },
      { action: 'Removed', label: 'Mark as Removed', confirm: true, requireReason: false }
    ],
    'Expired': [
      { action: 'Returned', label: 'Mark as Returned', confirm: true },
      { action: 'Available', label: 'Re-list Item', confirm: true }
    ],
    'Returned': [
      { action: 'Available', label: 'Re-list Item', confirm: true }
    ],
    'Sold': [],      // No actions, must void transaction
    'Removed': []    // No actions, item is gone
  };
  return actions[status] || [];
}