import api from './client';
import type { FeeStructure, Payment, StudentFee } from '@/types';

export const financeApi = {
  getDashboard: () => api.get('/dashboard/admin'),

  feeStructures: {
    list: (params?: { academicYearId?: string; termId?: string }) =>
      api.get('/finance/fee-structures', { params }),

    create: (data: {
      name: string;
      amount: number;
      academicYearId: string;
      termId?: string;
      gradeLevel?: string;
    }) => api.post('/finance/fee-structures', data),

    update: (id: string, data: any) =>
      api.put(`/finance/fee-structures/${id}`, data),

    delete: (id: string) => api.delete(`/finance/fee-structures/${id}`),
  },

  studentFees: {
    list: (params?: { classId?: string; grade?: string; status?: string; page?: number; limit?: number }) =>
      api.get('/finance/student-fees', { params }),

    generate: (data: { academicYearId: string; termId?: string; gradeLevel?: string; classId?: string }) =>
      api.post('/finance/student-fees/generate', data),

    getSummary: (studentId: string, params?: { schoolId?: string; academicYearId?: string; termId?: string }) =>
      api.get(`/finance/student-fees/${studentId}`, { params }),
  },

  payments: {
    list: (params?: { schoolId?: string }) =>
      api.get('/finance/payments', { params }),

    record: (data: {
      studentFeeId: string;
      amountPaid: number;
      method: string;
      paymentDate?: string;
      receiptNumber?: string;
    }) => api.post('/finance/payments/record', data),

    reverse: (paymentId: string, data: { schoolId: string; reason?: string }) =>
      api.post(`/finance/payments/${paymentId}/reverse`, data),
  },

  reports: {
    daily: (params?: { date?: string }) =>
      api.get('/finance/reports/daily', { params }),

    monthly: (params: { month: number; year: number }) =>
      api.get('/finance/reports/monthly', { params }),

    outstanding: (params: { academicYearId: string; termId?: string }) =>
      api.get('/finance/reports/outstanding', { params }),

    overdue: (params: { academicYearId: string; termId?: string }) =>
      api.get('/finance/reports/overdue', { params }),

    studentHistory: (studentId: string) =>
      api.get(`/finance/reports/student/${studentId}/history`),
  },

  discountPolicies: {
    list: (includeInactive?: boolean) =>
      api.get('/finance/discount-policies', { params: { includeInactive } }),

    create: (data: {
      name: string;
      discountType: string;
      discountValue: number;
      isActive?: boolean;
      criteria?: string;
    }) => api.post('/finance/discount-policies', data),

    update: (id: string, data: any) =>
      api.put(`/finance/discount-policies/${id}`, data),

    delete: (id: string) => api.delete(`/finance/discount-policies/${id}`),
  },

  getFeeCollectionMode: () => api.get('/finance/fee-collection-mode'),

  getCurriculumInfo: (params: { academicYearId: string }) =>
    api.get('/finance/curriculum-info', { params }),

  getAuditLogs: (params?: { entityType?: string; entityId?: string; limit?: number }) =>
    api.get('/finance/audit-logs', { params }),
};
