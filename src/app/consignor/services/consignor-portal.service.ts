import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProviderDashboard,
  ProviderItem,
  ProviderItemDetail,
  consignorsale,
  ProviderPayout,
  ProviderPayoutDetail,
  ConsignorProfile,
  UpdateConsignorProfile,
  PagedResult,
  ProviderItemQuery,
  consignorsaleQuery,
  NotificationDto,
  NotificationQueryParams,
  NotificationPreferencesDto,
  UpdateNotificationPreferencesRequest,
  StatementListDto,
  StatementDto,
  ItemRequest,
  CreateItemRequest,
  ItemRequestQuery,
  EarningsSummary,
  StatementListResponse
} from '../models/consignor.models';

@Injectable({
  providedIn: 'root'
})
export class ConsignorPortalService {
  private apiUrl = `${environment.apiUrl}/api/consignor`;

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard(): Observable<ProviderDashboard> {
    return this.http.get<ProviderDashboard>(`${this.apiUrl}/dashboard`);
  }

  // Earnings
  getEarningsSummary(): Observable<EarningsSummary> {
    return this.http.get<EarningsSummary>(`${this.apiUrl}/earnings-summary`);
  }

  // Items
  getMyItems(query?: ProviderItemQuery): Observable<PagedResult<ProviderItem>> {
    let params = new HttpParams();

    if (query?.status) params = params.set('status', query.status);
    if (query?.category) params = params.set('category', query.category);
    if (query?.dateFrom) params = params.set('dateFrom', query.dateFrom.toISOString());
    if (query?.dateTo) params = params.set('dateTo', query.dateTo.toISOString());
    if (query?.search) params = params.set('search', query.search);
    if (query?.page) params = params.set('page', query.page.toString());
    if (query?.pageSize) params = params.set('pageSize', query.pageSize.toString());

    return this.http.get<PagedResult<ProviderItem>>(`${this.apiUrl}/items`, { params });
  }

  getMyItem(id: string): Observable<ProviderItemDetail> {
    return this.http.get<ProviderItemDetail>(`${this.apiUrl}/items/${id}`);
  }

  // Sales
  getMySales(query?: consignorsaleQuery): Observable<PagedResult<consignorsale>> {
    let params = new HttpParams();

    if (query?.dateFrom) params = params.set('dateFrom', query.dateFrom.toISOString());
    if (query?.dateTo) params = params.set('dateTo', query.dateTo.toISOString());
    if (query?.payoutStatus) params = params.set('payoutStatus', query.payoutStatus);
    if (query?.page) params = params.set('page', query.page.toString());
    if (query?.pageSize) params = params.set('pageSize', query.pageSize.toString());

    return this.http.get<PagedResult<consignorsale>>(`${this.apiUrl}/sales`, { params });
  }

  // Payouts
  getMyPayouts(page: number = 1, pageSize: number = 20, year?: number): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/payouts`, { params });
  }

  getMyPayout(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payouts/${id}`);
  }

  // Profile
  getProfile(): Observable<ConsignorProfile> {
    return this.http.get<ConsignorProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(profile: UpdateConsignorProfile): Observable<ConsignorProfile> {
    return this.http.put<ConsignorProfile>(`${this.apiUrl}/profile`, profile);
  }

  // Notifications
  getNotifications(query?: NotificationQueryParams): Observable<PagedResult<NotificationDto>> {
    let params = new HttpParams();

    if (query?.unreadOnly) params = params.set('unreadOnly', query.unreadOnly.toString());
    if (query?.type) params = params.set('type', query.type);
    if (query?.page) params = params.set('page', query.page.toString());
    if (query?.pageSize) params = params.set('pageSize', query.pageSize.toString());

    return this.http.get<PagedResult<NotificationDto>>(`${this.apiUrl}/notifications`, { params });
  }

  getUnreadNotificationCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/notifications/unread-count`);
  }

  markNotificationAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/notifications/${notificationId}/read`, {});
  }

  markAllNotificationsAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/notifications/mark-all-read`, {});
  }

  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/notifications/${notificationId}`);
  }

  getNotificationPreferences(): Observable<NotificationPreferencesDto> {
    return this.http.get<NotificationPreferencesDto>(`${this.apiUrl}/notifications/preferences`);
  }

  updateNotificationPreferences(preferences: UpdateNotificationPreferencesRequest): Observable<NotificationPreferencesDto> {
    return this.http.put<NotificationPreferencesDto>(`${this.apiUrl}/notifications/preferences`, preferences);
  }

  // Statements
  getStatements(): Observable<StatementListResponse> {
    return this.http.get<StatementListResponse>(`${this.apiUrl}/statements`);
  }

  downloadStatementPdf(year: number, month: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/statements/${year}/${month}/pdf`, {
      responseType: 'blob'
    });
  }

  // Item Requests
  getMyItemRequests(query?: ItemRequestQuery): Observable<PagedResult<ItemRequest>> {
    let params = new HttpParams();

    if (query?.status) params = params.set('status', query.status);
    if (query?.search) params = params.set('search', query.search);
    if (query?.page) params = params.set('page', query.page.toString());
    if (query?.pageSize) params = params.set('pageSize', query.pageSize.toString());

    return this.http.get<PagedResult<ItemRequest>>(`${this.apiUrl}/item-requests`, { params });
  }

  getItemRequest(id: string): Observable<ItemRequest> {
    return this.http.get<ItemRequest>(`${this.apiUrl}/item-requests/${id}`);
  }

  createItemRequest(request: CreateItemRequest): Observable<ItemRequest> {
    return this.http.post<ItemRequest>(`${this.apiUrl}/item-requests`, request);
  }

  updateItemRequest(id: string, request: CreateItemRequest): Observable<ItemRequest> {
    return this.http.put<ItemRequest>(`${this.apiUrl}/item-requests/${id}`, request);
  }

  withdrawItemRequest(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/item-requests/${id}/withdraw`, {});
  }

  deleteItemRequest(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/item-requests/${id}`);
  }
}