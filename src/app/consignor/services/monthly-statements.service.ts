import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StatementMonth {
  year: number;
  month: number;
  monthName: string;
  salesCount: number;
  totalEarnings: number;
  payoutCount: number;
}

export interface StatementListResponse {
  statements: StatementMonth[];
}

@Injectable({
  providedIn: 'root'
})
export class MonthlyStatementsService {
  private apiUrl = `${environment.apiUrl}/api/consignor`;

  constructor(private http: HttpClient) {}

  getAvailableMonths(): Observable<StatementListResponse> {
    return this.http.get<StatementListResponse>(`${this.apiUrl}/statements`);
  }

  downloadMonthlyPdf(year: number, month: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/statements/${year}/${month}/pdf`, {
      responseType: 'blob'
    });
  }
}