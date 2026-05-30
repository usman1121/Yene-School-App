import api from './client';
import type { User, Class, Section, Subject, AcademicYear, FeeStructure, Announcement, School } from '@/types';

export const adminUsersApi = {
  getUsers: (params?: { role?: string; page?: number; limit?: number }) =>
    api.get('/auth/users', { params }),

  getTeachers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/auth/users/teachers', { params }),

  getUser: (id: string) => api.get(`/auth/users/${id}`),

  createTeacher: (data: { email: string; name: string }) =>
    api.post('/auth/register/teacher', data),

  createStudent: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register/student', data),

  createParent: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register/parent', data),

  createRegistrar: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register/registrar', data),

  updateUser: (id: string, data: { email?: string; password?: string; name?: string }) =>
    api.put(`/auth/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),

  adminResetPassword: (userId: string, data: { temporaryPassword: string }) =>
    api.post(`/auth/admin/reset-user-password/${userId}`, data),
};

export const adminClassesApi = {
  getClasses: (params?: { academicYearId?: string }) =>
    api.get('/classes', { params }),

  getClass: (id: string) => api.get(`/classes/${id}`),

  createClass: (data: { name: string; grade: number }) =>
    api.post('/classes', data),

  updateClass: (id: string, data: any) => api.put(`/classes/${id}`, data),

  deleteClass: (id: string) => api.delete(`/classes/${id}`),

  getGrades: () => api.get('/classes/grades/list'),
};

export const adminSectionsApi = {
  getSections: (classId: string) => api.get(`/sections`, { params: { classId } }),

  createSection: (data: { name: string; classId: string; capacity?: number }) =>
    api.post('/sections', data),

  updateSection: (id: string, data: any) => api.put(`/sections/${id}`, data),

  deleteSection: (id: string) => api.delete(`/sections/${id}`),
};

export const adminSubjectsApi = {
  getSubjects: () => api.get('/subjects'),

  createSubject: (data: { name: string; code?: string }) =>
    api.post('/subjects', data),

  updateSubject: (id: string, data: any) => api.put(`/subjects/${id}`, data),

  deleteSubject: (id: string) => api.delete(`/subjects/${id}`),

  assignToClass: (data: { classId: string; subjectId: string; sectionId?: string; teacherId?: string }) =>
    api.post('/class-subject', data),
};

export const adminAcademicYearsApi = {
  getAcademicYears: (params?: { schoolId?: string }) =>
    api.get('/academic-years', { params }),

  getActiveAcademicYear: (params?: { schoolId?: string }) =>
    api.get('/academic-years/active', { params }),

  getAcademicYear: (id: string) => api.get(`/academic-years/${id}`),

  createAcademicYear: (data: { name: string; curriculumType?: string }) =>
    api.post('/academic-years', data),

  updateAcademicYear: (id: string, data: any) =>
    api.put(`/academic-years/${id}`, data),

  activateAcademicYear: (id: string) =>
    api.put(`/academic-years/${id}/activate`),

  deleteAcademicYear: (id: string) => api.delete(`/academic-years/${id}`),

  getTerms: (academicYearId: string) =>
    api.get(`/academic-years/${academicYearId}/terms`),

  createTerm: (academicYearId: string, data: any) =>
    api.post(`/academic-years/${academicYearId}/terms`, data),

  updateTerm: (termId: string, data: any) =>
    api.put(`/academic-years/terms/${termId}`, data),

  lockTerm: (termId: string, isLocked: boolean) =>
    api.put(`/academic-years/terms/${termId}/lock`, { isLocked }),

  getPeriodWeights: (academicYearId: string) =>
    api.get(`/academic-years/${academicYearId}/period-weights`),

  validatePeriodWeights: (academicYearId: string) =>
    api.get(`/academic-years/${academicYearId}/validate-weights`),
};

export const adminSchoolApi = {
  getSchool: (id: string) => api.get(`/schools/${id}`),

  updateSchool: (id: string, data: { name?: string; email?: string; address?: string; phone?: string; logoUrl?: string }) =>
    api.put(`/schools/${id}`, data),

  uploadLogo: (id: string, file: FormData) =>
    api.post(`/schools/${id}/logo`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const adminDashboardApi = {
  get: () => api.get('/dashboard/admin'),
};
