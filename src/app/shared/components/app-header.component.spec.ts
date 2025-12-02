import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AppHeaderComponent } from './app-header.component';

describe('AppHeaderComponent', () => {
  let component: AppHeaderComponent;
  let fixture: ComponentFixture<AppHeaderComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of() // Observable for navigation events
    });
    routerSpy.createUrlTree.and.returnValue({} as any); // Mock UrlTree
    routerSpy.serializeUrl.and.returnValue(''); // Mock serialized URL

    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {},
      params: of({}),
      queryParams: of({}),
      url: of([]),
      data: of({}),
      fragment: of(''),
      outlet: 'primary',
      component: null,
      routeConfig: null,
      root: null as any,
      parent: null,
      firstChild: null,
      children: [],
      pathFromRoot: []
    });

    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should check if user is admin', () => {
    const result = component.isAdmin();
    expect(typeof result).toBe('boolean');
  });

  it('should check if user is owner', () => {
    const result = component.isOwner();
    expect(typeof result).toBe('boolean');
  });

  it('should check if user is customer or provider', () => {
    const result = component.isCustomerOrProvider();
    expect(typeof result).toBe('boolean');
  });

  it('should toggle user menu', () => {
    const initialState = component.showUserMenu();
    component.toggleUserMenu();
    expect(component.showUserMenu()).toBe(!initialState);
  });

  it('should logout', () => {
    component.logout();
    expect(component.showUserMenu()).toBe(false);
  });
});