import api from './client';
import type { Enrollment } from '@/types';

export const registrarApi = {
  getDashboard: () => api.get('/dashboard/registrar'),

  getStudents: (params?: { status?: string; grade?: string }) =>
    api.get('/registrar/students', { params }),

  getStudent: (id: string) => api.get(`/registrar/students/${id}`),

  createStudent: (data: {
    email: string;
    name: string;
    academicYear: string;
    gradeId: string;
    gender?: string;
    address?: string;
    phone?: string;
    emergencyContact?: { name: string; phone: string; relationship: string };
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
  }) => api.post('/registrar/students', data),

  updateStudent: (id: string, data: any) =>
    api.put(`/registrar/students/${id}`, data),

  enrollments: {
    getAll: (params?: { status?: string; page?: number }) =>
      api.get('/registrar/enrollments', { params }),

    getPending: () => api.get('/registrar/enrollments/pending'),

    approve: (enrollmentId: string, data: { className: string; section: string; rollNumber: string }) =>
      api.post(`/registrar/enrollments/${enrollmentId}/approve`, data),

    autoApprove: (enrollmentId: string) =>
      api.post(`/registrar/enrollments/${enrollmentId}/auto-approve`),

    reject: (enrollmentId: string, rejectionReason: string) =>
      api.post(`/registrar/enrollments/${enrollmentId}/reject`, { rejectionReason }),
  },

  assignClass: (studentId: string, data: { className: string; section: string; rollNumber: string }) =>
    api.post(`/registrar/students/${studentId}/assign-class`, data),

  uploadDocuments: (studentId: string, documents: any[]) =>
    api.post(`/registrar/students/${studentId}/documents`, { documents }),
};
