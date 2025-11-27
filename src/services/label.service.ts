import { apiClient } from './api.client';
import type { Label, CreateLabelRequest } from '../types';

class LabelService {
  async getAll(): Promise<Label[]> {
    return apiClient.get<Label[]>('/labels');
  }

  async getSystemLabels(): Promise<Label[]> {
    return apiClient.get<Label[]>('/labels/system');
  }

  async getById(id: number): Promise<Label> {
    return apiClient.get<Label>(`/labels/${id}`);
  }

  async create(data: CreateLabelRequest): Promise<Label> {
    return apiClient.post<Label>('/labels', data);
  }

  async update(id: number, data: Partial<Label>): Promise<Label> {
    return apiClient.put<Label>(`/labels/${id}`, data);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/labels/${id}`);
  }

  async assignToEmail(emailId: number, labelId: number, confidence?: number): Promise<void> {
    return apiClient.post<void>('/labels/assign', {
      email_id: emailId,
      label_id: labelId,
      confidence_score: confidence,
    });
  }

  async getEmailLabels(emailId: number): Promise<Label[]> {
    return apiClient.get<Label[]>(`/labels/email/${emailId}`);
  }

  async removeFromEmail(emailId: number, labelId: number): Promise<void> {
    return apiClient.delete<void>(`/labels/email/${emailId}/${labelId}`);
  }
}

export const labelService = new LabelService();
