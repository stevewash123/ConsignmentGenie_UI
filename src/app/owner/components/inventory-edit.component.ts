import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryService } from '../../services/inventory.service';
import { ConsignorService } from '../../services/consignor.service';
import { LoadingService } from '../../shared/services/loading.service';
import { ItemDetailDto, UpdateItemRequest, ItemCondition, ItemStatus, ItemCategoryDto, ApiResponse, PhotoInfo } from '../../models/inventory.model';
import { Consignor } from '../../models/consignor.model';

@Component({
  selector: 'app-inventory-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-edit.component.html',
  styleUrls: ['./inventory-edit.component.scss']
})
export class InventoryEditComponent implements OnInit {
  itemId: string;
  item = signal<ItemDetailDto | null>(null);
  consignors = signal<Consignor[]>([]);
  categories = signal<ItemCategoryDto[]>([]);

  formData: UpdateItemRequest = {
    consignorId: '',
    title: '',
    description: '',
    category: '',
    condition: ItemCondition.Good,
    price: 0,
    sku: '',
    brand: '',
    size: '',
    color: '',
    materials: '',
    measurements: '',
    minimumPrice: undefined,
    receivedDate: undefined,
    expirationDate: undefined
  };

  errors: { [key: string]: string } = {};
  isSubmitting = false;
  isLoading = true;

  // Photo upload properties
  maxPhotos = 3;
  isUploadingPhoto = false;
  uploadProgress = 0;
  isDragOver = false;

  // Details section toggle
  isDetailsExpanded = false;

