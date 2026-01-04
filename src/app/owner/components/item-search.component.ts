import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  template: `
    <div>
      <input
        type="text"
        [(ngModel)]="searchTerm"
        placeholder="Search items..."
        (input)="onSearch()"
      >
      <div *ngFor="let item of items">
        {{item.name}} - {{item.sku}}
      </div>
    </div>
  `
})
export class ItemSearchComponent {
  searchTerm = '';
  items: Item[] = [];

  onSearch() {
    // Search implementation would go here
  }
}