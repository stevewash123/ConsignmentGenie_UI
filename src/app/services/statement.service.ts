import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { StatementListDto, StatementDto } from '../consignor/models/consignor.models';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class StatementService {
  private readonly apiUrl = `${environment.apiUrl}/api/consignor/statements`;

  constructor(private http: HttpClient) {}

  /**
   * Get all statements for the authenticated consignor
   */
  getStatements(): Observable<StatementListDto[]> {
    return this.http.get<ApiResponse<StatementListDto[]>>(this.apiUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            // Convert date strings to Date objects
            return response.data.map(statement => ({
              ...statement,
              periodStart: new Date(statement.periodStart),
              periodEnd: new Date(statement.periodEnd),
              generatedAt: new Date(statement.generatedAt)
            }));
          }
          throw new Error(response.message || 'Failed to load statements');
        }),
        catchError(error => {
          console.error('Error loading statements:', error);
          return throwError(() => new Error(error.error?.message || 'Failed to load statements'));
        })
      );
  }

  /**
   * Get a specific statement by ID
   */
  getStatement(statementId: string): Observable<StatementDto> {
    return this.http.get<ApiResponse<StatementDto>>(`${this.apiUrl}/${statementId}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to load statement');
        }),
        catchError(error => {
          console.error('Error loading statement:', error);
          return throwError(() => new Error(error.error?.message || 'Failed to load statement'));
        })
      );
  }

  /**
   * Get statement by period (year/month)
   */
  getStatementByPeriod(year: number, month: number): Observable<StatementDto> {
    return this.http.get<ApiResponse<StatementDto>>(`${this.apiUrl}/${year}/${month}`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to load statement');
        }),
        catchError(error => {
          console.error('Error loading statement:', error);
          return throwError(() => new Error(error.error?.message || 'Failed to load statement'));
        })
      );
  }

  /**
   * Download PDF for a statement by ID
   */
  downloadStatementPdf(statementId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${statementId}/pdf`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error downloading PDF:', error);
        return throwError(() => new Error('Failed to download PDF'));
      })
    );
  }

  /**
   * Download PDF for statement by period (year/month)
   */
  downloadStatementPdfByPeriod(year: number, month: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${year}/${month}/pdf`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error downloading PDF:', error);
        return throwError(() => new Error('Failed to download PDF'));
      })
    );
  }

  /**
   * Helper method to trigger file download
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }
}