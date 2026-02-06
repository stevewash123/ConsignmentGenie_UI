import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsignorItemService } from '../../services/consignor-item.service';
import { ConsignorItemSummary } from '../../models/consignor-item.model';
import { ProviderItemDetail } from '../../../../../consignor/models/consignor.models';
import { ConsignorPortalService } from '../../../../../consignor/services/consignor-portal.service';

export interface UpdateItemRequest {
  title: string;
  description: string;
  notes?: string;
}

@Component({
  selector: 'app-edit-item-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-item-modal.component.html',
  styleUrls: ['./edit-item-modal.component.scss']
})
export class EditItemModalComponent implements OnInit, OnChanges {
  @Input() itemSummary: ConsignorItemSummary | null = null;
  @Input() isVisible = false;
  @Output() closed = new EventEmitter<boolean>(); // true if item was updated

  itemDetail: ProviderItemDetail | null = null;
  editForm: FormGroup;
  isLoading = false;
  isLoadingDetail = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private consignorItemService: ConsignorItemService,
    private consignorPortalService: ConsignorPortalService
  ) {
    this.editForm = this.createForm();
  }

  ngOnInit() {
    if (this.isVisible && this.itemSummary) {
      this.loadItemDetail();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isVisible'] && this.isVisible && this.itemSummary) {
      this.loadItemDetail();
    } else if (changes['isVisible'] && !this.isVisible) {
      this.resetForm();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  private loadItemDetail(): void {
    if (!this.itemSummary) return;

    this.isLoadingDetail = true;
    this.error = null;

    this.consignorPortalService.getMyItem(this.itemSummary.id).subscribe({
      next: (detail) => {
        this.itemDetail = detail;
        this.populateForm(detail);
        this.isLoadingDetail = false;
      },
      error: (error) => {
        this.error = 'Failed to load item details';
        this.isLoadingDetail = false;
        console.error('Error loading item detail:', error);
      }
    });
  }

  private populateForm(item: ProviderItemDetail): void {
    this.editForm.patchValue({
      title: item.title,
      description: item.description || '',
      notes: item.notes || ''
    });
  }

  private resetForm(): void {
    this.editForm.reset();
    this.itemDetail = null;
    this.error = null;
  }

  close() {
    this.closed.emit(false);
  }

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  onSubmit(): void {
    if (this.editForm.invalid || !this.itemSummary || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const updateRequest: UpdateItemRequest = {
      title: this.editForm.value.title.trim(),
      description: this.editForm.value.description?.trim() || '',
      notes: this.editForm.value.notes?.trim() || ''
    };

    // Use the service to update the item
    this.consignorItemService.updateItem(this.itemSummary.id, updateRequest).subscribe({
      next: () => {
        this.isLoading = false;
        this.closed.emit(true); // Item was updated
      },
      error: (error) => {
        this.isLoading = false;
        this.error = 'Failed to update item. Please try again.';
        console.error('Error updating item:', error);
      }
    });
  }

  canSubmit(): boolean {
    return this.editForm.valid && !this.isLoading && !this.isLoadingDetail;
  }

  // Helper methods for validation display
  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (!field || field.valid) return '';

    if (field.errors?.['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field.errors?.['maxlength']) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} cannot exceed ${maxLength} characters`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Title',
      description: 'Description',
      notes: 'Notes'
    };
    return labels[fieldName] || fieldName;
  }

  getRemainingChars(fieldName: string): number {
    const field = this.editForm.get(fieldName);
    if (!field) return 0;

    const maxLengths: { [key: string]: number } = {
      title: 200,
      description: 1000,
      notes: 500
    };

    const maxLength = maxLengths[fieldName] || 0;
    const currentLength = field.value?.length || 0;
    return Math.max(0, maxLength - currentLength);
  }
}