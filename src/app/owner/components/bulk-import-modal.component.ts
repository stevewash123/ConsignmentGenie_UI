import { Component, EventEmitter, Input, Output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, catchError, of } from 'rxjs';
import { ImportedItem } from './inventory-list.component';
import { InventoryService } from '../../services/inventory.service';
import { ConsignorService } from '../../services/consignor.service';
import { CreateItemRequest, ItemCondition } from '../../models/inventory.model';
import { Consignor } from '../../models/consignor.model';
import { BulkImportResultsModalComponent, BulkImportResult } from './bulk-import-results-modal.component';

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
  styleUrls: ['./bulk-import-modal.component.scss']
})
export class BulkImportModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() preloadedItems: ImportedItem[] | null = null; // For manifest data
  @Output() closeModal = new EventEmitter<void>();
  @Output() itemsImported = new EventEmitter<ImportedItem[]>();

  // Services
  private inventoryService = inject(InventoryService);
  private consignorService = inject(ConsignorService);

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

  // Manifest-specific properties
  isManifestImport = signal(false);
  manifestConsignorNumber = signal<string>('');
  manifestId = signal<string>('');

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

    // Reset manifest-specific properties
    this.isManifestImport.set(false);
    this.manifestConsignorNumber.set('');
    this.manifestId.set('');

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
    console.log('🔧 BulkImportModal: Initializing, loading consignors...', {
      hasPreloadedItems: !!(this.preloadedItems && this.preloadedItems.length > 0),
      preloadedItems: this.preloadedItems
    });
    this.loadConsignors();

    // If we have preloaded items (from manifest), process them directly
    if (this.preloadedItems && this.preloadedItems.length > 0) {
      console.log('📦 BulkImportModal: Processing preloaded manifest items', this.preloadedItems);
      this.processPreloadedItems();
    } else {
      console.log('📝 BulkImportModal: No preloaded items, showing file upload');
    }
  }

  ngOnChanges(changes: any) {
    console.log('🔄 BulkImportModal: Input changes detected:', changes);

    // Handle preloadedItems changes
    if (changes['preloadedItems'] && changes['preloadedItems'].currentValue) {
      const preloadedItems = changes['preloadedItems'].currentValue;
      console.log('📦 BulkImportModal: Preloaded items changed, processing:', preloadedItems);
      this.processPreloadedItems();
    }
  }

  private loadConsignors() {
    console.log('📡 BulkImportModal: Calling consignorService.getConsignors()');
    this.consignorService.getConsignors().subscribe({
      next: (consignors) => {
        console.log(`✅ BulkImportModal: Loaded ${consignors.length} consignors:`, consignors.map(c => ({ id: c.id, name: c.name, consignorNumber: c.consignorNumber })));
        this.consignors.set(consignors);

        // If we have preloaded items and consignors are now loaded, process them
        if (this.preloadedItems && this.preloadedItems.length > 0) {
          this.processPreloadedItems();
        }
      },
      error: (error) => {
        console.error('❌ BulkImportModal: Error loading consignors:', error);
      }
    });
  }

  private autoSelectConsignorFromManifest(consignorNumber: string) {
    const matchingConsignor = this.consignors().find(c =>
      c.consignorNumber?.toUpperCase() === consignorNumber.toUpperCase()
    );

    if (matchingConsignor) {
      console.log('✅ Auto-selecting consignor for manifest:', {
        consignorId: matchingConsignor.id,
        consignorNumber: matchingConsignor.consignorNumber,
        consignorName: matchingConsignor.name
      });

      this.defaultConsignorId.set(matchingConsignor.id.toString());
      this.useDefaultConsignor.set(true);
      this.defaultConsignorMode.set('all'); // Apply to all items in manifest
    } else {
      console.warn('⚠️ No matching consignor found for manifest consignor number:', consignorNumber);
    }
  }

  private processPreloadedItems() {
    if (!this.preloadedItems || this.preloadedItems.length === 0) return;

    console.log('📦 Processing manifest items directly to preview:', this.preloadedItems);

    // Mark as manifest import
    this.isManifestImport.set(true);

    // Extract consignor number from first item (all should be the same)
    const firstItem = this.preloadedItems[0];
    if (firstItem?.consignorNumber) {
      this.manifestConsignorNumber.set(firstItem.consignorNumber);
      console.log('🎅 Extracted consignor number from manifest:', firstItem.consignorNumber);

      // Auto-select the matching consignor if found
      this.autoSelectConsignorFromManifest(firstItem.consignorNumber);
    }

    // Convert ImportedItem[] to ImportRow[] format (same as CSV processing does)
    const importRows: ImportRow[] = this.preloadedItems.map((item, index) => {
      const rowData = {
        name: item.name,
        description: item.description || '',
        sku: item.sku || '',
        price: item.price,
        consignorNumber: item.consignorNumber || '',
        category: item.category || '',
        condition: item.condition || 'Good',
        receivedDate: item.receivedDate || new Date().toISOString().split('T')[0],
        location: item.location || '',
        notes: item.notes || ''
      };

      // Validate the row (reuse existing validation logic)
      const errors: string[] = [];
      if (!rowData.name?.trim()) errors.push('Name is required');
      if (!rowData.price || parseFloat(rowData.price) <= 0) errors.push('Valid price is required');

      return {
        rowNumber: index + 1,
        data: rowData,
        isValid: errors.length === 0,
        errors,
        originalCsv: `${rowData.name},${rowData.description},${rowData.sku},${rowData.price},${rowData.consignorNumber},${rowData.category},${rowData.condition},${rowData.receivedDate},${rowData.location},${rowData.notes}`
      };
    });

    // Set the import data and summary (same as CSV processing would do)
    this.importData.set(importRows);

    const validRows = importRows.filter(row => row.isValid).length;
    const errorRows = importRows.length - validRows;

    this.summary.set({
      totalRows: importRows.length,
      validRows,
      errorRows,
      errors: errorRows > 0 ? [`${errorRows} rows have validation errors`] : []
    });

    console.log(`📊 Manifest processing complete: ${validRows} valid, ${errorRows} invalid out of ${importRows.length} total items`);
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

    this.inventoryService.checkDuplicateFile(request).subscribe({
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