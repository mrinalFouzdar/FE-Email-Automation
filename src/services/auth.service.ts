import { apiClient } from './api.client';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';
import { getApiUrl } from '../config/api.config';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

    // Store token and user
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(getApiUrl('/auth/register'), data);

    // Store token and user
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async getProfile(): Promise<User> {
    return apiClient.get<User>('/auth/profile');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return apiClient.put<User>('/auth/profile', data);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
