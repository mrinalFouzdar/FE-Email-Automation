import api from './api';

export interface MeetingNotification {
  id: number;
  meeting_id: number;
  user_id: number;
  type: 'mom_missing' | 'client_replied' | 'mom_draft_ready';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  meeting_subject?: string;
}

export interface Meeting {
  id: number;
  email_id: number | null;
  project_id: number | null;
  project_name?: string;
  thread_id: string;
  subject: string;
  scheduled_at: string | null;
  meeting_end_at: string | null;
  status: 'scheduled' | 'cancelled' | 'done' | 'mom_received' | 'awaiting_reply' | 'closed' | 'mom_missing';
  mom_check_at: string | null;
  mom_received_at: string | null;
  followup_check_at: string | null;
  close_check_at: string | null;
  last_reply_at: string | null;
  created_at: string;
}

export interface MomDraft {
  id: number;
  meeting_id: number;
  content: string;
  generated_by: string;
  draft_type: 'auto' | 'user_refined';
  user_input?: string;
  final_content?: string;
  sent_at?: string | null;
  status: 'pending_review' | 'approved' | 'discarded';
  created_at: string;
}

export interface ComplianceStats {
  total_meetings: number;
  mom_received_count: number;
  cancelled_count: number;
  avg_mom_delay_hours: number;
  compliance_rate: number;
}

export const meetingService = {
  getMeetings: (projectId?: number, filter?: string) =>
    api.get('/meetings', { params: { projectId, filter } }),

  getComplianceStats: () =>
    api.get('/meetings/stats/compliance'),

  updateMeetingStatus: (id: number, status: string) =>
    api.patch(`/meetings/${id}/status`, { status }),

  getMomDraft: (meetingId: number) =>
    api.get(`/meetings/${meetingId}/mom-draft`),

  updateDraftStatus: (meetingId: number, draftId: number, status: string) =>
    api.patch(`/meetings/${meetingId}/mom-draft/${draftId}`, { status }),

  getUnreadNotifications: () =>
    api.get('/meetings/notifications/unread'),

  markNotificationRead: (id: number) =>
    api.patch(`/meetings/notifications/${id}/read`),

  markAllRead: () =>
    api.patch('/meetings/notifications/read-all'),

  refineMomDraft: (meetingId: number, userInput: string) =>
    api.post(`/meetings/${meetingId}/mom-draft/refine`, { userInput }),

  updateDraftContent: (meetingId: number, draftId: number, content: string) =>
    api.patch(`/meetings/${meetingId}/mom-draft/${draftId}/content`, { content }),

  sendMomEmail: (meetingId: number, draftId: number) =>
    api.post(`/meetings/${meetingId}/mom-draft/${draftId}/send`),
};
