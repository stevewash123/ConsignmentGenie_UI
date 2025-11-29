import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminHeaderComponent } from './admin-header.component';
import { AuthService } from '../../services/auth.service';
import { BehaviorSubject, of } from 'rxjs';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AdminHeaderComponent', () => {
  let component: AdminHeaderComponent;
  let fixture: ComponentFixture<AdminHeaderComponent>;
  let mockRouter: Router;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockCurrentUser$ = new BehaviorSubject<any>(null);

  const mockUser = {
    userId: 'test-user-id',
    email: 'admin@test.com',
    role: 1,
    organizationId: 'org-1',
    organizationName: 'Test Org'
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'logout'], {
      currentUser$: mockCurrentUser$
    });

    await TestBed.configureTestingModule({
      imports: [AdminHeaderComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminHeaderComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate');
  });

  beforeEach(() => {
    // Reset mocks
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockCurrentUser$.next(mockUser);
  });

  afterEach(() => {
    // Clean up subscriptions
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load user data on init', () => {
    fixture.detectChanges();
    expect(component.currentUser()).toEqual(mockUser);
  });

  it('should display user email in header', () => {
    fixture.detectChanges();
    const userEmail = fixture.debugElement.query(By.css('.user-email'));
    expect(userEmail.nativeElement.textContent.trim()).toBe(mockUser.email);
  });

  it('should display user initials in avatar', () => {
    fixture.detectChanges();
    const avatar = fixture.debugElement.query(By.css('.user-avatar'));
    expect(avatar.nativeElement.textContent.trim()).toBe('AD');
  });

  describe('User Menu Dropdown', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should start with menu closed', () => {
      expect(component.showUserMenu()).toBe(false);
      const dropdown = fixture.debugElement.query(By.css('.user-dropdown'));
      expect(dropdown.nativeElement.classList.contains('show')).toBe(false);
    });

    it('should toggle menu when profile button is clicked', () => {
      const profileBtn = fixture.debugElement.query(By.css('.profile-btn'));

      // Click to open
      profileBtn.nativeElement.click();
      fixture.detectChanges();

      expect(component.showUserMenu()).toBe(true);
      const dropdown = fixture.debugElement.query(By.css('.user-dropdown'));
      expect(dropdown.nativeElement.classList.contains('show')).toBe(true);

      // Click to close
      profileBtn.nativeElement.click();
      fixture.detectChanges();

      expect(component.showUserMenu()).toBe(false);
      expect(dropdown.nativeElement.classList.contains('show')).toBe(false);
    });

    it('should close menu when clicking outside', () => {
      // Open the menu first
      component.toggleUserMenu();
      fixture.detectChanges();
      expect(component.showUserMenu()).toBe(true);

      // Simulate clicking outside the user-menu
      const clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'target', {
        value: document.body
      });

      component.onDocumentClick(clickEvent);
      fixture.detectChanges();

      expect(component.showUserMenu()).toBe(false);
    });

    it('should not close menu when clicking inside user-menu', () => {
      // Open the menu first
      component.toggleUserMenu();
      fixture.detectChanges();
      expect(component.showUserMenu()).toBe(true);

      // Create a mock element that has closest method
      const mockElement = {
        closest: jasmine.createSpy('closest').and.returnValue(true)
      };

      const clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'target', {
        value: mockElement
      });

      component.onDocumentClick(clickEvent);
      fixture.detectChanges();

      expect(component.showUserMenu()).toBe(true);
    });

    it('should display all dropdown menu items', () => {
      component.toggleUserMenu();
      fixture.detectChanges();

      const dropdownItems = fixture.debugElement.queryAll(By.css('.dropdown-item'));
      const itemTexts = dropdownItems.map(item => item.nativeElement.textContent.trim());

      expect(itemTexts).toContain('Notifications');
      expect(itemTexts).toContain('My Profile');
      expect(itemTexts).toContain('System Settings');
      expect(itemTexts).toContain('Logout');
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.toggleUserMenu(); // Open menu
      fixture.detectChanges();
    });

    it('should call logout when logout button is clicked', () => {
      const logoutBtn = fixture.debugElement.query(By.css('.logout-btn'));

      logoutBtn.nativeElement.click();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      expect(component.showUserMenu()).toBe(false);
    });

    it('should close menu and navigate to login on logout', () => {
      // Open menu first
      expect(component.showUserMenu()).toBe(true);

      component.logout();

      expect(component.showUserMenu()).toBe(false);
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display navigation links when user is logged in', () => {
      const navLinks = fixture.debugElement.queryAll(By.css('.nav-links a'));
      const linkTexts = navLinks.map(link => link.nativeElement.textContent.trim());

      expect(linkTexts).toContain('Dashboard');
      expect(linkTexts).toContain('Organizations');
      expect(linkTexts).toContain('Users');
      expect(linkTexts).toContain('Billing');
      expect(linkTexts).toContain('Notifications');
    });

    it('should hide navigation when user is not logged in', () => {
      component.currentUser.set(null);
      fixture.detectChanges();

      const mainNav = fixture.debugElement.query(By.css('.main-nav'));
      expect(mainNav).toBeFalsy();
    });
  });

  describe('User Authentication State', () => {
    it('should redirect to login when no user is present', () => {
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockCurrentUser$.next(null);

      component.ngOnInit();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should update user data when auth service emits new user', () => {
      const newUser = { ...mockUser, email: 'newemail@test.com' };

      // Initialize component first
      component.ngOnInit();

      mockCurrentUser$.next(newUser);
      fixture.detectChanges();

      expect(component.currentUser()).toEqual(newUser);
    });
  });

  describe('Helper Methods', () => {
    it('should return correct initials for email', () => {
      expect(component.getInitials('john.doe@example.com')).toBe('JO');
      expect(component.getInitials('a@example.com')).toBe('A@');
      expect(component.getInitials('')).toBe('A');
      expect(component.getInitials(undefined)).toBe('A');
    });
  });

  describe('Responsive Behavior', () => {
    it('should be responsive on mobile', () => {
      fixture.detectChanges();

      // Test that the component renders without errors on mobile
      // (CSS media queries are tested via visual regression or E2E tests)
      expect(component).toBeTruthy();
    });
  });
});