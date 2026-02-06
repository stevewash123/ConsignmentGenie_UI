import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsignorPortalService } from '../../services/consignor-portal.service';

export interface ActivatedItemDto {
  id: string;
  title: string;
  price: number;
  thumbnailUrl?: string;
  status: string;
  activatedAt: Date;
}

@Component({
  selector: 'app-activated-items-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activated-items-modal.component.html',
  styleUrls: ['./activated-items-modal.component.scss']
})
export class ActivatedItemsModalComponent implements OnInit, OnChanges {
  @Input() notificationId: string | null = null;
  @Input() isVisible = false;
  @Output() closed = new EventEmitter<void>();

  activatedItems: ActivatedItemDto[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private consignorService: ConsignorPortalService) {}

  ngOnInit() {
    if (this.isVisible && this.notificationId) {
      this.loadActivatedItems();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isVisible'] && this.isVisible && this.notificationId) {
      this.loadActivatedItems();
    }
  }

  close() {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  loadActivatedItems() {
    if (!this.notificationId) return;

    this.isLoading = true;
    this.error = null;

    this.consignorService.getActivatedItems(this.notificationId).subscribe({
      next: (items) => {
        this.activatedItems = items;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load activated items';
        this.isLoading = false;
        console.error('Error loading activated items:', error);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}