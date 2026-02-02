import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RedirectService {
  private http = inject(HttpClient);

  /**
   * Get authorization URL from API and redirect to external OAuth provider
   */
  async redirectToOAuthProvider(apiEndpoint: string): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ authorizationUrl: string }>(`${environment.apiUrl}${apiEndpoint}`)
      );

      if (response?.authorizationUrl) {
        window.location.href = response.authorizationUrl;
      } else {
        throw new Error('No authorization URL received from API');
      }
    } catch (error) {
      console.error('Failed to get authorization URL:', error);
      throw error;
    }
  }

  /**
   * Redirect to QuickBooks OAuth
   */
  async redirectToQuickBooks(): Promise<void> {
    await this.redirectToOAuthProvider('/api/QuickBooks/connect');
  }

  /**
   * Redirect to Square OAuth
   */
  async redirectToSquare(): Promise<void> {
    await this.redirectToOAuthProvider('/api/owner/integrations/square/auth-url');
  }
}