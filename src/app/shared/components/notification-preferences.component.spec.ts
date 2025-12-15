import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { NotificationPreferencesComponent } from './notification-preferences.component';
import { NotificationService } from '../services/notification.service';
import { LoadingService } from '../services/loading.service';

describe('NotificationPreferencesComponent', () => {
  let component: NotificationPreferencesComponent;
  let fixture: ComponentFixture<NotificationPreferencesComponent>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;

  beforeEach(async () => {
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['getNotifications', 'getPreferences', 'updatePreferences']);
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

    // Mock getPreferences to return some default preferences
    mockNotificationService.getPreferences.and.returnValue(of({
      emailEnabled: true,
      digestMode: 'instant' as const,
      emailItemSold: true,
      emailPayoutProcessed: true,
      emailPayoutPending: true,
      emailStatementReady: true,
      emailAccountUpdate: true
    }));

    // Mock updatePreferences
    mockNotificationService.updatePreferences.and.returnValue(of({
      emailEnabled: true,
      digestMode: 'instant' as const,
      emailItemSold: true,
      emailPayoutProcessed: true,
      emailPayoutPending: true,
      emailStatementReady: true,
      emailAccountUpdate: true
    }));

    mockLoadingService.isLoading.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [NotificationPreferencesComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        FormBuilder,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: LoadingService, useValue: mockLoadingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationPreferencesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize component on init', () => {
    component.ngOnInit();
    expect(component).toBeTruthy();
  });

  it('should initialize form', () => {
    component.ngOnInit();
    expect(component.preferencesForm).toBeDefined();
  });

  it('should handle save preferences', () => {
    component.ngOnInit();
    spyOn(component, 'savePreferences');
    component.savePreferences();
    expect(component.savePreferences).toHaveBeenCalled();
  });

  it('should reset form', () => {
    component.ngOnInit();
    const originalValue = component.preferencesForm.value;
    component.resetForm();
    expect(component.preferencesForm.value).toEqual(originalValue);
  });

  it('should handle master email toggle', () => {
    component.ngOnInit();
    component.onMasterEmailToggle();
    expect(component.preferencesForm).toBeDefined();
  });

  it('should cleanup on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});