import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { NotificationCenterComponent } from './notification-center.component';
import { NotificationService } from '../services/notification.service';
import { LoadingService } from '../services/loading.service';

describe('NotificationCenterComponent', () => {
  let component: NotificationCenterComponent;
  let fixture: ComponentFixture<NotificationCenterComponent>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;

  beforeEach(async () => {
    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'getNotifications',
      'markAsRead',
      'markAllAsRead',
      'deleteNotification'
    ]);
    mockLoadingService = jasmine.createSpyObj('LoadingService', ['isLoading', 'start', 'stop']);

    mockNotificationService.getNotifications.and.returnValue(of({
      data: [],
      totalCount: 0,
      totalPages: 0,
      page: 1,
      pageSize: 20,
      hasNextPage: false,
      hasPreviousPage: false
    }));
    mockNotificationService.markAsRead.and.returnValue(of(undefined));
    mockNotificationService.markAllAsRead.and.returnValue(of(undefined));
    mockNotificationService.deleteNotification.and.returnValue(of(undefined));
    mockLoadingService.isLoading.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [NotificationCenterComponent, FormsModule, RouterTestingModule],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: LoadingService, useValue: mockLoadingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationCenterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load notifications on init', () => {
    component.ngOnInit();
    expect(mockNotificationService.getNotifications).toHaveBeenCalled();
  });

  it('should handle notification click', () => {
    const notification = {
      notificationId: 'test-1',
      isRead: false,
      type: 'item_sold' as any,
      role: 'consignor' as any,
      title: 'Test',
      message: 'Test message',
      createdAt: '2023-01-01T00:00:00Z',
      timeAgo: '1 hour ago'
    };
    spyOn(component, 'markAsRead');

    component.handleNotificationClick(notification as any);

    expect(component.markAsRead).toHaveBeenCalledWith(notification, jasmine.any(Event));
  });

  it('should get notification icon', () => {
    const result = component.getNotificationIcon('test-type');
    expect(typeof result).toBe('string');
  });

  it('should get notification icon class', () => {
    const result = component.getNotificationIconClass('test-type');
    expect(typeof result).toBe('string');
  });

  it('should track by notification id', () => {
    const notification = {
      notificationId: 'test-123',
      isRead: false,
      type: 'item_sold' as any,
      role: 'consignor' as any,
      title: 'Test',
      message: 'Test message',
      createdAt: '2023-01-01T00:00:00Z',
      timeAgo: '1 hour ago'
    };
    const result = component.trackByNotificationId(0, notification as any);
    expect(result).toBe('test-123');
  });

  it('should go to page', () => {
    // Setup pagedResult with totalPages > 2 so goToPage(2) will work
    component.pagedResult = {
      data: [],
      totalCount: 25,
      totalPages: 3,
      page: 1,
      pageSize: 10,
      hasNextPage: false,
      hasPreviousPage: false
    };

    component.goToPage(2);
    expect(component.currentPage).toBe(2);
  });

  it('should delete notification', () => {
    const notification = {
      notificationId: 'test-1',
      isRead: false,
      type: 'item_sold' as any,
      role: 'consignor' as any,
      title: 'Test',
      message: 'Test message',
      createdAt: '2023-01-01T00:00:00Z',
      timeAgo: '1 hour ago'
    };
    const event = new Event('click');

    // Mock the confirm dialog to return true
    spyOn(window, 'confirm').and.returnValue(true);

    component.deleteNotification(notification as any, event);

    expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith(component.role, 'test-1');
  });

  it('should mark all as read', () => {
    component.markAllAsRead();
    expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith(component.role);
  });

  it('should toggle unread only', () => {
    const initialValue = component.showUnreadOnly;
    component.toggleUnreadOnly();
    expect(component.showUnreadOnly).toBe(!initialValue);
  });

  it('should cleanup on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});