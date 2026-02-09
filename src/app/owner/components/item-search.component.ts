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
  category: string;
}

@Component({
  selector: 'app-item-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-search.component.html',
  styleUrls: ['./item-search.component.scss']
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
  selectedCategory = '';

  // Search subject for debouncing
  private searchSubject = new Subject<string>();

  // Computed values
  availableCategories = computed(() => {
    const categories = this.allItems().map(item => item.category).filter(Boolean);
    return [...new Set(categories)].sort();
  });

  // Computed filtered items
  displayedItems = computed(() => {
    const query = this.searchQuery.toLowerCase().trim();
    const category = this.selectedCategory;

    let filtered = this.allItems();

    // Filter by category first
    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }

    // Then filter by search query
    if (query) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.consignorName.toLowerCase().includes(query)
      );
    } else if (!category) {
      filtered = filtered.slice(0, 20); // Show first 20 items when no filters
    }

    return filtered;
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

  onCategoryChange(category: string) {
    this.selectedCategory = category;
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
  }

  selectItem(item: Item) {
    if (this.disabledItems().includes(item.id)) {
      return;
    }
    this.itemSelected.emit(item);
  }
}