import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobProgressComponent } from './job-progress.component';
import { SignalRNotificationsService } from '../../../services/signalr-notifications.service';
import { of } from 'rxjs';

describe('JobProgressComponent', () => {
  let component: JobProgressComponent;
  let fixture: ComponentFixture<JobProgressComponent>;
  let mockSignalRService: jasmine.SpyObj<SignalRNotificationsService>;

  beforeEach(async () => {
    mockSignalRService = jasmine.createSpyObj('SignalRNotificationsService', ['simulatePayoutJobProgress'], {
      connectionStatus$: of(false),
      jobProgress$: of()
    });

    await TestBed.configureTestingModule({
      imports: [JobProgressComponent],
      providers: [
        { provide: SignalRNotificationsService, useValue: mockSignalRService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JobProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});