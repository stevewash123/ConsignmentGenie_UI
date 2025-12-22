import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct text for available status', () => {
    component.status = 'available';
    fixture.detectChanges();

    expect(component.displayText).toBe('Available');
    expect(component.statusIcon).toBe('🟢');
    expect(component.badgeClass).toBe('status-available');
  });

  it('should display correct text for sold status', () => {
    component.status = 'sold';
    fixture.detectChanges();

    expect(component.displayText).toBe('Sold');
    expect(component.statusIcon).toBe('✅');
    expect(component.badgeClass).toBe('status-sold');
  });

  it('should display correct text for pending approval status', () => {
    component.status = 'pending_consignor_approval';
    fixture.detectChanges();

    expect(component.displayText).toBe('Price Change - Your Response Needed');
    expect(component.statusIcon).toBe('🟡');
    expect(component.badgeClass).toBe('status-pending');
  });

  it('should show action indicator when requires response', () => {
    component.status = 'pending_consignor_approval';
    component.requiresResponse = true;
    fixture.detectChanges();

    const element = fixture.nativeElement;
    const actionIndicator = element.querySelector('.action-indicator');
    expect(actionIndicator).toBeTruthy();
    expect(actionIndicator.textContent).toBe('⚡');
  });
});