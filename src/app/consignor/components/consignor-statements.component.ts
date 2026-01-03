import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ConsignorPortalService } from '../services/consignor-portal.service';
import { StatementListDto, StatementMonth } from '../models/consignor.models';
import { LoadingService } from '../../shared/services/loading.service';
import { LOADING_KEYS } from '../constants/loading-keys';

@Component({
  selector: 'app-consignor-statements',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './consignor-statements.component.html',
  styles: [`
    .statements-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .statements-header {
      margin-bottom: 30px;
    }

    .statements-header h1 {
      margin: 0 0 10px;
      color: #333;
      font-size: 28px;
    }

    .header-info p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .loading-container,
    .error-container,
    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-container {
      color: #dc3545;
    }

    .error-icon,
    .empty-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .empty-state {
      color: #666;
    }

    .empty-state h3 {
      margin: 0 0 10px;
      color: #333;
    }

    .statements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .statement-card {
      position: relative;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .statement-card:hover {
      border-color: #cbd5e0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .statement-card.new {
      border-color: #007bff;
      box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.2);
    }

    .statement-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .statement-period {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .statement-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .statement-status.generated {
      background-color: #dcfce7;
      color: #16a34a;
    }

    .statement-status.viewed {
      background-color: #e0e7ff;
      color: #4338ca;
    }

    .statement-summary {
      margin-bottom: 16px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .summary-label {
      font-size: 14px;
      color: #6b7280;
    }

    .summary-value {
      font-size: 14px;
      color: #1f2937;
      font-weight: 500;
    }

    .summary-value.earnings {
      color: #16a34a;
      font-weight: 600;
    }

    .summary-value.balance {
      color: #0891b2;
      font-weight: 600;
    }

    .statement-period-detail {
      margin-bottom: 20px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
    }

    .period-dates {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      font-size: 14px;
      color: #4b5563;
    }

    .period-separator {
      margin: 0 8px;
      color: #9ca3af;
    }

    .generated-date {
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }

    .statement-actions {
      display: flex;
      gap: 10px;
    }

    .statement-actions .btn {
      flex: 1;
    }

    .new-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background-color: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 4px 8px;
      border-radius: 12px;
      letter-spacing: 0.5px;
    }

    .quick-stats {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e2e8f0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }

    .btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background-color: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .btn:hover:not(:disabled) {
      background-color: #f8f9fa;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
      border-color: #6c757d;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #545b62;
    }

    @media (max-width: 768px) {
      .statements-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .statement-actions {
        flex-direction: column;
      }

      .period-dates {
        flex-direction: column;
        gap: 4px;
      }

      .period-separator {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .statements-container {
        padding: 15px;
      }
    }
  `]
})
export class ConsignorStatementsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  statements: StatementMonth[] = [];
  error: string | null = null;

  // Expose for template
  readonly KEYS = LOADING_KEYS;

  constructor(
    private consignorService: ConsignorPortalService,
    public loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadStatements();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatements() {
    this.loadingService.start(LOADING_KEYS.STATEMENTS_LIST);
    this.error = null;

    this.consignorService.getStatements()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const statementsData = response.success ? response.data : response;
          this.statements = statementsData.statements || [];
          // Sort by year/month descending (most recent first)
          this.statements.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          });
        },
        error: (error) => {
          console.error('Error loading statements:', error);
          this.error = 'Failed to load statements. Please try again later.';
        },
        complete: () => {
          this.loadingService.stop(LOADING_KEYS.STATEMENTS_LIST);
        }
      });
  }

  downloadPdf(statement: StatementMonth) {
    if (this.loadingService.isLoading(LOADING_KEYS.STATEMENT_PDF)) {
      return;
    }

    // Set downloading state for UI feedback
    statement.isDownloading = true;
    this.loadingService.start(LOADING_KEYS.STATEMENT_PDF);

    this.consignorService.downloadStatementPdf(statement.year, statement.month)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          this.downloadFile(blob, `statement-${statement.year}-${statement.month.toString().padStart(2, '0')}.pdf`);
        },
        error: (error) => {
          console.error('Error downloading PDF:', error);
          alert('Failed to download PDF. Please try again.');
        },
        complete: () => {
          statement.isDownloading = false;
          this.loadingService.stop(LOADING_KEYS.STATEMENT_PDF);
        }
      });
  }

  private downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  isNewStatement(statement: StatementMonth): boolean {
    // Consider statements from the last 2 months as "new"
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

    return statement.year === currentYear &&
           Math.abs(statement.month - currentMonth) <= 1;
  }

  formatDate(year: number, month: number): string {
    const date = new Date(year, month - 1, 1); // month - 1 because JavaScript months are 0-indexed
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  getTotalEarnings(): number {
    return this.statements.reduce((sum, statement) => sum + statement.totalEarnings, 0);
  }

  getCurrentBalance(): number {
    // Return the sum of all earnings for current balance calculation
    return this.getTotalEarnings();
  }

  getTotalItemsSold(): number {
    return this.statements.reduce((sum, statement) => sum + statement.salesCount, 0);
  }

  getTotalPayouts(): number {
    return this.statements.reduce((sum, statement) => sum + statement.payoutCount, 0);
  }

  trackByStatementId(index: number, statement: StatementMonth): string {
    return `${statement.year}-${statement.month}`;
  }

  getStatusClass(statement: StatementMonth): string {
    return 'generated'; // All statements are generated
  }

  getStatementNumber(statement: StatementMonth): string {
    return `${statement.year}${statement.month.toString().padStart(2, '0')}`;
  }

  getPeriodLabel(statement: StatementMonth): string {
    return statement.monthName;
  }

  getPeriodStart(statement: StatementMonth): Date {
    return new Date(statement.year, statement.month - 1, 1);
  }

  getPeriodEnd(statement: StatementMonth): Date {
    return new Date(statement.year, statement.month, 0);
  }

  getGeneratedAt(statement: StatementMonth): Date {
    return new Date(statement.year, statement.month, 1);
  }

  getStatementId(statement: StatementMonth): string {
    return `${statement.year}-${statement.month}`;
  }
}