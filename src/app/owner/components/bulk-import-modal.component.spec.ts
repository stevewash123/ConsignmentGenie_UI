import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { BulkImportModalComponent } from './bulk-import-modal.component';
import { InventoryService } from '../../services/inventory.service';
import { ConsignorService } from '../../services/consignor.service';

describe('BulkImportModalComponent', () => {
  let component: BulkImportModalComponent;
  let fixture: ComponentFixture<BulkImportModalComponent>;
  let mockInventoryService: jasmine.SpyObj<InventoryService>;
  let mockConsignorService: jasmine.SpyObj<ConsignorService>;

  beforeEach(async () => {
    const inventoryServiceSpy = jasmine.createSpyObj('InventoryService', [
      'bulkCreateItems',
      'checkDuplicateFile'
    ]);
    const consignorServiceSpy = jasmine.createSpyObj('ConsignorService', [
      'getConsignors'
    ]);

    await TestBed.configureTestingModule({
      imports: [BulkImportModalComponent],
      providers: [
        { provide: InventoryService, useValue: inventoryServiceSpy },
        { provide: ConsignorService, useValue: consignorServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BulkImportModalComponent);
    component = fixture.componentInstance;
    mockInventoryService = TestBed.inject(InventoryService) as jasmine.SpyObj<InventoryService>;
    mockConsignorService = TestBed.inject(ConsignorService) as jasmine.SpyObj<ConsignorService>;

    // Setup default mock returns
    mockInventoryService.bulkCreateItems.and.returnValue(of({ success: true, data: { successfulImports: 0, failedImports: 0, errors: [] } }));
    mockInventoryService.checkDuplicateFile.and.returnValue(of({ isDuplicate: false }));
    mockConsignorService.getConsignors.and.returnValue(of([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isOpen).toBeFalse();
    expect(component.isProcessing()).toBeFalse();
  });

  it('should show modal when isOpen is set to true', () => {
    component.isOpen = true;
    fixture.detectChanges();
    expect(component.isOpen).toBeTrue();
  });

  it('should close modal when close() is called', () => {
    component.isOpen = true;
    const emitSpy = spyOn(component.closeModal, 'emit');
    component.close();
    expect(emitSpy).toHaveBeenCalled();
  });
});