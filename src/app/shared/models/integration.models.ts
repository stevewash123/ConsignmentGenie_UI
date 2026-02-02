// Shared integration-related models and interfaces

export interface SquareStatus {
  isConnected: boolean;
  merchantId?: string;
  merchantName?: string;
  connectedAt?: Date;
  lastSync?: Date;
  itemCount?: number;
  lastCatalogSync?: Date;
  lastSalesImport?: Date;
  lastSalesImportCount?: number;
  itemLinkSummary?: {
    total: number;
    linked: number;
    shopOwned: number;
    skipped: number;
    unlinked: number;
  };
  error?: string;
}

export interface SquareConnectionResponse {
  success: boolean;
  oauthUrl?: string;
  error?: string;
}

export interface SquareDisconnectResponse {
  success: boolean;
  message?: string;
}

export interface SquareSyncResponse {
  success: boolean;
  message?: string;
  itemsProcessed?: number;
  itemsLinked?: number;
  itemsSkipped?: number;
  error?: string;
}