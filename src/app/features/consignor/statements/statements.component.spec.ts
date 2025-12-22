import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { StatementsComponent } from './statements.component';
import { MockStatementService } from '../services/mock-statement.service';
import { StatementMonth, StatementListResponse } from '../../../consignor/models/consignor.models';

describe('StatementsComponent', () => {
  let component: StatementsComponent;
  let fixture: ComponentFixture<StatementsComponent>;
  let mockStatementService: jasmine.SpyObj<MockStatementService>;

  const mockStatements: StatementMonth[] = [
    {
      year: 2024,
      month: 12,
      monthName: 'December 2024',
      salesCount: 12,
      totalEarnings: 485.00,
      payoutCount: 2
    },
    {
      year: 2024,
      month: 11,
      monthName: 'November 2024',
      salesCount: 8,
      totalEarnings: 312.50,
      payoutCount: 1
    }
  ];

  beforeEach(async () => {
    const statementServiceSpy = jasmine.createSpyObj('MockStatementService', [
      'getMonthlyStatements',
      'downloadMonthlyPdf'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        StatementsComponent,
        RouterTestingModule
      ],
      providers: [
        { provide: MockStatementService, useValue: statementServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StatementsComponent);
    component = fixture.componentInstance;
    mockStatementService = TestBed.inject(MockStatementService) as jasmine.SpyObj<MockStatementService>;
  });

  beforeEach(() => {
    // Set up default successful response
    mockStatementService.getMonthlyStatements.and.returnValue(
      of({ statements: mockStatements } as StatementListResponse)
    );
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load statements on init', () => {
    component.ngOnInit();

    expect(mockStatementService.getMonthlyStatements).toHaveBeenCalled();
    expect(component.statements).toEqual(mockStatements);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
  });

  it('should show loading state initially', fakeAsync(() => {
    component.loading = true;
    component.error = null;
    component.statements = [];
    fixture.detectChanges();
    tick();

    const loadingElement = fixture.nativeElement.querySelector('.loading-container');
    expect(loadingElement).toBeTruthy();
    expect(loadingElement.textContent).toContain('Loading statements...');
  }));

  it('should handle service error', () => {
    const errorMessage = 'Service error';
    mockStatementService.getMonthlyStatements.and.returnValue(
      throwError(() => new Error(errorMessage))
    );
    spyOn(console, 'error').and.stub();

    component.loadStatements();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe('Failed to load statements. Please try again later.');
    expect(console.error).toHaveBeenCalledWith('Error loading statements:', jasmine.any(Error));
  });

  it('should show error state when error occurs', fakeAsync(() => {
    component.error = 'Test error message';
    component.loading = false;
    component.statements = [];
    fixture.detectChanges();
    tick();

    const errorElement = fixture.nativeElement.querySelector('.error-container');
    expect(errorElement).toBeTruthy();
    expect(errorElement.textContent).toContain('Test error message');
  }));

  it('should show empty state when no statements', fakeAsync(() => {
    component.statements = [];
    component.loading = false;
    component.error = null;
    fixture.detectChanges();
    tick();

    const emptyElement = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyElement).toBeTruthy();
    expect(emptyElement.textContent).toContain('No statements available yet');
  }));

  it('should display statements table when data is loaded', fakeAsync(() => {
    component.statements = mockStatements;
    component.loading = false;
    component.error = null;
    fixture.detectChanges();
    tick();

    const tableElement = fixture.nativeElement.querySelector('.statements-table');
    expect(tableElement).toBeTruthy();

    const rows = fixture.nativeElement.querySelectorAll('tbody .statement-row');
    expect(rows.length).toBe(2);

    // Check first row content
    const firstRow = rows[0];
    expect(firstRow.textContent).toContain('December 2024');
    expect(firstRow.textContent).toContain('12');
    expect(firstRow.textContent).toContain('$485.00');
    expect(firstRow.textContent).toContain('2');
  }));

  it('should handle PDF download successfully', () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    mockStatementService.downloadMonthlyPdf.and.returnValue(of(mockBlob));

    spyOn(component as any, 'downloadFile');

    const statement = mockStatements[0];
    component.downloadPdf(statement);

    expect(mockStatementService.downloadMonthlyPdf).toHaveBeenCalledWith(2024, 12);
    expect((component as any).downloadFile).toHaveBeenCalledWith(
      mockBlob,
      'statement-2024-12.pdf'
    );
  });

  it('should handle PDF download error', () => {
    mockStatementService.downloadMonthlyPdf.and.returnValue(
      throwError(() => new Error('Download failed'))
    );
    spyOn(window, 'alert');
    spyOn(console, 'error').and.stub();

    const statement = { ...mockStatements[0] };
    component.downloadPdf(statement);

    expect(window.alert).toHaveBeenCalledWith('Failed to download PDF. Please try again.');
    expect(statement.isDownloading).toBeFalse();
    expect(console.error).toHaveBeenCalledWith('Error downloading PDF:', jasmine.any(Error));
  });

  it('should prevent download when already downloading', () => {
    const statement = { ...mockStatements[0], isDownloading: true };

    component.downloadPdf(statement);

    expect(mockStatementService.downloadMonthlyPdf).not.toHaveBeenCalled();
  });

  it('should set downloading state during PDF generation', fakeAsync(() => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    mockStatementService.downloadMonthlyPdf.and.returnValue(of(mockBlob));
    spyOn(component as any, 'downloadFile');

    const statement = { ...mockStatements[0] };

    component.downloadPdf(statement);
    expect(statement.isDownloading).toBeTrue();

    tick();

    expect(statement.isDownloading).toBeFalse();
  }));

  it('should show PDF button in correct states', fakeAsync(() => {
    component.statements = mockStatements;
    component.loading = false;
    component.error = null;
    fixture.detectChanges();
    tick();

    const buttons = fixture.nativeElement.querySelectorAll('.pdf-button');
    expect(buttons.length).toBe(2);

    // Check normal state
    expect(buttons[0].textContent.trim()).toBe('PDF');
    expect(buttons[0].disabled).toBeFalse();

    // Test downloading state
    component.statements[0].isDownloading = true;
    fixture.detectChanges();
    tick();

    expect(buttons[0].textContent).toContain('Generating...');
    expect(buttons[0].disabled).toBeTrue();
  }));

  it('should track statements correctly', () => {
    const statement = mockStatements[0];
    const key = component.trackByStatement(0, statement);
    expect(key).toBe('2024-12');
  });

  it('should retry loading when try again button is clicked', fakeAsync(() => {
    component.error = 'Test error';
    component.loading = false;
    component.statements = [];
    fixture.detectChanges();
    tick();

    const tryAgainButton = fixture.nativeElement.querySelector('.error-container .btn');
    expect(tryAgainButton).toBeTruthy();
    tryAgainButton.click();
    tick();

    expect(mockStatementService.getMonthlyStatements).toHaveBeenCalledTimes(2);
  }));

  it('should navigate back to dashboard when back button is clicked', fakeAsync(() => {
    component.statements = [];
    component.loading = false;
    component.error = null;
    fixture.detectChanges();
    tick();

    const backButton = fixture.nativeElement.querySelector('.back-button');
    expect(backButton).toBeTruthy();
    expect(backButton.getAttribute('routerLink')).toBe('/consignor/dashboard');
  }));

  it('should properly clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});