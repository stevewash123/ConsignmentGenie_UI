import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SuggestionBoxModalComponent, SuggestionFormData } from './suggestion-box-modal.component';

describe('SuggestionBoxModalComponent', () => {
  let component: SuggestionBoxModalComponent;
  let fixture: ComponentFixture<SuggestionBoxModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestionBoxModalComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SuggestionBoxModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default form data', () => {
    expect(component.formData()).toEqual({
      type: '',
      message: ''
    });
    expect(component.isSubmitting()).toBe(false);
  });

  it('should have correct suggestion types', () => {
    expect(component.suggestionTypes).toEqual([
      { value: 'FeatureRequest', label: 'Feature Request' },
      { value: 'BugReport', label: 'Bug Report' },
      { value: 'Improvement', label: 'Improvement' },
      { value: 'Integration', label: 'Integration' },
      { value: 'UserExperience', label: 'User Experience' },
      { value: 'Performance', label: 'Performance' },
      { value: 'Documentation', label: 'Documentation' },
      { value: 'Other', label: 'Other' }
    ]);
  });

  it('should emit close event when onClose is called', () => {
    const closeSpy = spyOn(component.close, 'emit');

    component.onClose();

    expect(closeSpy).toHaveBeenCalled();
    expect(component.formData()).toEqual({
      type: '',
      message: ''
    });
    expect(component.isSubmitting()).toBe(false);
  });

  it('should emit close event when clicking overlay', () => {
    const closeSpy = spyOn(component.close, 'emit');
    const overlayElement = document.createElement('div');
    const mockEvent = {
      target: overlayElement,
      currentTarget: overlayElement // Same element indicates click on overlay
    };

    component.onOverlayClick(mockEvent as any);

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should not emit close event when clicking inside modal content', () => {
    const closeSpy = spyOn(component.close, 'emit');
    const element = document.createElement('div');
    const mockEvent = {
      target: element,
      currentTarget: document.createElement('div') // Different from target
    };

    component.onOverlayClick(mockEvent as any);

    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('should not submit when form is invalid (empty type)', async () => {
    const submitSpy = spyOn(component.submit, 'emit');
    component.formData.set({
      type: '',
      message: 'Test message'
    });

    await component.onSubmit();

    expect(submitSpy).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should not submit when form is invalid (empty message)', async () => {
    const submitSpy = spyOn(component.submit, 'emit');
    component.formData.set({
      type: 'BugReport',
      message: ''
    });

    await component.onSubmit();

    expect(submitSpy).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should not submit when form is invalid (whitespace only message)', async () => {
    const submitSpy = spyOn(component.submit, 'emit');
    component.formData.set({
      type: 'BugReport',
      message: '   \n   \t   '
    });

    await component.onSubmit();

    expect(submitSpy).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should submit form when valid data is provided', async () => {
    const submitSpy = spyOn(component.submit, 'emit');
    const closeSpy = spyOn(component.close, 'emit');

    const formData: SuggestionFormData = {
      type: 'FeatureRequest',
      message: 'Please add dark mode support'
    };

    component.formData.set(formData);

    await component.onSubmit();

    expect(component.isSubmitting()).toBe(false); // Should be false after completion
    expect(submitSpy).toHaveBeenCalledWith({
      type: 'FeatureRequest',
      message: 'Please add dark mode support'
    });
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should trim whitespace from message when submitting', async () => {
    const submitSpy = spyOn(component.submit, 'emit');
    const closeSpy = spyOn(component.close, 'emit');

    component.formData.set({
      type: 'BugReport',
      message: '  Bug description with spaces  \n\t  '
    });

    await component.onSubmit();

    expect(submitSpy).toHaveBeenCalledWith({
      type: 'BugReport',
      message: 'Bug description with spaces'
    });
  });

  it('should reset form after submission', async () => {
    spyOn(component.submit, 'emit');
    spyOn(component.close, 'emit');

    component.formData.set({
      type: 'Improvement',
      message: 'Some improvement suggestion'
    });

    await component.onSubmit();

    expect(component.formData()).toEqual({
      type: '',
      message: ''
    });
  });

  it('should show/hide modal based on isVisible input', () => {
    component.isVisible = false;
    fixture.detectChanges();

    let modalElement = fixture.nativeElement.querySelector('.modal-overlay');
    expect(modalElement).toBeNull();

    component.isVisible = true;
    fixture.detectChanges();

    modalElement = fixture.nativeElement.querySelector('.modal-overlay');
    expect(modalElement).toBeTruthy();
  });

  it('should display correct character count', () => {
    component.isVisible = true;
    component.formData.set({
      type: 'Other',
      message: 'Hello world!'
    });
    fixture.detectChanges();

    const characterCount = fixture.nativeElement.querySelector('.character-count');
    expect(characterCount?.textContent?.trim()).toBe('12/2000 characters');
  });

  it('should disable submit button when form is invalid', async () => {
    component.isVisible = true;
    fixture.detectChanges();
    await fixture.whenStable();

    // Set empty values which should make form invalid
    const typeSelect = fixture.nativeElement.querySelector('select[name="type"]');
    const messageTextarea = fixture.nativeElement.querySelector('textarea[name="message"]');

    typeSelect.value = '';
    typeSelect.dispatchEvent(new Event('change'));
    messageTextarea.value = '';
    messageTextarea.dispatchEvent(new Event('input'));

    fixture.detectChanges();
    await fixture.whenStable();

    const submitButton = fixture.nativeElement.querySelector('.btn-submit');
    expect(submitButton?.disabled).toBe(true);
  });

  it('should enable submit button when form is valid', () => {
    component.isVisible = true;
    component.formData.set({
      type: 'FeatureRequest',
      message: 'Valid suggestion'
    });
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('.btn-submit');
    expect(submitButton?.disabled).toBe(false);
  });

  it('should show loading state during submission', async () => {
    const submitSpy = spyOn(component.submit, 'emit').and.stub();
    const closeSpy = spyOn(component.close, 'emit').and.stub();

    component.isVisible = true;
    component.formData.set({
      type: 'BugReport',
      message: 'Bug report'
    });
    fixture.detectChanges();

    // Start submission (this sets isSubmitting to true briefly)
    const submitPromise = component.onSubmit();

    // Check loading state is active
    expect(component.isSubmitting()).toBe(true);

    // Wait for submission to complete
    await submitPromise;

    // Check loading state is cleared
    expect(component.isSubmitting()).toBe(false);
  });

  it('should display all suggestion types in dropdown', () => {
    component.isVisible = true;
    fixture.detectChanges();

    const optionElements = fixture.nativeElement.querySelectorAll('select option');

    // +1 for the "Select a type..." placeholder option
    expect(optionElements.length).toBe(component.suggestionTypes.length + 1);

    // Check that all suggestion types are represented
    const optionValues = Array.from(optionElements).map((option: any) => option.value).filter(value => value);
    const expectedValues = component.suggestionTypes.map(type => type.value);

    expect(optionValues.sort()).toEqual(expectedValues.sort());
  });
});