import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SuggestionType {
  value: string;
  label: string;
}

export interface SuggestionFormData {
  type: string;
  message: string;
}

@Component({
  selector: 'app-suggestion-box-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suggestion-box-modal.component.html',
  styleUrls: ['./suggestion-box-modal.component.scss']
})
export class SuggestionBoxModalComponent {
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<SuggestionFormData>();

  isSubmitting = signal<boolean>(false);
  formData = signal<SuggestionFormData>({
    type: '',
    message: ''
  });

  suggestionTypes: SuggestionType[] = [
    { value: 'FeatureRequest', label: 'Feature Request' },
    { value: 'BugReport', label: 'Bug Report' },
    { value: 'Improvement', label: 'Improvement' },
    { value: 'Integration', label: 'Integration' },
    { value: 'UserExperience', label: 'User Experience' },
    { value: 'Performance', label: 'Performance' },
    { value: 'Documentation', label: 'Documentation' },
    { value: 'Other', label: 'Other' }
  ];

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  onOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  async onSubmit() {
    if (!this.formData().type || !this.formData().message.trim()) {
      return;
    }

    this.isSubmitting.set(true);

    try {
      // Emit the suggestion data to parent
      this.submit.emit({
        type: this.formData().type,
        message: this.formData().message.trim()
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.resetForm();
      this.close.emit();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private resetForm() {
    this.formData.set({
      type: '',
      message: ''
    });
    this.isSubmitting.set(false);
  }
}