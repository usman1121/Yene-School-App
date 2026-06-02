export { default as apiClient } from './client';

export { authAPI, userAPI } from '@/lib/api/auth';
export {
  attendanceAPI,
  timetableAPI,
  gradingAPI,
  lessonsAPI,
  teachersAPI,
  academicAPI,
} from '@/lib/api/teacher';
export {
  parentDashboardAPI,
  childrenAPI,
  parentAttendanceAPI,
  parentGradesAPI,
  parentFinanceAPI,
  parentTimetableAPI,
  parentLessonsAPI,
} from '@/lib/api/parent';
export { announcementsApi, notificationsApi, calendarApi, dashboardApi, healthApi } from './common.api';
export { studentApi } from './student.api';
export {
  adminUsersApi,
  adminClassesApi,
  adminSectionsApi,
  adminSubjectsApi,
  adminAcademicYearsApi,
  adminSchoolApi,
  adminDashboardApi,
} from './admin.api';
export { registrarApi } from './registrar.api';
export { financeApi } from './finance.api';
export { superAdminApi } from './super-admin.api';
