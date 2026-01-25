import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  NotificationDto,
  NotificationQueryParams,
  PagedResult,
  NotificationPreferencesDto,
  UpdateNotificationPreferencesRequest,
  UserRole
} from '../models/notification.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = environment.apiUrl;
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getApiPath(role: UserRole): string {
    return `${this.baseUrl}/api/${role}/notifications`;
  }

  getNotifications(
    role: UserRole,
    queryParams: NotificationQueryParams = {}
  ): Observable<PagedResult<NotificationDto>> {
    let params = new HttpParams();

    if (queryParams.page) {
      params = params.set('page', queryParams.page.toString());
    }
    if (queryParams.pageSize) {
      params = params.set('pageSize', queryParams.pageSize.toString());
    }
    if (queryParams.unreadOnly !== undefined) {
      params = params.set('unreadOnly', queryParams.unreadOnly.toString());
    }
    if (queryParams.type) {
      params = params.set('type', queryParams.type);
    }

    return this.http.get<PagedResult<NotificationDto>>(
      this.getApiPath(role),
      { params }
    );
  }

  getUnreadCount(role: UserRole): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.getApiPath(role)}/unread-count`)
      .pipe(
        tap(response => this.unreadCountSubject.next(response.count))
      );
  }

  markAsRead(role: UserRole, notificationId: string): Observable<void> {
    return this.http.post<void>(`${this.getApiPath(role)}/${notificationId}/read`, {})
      .pipe(
        tap(() => {
          const currentCount = this.unreadCountSubject.value;
          this.unreadCountSubject.next(Math.max(0, currentCount - 1));
        })
      );
  }

  markAsUnread(role: UserRole, notificationId: string): Observable<void> {
    return this.http.post<void>(`${this.getApiPath(role)}/${notificationId}/unread`, {})
      .pipe(
        tap(() => {
          const currentCount = this.unreadCountSubject.value;
          this.unreadCountSubject.next(currentCount + 1);
        })
      );
  }

  markAllAsRead(role: UserRole): Observable<void> {
    return this.http.post<void>(`${this.getApiPath(role)}/read-all`, {})
      .pipe(
        tap(() => this.unreadCountSubject.next(0))
      );
  }

  markAsImportant(role: UserRole, notificationId: string): Observable<void> {
    return this.http.post<void>(`${this.getApiPath(role)}/${notificationId}/important`, {});
  }

  markAsNotImportant(role: UserRole, notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.getApiPath(role)}/${notificationId}/important`);
  }

  deleteNotification(role: UserRole, notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.getApiPath(role)}/${notificationId}`);
  }

  getPreferences(role: UserRole): Observable<NotificationPreferencesDto> {
    return this.http.get<NotificationPreferencesDto>(`${this.getApiPath(role)}/preferences`);
  }

  updatePreferences(
    role: UserRole,
    preferences: UpdateNotificationPreferencesRequest
  ): Observable<NotificationPreferencesDto> {
    return this.http.put<NotificationPreferencesDto>(
      `${this.getApiPath(role)}/preferences`,
      preferences
    );
  }

  // Helper method to refresh unread count
  refreshUnreadCount(role: UserRole): Observable<{ count: number }> {
    return this.getUnreadCount(role);
  }

  // Get current unread count value (synchronous)
  getCurrentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }
}