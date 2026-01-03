import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { StatementsComponent } from './statements.component';
import { ConsignorPortalService } from '../../../consignor/services/consignor-portal.service';
import { StatementListDto, StatementMonth } from '../../../consignor/models/consignor.models';

describe('StatementsComponent', () => {
  let component: StatementsComponent;
  let fixture: ComponentFixture<StatementsComponent>;
  let consignorPortalServiceSpy: jasmine.SpyObj<ConsignorPortalService>;

  const mockStatementMonths: StatementMonth[] = [
    {
      year: 2024,
      month: 12,
      monthName: 'December 2024',
      salesCount: 12,
      totalEarnings: 485.00,
      payoutCount: 2
    }
  ];

  beforeEach(async () => {
    consignorPortalServiceSpy = jasmine.createSpyObj('ConsignorPortalService', [
      'getStatements',
      'downloadStatementPdf'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        StatementsComponent,
        RouterTestingModule
      ],
      providers: [
        { provide: ConsignorPortalService, useValue: consignorPortalServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StatementsComponent);
    component = fixture.componentInstance;

    // Set up default successful response
    consignorPortalServiceSpy.getStatements.and.returnValue(of({ statements: mockStatementMonths }));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(component.statements).toEqual([]);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
  });

  it('should load statements on init', () => {
    component.ngOnInit();

    expect(consignorPortalServiceSpy.getStatements).toHaveBeenCalled();
    expect(component.statements.length).toBe(1);
    expect(component.statements[0].year).toBe(2024);
    expect(component.statements[0].month).toBe(12);
    expect(component.statements[0].monthName).toBe('December 2024');
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
  });

  it('should handle service error', () => {
    consignorPortalServiceSpy.getStatements.and.returnValue(
      throwError(() => new Error('Service error'))
    );
    spyOn(console, 'error').and.stub();

    component.loadStatements();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe('Unable to load statements. Please try again.');
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle download successfully', () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' });
    consignorPortalServiceSpy.downloadStatementPdf.and.returnValue(of(mockBlob));
    spyOn(component as any, 'downloadFile');

    const statement: StatementMonth = {
      year: 2024,
      month: 12,
      monthName: 'December 2024',
      salesCount: 12,
      totalEarnings: 485.00,
      payoutCount: 2,
      isDownloading: false
    };

    component.downloadPdf(statement);

    expect(consignorPortalServiceSpy.downloadStatementPdf).toHaveBeenCalledWith(2024, 12);
    expect((component as any).downloadFile).toHaveBeenCalledWith(
      mockBlob,
      'statement-2024-12.pdf'
    );
  });

  it('should prevent download when already downloading', () => {
    const statement: StatementMonth = {
      year: 2024,
      month: 12,
      monthName: 'December 2024',
      salesCount: 12,
      totalEarnings: 485.00,
      payoutCount: 2,
      isDownloading: true
    };

    component.downloadPdf(statement);

    expect(consignorPortalServiceSpy.downloadStatementPdf).not.toHaveBeenCalled();
  });

  it('should track statements correctly', () => {
    const statement: StatementMonth = {
      year: 2024,
      month: 12,
      monthName: 'December 2024',
      salesCount: 12,
      totalEarnings: 485.00,
      payoutCount: 2,
      isDownloading: false
    };
    const key = component.trackByStatement(0, statement);
    expect(key).toBe('2024-12');
  });

  it('should clean up subscriptions on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});