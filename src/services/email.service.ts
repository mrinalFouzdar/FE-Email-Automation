import { apiClient } from './api.client';
import type { Email, EmailFilters, PaginatedResponse } from '../types';

class EmailService {
  async getAll(filters?: EmailFilters): Promise<PaginatedResponse<Email[]>> {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.is_unread !== undefined) params.append('is_unread', filters.is_unread.toString());
    if (filters?.sender) params.append('sender', filters.sender);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.userId) params.append('userId', filters.userId.toString());

    const url = `/emails${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get<PaginatedResponse<Email[]>>(url);
  }

  async getById(id: number): Promise<Email> {
    return apiClient.get<Email>(`/emails/${id}`);
  }

  async create(data: Partial<Email>): Promise<Email> {
    return apiClient.post<Email>('/emails', data);
  }

  async markAsRead(id: number, isRead = true): Promise<Email> {
    return apiClient.patch<Email>(`/emails/${id}/read`, { is_read: isRead });
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/emails/${id}`);
  }

  async getUnreadCount(accountId?: number): Promise<{ count: number }> {
    const url = accountId ? `/emails/unread-count?account_id=${accountId}` : '/emails/unread-count';
    return apiClient.get<{ count: number }>(url);
  }
}

export const emailService = new EmailService();
