import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  async getBranding(): Promise<StoreBranding | null> {
    try {
      const response = await this.http.get<StoreBranding>(`${this.apiUrl}/branding`).toPromise();
      return response || null;
    } catch (error) {
      console.error('Error loading branding settings:', error);
      throw error;
    }
  }

  async saveBranding(branding: StoreBranding): Promise<StoreBranding> {
    try {
      const response = await this.http.put<StoreBranding>(`${this.apiUrl}/branding`, branding).toPromise();
      if (!response) {
        throw new Error('No response received');
      }
      return response;
    } catch (error) {
      console.error('Error saving branding settings:', error);
      throw error;
    }
  }

  async uploadLogo(file: File): Promise<LogoUploadResult> {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await this.http.post<LogoUploadResult>(`${this.apiUrl}/branding/logo`, formData).toPromise();
      if (!response) {
        throw new Error('No response received');
      }
      return response;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  }

  async removeLogo(): Promise<void> {
    try {
      await this.http.delete(`${this.apiUrl}/branding/logo`).toPromise();
    } catch (error) {
      console.error('Error removing logo:', error);
      throw error;
    }
  }

  async previewStorefront(branding: StoreBranding): Promise<string> {
    try {
      const response = await this.http.post<{ previewUrl: string }>(`${this.apiUrl}/theme-preview`, branding).toPromise();
      if (!response?.previewUrl) {
        throw new Error('No preview URL received');
      }
      return response.previewUrl;
    } catch (error) {
      console.error('Error generating storefront preview:', error);
      throw error;
    }
  }
}