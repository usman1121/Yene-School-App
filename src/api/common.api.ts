import api from './client';
import type { Announcement, Notification, Event, DashboardResponse } from '@/types';

export const announcementsApi = {
  getAll: (params?: { page?: number; limit?: number; role?: string }) =>
    api.get<{ data: Announcement[] }>('/announcements', { params }),

  getById: (id: string) => api.get<Announcement>(`/announcements/${id}`),

  create: (data: { title: string; content: string; priority?: string }) =>
    api.post('/announcements', data),

  update: (id: string, data: { title?: string; content?: string; priority?: string }) =>
    api.put(`/announcements/${id}`, data),

  delete: (id: string) => api.delete(`/announcements/${id}`),

  getActiveCount: (params?: { role?: string }) =>
    api.get<{ count: number }>('/announcements/active-count', { params }),
};

export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean; type?: string }) =>
    api.get<Notification[]>('/notifications', { params }),

  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),

  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),

  markAllAsRead: () => api.post('/notifications/mark-all-read'),

  getPreferences: () => api.get('/notifications/preferences'),

  updatePreferences: (data: any) => api.put('/notifications/preferences', data),
};

export const calendarApi = {
  getCurrentEthiopianYear: () => api.get<{ year: number }>('/calendar/ethiopian-year'),

  getCurrentDate: () => api.get('/calendar/current'),

  convertToEthiopian: (date: string) => api.get('/calendar/convert', { params: { date } }),

  convertToGregorian: (year: number, month: number, day: number) =>
    api.get('/calendar/convert-to-gregorian', { params: { year, month, day } }),

  getSchoolCalendarMode: (schoolId: string) =>
    api.get(`/calendar/school/${schoolId}/mode`),
};

export const dashboardApi = {
  get: () => api.get<DashboardResponse>('/dashboard'),

  getTeacher: () => api.get<DashboardResponse>('/dashboard/teacher'),

  getStudent: () => api.get<DashboardResponse>('/dashboard/student'),

  getParent: () => api.get<DashboardResponse>('/dashboard/parent'),

  getAdmin: () => api.get<DashboardResponse>('/dashboard/admin'),

  getRegistrar: () => api.get<DashboardResponse>('/dashboard/registrar'),

  getSuperAdmin: () => api.get<DashboardResponse>('/dashboard/superadmin'),

  getItManager: () => api.get<DashboardResponse>('/dashboard/it-manager'),
};

export const healthApi = {
  check: () => api.get('/health'),
};
