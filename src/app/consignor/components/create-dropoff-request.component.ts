import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, NgControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { CreateDropoffRequest, DropoffItem } from '../models/consignor.models';

@Component({
  selector: 'app-create-dropoff-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-dropoff-request.component.html',
  styleUrls: ['./create-dropoff-request.component.scss']
})
export class CreateDropoffRequestComponent implements OnInit {
  dropoffRequest: CreateDropoffRequest = {
    items: [],
    plannedDate: '',
    plannedTimeSlot: '',
    message: ''
  };

  newItem: DropoffItem = this.createEmptyItem();

  timeSlotOptions = [
    { value: '', label: 'Select Time Slot (Optional)' },
    { value: 'Morning', label: 'Morning' },
    { value: 'Afternoon', label: 'Afternoon' },
    { value: 'Evening', label: 'Evening' },
    { value: 'Anytime', label: 'Anytime' }
  ];

  isSubmitting = false;
  error: string | null = null;
  editingIndex: number | null = null;
  originalItem: DropoffItem | null = null;
  shopName: string = 'Shop';
  categories: string[] = [];
  filteredCategories: string[] = [];
  conditions: { value: string; label: string }[] = [];

  @ViewChild('itemNameInput') itemNameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('addItemForm') addItemForm!: NgForm;

  constructor(
    private consignorService: ConsignorPortalService,
    private router: Router
  ) {}

