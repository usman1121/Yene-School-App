export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'IT_MANAGER'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT'
  | 'REGISTRAR'
  | 'FINANCE';

export interface User {
  id: string;
  email: string;
  username?: string;
  name: string;
  role: UserRole;
  schoolId?: string;
  isActive?: boolean;
  phone?: string;
  avatarUrl?: string;
  theme?: 'LIGHT' | 'DARK' | 'SYSTEM';
  calendarType?: 'GREGORIAN' | 'ETHIOPIAN';
  permissions?: string[];
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  loginIdentifier: string;
  password: string;
}

// Teacher types
export interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  class: { id: string; name: string; grade: number; homeroomTeacherId?: string | null };
  section: { id: string; name: string };
  subject: { id: string; name: string; code?: string };
}

export interface TeacherAssignment {
  id: string;
  subject: { id: string; name: string };
  class: { id: string; name: string };
  section: { id: string; name: string };
  type?: string;
  isHomeroom?: boolean;
  timetableSlotId?: string;
}

export interface StudentAttendance {
  id: string;
  rollNumber: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  avatarUrl?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'UNMARKED';
  remark: string;
}

export interface StudentGrade {
  studentId: string;
  studentName: string;
  rollNumber: string;
  caScore: number | null;
  midScore: number | null;
  finalScore: number | null;
  totalScore: number | null;
  gradeLetter: string | null;
  remark: string | null;
  status: string;
  isLocked?: boolean;
  gradeId?: string | null;
  componentScores?: Record<string, number | null>;
}

export interface Lesson {
  id: string;
  title: string;
  subject?: { name: string };
  class?: { name: string };
  section?: { name: string };
  isPublished: boolean;
  createdAt: string;
}

export interface UpcomingClass {
  id: string;
  className: string;
  grade: string;
  section: string;
  subject: string;
  time: string;
  room: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  canTakeAttendance?: boolean;
}

// Parent types
export interface Child {
  id: string;
  userId?: string;
  name: string;
  studentCode: string;
  className: string;
  section: string;
  relation: string;
  attendance: string;
  presentDays: number;
  totalDays: number;
  upcomingExams: number;
  overallGrade: string;
  feeBalance: number;
  totalPaid: number;
  totalDue: number;
  photoUrl?: string | null;
  avatarUrl?: string | null;
  attendanceTrend?: { week: string; percentage: number }[];
  grades?: { subject: string; currentGrade: string; average: string; status: string }[];
  homeroomTeacher?: { id: string; name: string; email?: string; phone?: string } | null;
}

export interface FeePeriodSummary {
  id: string;
  name: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
}

export interface SubjectGrade {
  id: string;
  subject: { id: string; name: string };
  class: { id: string; name: string };
  section: { id: string; name: string };
  term: { id: string; name: string };
  caScore: number | null;
  midScore: number | null;
  finalScore: number | null;
  totalScore: number | null;
  gradeLetter: string | null;
  gradePoint: number | null;
  remark: string | null;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  priority?: 'high' | 'medium' | 'low';
  authorId: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}
