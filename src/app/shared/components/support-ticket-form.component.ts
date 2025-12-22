import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CreateTicketRequest, TICKET_CATEGORIES, TICKET_PRIORITIES, TicketCategory, TicketPriority } from '../../models/support-ticket.model';

@Component({
  selector: 'app-support-ticket-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './support-ticket-form.component.html',
  styles: []
})
export class SupportTicketFormComponent {
  @Input() isLoading = false;
  @Output() submitTicket = new EventEmitter<CreateTicketRequest>();
  @Output() cancel = new EventEmitter<void>();

  ticketForm: FormGroup;
  categories = TICKET_CATEGORIES;
  priorities = TICKET_PRIORITIES;

  constructor(private fb: FormBuilder) {
    this.ticketForm = this.fb.group({
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      category: ['', Validators.required],
      priority: ['medium', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.ticketForm.valid && !this.isLoading) {
      const formValue = this.ticketForm.value;
      const request: CreateTicketRequest = {
        subject: formValue.subject,
        description: formValue.description,
        category: formValue.category as TicketCategory,
        priority: formValue.priority as TicketPriority
      };
      this.submitTicket.emit(request);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getFieldError(fieldName: string): string | null {
    const field = this.ticketForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors?.['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} cannot exceed ${maxLength} characters`;
      }
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      subject: 'Subject',
      description: 'Description',
      category: 'Category',
      priority: 'Priority'
    };
    return labels[fieldName] || fieldName;
  }
}