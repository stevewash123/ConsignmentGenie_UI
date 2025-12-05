import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OwnerLayoutComponent } from './owner-layout.component';
import { InventoryService } from '../../services/inventory.service';
import { LoadingService } from '../../shared/services/loading.service';
import {
  ItemListDto,
  ItemQueryParams,
  PagedResult,
  ItemCondition,
  ItemStatus,
  CategoryDto,
  UpdateItemStatusRequest
} from '../../models/inventory.model';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, OwnerLayoutComponent],
  template: `
    <app-owner-layout>
      <div class="inventory-container">
      <!-- Header -->
      <div class="inventory-header">
        <h1>Inventory Management</h1>
        <button class="btn btn-primary" (click)="createNewItem()">
          <i class="fas fa-plus"></i> Add New Item
        </button>
      </div>

      <!-- Search and Filters -->
      <div class="filters-section">
        <div class="search-row">
          <div class="search-field">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (keyup.enter)="applyFilters()"
              placeholder="Search items by title, SKU, or description..."
              class="form-control">
            <button class="btn btn-outline-primary" (click)="applyFilters()">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>

        <div class="filter-row">
          <select [(ngModel)]="selectedStatus" (change)="applyFilters()" class="form-select">
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Sold">Sold</option>
            <option value="Removed">Removed</option>
          </select>

          <select [(ngModel)]="selectedCondition" (change)="applyFilters()" class="form-select">
            <option value="">All Conditions</option>
            <option value="New">New</option>
            <option value="LikeNew">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>

          <select [(ngModel)]="selectedCategory" (change)="applyFilters()" class="form-select">
            <option value="">All Categories</option>
            @for (category of categories(); track category.id) {
              <option [value]="category.name">{{ category.name }}</option>
            }
          </select>

          <input
            type="number"
            [(ngModel)]="priceMin"
            (change)="applyFilters()"
            placeholder="Min Price"
            class="form-control price-input">

          <input
            type="number"
            [(ngModel)]="priceMax"
            (change)="applyFilters()"
            placeholder="Max Price"
            class="form-control price-input">

          <button class="btn btn-outline-secondary" (click)="clearFilters()">
            <i class="fas fa-times"></i> Clear
          </button>
        </div>

        <div class="sort-row">
          <label>Sort by:</label>
          <select [(ngModel)]="sortBy" (change)="applyFilters()" class="form-select">
            <option value="CreatedAt">Date Created</option>
            <option value="Title">Title</option>
            <option value="Price">Price</option>
            <option value="Sku">SKU</option>
            <option value="Status">Status</option>
          </select>

          <select [(ngModel)]="sortDirection" (change)="applyFilters()" class="form-select">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <!-- Results Summary and View Toggle -->
      <div class="results-summary">
        <span>Showing {{ itemsResult()?.items.length || 0 }} of {{ itemsResult()?.totalCount || 0 }} items</span>
        <div class="view-controls">
          <div class="view-toggle">
            <button class="btn btn-sm" [class.btn-primary]="viewMode === 'table'" [class.btn-outline-primary]="viewMode !== 'table'" (click)="setViewMode('table')">
              <i class="fas fa-table"></i> Table
            </button>
            <button class="btn btn-sm" [class.btn-primary]="viewMode === 'cards'" [class.btn-outline-primary]="viewMode !== 'cards'" (click)="setViewMode('cards')">
              <i class="fas fa-th-large"></i> Cards
            </button>
          </div>
          <div class="page-size-selector">
            <label>Items per page:</label>
            <select [(ngModel)]="pageSize" (change)="changePageSize()" class="form-select">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (isInventoryLoading()) {
        <div class="loading-state">
          <i class="fas fa-spinner fa-spin"></i> Loading inventory...
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i>
          {{ error() }}
          <button class="btn btn-sm btn-outline-danger" (click)="loadItems()">Retry</button>
        </div>
      }

      <!-- Items Table -->
      @if (!isInventoryLoading() && !error() && itemsResult() && viewMode === 'table') {
        <div class="items-table-container">
          <table class="table table-striped table-hover">
            <thead>
              <tr>
                <th>Image</th>
                <th>SKU</th>
                <th>Title</th>
                <th>Category</th>
                <th>Condition</th>
                <th>Price</th>
                <th>Status</th>
                <th>Source</th>
                <th>consignor</th>
                <th>Received</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of itemsResult()!.items; track item.itemId) {
                <tr>
                  <td class="image-cell">
                    @if (item.primaryImageUrl) {
                      <img [src]="item.primaryImageUrl" [alt]="item.title" class="item-thumbnail">
                    } @else {
                      <div class="no-image">
                        <i class="fas fa-image"></i>
                      </div>
                    }
                  </td>
                  <td class="sku-cell">{{ item.sku }}</td>
                  <td class="title-cell">
                    <div class="item-title">{{ item.title }}</div>
                    @if (item.description) {
                      <div class="item-description">{{ item.description | slice:0:50 }}...</div>
                    }
                  </td>
                  <td>{{ item.category }}</td>
                  <td>
                    <span class="badge" [class]="getConditionClass(item.condition)">
                      {{ getConditionLabel(item.condition) }}
                    </span>
                  </td>
                  <td class="price-cell">{{ item.price | currency }}</td>
                  <td>
                    <span class="badge" [class]="getStatusClass(item.status)">
                      {{ item.status }}
                    </span>
                  </td>
                  <td>
                    <span class="badge badge-info">
                      Manual
                    </span>
                  </td>
                  <td>{{ item.consignorName }}</td>
                  <td>{{ item.receivedDate | date:'short' }}</td>
                  <td class="actions-cell">
                    <div class="btn-group">
                      <button class="btn btn-sm btn-outline-primary" (click)="viewItem(item.itemId)">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-secondary" (click)="editItem(item.itemId)">
                        <i class="fas fa-edit"></i>
                      </button>
                      @if (item.status === 'Available') {
                        <button class="btn btn-sm btn-outline-warning" (click)="markAsRemoved(item)">
                          <i class="fas fa-archive"></i>
                        </button>
                      }
                      <button class="btn btn-sm btn-outline-danger" (click)="deleteItem(item)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="11" class="no-results">
                    <div class="empty-state">
                      <i class="fas fa-box-open fa-3x"></i>
                      <h3>No items found</h3>
                      <p>Try adjusting your search criteria or add new items to your inventory.</p>
                      <button class="btn btn-primary" (click)="createNewItem()">
                        <i class="fas fa-plus"></i> Add Your First Item
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Items Cards -->
      @if (!isInventoryLoading() && !error() && itemsResult() && viewMode === 'cards') {
        <div class="items-cards-container">
          @for (item of itemsResult()!.items; track item.itemId) {
            <div class="item-card">
              <div class="card-image">
                @if (item.primaryImageUrl) {
                  <img [src]="item.primaryImageUrl" [alt]="item.title" class="card-thumbnail">
                } @else {
                  <div class="no-image-large">
                    <i class="fas fa-image"></i>
                  </div>
                }
              </div>
              <div class="card-content">
                <div class="card-header">
                  <h3 class="card-title">{{ item.title }}</h3>
                  <span class="card-price">{{ item.price | currency }}</span>
                </div>
                <div class="card-details">
                  <p class="card-sku">SKU: {{ item.sku }}</p>
                  <p class="card-category">{{ item.category }}</p>
                  <div class="card-badges">
                    <span class="badge" [class]="getConditionClass(item.condition)">
                      {{ getConditionLabel(item.condition) }}
                    </span>
                    <span class="badge" [class]="getStatusClass(item.status)">
                      {{ item.status }}
                    </span>
                    <span class="badge badge-info">Manual</span>
                  </div>
                  <p class="card-consignor">{{ item.consignorName }}</p>
                  <p class="card-received">Received: {{ item.receivedDate | date:'short' }}</p>
                </div>
                <div class="card-actions">
                  <button class="btn btn-sm btn-outline-primary" (click)="viewItem(item.itemId)">
                    <i class="fas fa-eye"></i> View
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" (click)="editItem(item.itemId)">
                    <i class="fas fa-edit"></i> Edit
                  </button>
                  @if (item.status === 'Available') {
                    <button class="btn btn-sm btn-outline-warning" (click)="markAsRemoved(item)">
                      <i class="fas fa-archive"></i>
                    </button>
                  }
                  <button class="btn btn-sm btn-outline-danger" (click)="deleteItem(item)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <i class="fas fa-box-open fa-3x"></i>
              <h3>No items found</h3>
              <p>Try adjusting your search criteria or add new items to your inventory.</p>
              <button class="btn btn-primary" (click)="createNewItem()">
                <i class="fas fa-plus"></i> Add Your First Item
              </button>
            </div>
          }
        </div>
      }

      @if (!isInventoryLoading() && !error() && itemsResult()) {
        <!-- Pagination -->
        @if (itemsResult()!.totalPages > 1) {
          <nav class="pagination-nav">
            <ul class="pagination">
              <li class="page-item" [class.disabled]="!itemsResult()!.hasPreviousPage">
                <button class="page-link" (click)="goToPage(currentPage() - 1)">Previous</button>
              </li>

              @for (pageNum of visiblePages(); track pageNum) {
                <li class="page-item" [class.active]="pageNum === currentPage()">
                  <button class="page-link" (click)="goToPage(pageNum)">{{ pageNum }}</button>
                </li>
              }

              <li class="page-item" [class.disabled]="!itemsResult()!.hasNextPage">
                <button class="page-link" (click)="goToPage(currentPage() + 1)">Next</button>
              </li>
            </ul>

            <div class="pagination-info">
              Page {{ currentPage() }} of {{ itemsResult()!.totalPages }}
            </div>
          </nav>
        }
      }
      </div>
    </app-owner-layout>
  `,
  styles: [`
    .inventory-container {
      padding: 20px;
    }

    .inventory-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .inventory-header h1 {
      margin: 0;
      color: #333;
    }

    /* Search and Filters */
    .filters-section {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .search-row {
      margin-bottom: 15px;
    }

    .search-field {
      display: flex;
      gap: 10px;
      max-width: 500px;
    }

    .filter-row {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 15px;
    }

    .sort-row {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .price-input {
      max-width: 120px;
    }

    /* Results and View Controls */
    .results-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 10px 0;
    }

    .view-controls {
      display: flex;
      gap: 20px;
      align-items: center;
    }

    .view-toggle {
      display: flex;
      gap: 5px;
    }

    .page-size-selector {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .page-size-selector label {
      margin: 0;
      white-space: nowrap;
    }

    /* Cards Layout */
    .items-cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .item-card {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: box-shadow 0.3s ease, transform 0.2s ease;
      cursor: pointer;
    }

    .item-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    .card-image {
      height: 200px;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .card-thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image-large {
      color: #6c757d;
      font-size: 3rem;
    }

    .card-content {
      padding: 16px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .card-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      line-height: 1.3;
      flex: 1;
      margin-right: 10px;
    }

    .card-price {
      font-size: 1.2rem;
      font-weight: 700;
      color: #28a745;
    }

    .card-details {
      margin-bottom: 15px;
    }

    .card-sku {
      margin: 0 0 4px 0;
      font-size: 0.9rem;
      color: #6c757d;
    }

    .card-category {
      margin: 0 0 8px 0;
      font-size: 0.9rem;
      color: #495057;
    }

    .card-badges {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .card-consignor {
      margin: 0 0 4px 0;
      font-size: 0.9rem;
      color: #495057;
      font-weight: 500;
    }

    .card-received {
      margin: 0;
      font-size: 0.85rem;
      color: #6c757d;
    }

    .card-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .card-actions .btn {
      flex: 1;
      min-width: 70px;
    }

    /* Table Layout */
    .items-table-container {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .table {
      margin: 0;
    }

    .image-cell {
      width: 60px;
      padding: 8px;
    }

    .item-thumbnail {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 4px;
    }

    .no-image {
      width: 50px;
      height: 50px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6c757d;
    }

    .sku-cell {
      font-family: monospace;
      font-size: 0.9rem;
    }

    .title-cell {
      max-width: 200px;
    }

    .item-title {
      font-weight: 500;
      margin-bottom: 2px;
    }

    .item-description {
      font-size: 0.85rem;
      color: #6c757d;
    }

    .price-cell {
      font-weight: 600;
      color: #28a745;
    }

    .actions-cell {
      width: 200px;
    }

    /* Status and Condition Badges */
    .badge {
      font-size: 0.75rem;
      padding: 4px 8px;
    }

    .badge-success { background-color: #28a745; }
    .badge-warning { background-color: #ffc107; color: #212529; }
    .badge-danger { background-color: #dc3545; }
    .badge-info { background-color: #17a2b8; }
    .badge-secondary { background-color: #6c757d; }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6c757d;
    }

    .empty-state h3 {
      margin: 20px 0 10px 0;
      color: #495057;
    }

    .empty-state p {
      margin-bottom: 30px;
    }

    /* Pagination */
    .pagination-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 30px;
    }

    .pagination {
      margin: 0;
    }

    .pagination-info {
      color: #6c757d;
      font-size: 0.9rem;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 40px;
      color: #6c757d;
    }

    .loading-state i {
      margin-right: 8px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .inventory-container {
        padding: 15px;
      }

      .inventory-header {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .results-summary {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }

      .view-controls {
        justify-content: center;
        flex-wrap: wrap;
      }

      .items-cards-container {
        grid-template-columns: 1fr;
        gap: 15px;
      }

      .card-actions {
        justify-content: center;
      }

      .table-responsive {
        font-size: 0.85rem;
      }

      .pagination-nav {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }
    }

    @media (max-width: 576px) {
      .card-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .card-price {
        margin-top: 8px;
      }

      .card-actions .btn {
        font-size: 0.8rem;
        padding: 4px 8px;
      }
    }

    .inventory-header h1 {
      margin: 0;
      color: #495057;
    }

    .filters-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .search-row {
      margin-bottom: 15px;
    }

    .search-field {
      display: flex;
      gap: 10px;
      max-width: 500px;
    }

    .filter-row, .sort-row {
      display: flex;
      gap: 15px;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .price-input {
      max-width: 120px;
    }

    .form-select, .form-control {
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
    }

    .results-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 10px 0;
    }

    .view-controls {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .view-toggle {
      display: flex;
      gap: 5px;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .loading-state {
      text-align: center;
      padding: 40px;
      font-size: 18px;
      color: #6c757d;
    }

    .items-table-container {
      overflow-x: auto;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      border-radius: 8px;
    }

    .table {
      margin: 0;
      background: white;
    }

    .image-cell {
      width: 60px;
      text-align: center;
    }

    .item-thumbnail {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
    }

    .no-image {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e9ecef;
      border-radius: 4px;
      color: #6c757d;
    }

    .sku-cell {
      font-family: monospace;
      font-weight: bold;
      width: 120px;
    }

    .title-cell {
      max-width: 200px;
    }

    .item-title {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .item-description {
      font-size: 12px;
      color: #6c757d;
    }

    .price-cell {
      font-weight: 600;
      color: #28a745;
    }

    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .badge.condition-new { background: #d4edda; color: #155724; }
    .badge.condition-like-new { background: #cce5ff; color: #004085; }
    .badge.condition-good { background: #fff3cd; color: #856404; }
    .badge.condition-fair { background: #f8d7da; color: #721c24; }
    .badge.condition-poor { background: #f5c6cb; color: #491217; }

    .badge.status-available { background: #d4edda; color: #155724; }
    .badge.status-sold { background: #ffeaa7; color: #2d3748; }
    .badge.status-removed { background: #f8d7da; color: #721c24; }
    .badge.badge-info { background: #17a2b8; color: white; }

    .actions-cell {
      width: 150px;
    }

    .btn-group {
      display: flex;
      gap: 5px;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #6c757d;
    }

    .empty-state i {
      color: #adb5bd;
      margin-bottom: 20px;
    }

    .pagination-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 30px;
    }

    .pagination {
      display: flex;
      list-style: none;
      padding: 0;
      margin: 0;
      gap: 5px;
    }

    .page-item.disabled .page-link {
      color: #6c757d;
      pointer-events: none;
      background-color: #fff;
      border-color: #dee2e6;
    }

    .page-item.active .page-link {
      background-color: #007bff;
      border-color: #007bff;
      color: white;
    }

    .page-link {
      padding: 8px 12px;
      border: 1px solid #dee2e6;
      background: white;
      color: #007bff;
      text-decoration: none;
      cursor: pointer;
      border-radius: 4px;
    }

    .page-link:hover:not(.disabled) {
      background-color: #e9ecef;
    }

    .pagination-info {
      color: #6c757d;
      font-size: 14px;
    }

    .alert {
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .alert-danger {
      background-color: #f8d7da;
      border-color: #f5c6cb;
      color: #721c24;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-outline-primary {
      border: 1px solid #007bff;
      color: #007bff;
      background: white;
    }

    .btn-outline-secondary {
      border: 1px solid #6c757d;
      color: #6c757d;
      background: white;
    }

    .btn-outline-warning {
      border: 1px solid #ffc107;
      color: #856404;
      background: white;
    }

    .btn-outline-danger {
      border: 1px solid #dc3545;
      color: #dc3545;
      background: white;
    }

    .btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
  `]
})
export class InventoryListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  // State signals
  itemsResult = signal<PagedResult<ItemListDto> | null>(null);
  categories = signal<CategoryDto[]>([]);
  error = signal<string | null>(null);

  isInventoryLoading(): boolean {
    return this.loadingService.isLoading('inventory-list');
  }

  // Filter state
  searchQuery = '';
  selectedStatus = '';
  selectedCondition = '';
  selectedCategory = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  sortBy = 'CreatedAt';
  sortDirection = 'desc';
  currentPage = signal(1);
  pageSize = 25;

  // View state
  viewMode: 'table' | 'cards' = 'table';

  // Computed values
  visiblePages = computed(() => {
    const result = this.itemsResult();
    if (!result) return [];

    const current = this.currentPage();
    const total = result.totalPages;
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  });

  ngOnInit() {
    this.loadCategories();
    this.loadItems();
  }

  private loadCategories() {
    this.inventoryService.getCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories.set(response.data);
        }
      },
      error: (err) => console.error('Failed to load categories:', err)
    });
  }

  loadItems() {
    this.loadingService.start('inventory-list');
    this.error.set(null);

    const params: ItemQueryParams = {
      page: this.currentPage(),
      pageSize: this.pageSize,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedCondition) params.condition = this.selectedCondition;
    if (this.selectedCategory) params.category = this.selectedCategory;
    if (this.priceMin !== null) params.priceMin = this.priceMin;
    if (this.priceMax !== null) params.priceMax = this.priceMax;

    this.inventoryService.getItems(params).subscribe({
      next: (result) => {
        this.itemsResult.set(result);
      },
      error: (err) => {
        this.error.set('Failed to load inventory items. Please try again.');
        console.error('Error loading items:', err);
      },
      complete: () => {
        this.loadingService.stop('inventory-list');
      }
    });
  }

  applyFilters() {
    this.currentPage.set(1);
    this.loadItems();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedCondition = '';
    this.selectedCategory = '';
    this.priceMin = null;
    this.priceMax = null;
    this.sortBy = 'CreatedAt';
    this.sortDirection = 'desc';
    this.applyFilters();
  }

  changePageSize() {
    this.currentPage.set(1);
    this.loadItems();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadItems();
  }

  createNewItem() {
    this.router.navigate(['/owner/inventory/new']);
  }

  viewItem(id: string) {
    this.router.navigate(['/owner/inventory', id]);
  }

  editItem(id: string) {
    this.router.navigate(['/owner/inventory', id, 'edit']);
  }

  markAsRemoved(item: ItemListDto) {
    if (confirm(`Mark "${item.title}" as removed?`)) {
      const request: UpdateItemStatusRequest = {
        status: 'Removed',
        reason: 'Marked as removed from inventory list'
      };

      this.inventoryService.updateItemStatus(item.itemId, request).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadItems(); // Refresh the list
          }
        },
        error: (err) => {
          this.error.set('Failed to update item status.');
          console.error('Error updating item status:', err);
        }
      });
    }
  }

  deleteItem(item: ItemListDto) {
    if (confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
      this.inventoryService.deleteItem(item.itemId).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadItems(); // Refresh the list
          }
        },
        error: (err) => {
          this.error.set('Failed to delete item.');
          console.error('Error deleting item:', err);
        }
      });
    }
  }

  getConditionClass(condition: ItemCondition): string {
    return `condition-${condition.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()}`;
  }

  getConditionLabel(condition: ItemCondition): string {
    switch (condition) {
      case ItemCondition.LikeNew: return 'Like New';
      default: return condition;
    }
  }

  getStatusClass(status: ItemStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  setViewMode(mode: 'table' | 'cards') {
    this.viewMode = mode;
  }
}