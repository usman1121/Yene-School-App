import api from './core';
import type { Child, SubjectGrade, Announcement, AttendanceRecord, TimetableSlot } from '@/types';

export const parentDashboardAPI = {
  getDashboard: () => api.get('/dashboard/parent'),
  getGeneralDashboard: () => api.get('/dashboard/parent'),
  getChildren: () => api.get('/parents/me/children'),
  getStudentEnrollment: (studentUserId: string) => api.get(`/enrollments/student/${studentUserId}`),
  getStudentClass: (classId: string) => api.get(`/classes/${classId}`),
};

export const childrenAPI = {
  getMyChildren: () => api.get<{ children: Child[] }>('/parents/me/children'),

  getChildDetail: (childId: string) => api.get<Child>(`/parents/me/children/${childId}`),
};

export const parentAttendanceAPI = {
  getChildAttendance: (childId: string, params?: { startDate?: string; endDate?: string }) =>
    api.get<AttendanceRecord[]>(`/attendance/student/${childId}`, { params }),

  getChildDashboard: (childId: string) => api.get(`/attendance/dashboard/parent/${childId}`),
};

export const parentGradesAPI = {
  getChildGrades: (childId: string, params?: { academicYear?: string; termId?: string }) =>
    api.get<SubjectGrade[]>(`/grading/parent/grades/${childId}`, { params }),

  getFinalGrades: (childId: string, params?: { academicYear?: string; termId?: string }) =>
    api.get(`/grading/parent/final-grades/${childId}`, { params }),

  getPublishedReportCards: (childId: string, params?: { academicYear?: string; term?: string }) =>
    api.get(`/report-cards/parent/${childId}/published`, { params }),
};

export const parentFinanceAPI = {
  getChildFees: (childId: string, schoolId?: string, academicYearId?: string) =>
    api.get(`/finance/student-fees/${childId}`, {
      params: { schoolId, academicYearId },
    }),
};

export const parentTimetableAPI = {
  getChildTimetable: (childId: string) =>
    api.get<TimetableSlot[]>(`/timetable-slots/student/${childId}`),
};

export const parentLessonsAPI = {
  getChildLessons: (childId: string, params?: { limit?: number; page?: number }) =>
    api.get('/lessons', { params: { ...params, studentId: childId } }),
};

export const announcementsAPI = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<{ data: Announcement[] }>('/announcements', { params }),

  getById: (id: string) => api.get<Announcement>(`/announcements/${id}`),
};

export const notificationsAPI = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/notifications', { params }),

  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch('/notifications/read-all'),

  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
};
