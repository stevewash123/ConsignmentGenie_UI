import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { MockConsignorStatementService } from '../services/mock-consignor-statement.service';
import { StatementDto } from '../models/consignor.models';
import { LoadingService } from '../../shared/services/loading.service';
import { LOADING_KEYS } from '../constants/loading-keys';

@Component({
  selector: 'app-consignor-statement-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './consignor-statement-detail.component.html',
})
export class ConsignorStatementDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  statement: StatementDto | null = null;
  error: string | null = null;

  // Expose for template
  readonly KEYS = LOADING_KEYS;

  constructor(
    private route: ActivatedRoute,
    private statementService: MockConsignorStatementService,
    public loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const statementId = params.get('id');
          if (!statementId) {
            throw new Error('Statement ID is required');
          }
          this.loadingService.start(LOADING_KEYS.STATEMENT);
          this.error = null;
          return this.statementService.getStatement(statementId);
        })
      )
      .subscribe({
        next: (statement) => {
          this.statement = statement;
        },
        error: (error) => {
          console.error('Error loading statement:', error);
          if (error.status === 404) {
            this.error = 'Statement not found.';
          } else {
            this.error = 'Failed to load statement. Please try again later.';
          }
        },
        complete: () => {
          this.loadingService.stop(LOADING_KEYS.STATEMENT);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStatementById(statementId: string) {
    this.loadingService.start(LOADING_KEYS.STATEMENT);
    this.error = null;

    return this.statementService.getStatement(statementId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statement) => {
          this.statement = statement;
        },
        error: (error) => {
          console.error('Error loading statement:', error);
          if (error.status === 404) {
            this.error = 'Statement not found.';
          } else {
            this.error = 'Failed to load statement. Please try again later.';
          }
        },
        complete: () => {
          this.loadingService.stop(LOADING_KEYS.STATEMENT);
        }
      });
  }

  loadStatement() {
    const statementId = this.route.snapshot.paramMap.get('id');
    if (statementId) {
      this.loadStatementById(statementId);
    }
  }

  downloadPdf() {
    if (!this.statement?.hasPdf || this.loadingService.isLoading(LOADING_KEYS.STATEMENT_PDF)) {
      return;
    }

    this.loadingService.start(LOADING_KEYS.STATEMENT_PDF);

    this.statementService.downloadStatementPdf(this.statement.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.downloadFile(blob, `${this.statement?.statementNumber}.pdf`);
        },
        error: (error) => {
          console.error('Error downloading PDF:', error);
          alert('Failed to download PDF. Please try again.');
        },
        complete: () => {
          this.loadingService.stop(LOADING_KEYS.STATEMENT_PDF);
        }
      });
  }

  regenerateStatement() {
    if (!this.statement || this.loadingService.isLoading(LOADING_KEYS.STATEMENT_REGENERATE)) {
      return;
    }

    const confirmed = confirm('Are you sure you want to regenerate this statement? This will recalculate all amounts based on current data.');
    if (!confirmed) {
      return;
    }

    this.loadingService.start(LOADING_KEYS.STATEMENT_REGENERATE);

    this.statementService.regenerateStatement(this.statement.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedStatement) => {
          this.statement = updatedStatement;
          alert('Statement has been regenerated successfully.');
        },
        error: (error) => {
          console.error('Error regenerating statement:', error);
          alert('Failed to regenerate statement. Please try again.');
        },
        complete: () => {
          this.loadingService.stop(LOADING_KEYS.STATEMENT_REGENERATE);
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

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `${startStr} - ${endStr}`;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  trackBySaleDate(index: number, sale: any): string {
    return `${sale.date}-${sale.itemSku}`;
  }

  trackByPayoutNumber(index: number, payout: any): string {
    return payout.payoutNumber;
  }
}