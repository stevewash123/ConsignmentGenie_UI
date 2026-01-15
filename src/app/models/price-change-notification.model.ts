export interface PriceChangeNotification {
  id: string;
  itemId: string;
  itemName: string;
  itemImageUrl?: string;
  consignorId: string;
  consignorName: string;
  consignorEmail: string;
  currentPrice: number;
  proposedPrice: number;
  consignorCurrentEarnings: number;
  consignorProposedEarnings: number;
  commissionRate: number;
  updatedMarketPrice?: number;
  ownerNote?: string;
  daysListed: number;
  status: 'pending' | 'accepted' | 'declined' | 'kept_current';
  createdAt: Date;
  expiresAt?: Date;
  emailToken?: string; // Secure token for email responses
  respondedAt?: Date;
  consignorNote?: string;
}

export interface PriceChangeResponse {
  notificationId: string;
  action: 'accept' | 'keep_current' | 'decline_and_retrieve';
  consignorNote?: string;
  token?: string; // For email-based responses
}

export interface EmailActionRequest {
  token: string;
  action: 'accept' | 'keep_current' | 'decline_and_retrieve';
  consignorNote?: string;
}