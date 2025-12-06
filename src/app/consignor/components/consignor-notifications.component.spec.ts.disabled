import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProviderNotificationsComponent } from './consignor-notifications.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('ProviderNotificationsComponent', () => {
  let component: ProviderNotificationsComponent;
  let fixture: ComponentFixture<ProviderNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderNotificationsComponent, HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render notification center with consignor role', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const notificationCenter = compiled.querySelector('app-notification-center');

    expect(notificationCenter).toBeTruthy();
    expect(notificationCenter?.getAttribute('role')).toBe('consignor');
  });

  it('should be a simple wrapper component', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Should only contain the notification center
    expect(compiled.children.length).toBe(1);
    expect(compiled.firstElementChild?.tagName.toLowerCase()).toBe('app-notification-center');
  });
});