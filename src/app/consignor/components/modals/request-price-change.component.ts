import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MockConsignorItemService,
  ConsignorItemDetailDto,
  CreatePriceChangeRequestDto
} from '../../services/mock-consignor-item.service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-request-price-change',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './request-price-change.component.html',
  styleUrls: ['./request-price-change.component.scss']
})
export class RequestPriceChangeComponent implements OnInit {
  @Input() item!: ConsignorItemDetailDto;
  @Input() show: boolean = false;
  @Output() closed = new EventEmitter<any>();

  requestedPrice: number = 0;
  reason: string = '';
  loading: boolean = false;
  error: string | null = null;

  private priceChangeSubject = new Subject<number>();

  constructor(
    private itemService: MockConsignorItemService
  ) {}

  ngOnInit() {
    // Pre-populate with current price
    this.requestedPrice = this.item.listedPrice;

    // Debounce price input for earnings calculation
    this.priceChangeSubject.pipe(
      debounceTime(300)
    ).subscribe(price => {
      this.requestedPrice = price;
    });
  }

  onPriceChange(event: any) {
    const value = parseFloat(event.target.value) || 0;
    this.priceChangeSubject.next(value);
  }

  get newEarnings(): number {
    return this.requestedPrice * (this.item.splitPercentage / 100);
  }

  get earningsChange(): number {
    return this.newEarnings - this.item.consignorEarnings;
  }

  get isEarningsIncrease(): boolean {
    return this.earningsChange > 0;
  }

  get isEarningsDecrease(): boolean {
    return this.earningsChange < 0;
  }

  get isPriceValid(): boolean {
    return this.requestedPrice > 0 && this.requestedPrice !== this.item.listedPrice;
  }

  get isSubmitDisabled(): boolean {
    return !this.isPriceValid || this.loading;
  }

  get characterCount(): number {
    return this.reason.length;
  }

  get maxCharacters(): number {
    return 500;
  }

  onCancel(): void {
    this.closed.emit(null);
  }

  onSubmit(): void {
    if (this.isSubmitDisabled) return;

    this.loading = true;
    this.error = null;

    const request: CreatePriceChangeRequestDto = {
      currentPrice: this.item.listedPrice,
      requestedPrice: this.requestedPrice,
      reason: this.reason.trim() || undefined
    };

    this.itemService.requestPriceChange(this.item.id, request).subscribe({
      next: (response) => {
        this.loading = false;
        this.closed.emit(response);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to submit price change request. Please try again.';
        console.error('Price change request error:', err);
      }
    });
  }
}