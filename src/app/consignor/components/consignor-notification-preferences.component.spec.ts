import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProviderNotificationPreferencesComponent } from './consignor-notification-preferences.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('ProviderNotificationPreferencesComponent', () => {
  let component: ProviderNotificationPreferencesComponent;
  let fixture: ComponentFixture<ProviderNotificationPreferencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderNotificationPreferencesComponent, HttpClientTestingModule, RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderNotificationPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render notification preferences with consignor role', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const notificationPreferences = compiled.querySelector('app-notification-preferences');

    expect(notificationPreferences).toBeTruthy();
    expect(notificationPreferences?.getAttribute('role')).toBe('consignor');
  });

  it('should be a simple wrapper component', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Should only contain the notification preferences
    expect(compiled.children.length).toBe(1);
    expect(compiled.firstElementChild?.tagName.toLowerCase()).toBe('app-notification-preferences');
  });
});