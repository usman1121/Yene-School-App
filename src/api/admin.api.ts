import api from './client';
import type { User, Class, Section, Subject, AcademicYear, FeeStructure, Announcement, School } from '@/types';

export const adminUsersApi = {
  getUsers: (params?: { role?: string; page?: number; limit?: number }) =>
    api.get('/auth/users', { params }),

  getTeachers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/auth/users/teachers', { params }),

  getUser: (id: string) => api.get(`/auth/users/${id}`),

  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) =>
    api.post('/auth/change-password', data),

  createTeacher: (data: { email: string; name: string }) =>
    api.post('/auth/register/teacher', data),

  createStudent: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register/student', data),

  createStudentFull: (data: { email?: string; name: string; academicYear: string; grade: number; section?: string }) =>
    api.post('/students', data),

  createParent: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register/parent', data),

  createRegistrar: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register/registrar', data),

  updateUser: (id: string, data: { email?: string; name?: string; phone?: string }) =>
    api.put(`/auth/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),

  adminResetPassword: (userId: string, data: { temporaryPassword: string }) =>
    api.post(`/auth/admin/reset-user-password/${userId}`, data),
};

export const adminClassesApi = {
  getClasses: (params?: { academicYearId?: string }) =>
    api.get('/classes', { params }),

  getClass: (id: string) => api.get(`/classes/${id}`),

  createClass: (data: { name: string; grade: number; section: string; academicYearId: string }) =>
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

  assignToClass: (data: { classId: string; subjectId: string; sectionId: string; academicYearId: string; teacherId?: string }) =>
    api.post('/class-subjects', data),

  listAssignments: (params?: { classId?: string; teacherId?: string }) =>
    api.get('/class-subjects', { params }),

  getAssignmentsByClass: (classId: string) =>
    api.get(`/class-subjects/by-class/${classId}`),

  getAssignmentsByTeacher: (teacherId: string) =>
    api.get(`/class-subjects/by-teacher/${teacherId}`),

  bulkAssign: (data: { assignments: { classId: string; subjectId: string; sectionId: string; academicYearId: string }[] }) =>
    api.post('/class-subjects/bulk-assign', data),

  updateAssignment: (id: string, data: any) =>
    api.put(`/class-subjects/${id}`, data),

  deleteAssignment: (id: string) =>
    api.delete(`/class-subjects/${id}`),
};

export const adminAcademicYearsApi = {
  getAcademicYears: (params?: { schoolId?: string }) =>
    api.get('/academic-years', { params }),

  getActiveAcademicYear: (params?: { schoolId?: string }) =>
    api.get('/academic-years/active', { params }),

  getAcademicYear: (id: string) => api.get(`/academic-years/${id}`),

  createAcademicYear: (data: { name: string; startDate: string; endDate: string; curriculumType?: string; calendarType?: string }) =>
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

export const adminTimetableApi = {
  getSlots: (params?: { classId?: string; teacherId?: string }) =>
    api.get('/timetable-slots', { params }),

  getByClass: (classId: string) =>
    api.get(`/timetable-slots/class/${classId}`),

  getByTeacher: (teacherId: string) =>
    api.get(`/timetable-slots/teacher/${teacherId}`),

  getGrid: (classId: string) =>
    api.get(`/timetable-slots/grid/class/${classId}`),

  createSlot: (data: { classId: string; sectionId: string; subjectId: string; dayOfWeek: number; period: number; startTime: string; endTime: string; room?: string }) =>
    api.post('/timetable-slots', data),

  bulkCreate: (data: { slots: any[] }) =>
    api.post('/timetable-slots/bulk', data),

  autoGenerate: (data: { classId: string; academicYearId: string }) =>
    api.post('/timetable-slots/auto-generate', data),

  updateSlot: (id: string, data: any) =>
    api.patch(`/timetable-slots/${id}`, data),

  deleteSlot: (id: string) =>
    api.delete(`/timetable-slots/${id}`),

  deleteAllForClass: (classId: string, sectionId: string) =>
    api.delete(`/timetable-slots/class/${classId}/section/${sectionId}`),
};

export const adminEnrollmentApi = {
  getRequests: (params?: { schoolId?: string; status?: string }) =>
    api.get('/enrollment/requests', { params }),

  getRequest: (id: string) => api.get(`/enrollment/requests/${id}`),

  approveRequest: (id: string, data?: any) =>
    api.post(`/enrollment/requests/${id}/approve`, data || {}),

  rejectRequest: (id: string, data: { reason: string }) =>
    api.post(`/enrollment/requests/${id}/reject`, data),

  waitlistRequest: (id: string) =>
    api.post(`/enrollment/requests/${id}/waitlist`),

  cancelRequest: (id: string) =>
    api.delete(`/enrollment/requests/${id}`),

  sendCredentials: (id: string) =>
    api.post(`/enrollment/requests/${id}/send-credentials`),

  getStats: () => api.get('/enrollment/stats'),
};

export const adminCommunicationApi = {
  getTickets: (params?: { status?: string; category?: string }) =>
    api.get('/communications', { params }),

  getTicket: (id: string) => api.get(`/communications/${id}`),

  createTicket: (data: { studentId: string; subject: string; message: string; category: string; classId?: string }) =>
    api.post('/communications', data),

  updateStatus: (id: string, status: string) =>
    api.put(`/communications/${id}/status`, { status }),

  addReply: (id: string, data: { message: string }) =>
    api.post(`/communications/${id}/replies`, data),

  deleteReply: (replyId: string) =>
    api.delete(`/communications/replies/${replyId}`),

  deleteTicket: (id: string) =>
    api.delete(`/communications/${id}`),

  getUnreadCount: () => api.get('/communications/unread-count'),

  getMyCount: () => api.get('/communications/my-count'),
};

export const adminFinanceApi = {
  getFeeStructures: () => api.get('/finance/fee-structures'),

  createFeeStructure: (data: { name: string; amount: number; grade: number; academicYearId: string; term?: string }) =>
    api.post('/finance/fee-structures', data),

  updateFeeStructure: (id: string, data: any) =>
    api.put(`/finance/fee-structures/${id}`, data),

  deleteFeeStructure: (id: string) =>
    api.delete(`/finance/fee-structures/${id}`),

  clearFeeStructures: () => api.delete('/finance/fee-structures'),

  generateStudentFees: (data: { academicYearId: string; grade?: number }) =>
    api.post('/finance/student-fees/generate', data),

  getStudentFees: (params?: { studentId?: string; status?: string }) =>
    api.get('/finance/student-fees', { params }),

  getStudentFee: (studentId: string) =>
    api.get(`/finance/student-fees/${studentId}`),

  recordPayment: (data: { studentFeeId: string; amount: number; method: string; reference?: string }) =>
    api.post('/finance/payments/record', data),

  reversePayment: (paymentId: string) =>
    api.post(`/finance/payments/${paymentId}/reverse`),

  getDailyReport: (params?: { date?: string }) =>
    api.get('/finance/reports/daily', { params }),

  getMonthlyReport: (params?: { year?: number; month?: number }) =>
    api.get('/finance/reports/monthly', { params }),

  getOutstandingReport: () => api.get('/finance/reports/outstanding'),

  getOverdueReport: () => api.get('/finance/reports/overdue'),

  markOverdue: () => api.post('/finance/fees/mark-overdue'),

  getAuditLogs: () => api.get('/finance/audit-logs'),

  getDiscountPolicies: () => api.get('/finance/discount-policies'),

  createDiscountPolicy: (data: { name: string; type: string; value: number; schoolId: string; feeStructureId?: string }) =>
    api.post('/finance/discount-policies', data),

  updateDiscountPolicy: (id: string, data: any) =>
    api.put(`/finance/discount-policies/${id}`, data),

  deleteDiscountPolicy: (id: string) =>
    api.delete(`/finance/discount-policies/${id}`),

  getCollectionMode: () => api.get('/finance/fee-collection-mode'),

  getCurriculumInfo: () => api.get('/finance/curriculum-info'),
};

export const adminAnnouncementApi = {
  getList: (params?: { targetRole?: string }) =>
    api.get('/announcements', { params }),

  getActiveCount: () => api.get('/announcements/active-count'),

  get: (id: string) => api.get(`/announcements/${id}`),

  create: (data: { title: string; content: string; targetRoles?: string[] }) =>
    api.post('/announcements', data),

  update: (id: string, data: any) =>
    api.put(`/announcements/${id}`, data),

  delete: (id: string) =>
    api.delete(`/announcements/${id}`),
};

export const adminEventApi = {
  getList: (params?: { type?: string }) =>
    api.get('/events', { params }),

  getUpcomingCount: () => api.get('/events/upcoming-count'),

  getActiveCount: () => api.get('/events/active-count'),

  get: (id: string) => api.get(`/events/${id}`),

  create: (data: { title: string; description: string; startDate: string; endDate: string; type: string }) =>
    api.post('/events', data),

  update: (id: string, data: any) =>
    api.put(`/events/${id}`, data),

  delete: (id: string) =>
    api.delete(`/events/${id}`),
};

export const adminDisciplineApi = {
  getList: (params?: { studentId?: string; severity?: string; status?: string }) =>
    api.get('/discipline', { params }),

  get: (id: string) => api.get(`/discipline/${id}`),

  getByStudent: (studentId: string) =>
    api.get(`/discipline/student/${studentId}`),

  create: (data: { studentId: string; incidentType: string; description: string; severity: string; date?: string }) =>
    api.post('/discipline', data),

  update: (id: string, data: any) =>
    api.put(`/discipline/${id}`, data),

  delete: (id: string) =>
    api.delete(`/discipline/${id}`),
};

export const adminAttendanceApi = {
  getToday: () => api.get('/attendance/today'),

  openSession: (slotId: string) =>
    api.post(`/attendance/session/${slotId}`),

  getSession: (id: string) => api.get(`/attendance/session/${id}`),

  getStudentsForAttendance: () => api.get('/attendance/students'),

  markAttendance: (sessionId: string, records: { studentId: string; status: string }[]) =>
    api.post(`/attendance/session/${sessionId}/records`, { records }),

  submitSession: (id: string) =>
    api.put(`/attendance/session/${id}/submit`),

  getMyAttendance: (params?: { page?: number; limit?: number }) =>
    api.get('/attendance/me', { params }),

  getMySummary: () => api.get('/attendance/me/summary'),

  getSessions: (params?: { classId?: string; date?: string }) =>
    api.get('/attendance/sessions', { params }),

  getSummary: (params?: { date?: string }) =>
    api.get('/attendance/summary', { params }),

  getMissing: (params?: { date?: string }) =>
    api.get('/attendance/missing', { params }),

  notifyMissing: (data: { classId?: string; date?: string }) =>
    api.post('/attendance/missing/notify', data),

  overrideRecord: (id: string, data: { status: string; reason: string }) =>
    api.put(`/attendance/record/${id}`, data),

  getAdminDashboard: () => api.get('/attendance/dashboard/admin'),

  getTeacherDashboard: () => api.get('/attendance/dashboard/teacher'),

  getStudentDashboard: () => api.get('/attendance/dashboard/student'),

  getParentDashboard: (studentId: string) =>
    api.get(`/attendance/dashboard/parent/${studentId}`),
};

export const adminExamsApi = {
  getList: (params?: { classId?: string; status?: string }) =>
    api.get('/exams', { params }),

  get: (id: string) => api.get(`/exams/${id}`),

  create: (data: { name: string; examType: string; classId: string; academicYearId: string; subjectId: string; title: string; type: string; date: string; maxScore?: number }) =>
    api.post('/exams', data),

  update: (id: string, data: any) =>
    api.put(`/exams/${id}`, data),

  delete: (id: string) =>
    api.delete(`/exams/${id}`),

  enterResults: (id: string, data: { results: { studentId: string; score: number }[] }) =>
    api.post(`/exams/${id}/results`, data),

  publishTermResults: (data: { termId: string; classId: string }) =>
    api.post('/exams/publish', data),

  getTeacherExams: () => api.get('/exams/teacher/me'),

  getStudentUpcoming: () => api.get('/exams/student/upcoming'),

  getStudentResults: () => api.get('/exams/student/results'),

  // Seating plans
  getSeatingPlans: (params?: { examId?: string }) =>
    api.get('/exams/seating/plans', { params }),

  createSeatingPlan: (examType: string, data: any) =>
    api.post(`/exams/seating/type/${examType}/seating-plan`, data),

  getSeatingPlan: (id: string) =>
    api.get(`/exams/seating/plan/${id}`),

  generateSeating: (id: string) =>
    api.post(`/exams/seating/plan/${id}/generate`),

  deleteSeatingPlan: (id: string) =>
    api.delete(`/exams/seating/plan/${id}`),

  deleteStudentAssignments: (id: string) =>
    api.delete(`/exams/seating/plan/${id}/students`),

  printSeatingPlan: (id: string) =>
    api.get(`/exams/seating/plan/${id}/print`),

  exportSeatingExcel: (id: string) =>
    api.get(`/exams/seating/plan/${id}/excel`),
};

export const adminDashboardApi = {
  get: () => api.get('/dashboard/admin'),
};
