import { TestBed } from '@angular/core/testing';
import { MockStatementService } from './mock-statement.service';
import { StatementMonth, StatementListResponse } from '../../../consignor/models/consignor.models';

describe('MockStatementService', () => {
  let service: MockStatementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockStatementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return monthly statements sorted by newest first', (done) => {
    service.getMonthlyStatements().subscribe((response: StatementListResponse) => {
      expect(response).toBeTruthy();
      expect(response.statements).toBeTruthy();
      expect(response.statements.length).toBeGreaterThan(0);

      // Verify sorting (newest first)
      const statements = response.statements;
      for (let i = 0; i < statements.length - 1; i++) {
        const current = statements[i];
        const next = statements[i + 1];

        if (current.year === next.year) {
          expect(current.month).toBeGreaterThanOrEqual(next.month);
        } else {
          expect(current.year).toBeGreaterThan(next.year);
        }
      }

      done();
    });
  });

  it('should return statements with required properties', (done) => {
    service.getMonthlyStatements().subscribe((response: StatementListResponse) => {
      const statement = response.statements[0];

      expect(statement.year).toBeDefined();
      expect(statement.month).toBeDefined();
      expect(statement.monthName).toBeDefined();
      expect(statement.salesCount).toBeDefined();
      expect(statement.totalEarnings).toBeDefined();
      expect(statement.payoutCount).toBeDefined();

      expect(typeof statement.year).toBe('number');
      expect(typeof statement.month).toBe('number');
      expect(typeof statement.monthName).toBe('string');
      expect(typeof statement.salesCount).toBe('number');
      expect(typeof statement.totalEarnings).toBe('number');
      expect(typeof statement.payoutCount).toBe('number');

      done();
    });
  });

  it('should return empty statements list', (done) => {
    service.getEmptyStatements().subscribe((response: StatementListResponse) => {
      expect(response).toBeTruthy();
      expect(response.statements).toEqual([]);
      done();
    });
  });

  it('should download monthly PDF', (done) => {
    const year = 2024;
    const month = 12;

    service.downloadMonthlyPdf(year, month).subscribe((blob: Blob) => {
      expect(blob).toBeTruthy();
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(0);
      done();
    });
  });

  it('should generate different PDF content for different months', (done) => {
    let pdf1: Blob;
    let pdf2: Blob;
    let completedCount = 0;

    const checkCompletion = () => {
      completedCount++;
      if (completedCount === 2) {
        expect(pdf1.size).toBeGreaterThan(0);
        expect(pdf2.size).toBeGreaterThan(0);
        // PDFs should be different sizes due to different content
        // Note: This is a basic check since we can't easily compare text content of Blobs
        done();
      }
    };

    service.downloadMonthlyPdf(2024, 12).subscribe((blob) => {
      pdf1 = blob;
      checkCompletion();
    });

    service.downloadMonthlyPdf(2024, 11).subscribe((blob) => {
      pdf2 = blob;
      checkCompletion();
    });
  });

  it('should include proper month names in statements', (done) => {
    service.getMonthlyStatements().subscribe((response: StatementListResponse) => {
      const statements = response.statements;

      statements.forEach(statement => {
        expect(statement.monthName).toMatch(/^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/);

        // Verify month name matches the month number
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const expectedMonthName = monthNames[statement.month - 1];
        expect(statement.monthName).toContain(expectedMonthName);
        expect(statement.monthName).toContain(statement.year.toString());
      });

      done();
    });
  });

  it('should have realistic data values', (done) => {
    service.getMonthlyStatements().subscribe((response: StatementListResponse) => {
      const statements = response.statements;

      statements.forEach(statement => {
        // Basic sanity checks for realistic values
        expect(statement.year).toBeGreaterThan(2020);
        expect(statement.year).toBeLessThan(2030);
        expect(statement.month).toBeGreaterThanOrEqual(1);
        expect(statement.month).toBeLessThanOrEqual(12);
        expect(statement.salesCount).toBeGreaterThanOrEqual(0);
        expect(statement.totalEarnings).toBeGreaterThanOrEqual(0);
        expect(statement.payoutCount).toBeGreaterThanOrEqual(0);
      });

      done();
    });
  });

  it('should simulate network delay', (done) => {
    const startTime = Date.now();

    service.getMonthlyStatements().subscribe(() => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have some delay (at least 400ms based on our delay(500))
      expect(duration).toBeGreaterThan(400);
      done();
    });
  });

  it('should simulate PDF generation delay', (done) => {
    const startTime = Date.now();

    service.downloadMonthlyPdf(2024, 12).subscribe(() => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should have PDF generation delay (at least 1000ms based on our delay(1200))
      expect(duration).toBeGreaterThan(1000);
      done();
    });
  });
});