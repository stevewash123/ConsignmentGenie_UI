import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MonthlyStatementsService, StatementMonth } from '../services/monthly-statements.service';
import { LoadingService } from '../../shared/services/loading.service';

@Component({
  selector: 'app-monthly-statements',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './monthly-statements.component.html',
  styleUrls: ['./monthly-statements.component.scss']
})
export class MonthlyStatementsComponent implements OnInit {
  statements: StatementMonth[] = [];
  loading = true;
  error: string | null = null;
  downloading = false;

  constructor(
    private monthlyStatementsService: MonthlyStatementsService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadStatements();
  }

  loadStatements() {
    this.loading = true;
    this.error = null;

    this.monthlyStatementsService.getAvailableMonths().subscribe({
      next: (response) => {
        this.statements = response.statements;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load statements. Please try again.';
        this.loading = false;
        console.error('Error loading statements:', error);
      }
    });
  }

  downloadPdf(statement: StatementMonth) {
    if (this.downloading) return;

    this.downloading = true;

    this.monthlyStatementsService.downloadMonthlyPdf(statement.year, statement.month).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `statement-${statement.year}-${statement.month.toString().padStart(2, '0')}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.downloading = false;
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF. Please try again.');
        this.downloading = false;
      }
    });
  }
}