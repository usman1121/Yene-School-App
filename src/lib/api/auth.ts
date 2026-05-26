import api from './core';
import type { AuthResponse, LoginCredentials } from '@/types';

export const authAPI = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', credentials),

  getProfile: () => api.get('/auth/users/me'),

  updateProfile: (data: any) => api.put('/auth/users/me', data),

  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword }),

  requestPasswordReset: (username: string) =>
    api.post('/auth/request-password-reset', { username }),
};

export const userAPI = {
  getProfile: () => api.get('/auth/users/me'),
  updateProfile: (data: { name?: string; email?: string; phone?: string }) =>
    api.put('/auth/users/me', data),
  updateTheme: (theme: string) => api.patch('/auth/users/me/theme', { theme }),
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword }),
};
