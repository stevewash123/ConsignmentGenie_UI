import { Component, inject, OnInit, signal, output, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { RecordSaleService } from '../../services/record-sale.service';

export interface Item {
  id: string;
  name: string;
  sku: string;
  price: number;
  consignorName: string;
  status: string;
}

@Component({
  selector: 'app-item-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-search.component.html',
  styles: [`
    .item-search-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .search-header {
      padding: 20px 20px 0 20px;
    }

    .search-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.4rem;
      font-weight: 600;
    }

    .search-section {
      padding: 20px;
    }

    .search-input-wrapper {
      position: relative;
      width: 100%;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #6c757d;
      font-size: 0.9rem;
    }

    .search-input {
      width: 100%;
      padding: 12px 12px 12px 40px;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .loading-state {
      padding: 20px;
      text-align: center;
      color: #6c757d;
      font-style: italic;
    }

    .items-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .section-title {
      padding: 0 20px 10px 20px;
      font-weight: 600;
      color: #495057;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .item-count {
      font-weight: normal;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .items-list {
      flex: 1;
      overflow-y: auto;
      padding: 0 20px 20px 20px;
    }

    .item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 8px;
      background: white;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .item-row:hover:not(.disabled) {
      border-color: #007bff;
      box-shadow: 0 2px 8px rgba(0,123,255,0.1);
      transform: translateY(-1px);
    }

    .item-row.disabled {
      background: #f8f9fa;
      border-color: #dee2e6;
      opacity: 0.6;
      cursor: not-allowed;
    }

    .item-info {
      flex: 1;
      min-width: 0;
    }

    .item-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
      word-break: break-word;
    }

    .item-details {
      display: flex;
      gap: 16px;
      font-size: 0.85rem;
      color: #6c757d;
    }

    .item-sku {
      font-family: monospace;
      font-weight: 500;
    }

    .item-consignor {
      font-style: italic;
    }

    .item-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .item-price {
      font-size: 1.1rem;
      font-weight: 700;
      color: #28a745;
      min-width: 70px;
      text-align: right;
    }

    .add-button {
      width: 36px;
      height: 36px;
      border: 2px solid #007bff;
      border-radius: 50%;
      background: white;
      color: #007bff;
      font-size: 1.2rem;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .add-button:hover:not(:disabled) {
      background: #007bff;
      color: white;
      transform: scale(1.05);
    }

    .add-button:disabled {
      border-color: #28a745;
      color: #28a745;
      cursor: not-allowed;
      transform: none;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6c757d;
    }

    .empty-state i {
      font-size: 3rem;
      margin-bottom: 20px;
      color: #adb5bd;
    }

    .empty-state p {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      color: #495057;
    }

    .empty-state small {
      color: #6c757d;
    }

    /* Scrollbar styling */
    .items-list::-webkit-scrollbar {
      width: 6px;
    }

    .items-list::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .items-list::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .items-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .item-details {
        flex-direction: column;
        gap: 4px;
      }

      .item-actions {
        flex-direction: column;
        gap: 8px;
      }

      .item-price {
        min-width: auto;
      }
    }
  `]
})
export class ItemSearchComponent implements OnInit {
  private recordSaleService = inject(RecordSaleService);

  // Inputs and outputs
  itemSelected = output<Item>();
  disabledItems = input<string[]>([]);

  // State signals
  allItems = signal<Item[]>([]);
  isLoading = signal<boolean>(false);
  searchQuery = '';

  // Search subject for debouncing
  private searchSubject = new Subject<string>();

  // Computed filtered items
  displayedItems = computed(() => {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      return this.allItems().slice(0, 20); // Show first 20 items when no search
    }

    return this.allItems().filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.consignorName.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.setupSearch();
    this.loadInitialItems();
  }

  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        if (!searchTerm.trim()) {
          return of([]); // Return empty for no search, loadInitialItems will handle initial load
        }
        this.isLoading.set(true);
        return this.recordSaleService.getAvailableItems(searchTerm);
      })
    ).subscribe({
      next: (items) => {
        if (this.searchQuery.trim()) {
          this.allItems.set(items);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Search failed:', err);
        this.isLoading.set(false);
      }
    });
  }

  private loadInitialItems() {
    this.isLoading.set(true);
    this.recordSaleService.getAvailableItems().subscribe({
      next: (items) => {
        this.allItems.set(items);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load items:', err);
        this.isLoading.set(false);
      }
    });
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.searchSubject.next(this.searchQuery);
  }

  selectItem(item: Item) {
    if (this.disabledItems().includes(item.id)) {
      return;
    }
    this.itemSelected.emit(item);
  }
}