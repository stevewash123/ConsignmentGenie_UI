import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemImageDto } from '../services/mock-consignor-item.service';

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="image-gallery">
      <!-- Main Image -->
      <div class="main-image-container">
        <img
          [src]="selectedImage.url"
          [alt]="itemName"
          class="main-image"
          loading="lazy">
      </div>

      <!-- Thumbnails -->
      <div class="thumbnails" *ngIf="images.length > 1">
        <button
          *ngFor="let image of images"
          type="button"
          class="thumbnail-button"
          [class.active]="image.id === selectedImage.id"
          (click)="selectImage(image)">
          <img
            [src]="image.url"
            [alt]="itemName + ' view ' + image.sortOrder"
            class="thumbnail-image"
            loading="lazy">
        </button>
      </div>

      <!-- Image Counter -->
      <div class="image-counter" *ngIf="images.length > 1">
        {{ getSelectedImageIndex() + 1 }} of {{ images.length }}
      </div>
    </div>
  `,
  styles: [`
    .image-gallery {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .main-image-container {
      position: relative;
      width: 100%;
      max-width: 400px;
      aspect-ratio: 1;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .main-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.2s ease;
    }

    .main-image:hover {
      opacity: 0.95;
    }

    .thumbnails {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      max-width: 400px;
    }

    .thumbnail-button {
      border: 2px solid #e5e7eb;
      border-radius: 0.375rem;
      background: #f9fafb;
      cursor: pointer;
      transition: all 0.15s ease;
      padding: 2px;
      width: 60px;
      height: 60px;
      overflow: hidden;
    }

    .thumbnail-button:hover {
      border-color: #3b82f6;
    }

    .thumbnail-button.active {
      border-color: #3b82f6;
      background: #dbeafe;
    }

    .thumbnail-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 0.25rem;
    }

    .image-counter {
      text-align: center;
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      .main-image-container {
        max-width: 100%;
      }

      .thumbnails {
        justify-content: center;
        max-width: 100%;
      }

      .thumbnail-button {
        width: 50px;
        height: 50px;
      }
    }
  `]
})
export class ImageGalleryComponent implements OnInit, OnChanges {
  @Input() images: ItemImageDto[] = [];
  @Input() itemName: string = '';

  selectedImage: ItemImageDto = this.images[0];

  ngOnInit() {
    if (this.images.length > 0) {
      this.selectedImage = this.images.find(img => img.isPrimary) || this.images[0];
    }
  }

  ngOnChanges() {
    if (this.images.length > 0 && !this.selectedImage) {
      this.selectedImage = this.images.find(img => img.isPrimary) || this.images[0];
    }
  }

  selectImage(image: ItemImageDto) {
    this.selectedImage = image;
  }

  getSelectedImageIndex(): number {
    return this.images.findIndex(img => img.id === this.selectedImage.id);
  }
}