  // Condition options
  conditionOptions = [
    { value: ItemCondition.New, label: 'New' },
    { value: ItemCondition.LikeNew, label: 'Like New' },
    { value: ItemCondition.Good, label: 'Good' },
    { value: ItemCondition.Fair, label: 'Fair' },
    { value: ItemCondition.Poor, label: 'Poor' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private inventoryService: InventoryService,
    private consignorService: ConsignorService,
    private loadingService: LoadingService
  ) {
    this.itemId = this.route.snapshot.params['id'] || '';
  }

  ngOnInit(): void {
    if (this.itemId) {
      this.loadData();
    }
  }

  async loadData(): Promise<void> {
    this.loadingService.start('item-edit');
    this.isLoading = true;

    try {
      // Load item, consignors, and categories in parallel
      const [itemResponse, consignorsResponse, categoriesResponse] = await Promise.all([
        this.inventoryService.getItem(this.itemId).toPromise(),
        this.consignorService.getConsignors().toPromise(),
        this.inventoryService.getCategories().toPromise()
      ]);

      if (itemResponse?.data) {
        console.log('Edit component - Raw API response data:', itemResponse.data);
        console.log('Edit component - Photos array:', itemResponse.data.photos);
        console.log('Edit component - Photos length:', itemResponse.data.photos?.length);

        this.item.set(itemResponse.data);
        console.log('Edit component - Item signal set with:', this.item());
        console.log('Edit component - Item photos after setting:', this.item()?.photos);

        this.populateForm(itemResponse.data);
      }

      if (consignorsResponse) {
        this.consignors.set(consignorsResponse);
      }

      if (categoriesResponse?.data) {
        this.categories.set(categoriesResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.errors['general'] = 'Failed to load item data';
    } finally {
      this.isLoading = false;
      this.loadingService.stop('item-edit');
    }
  }

  populateForm(item: ItemDetailDto): void {
    this.formData = {
      consignorId: item.consignorId,
      title: item.title,
      description: item.description || '',
      category: item.category,
      condition: item.condition,
      price: item.price,
      sku: item.sku || '',
      brand: item.brand || '',
      size: item.size || '',
      color: item.color || '',
      materials: item.materials || '',
      measurements: item.measurements || '',
      minimumPrice: item.minimumPrice,
      receivedDate: item.receivedDate ? new Date(item.receivedDate) : undefined,
      expirationDate: item.expirationDate ? new Date(item.expirationDate) : undefined
    };

    // Calculate expiration date if we have a received date but no expiration date
    if (this.formData.receivedDate && !this.formData.expirationDate) {
      this.onReceivedDateChange();
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.errors = {};

    try {
      const response = await this.inventoryService.updateItem(this.itemId, this.formData).toPromise();

      if (response?.data) {
        // Navigate back to inventory list
        this.router.navigate(['/owner/inventory']);
      }
    } catch (error: any) {
      console.error('Error updating item:', error);
      if (error.error?.errors) {
        this.errors = error.error.errors;
      } else {
        this.errors['general'] = error.error?.message || 'Failed to update item';
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.formData.title?.trim()) {
      this.errors['title'] = 'Title is required';
      isValid = false;
    }

    if (!this.formData.consignorId) {
      this.errors['consignorId'] = 'Consignor is required';
      isValid = false;
    }

    if (!this.formData.category) {
      this.errors['category'] = 'Category is required';
      isValid = false;
    }

    if (!this.formData.condition) {
      this.errors['condition'] = 'Condition is required';
      isValid = false;
    }

    if (!this.formData.price || this.formData.price <= 0) {
      this.errors['price'] = 'Price must be greater than 0';
      isValid = false;
    }

    return isValid;
  }

  formatDateForInput(date: Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  formatDateForDisplay(date: Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US'); // MM/DD/YYYY format
  }

  setReceivedDate(dateValue: string | null): void {
    this.formData.receivedDate = dateValue ? new Date(dateValue) : undefined;
    this.onReceivedDateChange();
  }

  setExpirationDate(dateValue: string | null): void {
    this.formData.expirationDate = dateValue ? new Date(dateValue) : undefined;
  }

  onReceivedDateChange(): void {
    if (this.formData.receivedDate) {
      // Auto-calculate expiration date (90 days from received)
      const received = new Date(this.formData.receivedDate);
      const expiration = new Date(received);
      expiration.setDate(expiration.getDate() + 90);
      this.formData.expirationDate = expiration;
    }
  }

  goBack(): void {
    this.router.navigate(['/owner/inventory', this.itemId]);
  }

  cancel(): void {
    this.goBack();
  }

  toggleDetailsSection(): void {
    this.isDetailsExpanded = !this.isDetailsExpanded;
  }

  // Photo upload methods
  getThumbnailUrl(url: string, width = 200, height = 200): string {
    // Insert transform params into Cloudinary URL
    // From: .../upload/v123/...
    // To:   .../upload/w_200,h_200,c_fill/v123/...
    return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.uploadPhoto(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      this.uploadPhoto(files[0]);
    }
  }

  async uploadPhoto(file: File): Promise<void> {
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      this.errors['photos'] = 'File size must be under 10MB';
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      this.errors['photos'] = 'Only JPG, PNG, and WEBP images are allowed';
      return;
    }

    this.isUploadingPhoto = true;
    this.uploadProgress = 0;
    delete this.errors['photos'];

    try {
      // Upload photo using real API
      const response = await this.inventoryService.uploadItemImage(this.itemId, file).toPromise();

      if (response?.success && response.data) {
        const photoUrl = response.data;

        // Add photo to item
        const currentItem = this.item();
        if (currentItem) {
          const newPhoto = {
            url: photoUrl,
            publicId: `photo_${Date.now()}`,
            isPrimary: (currentItem.photos || []).length === 0,
            order: (currentItem.photos || []).length,
            uploadedAt: new Date().toISOString()
          };

          const updatedItem = {
            ...currentItem,
            photos: [...(currentItem.photos || []), newPhoto]
          };
          this.item.set(updatedItem);
        }

        this.isUploadingPhoto = false;
        this.uploadProgress = 0;
      } else {
        throw new Error(response?.message || 'Failed to upload photo');
      }

    } catch (error: any) {
      console.error('Error uploading photo:', error);
      this.errors['photos'] = error.error?.message || 'Failed to upload photo';
      this.isUploadingPhoto = false;
      this.uploadProgress = 0;
    }
  }

  async setPrimaryPhoto(index: number): Promise<void> {
    const currentItem = this.item();
    if (!currentItem?.photos) return;

    try {
      // TODO: Replace with actual API call to set primary photo
      // Use: this.inventoryService.setPrimaryPhoto(this.itemId, index)
      // For now, update locally
      const updatedPhotos = currentItem.photos.map((photo, i) => ({
        ...photo,
        isPrimary: i === index
      }));

      const updatedItem = {
        ...currentItem,
        photos: updatedPhotos
      };
      this.item.set(updatedItem);

    } catch (error: any) {
      console.error('Error setting primary photo:', error);
      this.errors['photos'] = 'Failed to set primary photo';
    }
  }

  async deletePhoto(index: number): Promise<void> {
    const currentItem = this.item();
    if (!currentItem?.photos) return;

    try {
      // Get the photo to delete
      const photoToDelete = currentItem.photos[index];

      // Delete photo using real API
      const response = await this.inventoryService.deleteItemImage(photoToDelete.url).toPromise();

      if (response?.success) {
        // Update local state - remove deleted photo
        const updatedPhotos = currentItem.photos.filter((_, i) => i !== index);

        // If we deleted the primary photo, set first remaining photo as primary
        if (updatedPhotos.length > 0 && !updatedPhotos.some(p => p.isPrimary)) {
          updatedPhotos[0].isPrimary = true;
        }

        const updatedItem = {
          ...currentItem,
          photos: updatedPhotos
        };
        this.item.set(updatedItem);
      } else {
        throw new Error(response?.message || 'Failed to delete photo');
      }

    } catch (error: any) {
      console.error('Error deleting photo:', error);
      this.errors['photos'] = error.error?.message || 'Failed to delete photo';
    }
  }

  getStatusClass(status: ItemStatus): string {
    switch (status) {
      case ItemStatus.Available: return 'status-available';
      case ItemStatus.Sold: return 'status-sold';
      case ItemStatus.Removed: return 'status-removed';
      default: return 'status-unknown';
    }
  }
}