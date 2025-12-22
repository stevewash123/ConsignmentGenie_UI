import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  SupportTicket,
  CreateTicketRequest,
  UpdateTicketRequest,
  AddResponseRequest,
  TicketStatus
} from '../models/support-ticket.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupportTicketService {
  private readonly apiUrl = `${environment.apiUrl}/api/support-tickets`;

  constructor(private http: HttpClient) {}

  // User methods - for creating and viewing their own tickets
  getUserTickets(): Observable<SupportTicket[]> {
    return this.http.get<ApiResponse<SupportTicket[]>>(`${this.apiUrl}/user`)
      .pipe(map(response => response.data));
  }

  createTicket(request: CreateTicketRequest): Observable<SupportTicket> {
    return this.http.post<ApiResponse<SupportTicket>>(`${this.apiUrl}`, request)
      .pipe(map(response => response.data));
  }

  getTicket(id: string): Observable<SupportTicket> {
    return this.http.get<ApiResponse<SupportTicket>>(`${this.apiUrl}/${id}`)
      .pipe(map(response => response.data));
  }

  addResponse(ticketId: string, request: AddResponseRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/${ticketId}/responses`, request);
  }

  // Admin methods - for managing all tickets
  getAllTickets(status?: TicketStatus, assignedTo?: string): Observable<SupportTicket[]> {
    let url = `${this.apiUrl}/admin`;
    const params = new URLSearchParams();

    if (status) params.append('status', status);
    if (assignedTo) params.append('assignedTo', assignedTo);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<ApiResponse<SupportTicket[]>>(url)
      .pipe(map(response => response.data));
  }

  updateTicket(id: string, request: UpdateTicketRequest): Observable<SupportTicket> {
    return this.http.patch<ApiResponse<SupportTicket>>(`${this.apiUrl}/${id}`, request)
      .pipe(map(response => response.data));
  }

  reassignTicket(id: string, assignedTo: 'owner' | 'admin'): Observable<SupportTicket> {
    return this.updateTicket(id, { assignedTo });
  }

  closeTicket(id: string): Observable<SupportTicket> {
    return this.updateTicket(id, { status: 'closed' });
  }
}