import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { NotificationBellComponent } from './notification-bell.component';
import { NotificationService } from '../services/notification.service';
import { LoadingService } from '../services/loading.service';

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let unreadCountSubject: BehaviorSubject<number>;

  beforeEach(async () => {
    unreadCountSubject = new BehaviorSubject<number>(1);

    mockNotificationService = jasmine.createSpyObj('NotificationService',
      ['getNotifications', 'getUnreadCount', 'markAsRead', 'markAllAsRead'],
      {
        unreadCount$: unreadCountSubject.asObservable()
      }
    );

    // Setup method return values
    mockNotificationService.getUnreadCount.and.returnValue(of({ count: 1 }));
    mockNotificationService.getNotifications.and.returnValue(of({
      data: [],
      totalCount: 0,
      totalPages: 0,
      page: 1,
      pageSize: 5,
      hasNextPage: false,
      hasPreviousPage: false
    }));

    mockLoadingService = jasmine.createSpyObj('LoadingService', ['isLoading', 'start', 'stop']);

    // Setup LoadingService return values
    mockLoadingService.isLoading.and.returnValue(false);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of() // Observable for navigation events
    });
    routerSpy.createUrlTree.and.returnValue({} as any); // Mock UrlTree
    routerSpy.serializeUrl.and.returnValue(''); // Mock serialized URL

    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {},
      params: of({}),
      queryParams: of({}),
      url: of([]),
      data: of({}),
      fragment: of(''),
      outlet: 'primary',
      component: null,
      routeConfig: null,
      root: null as any,
      parent: null,
      firstChild: null,
      children: [],
      pathFromRoot: []
    });

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: LoadingService, useValue: mockLoadingService },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with unread count', () => {
    fixture.detectChanges();
    expect(component.unreadCount).toBe(1);
  });

  it('should display notification badge when there are unread notifications', () => {
    fixture.detectChanges(); // Initialize component first
    unreadCountSubject.next(3);
    fixture.detectChanges(); // Apply the new value

    const badge = fixture.nativeElement.querySelector('.notification-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toBe('3');
  });

  it('should display "99+" when unread count exceeds 99', () => {
    fixture.detectChanges(); // Initialize component first
    unreadCountSubject.next(150);
    fixture.detectChanges(); // Apply the new value

    const badge = fixture.nativeElement.querySelector('.notification-badge');
    expect(badge.textContent.trim()).toBe('99+');
  });

  it('should not display badge when unread count is 0', () => {
    fixture.detectChanges(); // Initialize component first
    unreadCountSubject.next(0);
    fixture.detectChanges(); // Apply the new value

    const badge = fixture.nativeElement.querySelector('.notification-badge');
    expect(badge).toBeFalsy();
  });

  it('should toggle dropdown when bell button is clicked', () => {
    fixture.detectChanges();

    const bellButton = fixture.nativeElement.querySelector('.bell-button');
    expect(component.isDropdownOpen).toBe(false);

    bellButton.click();
    expect(component.isDropdownOpen).toBe(true);

    bellButton.click();
    expect(component.isDropdownOpen).toBe(false);
  });

  it('should show dropdown when toggled open', () => {
    component.isDropdownOpen = true;
    fixture.detectChanges();

    const dropdown = fixture.nativeElement.querySelector('.notification-dropdown');
    expect(dropdown).toBeTruthy();
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should close dropdown', () => {
    component.isDropdownOpen = true;
    component.closeDropdown();
    expect(component.isDropdownOpen).toBe(false);
  });

  it('should return trackBy value', () => {
    const notification = { notificationId: 'test-123' };
    const result = component.trackByNotificationId(0, notification as any);
    expect(result).toBe('test-123');
  });

  it('should mark notification as read', () => {
    const notification = { notificationId: 'test-1', isRead: false };
    const event = new Event('click');
    mockNotificationService.markAsRead.and.returnValue(of(undefined));
    component.unreadCount = 5;

    component.markAsRead(notification as any, event);

    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('consignor', 'test-1');
  });

  it('should mark all notifications as read', () => {
    component.recentNotifications = [
      { isRead: false } as any,
      { isRead: false } as any
    ];
    mockNotificationService.markAllAsRead.and.returnValue(of(undefined));

    component.markAllAsRead();

    expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith('consignor');
  });

  it('should handle notification click', () => {
    const notification = { notificationId: 'test-1', isRead: true, type: 'welcome' };
    spyOn(component, 'closeDropdown');
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    component.handleNotificationClick(notification as any);

    expect(component.closeDropdown).toHaveBeenCalled();
  });

  it('should get notification icon', () => {
    const result = component.getNotificationIcon('welcome');
    expect(typeof result).toBe('string');
  });

  it('should get notification icon class', () => {
    const result = component.getNotificationIconClass('welcome');
    expect(typeof result).toBe('string');
  });
});