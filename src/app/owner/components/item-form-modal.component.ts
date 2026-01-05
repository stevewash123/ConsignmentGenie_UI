import { Component, EventEmitter, Input, Output, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { ConsignorService } from '../../services/consignor.service';
import { ConditionService, ConditionOption } from '../../services/condition.service';
import { LoadingService } from '../../shared/services/loading.service';
import { ItemCategoryDto, CreateItemRequest, ItemCondition, ItemDetailDto } from '../../models/inventory.model';
import { Consignor } from '../../models/consignor.model';

@Component({
  selector: 'app-item-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-form-modal-simple.component.html',
  styleUrls: ['./item-form-modal.component.scss']
})
export class ItemFormModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() editingItem: ItemDetailDto | null = null;
  @Output() itemSaved = new EventEmitter<ItemDetailDto>();
  @Output() modalClosed = new EventEmitter<void>();

  private inventoryService = inject(InventoryService);
  private consignorService = inject(ConsignorService);
  private conditionService = inject(ConditionService);
  private loadingService = inject(LoadingService);

  conditionOptions = signal<ConditionOption[]>([]);
  isLoadingConditions = false;

  formData: any = {
    title: '',
    sku: '',
    price: 0,
    condition: '',
    consignorId: '',
    categoryId: '',
    description: '',
    receivedDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date().toISOString().split('T')[0]
  };

  ngOnInit() {
    if (this.isOpen) {
      this.loadConditions();
    }
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.loadConditions();
      if (this.editingItem) {
        this.populateForm();
      } else {
        this.resetForm();
        this.formData.condition = 'Good';
      }
    }
  }

  private loadConditions() {
    this.isLoadingConditions = true;
    this.conditionService.getAll().subscribe({
      next: (conditions) => {
        this.conditionOptions.set(conditions);
        this.isLoadingConditions = false;
      },
      error: () => {
        this.conditionOptions.set([]);
        this.isLoadingConditions = false;
      }
    });
  }

  private populateForm() {
    if (this.editingItem) {
      this.formData = {
        title: this.editingItem.title,
        sku: this.editingItem.sku,
        price: this.editingItem.price,
        condition: this.editingItem.condition,
        consignorId: this.editingItem.consignorId,
        categoryId: this.editingItem.category || '',
        description: this.editingItem.description || '',
        receivedDate: this.editingItem.receivedDate ? new Date(this.editingItem.receivedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expirationDate: new Date().toISOString().split('T')[0]
      };
    }
  }

  private resetForm() {
    this.formData = {
      title: '',
      sku: '',
      price: 0,
      condition: 'Good',
      consignorId: '',
      categoryId: '',
      description: '',
      receivedDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date().toISOString().split('T')[0]
    };
  }

  validateForm(): boolean {
    return !!(this.formData.title && this.formData.sku && this.formData.price && this.formData.condition);
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    if (this.editingItem) {
      this.updateItem();
    } else {
      this.createItem();
    }
  }

  private createItem() {
    const request: CreateItemRequest = {
      ...this.formData,
      condition: this.formData.condition
    };

    this.inventoryService.createItem(request).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.itemSaved.emit(response.data);
          this.close();
        }
      },
      error: (error) => {
        console.error('Create item error:', error);
      }
    });
  }

  private updateItem() {
    if (!this.editingItem) return;

    this.inventoryService.updateItem(this.editingItem.itemId, this.formData).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.itemSaved.emit(response.data);
          this.close();
        }
      },
      error: (error) => {
        console.error('Update item error:', error);
      }
    });
  }

  close() {
    this.modalClosed.emit();
  }
}