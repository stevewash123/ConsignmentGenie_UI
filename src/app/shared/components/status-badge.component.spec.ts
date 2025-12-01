import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';
import { ProviderStatus } from '../../models/provider.model';

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

  it('should display active status correctly', () => {
    component.status = 'active';
    fixture.detectChanges();

    expect(component.badgeClass).toContain('bg-green-100');
    expect(component.badgeClass).toContain('text-green-800');
    expect(component.badgeClass).toContain('border-green-200');
    expect(component.label).toBeDefined();
  });

  it('should display invited status correctly', () => {
    component.status = 'invited';
    fixture.detectChanges();

    expect(component.badgeClass).toContain('bg-yellow-100');
    expect(component.badgeClass).toContain('text-yellow-800');
    expect(component.badgeClass).toContain('border-yellow-200');
    expect(component.label).toBeDefined();
  });

  it('should display inactive status correctly', () => {
    component.status = 'inactive';
    fixture.detectChanges();

    expect(component.badgeClass).toContain('bg-gray-100');
    expect(component.badgeClass).toContain('text-gray-600');
    expect(component.badgeClass).toContain('border-gray-200');
    expect(component.label).toBeDefined();
  });

  it('should have base classes for all statuses', () => {
    const baseClasses = ['px-2', 'py-1', 'rounded-full', 'text-sm', 'font-medium', 'border'];

    component.status = 'active';
    expect(baseClasses.every(cls => component.badgeClass.includes(cls))).toBe(true);

    component.status = 'invited';
    expect(baseClasses.every(cls => component.badgeClass.includes(cls))).toBe(true);

    component.status = 'inactive';
    expect(baseClasses.every(cls => component.badgeClass.includes(cls))).toBe(true);
  });

  it('should default to active status', () => {
    expect(component.status).toBe('active');
  });

  it('should render the label in the template', () => {
    component.status = 'active';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const span = compiled.querySelector('span');
    expect(span).toBeTruthy();
    expect(span?.textContent?.trim()).toBe(component.label);
  });

  it('should apply correct CSS classes to span element', () => {
    component.status = 'active';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const span = compiled.querySelector('span');
    expect(span).toBeTruthy();
    expect(span?.className).toContain('bg-green-100');
    expect(span?.className).toContain('text-green-800');
  });
});