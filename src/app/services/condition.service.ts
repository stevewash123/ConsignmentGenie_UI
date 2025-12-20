import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ConditionOption {
  value: string;   // "LikeNew"
  label: string;   // "Like New"
}

@Injectable({ providedIn: 'root' })
export class ConditionService {
  private apiUrl = `${environment.apiUrl}/api/conditions`;
  private conditions$: Observable<ConditionOption[]> | null = null;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ConditionOption[]> {
    // Cache since this is a static list
    if (!this.conditions$) {
      this.conditions$ = this.http.get<ConditionOption[]>(this.apiUrl).pipe(
        shareReplay(1)
      );
    }
    return this.conditions$;
  }
}