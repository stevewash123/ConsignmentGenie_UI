import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

declare global {
  interface Window {
    Plaid: any;
  }
}

export interface PlaidLinkConfig {
  token: string;
  onSuccess: (public_token: string, metadata: any) => void;
  onExit: (err: any, metadata: any) => void;
  onEvent?: (eventName: string, metadata: any) => void;
  onLoad?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class PlaidLinkService {
  private plaidReadySubject = new BehaviorSubject<boolean>(false);
  public plaidReady$ = this.plaidReadySubject.asObservable();

  constructor() {
    this.loadPlaidScript();
  }

  private loadPlaidScript(): void {
    // Check if Plaid is already loaded
    if (window.Plaid) {
      this.plaidReadySubject.next(true);
      return;
    }

    // Check if script is already added
    if (document.querySelector('script[src*="plaid"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    script.onload = () => {
      this.plaidReadySubject.next(true);
    };
    script.onerror = (error) => {
      console.error('Failed to load Plaid Link script:', error);
      this.plaidReadySubject.next(false);
    };

    document.head.appendChild(script);
  }

  openPlaidLink(config: PlaidLinkConfig): void {
    if (!window.Plaid) {
      console.error('Plaid Link is not loaded');
      return;
    }

    const linkHandler = window.Plaid.create(config);
    linkHandler.open();
  }

  isPlaidReady(): Observable<boolean> {
    return this.plaidReady$;
  }
}