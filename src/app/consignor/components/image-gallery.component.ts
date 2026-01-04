import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemImageDto } from '../services/mock-consignor-item.service';

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.scss']
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