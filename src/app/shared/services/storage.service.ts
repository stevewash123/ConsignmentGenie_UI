import { Injectable } from '@angular/core';

// ============================================================================
// Types
// ============================================================================
export interface UserData {
  userId: string;
  email: string;
  role: string | number;
  organizationId: string;
  organizationName: string;
  businessName?: string;
}

// ============================================================================
// Constants
// ============================================================================
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  TOKEN_EXPIRY: 'tokenExpiry',
  USER_DATA: 'user_data',
  USER_ID: 'userId',
  USER_EMAIL: 'userEmail',
  USER_ROLE: 'userRole',
  ORGANIZATION_ID: 'organizationId',
  ORGANIZATION_NAME: 'organizationName',
  BUSINESS_NAME: 'businessName'
} as const;

/**
 * Service for abstracting browser storage operations.
 * Makes components testable by allowing mock injection.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  // ============================================================================
  // Generic Storage Methods
  // ============================================================================

  /**
   * Get item from localStorage
   */
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  /**
   * Set item in localStorage
   */
  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    localStorage.clear();
  }

  /**
   * Get item and parse as JSON
   */
  getJson<T>(key: string): T | null {
    const item = this.getItem(key);
    if (!item) {
      return null;
    }
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set item as JSON string
   */
  setJson<T>(key: string, value: T): void {
    this.setItem(key, JSON.stringify(value));
  }

  // ============================================================================
  // Auth-Specific Methods
  // ============================================================================

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  /**
   * Get authentication token
   */
  getAuthToken(): string | null {
    return this.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Set token expiry time
   */
  setTokenExpiry(expiryTime: string): void {
    this.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime);
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry(): string | null {
    return this.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  }

  /**
   * Set user data (stores individual fields for backward compatibility)
   */
  setUserData(userData: UserData): void {
    this.setJson(STORAGE_KEYS.USER_DATA, userData);

    // Also store individual fields for backward compatibility
    this.setItem(STORAGE_KEYS.USER_ID, userData.userId);
    this.setItem(STORAGE_KEYS.USER_EMAIL, userData.email);
    this.setItem(STORAGE_KEYS.USER_ROLE, String(userData.role));
    this.setItem(STORAGE_KEYS.ORGANIZATION_ID, userData.organizationId);
    this.setItem(STORAGE_KEYS.ORGANIZATION_NAME, userData.organizationName);

    if (userData.businessName) {
      this.setItem(STORAGE_KEYS.BUSINESS_NAME, userData.businessName);
    }
  }

  /**
   * Get user data
   */
  getUserData(): UserData | null {
    return this.getJson<UserData>(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    this.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    this.removeItem(STORAGE_KEYS.USER_DATA);
    this.removeItem(STORAGE_KEYS.USER_ID);
    this.removeItem(STORAGE_KEYS.USER_EMAIL);
    this.removeItem(STORAGE_KEYS.USER_ROLE);
    this.removeItem(STORAGE_KEYS.ORGANIZATION_ID);
    this.removeItem(STORAGE_KEYS.ORGANIZATION_NAME);
    this.removeItem(STORAGE_KEYS.BUSINESS_NAME);
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    const expiry = this.getTokenExpiry();

    if (!token || !expiry) {
      return false;
    }

    return new Date(expiry) > new Date();
  }
}