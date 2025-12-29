import { Component, EventEmitter, Input, Output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, catchError, of } from 'rxjs';
import { ImportedItem } from './inventory-list.component';
import { InventoryService } from '../../services/inventory.service';
import { ConsignorService } from '../../services/consignor.service';
import { CreateItemRequest, ItemCondition } from '../../models/inventory.model';
import { Consignor } from '../../models/consignor.model';
import { BulkImportResultsModalComponent, BulkImportResult } from './bulk-import-results-modal.component';
import { environment } from '../../../environments/environment';

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
  imports: [CommonModule, FormsModule, BulkImportResultsModalComponent],
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
      max-height: 95vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      padding: 2rem 2rem 1rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
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
      flex: 1;
      min-height: 0;
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

    /* Selective row height: only edited row gets taller */
    .preview-table tbody tr {
      transition: height 0.2s ease, background-color 0.2s ease;
    }

    /* Non-editing rows stay compact */
    .preview-table tbody tr:not(.editing) {
      height: 3rem;
    }

    /* Editing row gets taller to accommodate inputs */
    .preview-table tbody tr.editing {
      height: auto;
      min-height: 4rem;
    }

    /* Compact table styles */
    .compact-header {
      font-size: 0.85rem;
      padding: 0.5rem;
    }

    .compact-cell {
      vertical-align: top;
      padding: 0.375rem 0.5rem;
      font-size: 0.85rem;
      box-sizing: border-box;
    }

    /* Compact cells in non-editing rows */
    tr:not(.editing) .compact-cell {
      height: 3rem;
      overflow: hidden;
    }

    /* Cells in editing rows can expand */
    tr.editing .compact-cell {
      height: auto;
      min-height: 3rem;
    }

    .compact-icon {
      font-size: 1rem;
    }

    /* Edit inputs with comfortable sizing */
    .edit-input,
    .edit-select {
      width: 100%;
      height: 2.5rem;
      padding: 0.375rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      background-color: white;
      box-sizing: border-box;
      margin: 0;
    }

    /* Error lists with proper spacing in compact rows */
    .error-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    /* Error items in non-editing rows stay compact */
    tr:not(.editing) .error-list {
      max-height: 2.25rem;
      overflow-y: auto;
    }

    .error-item {
      color: #dc2626;
      font-size: 0.75rem;
      background: #fef2f2;
      padding: 0.125rem 0.25rem;
      border-radius: 2px;
      margin-bottom: 0.125rem;
      line-height: 1.2;
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
      flex-shrink: 0;
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

    /* Duplicate Warning Styles */
    .duplicate-warning {
      display: flex;
      align-items: flex-start;
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      gap: 0.75rem;
    }

    .warning-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .warning-content {
      flex: 1;
    }

    .warning-title {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 0.5rem;
    }

    .warning-text {
      color: #78350f;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
      line-height: 1.4;
    }

    /* Default Consignor Section */
    .default-consignor-section {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .default-consignor-header {
      margin-bottom: 0.75rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }

    .section-description {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
      line-height: 1.4;
    }

    .default-consignor-controls {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .consignor-selector {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .select-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      white-space: nowrap;
    }

    .consignor-dropdown {
      width: 280px;
      padding: 0.375rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background-color: white;
      font-size: 0.875rem;
      color: #374151;
    }

    .consignor-dropdown:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    /* Radio Group Styles */
    .radio-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .radio-label {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .radio-options {
      display: flex;
      gap: 1rem;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
    }

    .radio-option input[type="radio"] {
      margin: 0;
    }

    .radio-group.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .radio-group.disabled .radio-option {
      color: #9ca3af;
    }

    /* Fixed Summary Footer Styles */
    .fixed-summary-footer {
      background-color: #f8fafc;
      border-top: 2px solid #e2e8f0;
      padding: 0.75rem;
      margin-top: 0.5rem;
      border-radius: 0 0 8px 8px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .summary-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .summary-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
    }

    .summary-value.valid-count {
      color: #059669;
    }

    .summary-value.error-count {
      color: #dc2626;
    }

    .summary-value.import-count {
      color: #2563eb;
    }

    /* Default Consignor Indicators */
    .default-consignor {
      background-color: #eff6ff;
      position: relative;
    }

    .default-indicator {
      color: #2563eb;
      font-weight: bold;
      margin-left: 0.25rem;
    }

    /* In-Grid Editing Styles */
    .actions-header {
      width: 100px;
    }

    .actions-cell {
      padding: 0.25rem 0.5rem !important;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
    }

    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 3px;
      font-size: 0.75rem;
      line-height: 1;
    }

    .action-btn:hover {
      background-color: #f3f4f6;
    }

    .edit-btn:hover {
      background-color: #eff6ff;
    }

    .delete-btn:hover {
      background-color: #fef2f2;
    }

    .save-btn:hover {
      background-color: #f0f9f0;
    }

    .cancel-btn:hover {
      background-color: #fef2f2;
    }

    .editable-cell {
      position: relative;
      min-width: 120px;
    }

    .editing {
      background-color: #fefce8 !important;
    }

    /* Fix grid jumpiness with absolute heights */
    .preview-table tbody tr {
      height: 3rem !important;
      transition: background-color 0.2s ease;
    }

    .compact-cell {
      vertical-align: top;
      height: 3rem;
      padding: 0.375rem 0.5rem;
      box-sizing: border-box;
      overflow: hidden;
    }

    .editable-cell {
      height: 3rem;
    }

    /* Edit inputs sized to fit exactly in cell */
    .edit-input,
    .edit-select {
      width: 100%;
      height: 2.25rem;
      padding: 0.25rem 0.375rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      background-color: white;
      box-sizing: border-box;
      margin: 0;
    }

    .edit-input:focus,
    .edit-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    /* Error list with controlled height */
    .error-list {
      list-style: none;
      padding: 0;
      margin: 0;
      max-height: 2.25rem;
      overflow-y: auto;
    }

    .error-item {
      color: #dc2626;
      font-size: 0.75rem;
      background: #fef2f2;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      margin-bottom: 0.125rem;
      line-height: 1.2;
    }

    /* Edit hint fits in same space */
    .edit-hint {
      font-style: italic;
      color: #6b7280;
      font-size: 0.75rem;
      line-height: 2.25rem;
    }

    /* Visual indicator for recently edited row */
    .recently-saved {
      background-color: #f0f9ff !important;
      transition: background-color 0.5s ease;
    }

    /* Ensure action buttons stay centered in fixed height */
    .actions-cell {
      padding: 0.375rem 0.5rem !important;
      height: 3rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
      align-items: center;
      height: 100%;
    }
  `]
})
export class BulkImportModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() itemsImported = new EventEmitter<ImportedItem[]>();

  // Services
  private inventoryService = inject(InventoryService);
  private consignorService = inject(ConsignorService);
  private http = inject(HttpClient);

  // State
  selectedFile = signal<File | null>(null);
  importData = signal<ImportRow[]>([]);
  summary = signal<ImportSummary | null>(null);
  isProcessing = signal(false);
  isDragOver = signal(false);
  isImporting = signal(false);
  consignors = signal<Consignor[]>([]);

  // Results modal
  showResultsModal = signal(false);
  importResults = signal<BulkImportResult | null>(null);

  // Duplicate detection
  isDuplicateFile = signal(false);
  duplicateInfo = signal<{lastUploadDate: string, lastFileName: string} | null>(null);
  showDuplicateWarning = signal(false);
  firstDataRow = signal<string>('');

  // Default consignor for unmatched items
  defaultConsignorId = signal<string | null>(null);
  useDefaultConsignor = signal(false);
  defaultConsignorMode = signal<'missing' | 'missing-and-errors' | 'all'>('missing');

  // In-grid editing state
  editingRowId = signal<number | null>(null);
  editingData = signal<any>({});
  recentlySavedRowId = signal<number | null>(null);

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
    this.isImporting.set(false);
    this.showResultsModal.set(false);
    this.importResults.set(null);

    // Reset default consignor settings
    this.defaultConsignorId.set(null);
    this.useDefaultConsignor.set(false);

    // Reset duplicate detection
    this.isDuplicateFile.set(false);
    this.duplicateInfo.set(null);
    this.showDuplicateWarning.set(false);
    this.firstDataRow.set('');
  }

  showImportResults(result: BulkImportResult) {
    this.importResults.set(result);
    this.showResultsModal.set(true);
  }

  onResultsModalClosed() {
    // Check if import was successful before clearing the results
    const results = this.importResults();
    const shouldCloseMainModal = results?.success && results.successfulImports > 0;

    this.showResultsModal.set(false);
    this.importResults.set(null);

    // If import was successful, close the main modal too
    if (shouldCloseMainModal) {
      this.close();
    }
  }

  onSendToNotifications(result: BulkImportResult) {
    console.log('📧 BulkImportModal: Send to Notifications clicked:', result);
    // TODO: Implement notification service integration
    // For now, just close the modal
    this.onResultsModalClosed();
  }

  ngOnInit() {
    console.log('🔧 BulkImportModal: Initializing, loading consignors...');
    this.loadConsignors();
  }

  private loadConsignors() {
    console.log('📡 BulkImportModal: Calling consignorService.getConsignors()');
    this.consignorService.getConsignors().subscribe({
      next: (consignors) => {
        console.log(`✅ BulkImportModal: Loaded ${consignors.length} consignors:`, consignors.map(c => ({ id: c.id, name: c.name, consignorNumber: c.consignorNumber })));
        this.consignors.set(consignors);
      },
      error: (error) => {
        console.error('❌ BulkImportModal: Error loading consignors:', error);
      }
    });
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
    // Store first data row for duplicate detection
    const firstDataRow = lines[1];
    this.firstDataRow.set(firstDataRow);

    // Check for duplicate file before processing
    this.checkForDuplicateFile(firstDataRow, lines.length - 1);

    const rows: ImportRow[] = [];
    let validCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvRow(lines[i]);
      if (values.length === 0) continue;

      const rowData: any = {};
      headers.forEach((header, index) => {
        // Convert header to camelCase
        const camelCaseHeader = header.charAt(0).toLowerCase() + header.slice(1);
        rowData[camelCaseHeader] = values[index] || '';
      });

      const validation = this.validateRowData(rowData);
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

  private checkForDuplicateFile(firstDataRow: string, rowCount: number) {
    if (!this.selectedFile()) return;

    const request = {
      fileName: this.selectedFile()!.name,
      firstDataRow,
      rowCount
    };

    this.http.post<{ isDuplicate: boolean; lastUploadDate?: string; lastFileName?: string }>
      (`${environment.apiUrl}/api/items/check-duplicate`, request)
      .subscribe({
        next: (response) => {
          this.isDuplicateFile.set(response.isDuplicate);
          if (response.isDuplicate && response.lastUploadDate && response.lastFileName) {
            this.duplicateInfo.set({
              lastUploadDate: response.lastUploadDate,
              lastFileName: response.lastFileName
            });
            this.showDuplicateWarning.set(true);
          }
        },
        error: (error) => {
          console.error('Error checking for duplicate file:', error);
          // Continue with normal processing even if duplicate check fails
        }
      });
  }

  dismissDuplicateWarning() {
    this.showDuplicateWarning.set(false);
  }

  onDefaultConsignorChange(value: string) {
    this.defaultConsignorId.set(value || null);
    this.useDefaultConsignor.set(!!value);

    // Trigger re-calculation of importable items and clear ConsignorNumber errors
    if (value) {
      this.updateRowErrorsForDefaultConsignor();
    }
  }

  onDefaultConsignorModeChange(mode: 'missing' | 'missing-and-errors' | 'all') {
    this.defaultConsignorMode.set(mode);
    // Re-run error clearing logic when mode changes
    if (this.defaultConsignorId()) {
      this.updateRowErrorsForDefaultConsignor();
    }
  }

  willUseDefaultConsignor(row: ImportRow): boolean {
    if (!this.defaultConsignorId()) return false;

    const mode = this.defaultConsignorMode();

    switch (mode) {
      case 'missing':
        return !row.data.consignorNumber;
      case 'missing-and-errors':
        return !row.data.consignorNumber || !row.isValid;
      case 'all':
        return true;
      default:
        return false;
    }
  }

  getDisplayConsignorNumber(row: ImportRow): string {
    if (this.willUseDefaultConsignor(row)) {
      const defaultConsignor = this.consignors().find(c => c.id.toString() === this.defaultConsignorId());
      return defaultConsignor ? defaultConsignor.consignorNumber : row.data.consignorNumber || '';
    }
    return row.data.consignorNumber || '';
  }

  // In-grid editing methods
  startEditRow(row: ImportRow) {
    this.editingRowId.set(row.rowNumber);
    this.editingData.set({
      name: row.data.name,
      price: row.data.price,
      category: row.data.category,
      condition: row.data.condition
    });
  }

  cancelEdit() {
    this.editingRowId.set(null);
    this.editingData.set({});
  }

  saveEdit() {
    const rowId = this.editingRowId();
    const editData = this.editingData();

    if (rowId === null) return;

    // Update the import data
    const updatedData = this.importData().map(row => {
      if (row.rowNumber === rowId) {
        const updatedRow = {
          ...row,
          data: {
            ...row.data,
            ...editData
          }
        };

        // Re-validate the row after editing
        return this.validateRow(updatedRow);
      }
      return row;
    });

    this.importData.set(updatedData);

    // Recalculate summary
    this.recalculateSummary(updatedData);

    // Show visual feedback for saved row
    this.recentlySavedRowId.set(rowId);
    setTimeout(() => this.recentlySavedRowId.set(null), 2000);

    // Exit edit mode
    this.cancelEdit();
  }

  deleteRow(rowNumber: number) {
    const updatedData = this.importData().filter(row => row.rowNumber !== rowNumber);
    this.importData.set(updatedData);
    this.recalculateSummary(updatedData);

    // If deleting the currently edited row, cancel edit
    if (this.editingRowId() === rowNumber) {
      this.cancelEdit();
    }
  }

  isEditing(row: ImportRow): boolean {
    return this.editingRowId() === row.rowNumber;
  }

  isRecentlySaved(row: ImportRow): boolean {
    return this.recentlySavedRowId() === row.rowNumber;
  }

  updateEditField(field: string, value: string) {
    this.editingData.update(data => ({
      ...data,
      [field]: value
    }));
  }

  private validateRow(row: ImportRow): ImportRow {
    const errors: string[] = [];

    if (!row.data.name || row.data.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!row.data.price || isNaN(parseFloat(row.data.price)) || parseFloat(row.data.price) <= 0) {
      errors.push('Valid price is required');
    }

    if (!row.data.category || row.data.category.trim() === '') {
      errors.push('Category is required');
    }

    const validConditions = ['New', 'LikeNew', 'Good', 'Fair', 'Poor'];
    if (!row.data.condition || !validConditions.includes(row.data.condition)) {
      errors.push('Valid condition is required');
    }

    return {
      ...row,
      errors,
      isValid: errors.length === 0
    };
  }

  private recalculateSummary(data: ImportRow[]) {
    const validCount = data.filter(row => row.isValid).length;
    const errorCount = data.filter(row => !row.isValid).length;

    this.summary.set({
      totalRows: data.length,
      validRows: validCount,
      errorRows: errorCount,
      errors: []
    });
  }

  private validateRowData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields - now using camelCase properties
    if (!data.name || data.name.trim() === '') {
      errors.push('Name is required');
    }

    if (!data.price || data.price.trim() === '') {
      errors.push('Price is required');
    } else {
      const priceValue = parseFloat(data.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        errors.push('Price must be a positive number');
      }
    }

    if (!data.consignorNumber || data.consignorNumber.trim() === '') {
      errors.push('ConsignorNumber is required');
    } else {
      // Pattern: NNNLLN (3 digits, 2 letters, 1 number)
      const pattern = /^\d{3}[A-Z]{2}\d$/;
      if (!pattern.test(data.consignorNumber.toUpperCase())) {
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

  private updateRowErrorsForDefaultConsignor() {
    // Update error display to hide errors for items that would use default consignor
    const updatedData = this.importData().map(row => {
      const willUseDefault = this.willUseDefaultConsignor(row);

      if (!willUseDefault) {
        return row; // Keep original errors if not using default
      }

      const mode = this.defaultConsignorMode();
      let filteredErrors = [...row.errors];

      // Always remove ConsignorNumber errors when using default
      filteredErrors = filteredErrors.filter(error =>
        !error.includes('ConsignorNumber') &&
        !error.toLowerCase().includes('consignor')
      );

      // For 'missing-and-errors' and 'all' modes, clear ALL errors since default will handle
      if (mode === 'missing-and-errors' || mode === 'all') {
        filteredErrors = [];
      }

      return {
        ...row,
        errors: filteredErrors,
        isValid: filteredErrors.length === 0
      };
    });

    this.importData.set(updatedData);

    // Recalculate summary
    const validCount = updatedData.filter(row => row.isValid).length;
    const errorCount = updatedData.filter(row => !row.isValid).length;

    this.summary.set({
      totalRows: updatedData.length,
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
    console.log('🚀 BulkImportModal: Starting import process...');
    const validRows = this.importData().filter(row => row.isValid);
    console.log(`📊 BulkImportModal: Found ${validRows.length} valid rows to import`);

    if (validRows.length === 0) {
      console.warn('⚠️ BulkImportModal: No valid items to import');
      this.showImportResults({
        success: false,
        successfulImports: 0,
        failedImports: 0,
        totalItems: 0,
        errors: ['No valid items to import.'],
        message: 'Import failed: No valid items found.'
      });
      return;
    }

    this.isImporting.set(true);

    // Convert ImportedItem data to CreateItemRequest format
    const consignorLookup = new Map<string, string>();
    const consignorsList = this.consignors();

    console.log('🔍 BulkImportModal: Consignors data:', consignorsList);

    consignorsList.forEach(c => {
      if (c.consignorNumber) {
        consignorLookup.set(c.consignorNumber.toUpperCase(), c.id.toString());
      }
    });
    console.log('🔍 BulkImportModal: Consignor lookup map:', Object.fromEntries(consignorLookup));

    // Process all valid rows (convertToCreateItemRequest will handle default consignor logic)
    const createRequests: CreateItemRequest[] = validRows
      .map(row => this.convertToCreateItemRequest(row.data, consignorLookup))
      .filter(req => req !== null) as CreateItemRequest[];

    console.log(`🔄 BulkImportModal: Converted ${createRequests.length} items to CreateItemRequest format:`, createRequests);

    if (createRequests.length === 0) {
      this.isImporting.set(false);
      console.error('❌ BulkImportModal: No items could be converted for import. Check consignor numbers.');
      this.showImportResults({
        success: false,
        successfulImports: 0,
        failedImports: validRows.length,
        totalItems: validRows.length,
        errors: ['No items could be converted for import. Check consignor numbers.'],
        message: 'Import failed: Invalid consignor numbers.'
      });
      return;
    }

    // Use proper bulk API for efficient processing
    console.log(`📡 BulkImportModal: Making bulk API call to create ${createRequests.length} items...`);

    this.inventoryService.bulkCreateItems(
      createRequests,
      this.selectedFile()?.name,
      this.firstDataRow()
    ).subscribe({
      next: (response) => {
        console.log('📊 BulkImportModal: Bulk API response received:', response);
        this.isImporting.set(false);

        if (response.success) {
          const result = response.data;
          console.log(`✅ BulkImportModal: Import completed - ${result.successfulImports} successful, ${result.failedImports} failed`);

          if (result.successfulImports > 0) {
            this.itemsImported.emit(validRows.map(r => r.data));
          }

          // Show results modal for all cases - success, partial success, or complete failure
          this.showImportResults({
            success: result.successfulImports > 0,
            successfulImports: result.successfulImports,
            failedImports: result.failedImports,
            totalItems: result.successfulImports + result.failedImports,
            errors: result.errors || [],
            message: result.successfulImports > 0
              ? (result.failedImports > 0
                ? `Import completed with some errors: ${result.successfulImports} successful, ${result.failedImports} failed.`
                : `Import completed successfully! ${result.successfulImports} items created.`)
              : 'Import failed. No items were created.'
          });
        } else {
          console.error('❌ BulkImportModal: Bulk API returned error:', response.message);
          this.showImportResults({
            success: false,
            successfulImports: 0,
            failedImports: createRequests.length,
            totalItems: createRequests.length,
            errors: [response.message || 'Unknown error occurred'],
            message: `Import failed: ${response.message}`
          });
        }
      },
      error: (error) => {
        this.isImporting.set(false);
        console.error('💥 BulkImportModal: Fatal error during bulk import:', error);

        let errorMessage = 'Import failed due to an error. Please try again.';
        if (error.status === 401) {
          errorMessage = 'Import failed: Authentication error. Please login again.';
        } else if (error.status === 500) {
          errorMessage = `Import failed: Server error. ${error.error?.message || 'Please try again.'}`;
        }

        this.showImportResults({
          success: false,
          successfulImports: 0,
          failedImports: createRequests.length,
          totalItems: createRequests.length,
          errors: [errorMessage],
          message: errorMessage
        });
      }
    });
  }

  private convertToCreateItemRequest(data: any, consignorLookup: Map<string, string>): CreateItemRequest | null {
    console.log('🔄 BulkImportModal: Converting item data:', data);
    let consignorId = consignorLookup.get(data.consignorNumber?.toUpperCase());

    if (!consignorId) {
      console.warn(`⚠️ BulkImportModal: Consignor not found for number: ${data.consignorNumber}`);
      console.log('🔍 BulkImportModal: Available consignor numbers:', Array.from(consignorLookup.keys()));

      // Use default consignor if enabled and available
      if (this.useDefaultConsignor() && this.defaultConsignorId()) {
        consignorId = this.defaultConsignorId();
        console.log(`🔄 BulkImportModal: Using default consignor ${consignorId} for item "${data.name}"`);
      } else {
        return null;
      }
    }

    // Convert condition string to ItemCondition enum
    const conditionMap: { [key: string]: ItemCondition } = {
      'New': ItemCondition.New,
      'LikeNew': ItemCondition.LikeNew,
      'Like New': ItemCondition.LikeNew, // Handle space variant
      'Good': ItemCondition.Good,
      'Fair': ItemCondition.Fair,
      'Poor': ItemCondition.Poor
    };

    const request = {
      consignorId,
      title: data.name,
      description: data.description || undefined,
      sku: data.sku || undefined,
      price: parseFloat(data.price),
      category: data.category || 'General',
      condition: conditionMap[data.condition] || ItemCondition.Good,
      receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
      location: data.location || undefined,
      notes: data.notes || undefined
    };

    console.log(`✅ BulkImportModal: Converted item "${data.name}" to CreateItemRequest:`, request);
    return request;
  }

  hasValidItems(): boolean {
    return this.getImportableItemsCount() > 0;
  }

  getImportableItemsCount(): number {
    const data = this.importData();
    if (!data.length) return 0;

    const consignorLookup = new Map<string, string>();
    this.consignors().forEach(c => {
      if (c.consignorNumber) {
        consignorLookup.set(c.consignorNumber.toUpperCase(), c.id.toString());
      }
    });

    let count = 0;

    for (const row of data) {
      if (!row.isValid) continue; // Skip rows with validation errors

      const hasMatchingConsignor = consignorLookup.has(row.data.consignorNumber?.toUpperCase());

      if (hasMatchingConsignor) {
        count++; // Item has valid consignor match
      } else if (this.useDefaultConsignor() && this.defaultConsignorId()) {
        count++; // Item would use default consignor
      }
      // Skip items without consignor match and no default consignor set
    }

    return count;
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