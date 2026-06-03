import api from './client';
import type { School } from '@/types';

export const superAdminApi = {
  getDashboard: () => api.get('/dashboard/superadmin'),

  schools: {
    list: () => api.get('/schools'),

    get: (id: string) => api.get(`/schools/${id}`),

    create: (data: { name: string; email: string; address?: string; phone?: string }) =>
      api.post('/schools', data),

    update: (id: string, data: { name?: string; email?: string; address?: string; phone?: string; logoUrl?: string }) =>
      api.put(`/schools/${id}`, data),

    deactivate: (id: string) => api.delete(`/schools/${id}`),
  },

  platformSettings: {
    get: () => api.get('/platform-settings'),

    update: (data: Record<string, any>) => api.put('/platform-settings', data),

    getMaintenanceMode: () => api.get('/platform-settings/maintenance-mode'),

    setMaintenanceMode: (enabled: boolean) =>
      api.post('/platform-settings/maintenance-mode', { enabled }),
  },

  subscriptions: {
    list: () => api.get('/subscription/plans'),

    createPlan: (data: { name: string; tier: string; price: number; features: string[] }) =>
      api.post('/subscription/plans', data),

    updatePlan: (id: string, data: any) => api.put(`/subscription/plans/${id}`, data),
  },
};
