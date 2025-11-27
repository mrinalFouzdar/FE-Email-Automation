export interface Email {
  id: number;
  gmail_id?: string;
  thread_id?: string;
  sender_email: string;
  sender_name?: string;
  to_recipients?: string[];
  cc_recipients?: string[];
  subject: string;
  body: string;
  is_unread: boolean;
  labels?: string[];
  received_at: string;
  created_at: string;
  account_id?: number;
}

export interface EmailFilters {
  page?: number;
  limit?: number;
  is_unread?: boolean;
  sender?: string;
  search?: string;
}
