import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MockStatementService } from '../services/mock-statement.service';
import { StatementMonth } from '../../../consignor/models/consignor.models';

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
    private statementService: MockStatementService
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

    this.statementService.getMonthlyStatements()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.statements = response.statements;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading statements:', error);
          this.error = 'Failed to load statements. Please try again later.';
          this.loading = false;
        }
      });
  }

  downloadPdf(statement: StatementMonth) {
    if (statement.isDownloading) {
      return;
    }

    statement.isDownloading = true;

    this.statementService.downloadMonthlyPdf(statement.year, statement.month)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.downloadFile(blob, `statement-${statement.year}-${String(statement.month).padStart(2, '0')}.pdf`);
          statement.isDownloading = false;
        },
        error: (error) => {
          console.error('Error downloading PDF:', error);
          alert('Failed to download PDF. Please try again.');
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
}