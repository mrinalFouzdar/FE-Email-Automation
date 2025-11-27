export type EmailProvider = 'gmail' | 'imap';

export interface EmailAccount {
  id: number;
  user_id: number;
  email: string;
  provider: EmailProvider;
  is_active: boolean;
  imap_host?: string;
  imap_port?: number;
  imap_user?: string;
  imap_tls?: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateAccountRequest {
  email: string;
  provider: EmailProvider;
  imap_host?: string;
  imap_port?: number;
  imap_user?: string;
  imap_password?: string;
  imap_tls?: boolean;
}
