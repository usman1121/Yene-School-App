import api from './client';
import type { SubjectGrade, TimetableSlot } from '@/types';

export const studentApi = {
  getMyClass: () => api.get('/students/me/class'),

  getMyTimetable: () => api.get<TimetableSlot[]>('/timetable-slots/student/me'),

  getMyGrades: (params?: { academicYear?: string; termId?: string }) =>
    api.get<SubjectGrade[]>('/grading/student/grades', { params }),

  getMyAttendance: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/attendance/me', { params }),

  getMyAttendanceSummary: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/attendance/me/summary', { params }),

  getMyLessons: (params?: { limit?: number; page?: number }) =>
    api.get('/lessons', { params: { ...params, role: 'STUDENT' } }),

  getUpcomingExams: (params?: { academicYearId?: string }) =>
    api.get('/exams/upcoming', { params }),

  getAssessmentResults: (params?: { academicYearId?: string; termId?: string }) =>
    api.get('/assessments/student/results', { params }),

  getUpcomingAssessments: (params?: { academicYearId?: string }) =>
    api.get('/assessments/student/upcoming', { params }),

  getDashboard: () => api.get('/dashboard/student'),

  getMyReportCards: (params?: { academicYear?: string; term?: string }) =>
    api.get('/report-cards/student/me', { params }),
};
