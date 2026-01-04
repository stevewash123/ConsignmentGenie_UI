import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { CreateItemRequest } from '../models/consignor.models';

@Component({
  selector: 'app-submit-item-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './submit-item-request.component.html',
  styleUrls: ['./submit-item-request.component.scss']
})
export class SubmitItemRequestComponent implements OnInit {
  formData: CreateItemRequest = {
    name: '',
    condition: '',
    images: []
  };

  conditions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  categories = [
    'Clothing',
    'Accessories',
    'Shoes',
    'Bags',
    'Jewelry',
    'Home Decor',
    'Electronics',
    'Books',
    'Sporting Goods',
    'Other'
  ];

  isSubmitting = false;
  error: string | null = null;
  previewImages: string[] = [];

  constructor(
    private consignorService: ConsignorPortalService,
    private router: Router
  ) {}

  ngOnInit() {}

  onFileSelected(event: any) {
    const files = event.target.files;
    this.handleFiles(files);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
  }

  private handleFiles(files: FileList) {
    for (let i = 0; i < files.length && this.previewImages.length < 8; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          this.previewImages.push(imageUrl);

          this.formData.images = this.formData.images || [];
          this.formData.images.push({
            imageUrl: imageUrl,
            displayOrder: this.formData.images.length,
            isPrimary: this.formData.images.length === 0
          });
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number) {
    this.previewImages.splice(index, 1);
    this.formData.images?.splice(index, 1);

    // Reorder remaining images
    this.formData.images?.forEach((img, i) => {
      img.displayOrder = i;
      img.isPrimary = i === 0;
    });
  }

  setPrimaryImage(index: number) {
    if (this.formData.images) {
      this.formData.images.forEach((img, i) => {
        img.isPrimary = i === index;
      });
    }
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    this.consignorService.createItemRequest(this.formData).subscribe({
      next: (result) => {
        this.router.navigate(['/consignor/item-requests']);
      },
      error: (err) => {
        this.error = 'Failed to submit item request. Please try again.';
        this.isSubmitting = false;
        console.error('Submit error:', err);
      }
    });
  }

  private validateForm(): boolean {
    const errors: string[] = [];

    if (!this.formData.name?.trim()) {
      errors.push('Item name is required');
    }

    if (!this.formData.condition) {
      errors.push('Condition is required');
    }

    if (this.formData.suggestedPrice && this.formData.suggestedPrice <= 0) {
      errors.push('Suggested price must be greater than 0');
    }

    if (this.formData.minAcceptablePrice && this.formData.minAcceptablePrice <= 0) {
      errors.push('Minimum acceptable price must be greater than 0');
    }

    if (this.formData.suggestedPrice && this.formData.minAcceptablePrice &&
        this.formData.minAcceptablePrice > this.formData.suggestedPrice) {
      errors.push('Minimum acceptable price cannot be higher than suggested price');
    }

    if (errors.length > 0) {
      this.error = errors.join(', ');
      return false;
    }

    return true;
  }

  cancel() {
    this.router.navigate(['/consignor/item-requests']);
  }
}