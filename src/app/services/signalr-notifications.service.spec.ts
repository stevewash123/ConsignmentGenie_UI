import { TestBed } from '@angular/core/testing';
import { SignalRNotificationsService } from './signalr-notifications.service';

describe('SignalRNotificationsService', () => {
  let service: SignalRNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignalRNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have connection status observable', () => {
    expect(service.connectionStatus$).toBeDefined();
  });

  it('should have job progress observable', () => {
    expect(service.jobProgress$).toBeDefined();
  });

  it('should have toast notifications observable', () => {
    expect(service.toastNotifications$).toBeDefined();
  });
});