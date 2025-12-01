import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
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
      items: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: 5
    }));

    mockLoadingService = jasmine.createSpyObj('LoadingService', ['isLoading', 'start', 'stop']);

    // Setup LoadingService return values
    mockLoadingService.isLoading.and.returnValue(false);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: LoadingService, useValue: mockLoadingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
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
});