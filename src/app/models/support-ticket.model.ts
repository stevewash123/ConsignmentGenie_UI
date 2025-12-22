export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo: string; // 'owner' or 'admin'
  submittedBy: string; // user email or name
  submittedAt: string;
  updatedAt: string;
  organizationId: string;
  responses?: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  message: string;
  respondedBy: string;
  respondedAt: string;
  isInternal: boolean; // true for admin notes, false for public responses
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  assignedTo?: string;
  priority?: TicketPriority;
}

export interface AddResponseRequest {
  message: string;
  isInternal?: boolean;
}

export type TicketCategory = 'content' | 'technical' | 'billing' | 'other';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export const TICKET_CATEGORIES: { value: TicketCategory; label: string; description: string; routeTo: 'owner' | 'admin' }[] = [
  { value: 'content', label: 'Content Issues', description: 'Incorrect item data, pricing, or inventory problems', routeTo: 'owner' },
  { value: 'technical', label: 'Technical Issues', description: 'Software bugs, system errors, or performance problems', routeTo: 'admin' },
  { value: 'billing', label: 'Billing & Payments', description: 'Payment processing, subscription, or account billing issues', routeTo: 'admin' },
  { value: 'other', label: 'Other', description: 'General questions or issues not covered above', routeTo: 'admin' }
];

export const TICKET_STATUSES: { value: TicketStatus; label: string; color: string }[] = [
  { value: 'open', label: 'Open', color: 'text-red-600' },
  { value: 'in_progress', label: 'In Progress', color: 'text-yellow-600' },
  { value: 'resolved', label: 'Resolved', color: 'text-green-600' },
  { value: 'closed', label: 'Closed', color: 'text-gray-600' }
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-blue-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
];