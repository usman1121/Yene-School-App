export { default as api } from './core';
export * from './auth';
export * from './teacher';
export * from './parent';
export * from './utils';

// Re-export role-specific APIs from src/api for convenience
export {
  adminUsersApi,
  adminClassesApi,
  adminSectionsApi,
  adminSubjectsApi,
  adminAcademicYearsApi,
  adminSchoolApi,
  adminDashboardApi,
} from '@/api/admin.api';

export {
  announcementsApi,
  notificationsApi,
  calendarApi,
  dashboardApi,
  healthApi,
} from '@/api/common.api';

export {
  studentApi,
} from '@/api/student.api';

export {
  registrarApi,
} from '@/api/registrar.api';

export {
  financeApi,
} from '@/api/finance.api';

export {
  superAdminApi,
} from '@/api/super-admin.api';
