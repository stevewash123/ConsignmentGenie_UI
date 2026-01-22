import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastNotificationsComponent } from './toast-notifications.component';
import { SignalRNotificationsService } from '../../../services/signalr-notifications.service';
import { of } from 'rxjs';

describe('ToastNotificationsComponent', () => {
  let component: ToastNotificationsComponent;
  let fixture: ComponentFixture<ToastNotificationsComponent>;
  let mockSignalRService: jasmine.SpyObj<SignalRNotificationsService>;

  beforeEach(async () => {
    mockSignalRService = jasmine.createSpyObj('SignalRNotificationsService', [], {
      toastNotifications$: of()
    });

    await TestBed.configureTestingModule({
      imports: [ToastNotificationsComponent],
      providers: [
        { provide: SignalRNotificationsService, useValue: mockSignalRService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});