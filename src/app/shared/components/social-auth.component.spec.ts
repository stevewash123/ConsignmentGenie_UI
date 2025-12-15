import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { SocialAuthComponent, SocialAuthResult } from './social-auth.component';
import { By } from '@angular/platform-browser';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SocialAuthComponent', () => {
  let component: SocialAuthComponent;
  let fixture: ComponentFixture<SocialAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialAuthComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SocialAuthComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default login mode', () => {
      expect(component.mode).toBe('login');
    });
  });

  describe('Mode Display', () => {
    it('should display correct title for signup mode', () => {
      component.mode = 'signup';
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(By.css('.auth-title'));
      expect(titleElement.nativeElement.textContent.trim()).toBe('Create your account');
    });

    it('should display correct title for login mode', () => {
      component.mode = 'login';
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(By.css('.auth-title'));
      expect(titleElement.nativeElement.textContent.trim()).toBe('Welcome back');
    });

    it('should display correct title for link mode', () => {
      component.mode = 'link';
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(By.css('.auth-title'));
      expect(titleElement.nativeElement.textContent.trim()).toBe('Link your account');
    });

    it('should return correct text for getModeText method', () => {
      component.mode = 'signup';
      expect(component.getModeText()).toBe('Sign up');

      component.mode = 'login';
      expect(component.getModeText()).toBe('Sign in');

      component.mode = 'link';
      expect(component.getModeText()).toBe('Link account');
    });
  });

  describe('Template Rendering', () => {
    it('should render Google button with correct text', () => {
      component.mode = 'signup';
      fixture.detectChanges();

      const googleBtn = fixture.debugElement.query(By.css('.google-btn'));
      expect(googleBtn.nativeElement.textContent).toContain('Sign up with Google');
    });

    it('should render Facebook button as enabled with normal text', () => {
      fixture.detectChanges();

      const facebookBtn = fixture.debugElement.query(By.css('.facebook-btn'));
      expect(facebookBtn.nativeElement.disabled).toBe(false);
      expect(facebookBtn.nativeElement.textContent).toContain('Sign in with Facebook');
    });

    it('should show divider and email prompt for non-link modes', () => {
      component.mode = 'login';
      fixture.detectChanges();

      const divider = fixture.debugElement.query(By.css('.divider'));
      const emailPrompt = fixture.debugElement.query(By.css('.email-signup-prompt'));

      expect(divider).toBeTruthy();
      expect(emailPrompt).toBeTruthy();
    });

    it('should hide divider and email prompt for link mode', () => {
      component.mode = 'link';
      fixture.detectChanges();

      const divider = fixture.debugElement.query(By.css('.divider'));
      const emailPrompt = fixture.debugElement.query(By.css('.email-signup-prompt'));

      expect(divider).toBeFalsy();
      expect(emailPrompt).toBeFalsy();
    });

    it('should trigger Google login when button clicked', () => {
      spyOn(component, 'loginWithGoogle');
      fixture.detectChanges();

      const googleBtn = fixture.debugElement.query(By.css('.google-btn'));
      googleBtn.nativeElement.click();

      expect(component.loginWithGoogle).toHaveBeenCalled();
    });

    it('should trigger Facebook login when button clicked', () => {
      spyOn(component, 'loginWithFacebook');
      fixture.detectChanges();

      const facebookBtn = fixture.debugElement.query(By.css('.facebook-btn'));
      facebookBtn.nativeElement.click();

      expect(component.loginWithFacebook).toHaveBeenCalled();
    });
  });

  describe('Event Emitters', () => {
    it('should have authSuccess event emitter', () => {
      expect(component.authSuccess).toBeDefined();
      expect(component.authSuccess instanceof EventEmitter).toBe(true);
    });

    it('should have authError event emitter', () => {
      expect(component.authError).toBeDefined();
      expect(component.authError instanceof EventEmitter).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should emit error when Google not loaded', () => {
      spyOn(component.authError, 'emit');
      (component as any).isGoogleLoaded = false;

      component.loginWithGoogle();

      expect(component.authError.emit).toHaveBeenCalledWith('Google authentication not loaded');
    });

    it('should emit not loaded error for Facebook login when not loaded', () => {
      spyOn(component.authError, 'emit');

      component.loginWithFacebook();

      expect(component.authError.emit).toHaveBeenCalledWith('Facebook authentication not loaded');
    });
  });

  describe('Mock Backend Integration', () => {
    it('should simulate backend authentication call', fakeAsync(() => {
      spyOn(component.authSuccess, 'emit');

      const authResult: SocialAuthResult = {
        provider: 'google',
        email: 'test@example.com',
        name: 'Test User',
        providerId: 'google123',
        isNewUser: false
      };

      (component as any).mockBackendAuth(authResult);
      tick(1000);

      expect(component.authSuccess.emit).toHaveBeenCalledWith({
        provider: 'google',
        email: 'test@example.com',
        name: 'Test User',
        providerId: 'google123',
        isNewUser: jasmine.any(Boolean)
      });
    }));
  });
});