  ngOnInit() {
    // Load shop name from dashboard
    this.consignorService.getDashboard().subscribe({
      next: (dashboard) => {
        this.shopName = dashboard.shopName;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
      }
    });

    // Load categories
    this.consignorService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.filteredCategories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        // Fallback categories if API fails
        this.categories = ['Clothing', 'Accessories', 'Shoes', 'Jewelry', 'Home & Decor'];
        this.filteredCategories = this.categories;
      }
    });

    // Load conditions
    this.loadConditions();
  }

  createEmptyItem(): DropoffItem {
    return {
      name: '',
      category: '',
      brand: '',
      condition: '',
      suggestedPrice: 0,
      minimumPrice: undefined,
      imageUrl: undefined,
      imagePublicId: undefined,
      notes: ''
    };
  }

  loadConditions() {
    // Call the conditions endpoint to get available condition options
    this.consignorService.getConditions().subscribe({
      next: (conditions) => {
        this.conditions = conditions.map(c => ({ value: c.value, label: c.label }));
      },
      error: (error) => {
        console.error('Error loading conditions:', error);
        // Fallback conditions if API fails
        this.conditions = [
          { value: 'New', label: 'New' },
          { value: 'LikeNew', label: 'Like New' },
          { value: 'Good', label: 'Good' },
          { value: 'Fair', label: 'Fair' },
          { value: 'Poor', label: 'Poor' }
        ];
      }
    });
  }

  addItem() {
    if (this.isNewItemValid()) {
      this.dropoffRequest.items.push({ ...this.newItem });
      this.newItem = this.createEmptyItem(); // Clear the form
      this.filteredCategories = this.categories; // Reset filtered categories
      this.error = null; // Clear any validation errors

      // Reset form validation state
      setTimeout(() => {
        if (this.addItemForm) {
          // Reset all form controls to pristine and untouched state
          Object.keys(this.addItemForm.controls).forEach(key => {
            const control = this.addItemForm.controls[key];
            control.markAsUntouched();
            control.markAsPristine();
            // Also clear any errors by updating validity
            control.updateValueAndValidity();
          });
        }

        // Set focus back to item name input
        if (this.itemNameInput) {
          this.itemNameInput.nativeElement.focus();
        }
      }, 0);
    }
  }

  isNewItemValid(): boolean {
    return !!(this.newItem.name && this.newItem.name.trim() !== '' &&
              this.newItem.category && this.newItem.category.trim() !== '' &&
              this.newItem.condition && this.newItem.condition.trim() !== '' &&
              this.newItem.suggestedPrice > 0);
  }

  onCategoryInput(value: string, isNewItem: boolean = true) {
    const filterValue = value.toLowerCase();
    this.filteredCategories = this.categories.filter(category =>
      category.toLowerCase().includes(filterValue)
    );
  }

  selectCategory(category: string, isNewItem: boolean = true) {
    if (isNewItem) {
      this.newItem.category = category;
    } else if (this.editingIndex !== null) {
      this.dropoffRequest.items[this.editingIndex].category = category;
    }
    this.filteredCategories = this.categories;
  }

  canSubmit(): boolean {
    return this.dropoffRequest.items.length > 0 && !!this.dropoffRequest.plannedDate;
  }

  removeItem(index: number) {
    this.dropoffRequest.items.splice(index, 1);
    // Clear editing state if we removed the currently edited item
    if (this.editingIndex === index) {
      this.editingIndex = null;
      this.originalItem = null;
    } else if (this.editingIndex !== null && this.editingIndex > index) {
      // Adjust editing index if we removed an item before the currently edited one
      this.editingIndex--;
    }
  }

  startEditing(index: number) {
    // Save any current edit first
    if (this.editingIndex !== null && this.editingIndex !== index) {
      this.saveItem(this.editingIndex);
    }

    this.editingIndex = index;
    // Store a copy of the original item for cancel functionality
    this.originalItem = { ...this.dropoffRequest.items[index] };
  }

  saveItem(index: number) {
    this.editingIndex = null;
    this.originalItem = null;
  }

  cancelEdit() {
    if (this.editingIndex !== null && this.originalItem) {
      // Restore the original item data
      this.dropoffRequest.items[this.editingIndex] = { ...this.originalItem };
    }
    this.editingIndex = null;
    this.originalItem = null;
  }

  getTotalSuggestedPrice(): number {
    return this.dropoffRequest.items.reduce((total, item) => total + (item.suggestedPrice || 0), 0);
  }

  onSubmit(form: NgForm) {
    if (!this.canSubmit()) {
      if (this.dropoffRequest.items.length === 0) {
        this.error = 'Please add at least one item to your manifest.';
      } else if (!this.dropoffRequest.plannedDate) {
        this.error = 'Please select a drop-off date.';
      }
      return;
    }

    // Remove any empty items before submission
    const validItems = this.dropoffRequest.items.filter(item =>
      item.name && item.name.trim() !== '' && item.suggestedPrice > 0
    );

    if (validItems.length === 0) {
      this.error = 'Please add at least one valid item with a name and suggested price.';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const requestData: CreateDropoffRequest = {
      ...this.dropoffRequest,
      items: validItems,
      plannedDate: this.dropoffRequest.plannedDate || undefined,
      plannedTimeSlot: this.dropoffRequest.plannedTimeSlot || undefined,
      message: this.dropoffRequest.message || undefined
    };

    this.consignorService.createDropoffRequest(requestData).subscribe({
      next: (result) => {
        // Navigate to the detail view of the created request
        this.router.navigate(['/consignor/dropoff-requests', result.id]);
      },
      error: (error) => {
        console.error('Error creating dropoff request:', error);
        this.error = 'Failed to create dropoff request. Please try again.';
        this.isSubmitting = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/consignor/dropoff-requests']);
  }

  isItemValid(item: DropoffItem): boolean {
    return !!(item.name && item.name.trim() !== '' &&
              item.condition && item.condition.trim() !== '' &&
              item.suggestedPrice > 0);
  }

  onAddItemKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.isNewItemValid()) {
      event.preventDefault();
      this.addItem();
    }
  }

  onFileInputBlur() {
    // When file input loses focus, restore focus to the item name input
    // This ensures Enter key works for Add Item instead of triggering file dialog
    setTimeout(() => {
      const itemNameInput = document.querySelector('[name="newItemName"]') as HTMLInputElement;
      if (itemNameInput && this.editingIndex === null) {
        itemNameInput.focus();
      }
    }, 0);
  }

  onFormKeyDown(event: KeyboardEvent) {
    // Handle Enter key at form level to ensure Add Item is triggered
    if (event.key === 'Enter' && this.editingIndex === null) {
      const target = event.target as HTMLElement;

      // Don't intercept Enter on textarea (allow line breaks)
      if (target.tagName === 'TEXTAREA') {
        return;
      }

      // Don't intercept Enter on file inputs (they handle it specially)
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'file') {
        event.preventDefault();
        return;
      }

      // If form is valid, trigger Add Item
      if (this.isNewItemValid()) {
        event.preventDefault();
        this.addItem();
      }
    }
  }

  getConditionLabel(conditionValue: string): string {
    const condition = this.conditions.find(c => c.value === conditionValue);
    return condition ? condition.label : conditionValue;
  }

  onPhotoSelected(event: any, isNewItem: boolean) {
    const file = event.target.files[0];
    if (file) {
      // Upload to Cloudinary via API
      this.consignorService.uploadPhoto(file).subscribe({
        next: (uploadResult) => {
          if (isNewItem) {
            this.newItem.imageUrl = uploadResult.url;
            this.newItem.imagePublicId = uploadResult.publicId;
          } else if (this.editingIndex !== null) {
            this.dropoffRequest.items[this.editingIndex].imageUrl = uploadResult.url;
            this.dropoffRequest.items[this.editingIndex].imagePublicId = uploadResult.publicId;
          }
        },
        error: (error) => {
          console.error('Error uploading photo:', error);
          this.error = 'Failed to upload photo. Please try again.';
        }
      });
    }
  }

  removePhoto(isNewItem: boolean) {
    if (isNewItem) {
      this.newItem.imageUrl = undefined;
      this.newItem.imagePublicId = undefined;
    } else if (this.editingIndex !== null) {
      this.dropoffRequest.items[this.editingIndex].imageUrl = undefined;
      this.dropoffRequest.items[this.editingIndex].imagePublicId = undefined;
    }
  }
}