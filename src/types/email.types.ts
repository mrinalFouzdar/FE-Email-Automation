export interface EmailMeta {
  is_hierarchy: boolean;
  is_client: boolean;
  is_meeting: boolean;
  is_escalation: boolean;
  is_urgent: boolean;
  is_mom: boolean;
}

export interface Email {
  id: number;
  gmail_id: string;
  thread_id?: string;
  subject: string;
  sender_email: string;
  to_recipients: string[];
  cc_recipients: string[];
  recipients: string[];
  body: string;
  is_unread: boolean;
  labels: string[];
  received_at: string;
  created_at: string;
  account_id?: number;
  meta?: EmailMeta;
}

export interface EmailFilters {
  page?: number;
  limit?: number;
  is_unread?: boolean;
  sender?: string;
  search?: string;
  userId?: number;
}
