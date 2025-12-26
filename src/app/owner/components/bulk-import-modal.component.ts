import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportedItem } from './inventory-list.component';

export interface ImportRow {
  rowNumber: number;
  data: any;
  isValid: boolean;
  errors: string[];
  originalCsv: string;
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: string[];
}

@Component({
  selector: 'app-bulk-import-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-import-modal.component.html',
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 1200px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      padding: 2rem 2rem 1rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0.5rem;
      border-radius: 6px;
    }

    .close-button:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 2rem;
      overflow-y: auto;
      max-height: calc(90vh - 140px);
    }

    .upload-section {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 3rem 2rem;
      text-align: center;
      margin-bottom: 2rem;
      transition: all 0.2s ease;
    }

    .upload-section.dragover {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .upload-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #6b7280;
    }

    .upload-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .upload-description {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    .upload-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      font-size: 0.875rem;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover {
      background: #4b5563;
    }

    .file-input {
      display: none;
    }

    .preview-section {
      margin-top: 2rem;
    }

    .summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .summary-label {
      color: #64748b;
    }

    .summary-value {
      font-weight: 600;
    }

    .valid-count {
      color: #059669;
    }

    .error-count {
      color: #dc2626;
    }

    .preview-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .preview-table th {
      background: #f9fafb;
      padding: 0.75rem;
      font-weight: 600;
      color: #374151;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .preview-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .status-cell {
      width: 60px;
      text-align: center;
    }

    .status-valid {
      color: #059669;
      font-size: 1.25rem;
    }

    .status-error {
      color: #dc2626;
      font-size: 1.25rem;
    }

    .error-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .error-item {
      color: #dc2626;
      font-size: 0.75rem;
      background: #fef2f2;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.25rem;
    }

    /* Compact table styles */
    .compact-header {
      font-size: 0.85rem;
      padding: 0.5rem;
    }

    .compact-cell {
      padding: 0.5rem;
      font-size: 0.85rem;
    }

    .compact-icon {
      font-size: 1rem;
    }

    /* Row highlighting */
    .row-valid {
      background-color: #ffffff;
    }

    .row-error {
      background-color: #fef2f2;
    }

    /* Pagination styles */
    .pagination-info {
      margin-bottom: 1rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .table-container {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 1rem;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
    }

    .page-info {
      color: #6b7280;
      font-size: 0.875rem;
      min-width: 120px;
      text-align: center;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      border-radius: 0.375rem;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      cursor: pointer;
    }

    .btn-sm:hover:not(:disabled) {
      background: #f9fafb;
    }

    .btn-sm:disabled {
      background: #f9fafb;
      color: #9ca3af;
      cursor: not-allowed;
    }

    .modal-footer {
      padding: 1rem 2rem 2rem;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .footer-left {
      display: flex;
      gap: 1rem;
    }

    .footer-right {
      display: flex;
      gap: 1rem;
    }

    .btn-success {
      background: #059669;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #047857;
    }

    .btn-success:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .modal-content {
        margin: 1rem;
        max-width: calc(100vw - 2rem);
      }

      .modal-header {
        padding: 1rem;
      }

      .modal-body {
        padding: 1rem;
      }

      .upload-section {
        padding: 2rem 1rem;
      }

      .upload-buttons {
        flex-direction: column;
        align-items: center;
      }

      .modal-footer {
        flex-direction: column;
        padding: 1rem;
      }

      .footer-left,
      .footer-right {
        justify-content: center;
      }
    }
  `]
})
export class BulkImportModalComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() itemsImported = new EventEmitter<ImportedItem[]>();

  // State
  selectedFile = signal<File | null>(null);
  importData = signal<ImportRow[]>([]);
  summary = signal<ImportSummary | null>(null);
  isProcessing = signal(false);
  isDragOver = signal(false);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(25);

  // Sample template data
  private sampleCsvData = `Name,Description,SKU,Price,ConsignorNumber,Category,Condition,ReceivedDate,Location,Notes
Blue Denim Jacket,Vintage 90s style,,45.00,472HK3,Clothing,Good,2025-01-15,Rack A,
Gold Hoop Earrings,14k gold plated,,28.00,891TM2,Jewelry,New,2025-01-16,,Gift boxed
Leather Messenger Bag,Brown leather with brass buckles,,125.00,472HK3,Accessories,LikeNew,2025-01-14,Shelf B2,Minor scratch on back`;

  close() {
    this.closeModal.emit();
    this.reset();
  }

  reset() {
    this.selectedFile.set(null);
    this.importData.set([]);
    this.summary.set(null);
    this.isProcessing.set(false);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file.');
      return;
    }

    this.selectedFile.set(file);
    this.processCsv(file);
  }

  private processCsv(file: File) {
    this.isProcessing.set(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      this.parseCsv(csvText);
      this.isProcessing.set(false);
    };
    reader.readAsText(file);
  }

  private parseCsv(csvText: string) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      alert('CSV file must contain at least a header row and one data row.');
      return;
    }

    const headers = this.parseCsvRow(lines[0]);
    const rows: ImportRow[] = [];
    let validCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvRow(lines[i]);
      if (values.length === 0) continue;

      const rowData: any = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index] || '';
      });

      const validation = this.validateRow(rowData, i + 1);
      const row: ImportRow = {
        rowNumber: i,
        data: rowData,
        isValid: validation.isValid,
        errors: validation.errors,
        originalCsv: lines[i]
      };

      rows.push(row);
      if (row.isValid) validCount++;
      else errorCount++;
    }

    this.importData.set(rows);
    this.summary.set({
      totalRows: rows.length,
      validRows: validCount,
      errorRows: errorCount,
      errors: []
    });
  }

  private parseCsvRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (row[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private validateRow(data: any, rowNumber: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!data.name || data.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!data.price || data.price.trim() === '') {
      errors.push('Price is required');
    } else {
      const price = parseFloat(data.price);
      if (isNaN(price) || price <= 0) {
        errors.push('Price must be a positive number');
      }
    }

    if (!data.ConsignorNumber || data.ConsignorNumber.trim() === '') {
      errors.push('ConsignorNumber is required');
    } else {
      // Pattern: NNNLLN (3 digits, 2 letters, 1 number)
      const pattern = /^\d{3}[A-Z]{2}\d$/;
      if (!pattern.test(data.ConsignorNumber.toUpperCase())) {
        errors.push('ConsignorNumber must be format NNNLLN (e.g., 472HK3)');
      }
    }

    // Optional but validated if present
    if (data.condition && data.condition.trim() !== '') {
      const validConditions = ['New', 'LikeNew', 'Good', 'Fair', 'Poor'];
      if (!validConditions.includes(data.condition)) {
        errors.push('Condition must be: New, LikeNew, Good, Fair, or Poor');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  downloadTemplate() {
    const blob = new Blob([this.sampleCsvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  downloadErrorReport() {
    const errorRows = this.importData().filter(row => !row.isValid);
    if (errorRows.length === 0) return;

    let csvContent = 'RowNumber,OriginalData,Errors\n';
    errorRows.forEach(row => {
      const errors = row.errors.join('; ');
      csvContent += `${row.rowNumber},"${row.originalCsv}","${errors}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  importValidItems() {
    const validRows = this.importData().filter(row => row.isValid);
    const items = validRows.map(row => row.data);

    // Emit the valid items for mock import
    this.itemsImported.emit(items);

    alert(`Successfully imported ${items.length} items!`);
    this.close();
  }

  hasValidItems(): boolean {
    return this.summary()?.validRows > 0;
  }

  trackByRowNumber(index: number, row: ImportRow): number {
    return row.rowNumber;
  }

  // Pagination methods
  paginatedData() {
    const data = this.importData();
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / this.pageSize());
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = Math.min(startIndex + this.pageSize(), totalItems);
    const items = data.slice(startIndex, endIndex);

    return {
      items,
      totalItems,
      totalPages,
      startIndex,
      endIndex
    };
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage() {
    const totalPages = this.paginatedData().totalPages;
    if (this.currentPage() < totalPages) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }
}