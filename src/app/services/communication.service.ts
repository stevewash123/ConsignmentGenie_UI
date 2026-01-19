import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SendNotificationRequest {
  title: string;
  message: string;
  type?: 'info' | 'alert' | 'contact' | 'reminder';
  metadata?: { [key: string]: any };
}

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Send a notification to the shop owner from the current user's context
   */
  sendNotificationToOwner(request: SendNotificationRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/notifications/send-to-owner`, request);
  }

  /**
   * Send contact info as a notification to the owner
   */
  sendContactInfoToOwner(consignorName: string, contactInfo: any): Observable<any> {
    const request: SendNotificationRequest = {
      title: `Contact Info Request: ${consignorName}`,
      message: this.formatContactInfoMessage(consignorName, contactInfo),
      type: 'contact',
      metadata: {
        consignorId: contactInfo.consignorId,
        requestType: 'contact_info',
        contactData: contactInfo
      }
    };

    return this.sendNotificationToOwner(request);
  }

  private formatContactInfoMessage(consignorName: string, contactInfo: any): string {
    let message = `Contact information for ${consignorName}:\n\n`;

    if (contactInfo.email) {
      message += `📧 Email: ${contactInfo.email}\n`;
    }

    if (contactInfo.phone) {
      message += `📞 Phone: ${contactInfo.phone}\n`;
    }

    if (contactInfo.address) {
      message += `📍 Address:\n${contactInfo.address}\n`;
    }

    message += `\nRequested from consignor detail page.`;

    return message;
  }
}