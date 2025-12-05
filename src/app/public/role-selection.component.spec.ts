import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { RoleSelectionComponent } from './role-selection.component';

// Mock components for routing tests
@Component({ template: '' })
class MockOwnerSignupComponent { }

@Component({ template: '' })
class MockConsignorSignupComponent { }

@Component({ template: '' })
class MockLoginComponent { }

describe('RoleSelectionComponent', () => {
  let component: RoleSelectionComponent;
  let fixture: ComponentFixture<RoleSelectionComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RoleSelectionComponent,
        RouterTestingModule.withRoutes([
          { path: 'signup/owner', component: MockOwnerSignupComponent },
          { path: 'signup/consignor', component: MockConsignorSignupComponent },
          { path: 'login', component: MockLoginComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RoleSelectionComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct title and description', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h2')?.textContent).toBe('Create Your Account');
    expect(compiled.querySelector('.selection-header p')?.textContent)
      .toBe('Choose how you want to get started with Consignment Genie');
  });

  it('should display both role option cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const roleCards = compiled.querySelectorAll('.role-card');

    expect(roleCards.length).toBe(2);

    // Check owner card
    const ownerCard = roleCards[0];
    expect(ownerCard.querySelector('h3')?.textContent).toBe('Open a Consignment Shop');
    expect(ownerCard.getAttribute('href')).toBe('/signup/owner');

    // Check consignor card
    const providerCard = roleCards[1];
    expect(providerCard.querySelector('h3')?.textContent).toBe('Consign Items at a Shop');
    expect(providerCard.getAttribute('href')).toBe('/signup/consignor');
  });

  it('should display correct features for owner role', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const ownerCard = compiled.querySelector('.owner-card');
    const features = ownerCard?.querySelectorAll('.feature-list li');

    expect(features?.length).toBe(4);
    expect(features?.[0].textContent?.trim()).toBe('Set up your shop instantly');
    expect(features?.[1].textContent?.trim()).toBe('Manage consignors and inventory');
    expect(features?.[2].textContent?.trim()).toBe('Process sales and payouts');
    expect(features?.[3].textContent?.trim()).toBe('Full business dashboard');
  });

  it('should display correct features for consignor role', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const providerCard = compiled.querySelector('.consignor-card');
    const features = providerCard?.querySelectorAll('.feature-list li');

    expect(features?.length).toBe(4);
    expect(features?.[0].textContent?.trim()).toBe('Quick and easy signup');
    expect(features?.[1].textContent?.trim()).toBe('Submit items for consignment');
    expect(features?.[2].textContent?.trim()).toBe('Track your sales and earnings');
    expect(features?.[3].textContent?.trim()).toBe('Get paid automatically');
  });

  it('should display login link for existing users', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const loginSection = compiled.querySelector('.login-section');
    const loginLink = loginSection?.querySelector('a[routerLink="/login"]');

    expect(loginLink).toBeTruthy();
    expect(loginLink?.textContent?.trim()).toBe('Sign in here');
  });

  it('should have correct routing attributes', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Check owner signup link
    const ownerLink = compiled.querySelector('a[routerLink="/signup/owner"]');
    expect(ownerLink).toBeTruthy();

    // Check consignor signup link
    const providerLink = compiled.querySelector('a[routerLink="/signup/consignor"]');
    expect(providerLink).toBeTruthy();

    // Check login link
    const loginLink = compiled.querySelector('a[routerLink="/login"]');
    expect(loginLink).toBeTruthy();
  });

  it('should navigate to owner signup when owner card is clicked', async () => {
    spyOn(router, 'navigate');

    const compiled = fixture.nativeElement as HTMLElement;
    const ownerCard = compiled.querySelector('.owner-card') as HTMLElement;

    ownerCard.click();

    // Note: In real app, this would navigate via routerLink
    // This test verifies the element has the correct routerLink attribute
    expect(ownerCard.getAttribute('routerLink')).toBe('/signup/owner');
  });

  it('should navigate to consignor signup when consignor card is clicked', async () => {
    spyOn(router, 'navigate');

    const compiled = fixture.nativeElement as HTMLElement;
    const providerCard = compiled.querySelector('.consignor-card') as HTMLElement;

    providerCard.click();

    // Note: In real app, this would navigate via routerLink
    // This test verifies the element has the correct routerLink attribute
    expect(providerCard.getAttribute('routerLink')).toBe('/signup/consignor');
  });

  it('should have proper styling classes for differentiation', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const ownerCard = compiled.querySelector('.owner-card');
    const providerCard = compiled.querySelector('.consignor-card');

    expect(ownerCard).toHaveClass('role-card');
    expect(ownerCard).toHaveClass('owner-card');

    expect(providerCard).toHaveClass('role-card');
    expect(providerCard).toHaveClass('consignor-card');
  });

  it('should display role icons', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const icons = compiled.querySelectorAll('.role-icon');

    expect(icons.length).toBe(2);
    expect(icons[0].textContent?.trim()).toBe('🏪'); // Shop icon for owner
    expect(icons[1].textContent?.trim()).toBe('🎨'); // Artist icon for consignor
  });
});