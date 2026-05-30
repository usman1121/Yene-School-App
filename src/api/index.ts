export { default as apiClient } from './client';

export { authApi, userApi } from '@/lib/api/auth';
export {
  attendanceApi,
  timetableApi,
  gradingApi,
  lessonsApi,
  teachersApi,
  academicApi,
} from '@/lib/api/teacher';
export {
  parentDashboardApi,
  childrenApi,
  parentAttendanceApi,
  parentGradesApi,
  parentFinanceApi,
  parentTimetableApi,
  parentLessonsApi,
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
