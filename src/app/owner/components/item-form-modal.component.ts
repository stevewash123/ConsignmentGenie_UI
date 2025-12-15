import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { ConsignorService } from '../../services/consignor.service';
import { LoadingService } from '../../shared/services/loading.service';
import {
  CreateItemRequest,
  UpdateItemRequest,
  ItemListDto,
  CategoryDto,
  ItemCondition
} from '../../models/inventory.model';
import { Consignor } from '../../models/consignor.model';

@Component({
  selector: 'app-item-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-form-modal.component.html',
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 1rem;
      max-width: 600px;
      width: 95%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-grid {
      display: grid;
      gap: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-label {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .form-label.required::after {
      content: ' *';
      color: #dc2626;
    }

    .form-input,
    .form-select,
    .form-textarea {
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.75rem;
      font-size: 0.875rem;
      transition: border-color 0.2s ease;
    }

    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-error {
      color: #dc2626;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .price-input-group {
      position: relative;
    }

    .price-input-group .form-input {
      padding-left: 1.75rem;
    }

    .currency-symbol {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      font-weight: 500;
      pointer-events: none;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      border-bottom-left-radius: 1rem;
      border-bottom-right-radius: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .modal {
        width: 100%;
        margin: 1rem;
        max-height: calc(100vh - 2rem);
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .modal-footer {
        flex-direction: column;
        gap: 0.75rem;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ItemFormModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() editingItem: ItemListDto | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() itemSaved = new EventEmitter<ItemListDto>();

  // Form data
  formData = {
    title: '',
    description: '',
    sku: '',
    price: null as number | null,
    consignorId: '',
    categoryId: '',
    condition: ItemCondition.Good
  };

  // Data sources
  consignors = signal<Consignor[]>([]);
  categories = signal<CategoryDto[]>([]);

  // State
  isSubmitting = false;
  errors: Record<string, string> = {};

  // Condition options
  conditionOptions: { value: ItemCondition; label: string }[] = [
    { value: ItemCondition.New, label: 'New' },
    { value: ItemCondition.LikeNew, label: 'Like New' },
    { value: ItemCondition.Good, label: 'Good' },
    { value: ItemCondition.Fair, label: 'Fair' },
    { value: ItemCondition.Poor, label: 'Poor' }
  ];

  constructor(
    private inventoryService: InventoryService,
    private consignorService: ConsignorService,
    public loadingService: LoadingService
  ) {}

  ngOnInit() {
    if (this.isOpen) {
      this.loadFormData();
    }
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.loadFormData();
      if (this.editingItem) {
        this.populateForm();
      } else {
        this.resetForm();
      }
    }
  }

  private loadFormData() {
    // Load consignors
    this.consignorService.getConsignors().subscribe({
      next: (result) => {
        this.consignors.set(result || []);
      },
      error: (error) => {
        console.error('Error loading consignors:', error);
      }
    });

    // Load categories
    this.inventoryService.getCategories().subscribe({
      next: (result) => {
        this.categories.set(result.data || []);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  private populateForm() {
    if (this.editingItem) {
      this.formData = {
        title: this.editingItem.Title,
        description: this.editingItem.Description || '',
        sku: this.editingItem.Sku,
        price: this.editingItem.Price,
        consignorId: this.editingItem.ConsignorId,
        categoryId: '', // Will need to map category name to ID
        condition: this.editingItem.Condition
      };
    }
  }

  private resetForm() {
    this.formData = {
      title: '',
      description: '',
      sku: '',
      price: null,
      consignorId: '',
      categoryId: '',
      condition: ItemCondition.Good
    };
    this.errors = {};
  }

  validateForm(): boolean {
    this.errors = {};

    if (!this.formData.title?.trim()) {
      this.errors['title'] = 'Title is required';
    }

    if (!this.formData.sku?.trim()) {
      this.errors['sku'] = 'SKU is required';
    }

    if (!this.formData.price || this.formData.price <= 0) {
      this.errors['price'] = 'Price must be greater than 0';
    }

    if (!this.formData.consignorId) {
      this.errors['consignorId'] = 'Consignor is required';
    }

    if (!this.formData.categoryId) {
      this.errors['categoryId'] = 'Category is required';
    }

    return Object.keys(this.errors).length === 0;
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    const request = {
      title: this.formData.title.trim(),
      description: this.formData.description?.trim() || '',
      sku: this.formData.sku.trim(),
      price: this.formData.price!,
      consignorId: this.formData.consignorId,
      category: '', // Will be populated from categoryId lookup
      condition: this.formData.condition
    };

    const operation = this.editingItem
      ? this.inventoryService.updateItem(this.editingItem.ItemId, request as UpdateItemRequest)
      : this.inventoryService.createItem(request as CreateItemRequest);

    operation.subscribe({
      next: (response) => {
        // Convert ItemDetailDto to ItemListDto format for the parent component
        const itemDetailData = response.data;
        const itemListData: ItemListDto = {
          ItemId: itemDetailData.ItemId,
          Sku: itemDetailData.Sku,
          Title: itemDetailData.Title,
          Description: itemDetailData.Description,
          Price: itemDetailData.Price,
          Category: itemDetailData.Category,
          Condition: itemDetailData.Condition,
          Status: itemDetailData.Status,
          PrimaryImageUrl: itemDetailData.Images?.[0]?.ImageUrl || null,
          ReceivedDate: itemDetailData.ReceivedDate,
          SoldDate: itemDetailData.SoldDate,
          ConsignorId: itemDetailData.ConsignorId,
          ConsignorName: itemDetailData.ConsignorName,
          CommissionRate: itemDetailData.CommissionRate
        };
        this.itemSaved.emit(itemListData);
        this.close();
      },
      error: (error) => {
        console.error('Error saving item:', error);
        if (error.error?.errors) {
          this.errors = error.error.errors;
        } else {
          this.errors['general'] = error.error?.message || 'Failed to save item. Please try again.';
        }
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  close() {
    this.resetForm();
    this.closeModal.emit();
  }

  onOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  getTitle(): string {
    return this.editingItem ? 'Edit Item' : 'Add New Item';
  }

  getSubmitText(): string {
    if (this.isSubmitting) {
      return this.editingItem ? 'Updating...' : 'Adding...';
    }
    return this.editingItem ? 'Update Item' : 'Add Item';
  }
}