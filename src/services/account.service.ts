import { apiClient } from './api.client';
import type { EmailAccount, CreateAccountRequest } from '../types';

class AccountService {
  async getAll(): Promise<EmailAccount[]> {
    return apiClient.get<EmailAccount[]>('/accounts');
  }

  async getActive(): Promise<EmailAccount[]> {
    return apiClient.get<EmailAccount[]>('/accounts/active');
  }

  async getById(id: number): Promise<EmailAccount> {
    return apiClient.get<EmailAccount>(`/accounts/${id}`);
  }

  async create(data: CreateAccountRequest): Promise<EmailAccount> {
    return apiClient.post<EmailAccount>('/accounts', data);
  }

  async update(id: number, data: Partial<EmailAccount>): Promise<EmailAccount> {
    return apiClient.put<EmailAccount>(`/accounts/${id}`, data);
  }

  async toggleActive(id: number, isActive: boolean): Promise<EmailAccount> {
    return apiClient.patch<EmailAccount>(`/accounts/${id}/toggle`, { is_active: isActive });
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/accounts/${id}`);
  }
}

export const accountService = new AccountService();
