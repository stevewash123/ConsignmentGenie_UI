import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { StoreBranding } from '../models/store-branding.interface';

export interface LogoUploadResult {
  url: string;
  dimensions: { width: number; height: number };
}

@Injectable({
  providedIn: 'root'
})
export class BrandingService {
  private readonly apiUrl = `${environment.apiUrl}/api/organizations`;

  constructor(private http: HttpClient) {}

  getBranding(): Observable<StoreBranding | null> {
    return this.http.get<StoreBranding>(`${this.apiUrl}/branding`).pipe(
      map(response => response || null),
      catchError(error => {
        console.error('Error loading branding settings:', error);
        throw error;
      })
    );
  }

  saveBranding(branding: StoreBranding): Observable<StoreBranding> {
    return this.http.put<StoreBranding>(`${this.apiUrl}/branding`, branding).pipe(
      map(response => {
        if (!response) {
          throw new Error('No response received');
        }
        return response;
      }),
      catchError(error => {
        console.error('Error saving branding settings:', error);
        throw error;
      })
    );
  }

  uploadLogo(file: File): Observable<LogoUploadResult> {
    const formData = new FormData();
    formData.append('logo', file);

    return this.http.post<{success: boolean, data: LogoUploadResult}>(`${this.apiUrl}/branding/logo`, formData).pipe(
      map(response => {
        if (!response?.success || !response.data) {
          throw new Error('Upload failed or no data received');
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error uploading logo:', error);
        throw error;
      })
    );
  }

  removeLogo(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/branding/logo`).pipe(
      catchError(error => {
        console.error('Error removing logo:', error);
        throw error;
      })
    );
  }

  previewStorefront(branding: StoreBranding): Observable<string> {
    return this.http.post<{ previewUrl: string }>(`${this.apiUrl}/theme-preview`, branding).pipe(
      map(response => {
        if (!response?.previewUrl) {
          throw new Error('No preview URL received');
        }
        return response.previewUrl;
      }),
      catchError(error => {
        console.error('Error generating storefront preview:', error);
        throw error;
      })
    );
  }
}