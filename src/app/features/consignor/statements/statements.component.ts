import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, map } from 'rxjs';
import { ConsignorPortalService } from '../../../consignor/services/consignor-portal.service';
import { StatementMonth, StatementListDto } from '../../../consignor/models/consignor.models';

@Component({
  selector: 'app-statements',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './statements.component.html',
  styleUrls: ['./statements.component.scss']
})
export class StatementsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  statements: StatementMonth[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private consignorPortalService: ConsignorPortalService
  ) {}

  ngOnInit() {
    this.loadStatements();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatements() {
    this.loading = true;
    this.error = null;

    this.consignorPortalService.getStatements()
      .pipe(
        takeUntil(this.destroy$),
        map((statementList: StatementListDto[]) => this.transformToStatementMonths(statementList))
      )
      .subscribe({
        next: (statements) => {
          this.statements = statements;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading statements:', error);
          this.error = 'Unable to load statements. Please try again.';
          this.loading = false;
        }
      });
  }

  downloadPdf(statement: StatementMonth) {
    if (statement.isDownloading) {
      return;
    }

    statement.isDownloading = true;

    this.consignorPortalService.downloadStatementPdfByPeriod(statement.year, statement.month)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.downloadFile(blob, `statement-${statement.year}-${String(statement.month).padStart(2, '0')}.pdf`);
          statement.isDownloading = false;
        },
        error: (error) => {
          console.error('Error downloading PDF:', error);
          this.handleDownloadError(error, statement);
          statement.isDownloading = false;
        }
      });
  }

  private downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  trackByStatement(index: number, statement: StatementMonth): string {
    return `${statement.year}-${statement.month}`;
  }

  private transformToStatementMonths(statementList: StatementListDto[]): StatementMonth[] {
    // Group statements by year/month and aggregate counts
    const monthMap = new Map<string, StatementMonth>();

    statementList.forEach(stmt => {
      const date = new Date(stmt.periodStart);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (monthMap.has(key)) {
        const existing = monthMap.get(key)!;
        existing.salesCount += stmt.itemsSold;
        existing.totalEarnings += stmt.totalEarnings;
        existing.payoutCount += 1; // Count this statement as activity
      } else {
        monthMap.set(key, {
          year,
          month,
          monthName,
          salesCount: stmt.itemsSold,
          totalEarnings: stmt.totalEarnings,
          payoutCount: 1
        });
      }
    });

    return Array.from(monthMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }

  private handleDownloadError(error: any, statement: StatementMonth): void {
    let message = 'Failed to download PDF. Please try again.';

    if (error.status === 404) {
      message = 'Statement not available for this month.';
    } else if (error.status === 0) {
      message = 'Download failed. Please check your connection and try again.';
    } else if (error.status >= 500) {
      message = 'Statement is taking longer than usual. Please try again.';
    }

    alert(message);
  }
}