import api from './core';
import type { TimetableSlot, TeacherAssignment, StudentAttendance, StudentGrade, Lesson, UpcomingClass } from '@/types';

export const attendanceAPI = {
  getTeacherDashboard: () => api.get('/attendance/dashboard/teacher'),

  getMyAssignments: () => api.get('/teachers/me/assignments'),

  getStudentsForClass: (classId: string, className: string, sectionName: string, date: string, sectionId?: string) =>
    api.get('/attendance/students', {
      params: { classId, className, section: sectionName, sectionId, date },
    }),

  openSession: (slotId: string, date: string) =>
    api.post(`/attendance/session/${slotId}`, { date }),

  markAttendance: (sessionId: string, data: { records: Array<{ studentId: string; status: string; remark?: string }> }) =>
    api.post(`/attendance/session/${sessionId}/records`, data),

  submitSession: (sessionId: string) =>
    api.put(`/attendance/session/${sessionId}/submit`),

  getTeacherAttendance: (params?: { date?: string; classId?: string }) =>
    api.get('/attendance/teacher', { params }),
};

export const timetableAPI = {
  getByTeacher: (teacherId: string) =>
    api.get<TimetableSlot[]>(`/timetable-slots/teacher/${teacherId}`),
};

export const gradingAPI = {
  getTeacherAssignments: (params?: { academicYear?: string }) =>
    api.get('/grading/teacher/assignments', { params }),

  getTeacherAssessmentTypes: () =>
    api.get('/grading/teacher/assessment-types'),

  getTeacherStudents: (params: {
    academicYear: string;
    termId: string;
    classId: string;
    sectionId: string;
    subjectId: string;
  }) => api.get('/grading/teacher/students', { params }),

  bulkEnterGrades: (data: { grades: Array<any> }) =>
    api.post('/grading/teacher/grades/bulk', data),

  submitAllGrades: (data: {
    academicYear: string;
    termId: string;
    classId: string;
    sectionId: string;
    subjectId: string;
  }) => api.post('/grading/teacher/grades/submit-all', data),
};

export const lessonsAPI = {
  getAll: (params?: { limit?: number; page?: number }) =>
    api.get<{ data: Lesson[] }>('/lessons', { params }),

  getById: (id: string) => api.get(`/lessons/${id}`),

  getByTeacher: (teacherId: string, params?: { limit?: number }) =>
    api.get<{ data: Lesson[] }>(`/lessons/teacher/${teacherId}`, { params }),
};

export const teachersAPI = {
  getMyAssignments: () => api.get('/teachers/me/assignments'),
};

export const academicAPI = {
  getActiveYear: () => api.get('/academic-years/active'),
  getCurrentTerm: () => api.get('/academic-years/terms/current'),
  getTerms: (academicYearId: string) => api.get(`/academic-years/${academicYearId}/terms`),
};
