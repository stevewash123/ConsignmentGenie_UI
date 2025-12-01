import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { ConfirmationDialogService } from '../services/confirmation-dialog.service';
import { Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationDialogService>;
  let dialogSubject: Subject<any>;

  beforeEach(async () => {
    dialogSubject = new Subject();
    mockConfirmationService = jasmine.createSpyObj('ConfirmationDialogService', ['sendResult'], {
      dialog$: dialogSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent, FormsModule, NoopAnimationsModule],
      providers: [
        { provide: ConfirmationDialogService, useValue: mockConfirmationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with dialog hidden', () => {
    fixture.detectChanges();
    expect(component.showDialog()).toBe(false);
    expect(component.dialogData()).toBeNull();
  });

  it('should show dialog when service emits dialog data', fakeAsync(() => {
    const dialogData = {
      title: 'Test Confirmation',
      message: 'Are you sure?',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      isDestructive: false,
      showInput: false
    };

    fixture.detectChanges();

    dialogSubject.next(dialogData);
    tick();

    expect(component.showDialog()).toBe(true);
    expect(component.dialogData()).toEqual(dialogData);
  }));

  it('should display dialog content correctly', fakeAsync(() => {
    const dialogData = {
      title: 'Delete Item',
      message: 'This action cannot be undone.',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      isDestructive: true,
      showInput: false
    };

    fixture.detectChanges();
    dialogSubject.next(dialogData);
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.dialog-title')?.textContent).toBe('Delete Item');
    expect(compiled.querySelector('.dialog-message')?.textContent).toBe('This action cannot be undone.');
    expect(compiled.querySelector('.cancel-btn')?.textContent?.trim()).toBe('Cancel');
    expect(compiled.querySelector('.confirm-btn')?.textContent?.trim()).toBe('Delete');
  }));

  it('should show input field when showInput is true', fakeAsync(() => {
    const dialogData = {
      title: 'Add Note',
      message: 'Please provide additional details.',
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      isDestructive: false,
      showInput: true,
      inputLabel: 'Note',
      inputPlaceholder: 'Enter your note here...'
    };

    fixture.detectChanges();
    dialogSubject.next(dialogData);
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.input-group')).toBeTruthy();
    expect(compiled.querySelector('.input-label')?.textContent).toBe('Note');
    expect(compiled.querySelector('.dialog-input')).toBeTruthy();
  }));

  it('should apply destructive styling when isDestructive is true', fakeAsync(() => {
    const dialogData = {
      title: 'Delete Item',
      message: 'This action cannot be undone.',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      isDestructive: true,
      showInput: false
    };

    fixture.detectChanges();
    dialogSubject.next(dialogData);
    tick();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.dialog-header')?.classList).toContain('destructive');
    expect(compiled.querySelector('.confirm-btn')?.classList).toContain('destructive');
  }));

  it('should send cancel result when cancel button is clicked', fakeAsync(() => {
    const dialogData = {
      title: 'Test',
      message: 'Test message',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      isDestructive: false,
      showInput: false
    };

    fixture.detectChanges();
    dialogSubject.next(dialogData);
    tick();
    fixture.detectChanges();

    const cancelBtn = fixture.nativeElement.querySelector('.cancel-btn') as HTMLButtonElement;
    cancelBtn.click();
    tick();

    expect(mockConfirmationService.sendResult).toHaveBeenCalledWith({ confirmed: false });
    expect(component.showDialog()).toBe(false);
  }));

  it('should send confirm result when confirm button is clicked', fakeAsync(() => {
    const dialogData = {
      title: 'Test',
      message: 'Test message',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      isDestructive: false,
      showInput: false
    };

    fixture.detectChanges();
    dialogSubject.next(dialogData);
    tick();
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector('.confirm-btn') as HTMLButtonElement;
    confirmBtn.click();
    tick(400); // Wait for the setTimeout delay

    expect(mockConfirmationService.sendResult).toHaveBeenCalledWith({ confirmed: true, inputValue: undefined });
    expect(component.showDialog()).toBe(false);
  }));

  it('should include input value in confirm result when input is shown', fakeAsync(() => {
    const dialogData = {
      title: 'Test',
      message: 'Test message',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      isDestructive: false,
      showInput: true,
      inputValue: 'Initial value'
    };

    fixture.detectChanges();
    dialogSubject.next(dialogData);
    tick();
    fixture.detectChanges();

    // Update input value
    component.inputValue = 'Updated value';
    const confirmBtn = fixture.nativeElement.querySelector('.confirm-btn') as HTMLButtonElement;
    confirmBtn.click();
    tick(400);

    expect(mockConfirmationService.sendResult).toHaveBeenCalledWith({
      confirmed: true,
      inputValue: 'Updated value'
    });
  }));

  it('should close dialog when overlay is clicked', fakeAsync(() => {
    const dialogData = {
      title: 'Test',
      message: 'Test message',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      isDestructive: false,
      showInput: false
    };

    fixture.detectChanges();
    dialogSubject.next(dialogData);
    tick();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('.confirmation-overlay') as HTMLElement;
    overlay.click();
    tick();

    expect(mockConfirmationService.sendResult).toHaveBeenCalledWith({ confirmed: false });
    expect(component.showDialog()).toBe(false);
  }));

  it('should show loading state during confirmation', fakeAsync(() => {
    const dialogData = {
      title: 'Test',
      message: 'Test message',
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      isDestructive: false,
      showInput: false
    };

    fixture.detectChanges();
    dialogSubject.next(dialogData);
    tick();
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector('.confirm-btn') as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges(); // Apply the state change to the DOM

    expect(component.isConfirming()).toBe(true);
    expect(confirmBtn.disabled).toBe(true);

    tick(400);
    expect(component.isConfirming()).toBe(false);
  }));

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});