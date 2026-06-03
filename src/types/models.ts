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

export interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  class: { id: string; name: string; grade?: number; homeroomTeacherId?: string | null };
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
  subject?: { name: string; id?: string };
  class?: { name: string; id?: string };
  section?: { name: string; id?: string };
  isPublished: boolean;
  createdAt: string;
}

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

export interface SubjectGrade {
  id: string;
  subject: { id: string; name: string };
  class: { id: string; name: string };
  section: { id: string; name: string };
  term?: { id: string; name: string };
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
  authorId?: string;
  authorName?: string;
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
  body?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface School {
  id: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  code?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  isActive: boolean;
  curriculumType: string;
  schoolId: string;
  startDate?: string;
  endDate?: string;
  terms?: Term[];
}

export interface Term {
  id: string;
  name: string;
  order: number;
  percentageWeight: number;
  isLocked: boolean;
  startDate?: string;
  endDate?: string;
  academicYearId: string;
}

export interface Class {
  id: string;
  name: string;
  grade: number;
  schoolId: string;
  homeroomTeacherId?: string;
  sections?: Section[];
}

export interface Section {
  id: string;
  name: string;
  classId: string;
  capacity?: number;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  schoolId?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: { id: string; name: string };
  class: { id: string; name: string };
  section?: { id: string; name: string };
  date: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  maxScore: number;
  room?: string;
}

export interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  termId?: string;
  academicYearId: string;
  gradeLevel?: string;
  schoolId: string;
}

export interface StudentFee {
  id: string;
  studentId: string;
  studentName?: string;
  feeStructureId: string;
  feeStructureName?: string;
  amount: number;
  discountAmount?: number;
  finalAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: string;
  status: string;
}

export interface Payment {
  id: string;
  amountPaid: number;
  paymentDate: string;
  method: string;
  receiptNumber?: string;
  studentFeeId?: string;
  recordedById?: string;
}

export interface Enrollment {
  id: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  rejectionReason?: string;
  className?: string;
  section?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  conversationId: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: { id: string; name: string; role: string }[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  type?: string;
  schoolId: string;
  createdAt: string;
}

export interface DisciplineIncident {
  id: string;
  studentId: string;
  studentName?: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'ESCALATED';
  actionTaken?: string;
  outcome?: string;
  reportedById?: string;
  reportedByName?: string;
  incidentDate: string;
  createdAt: string;
}

export interface ReportCard {
  id: string;
  studentId: string;
  studentName?: string;
  termId?: string;
  academicYearId?: string;
  status: 'DRAFT' | 'PUBLISHED';
  percentage?: number;
  grade?: string;
  publishedAt?: string;
  subjects?: SubjectGrade[];
}

export interface DashboardStats {
  [key: string]: any;
}

export interface DashboardAlert {
  message: string;
  type: 'warning' | 'error' | 'info' | 'success';
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

export interface DashboardQuickAction {
  label: string;
  icon?: string;
  url: string;
  permission?: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface DashboardChart {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }[];
}

export interface DashboardResponse {
  stats: DashboardStats;
  alerts: DashboardAlert[];
  quickActions: DashboardQuickAction[];
  charts: Record<string, DashboardChart>;
  metadata: {
    schoolId?: string;
    academicYear?: string;
    term?: string;
    generatedAt: string;
    curriculum?: {
      curriculumType: string;
      academicYear: string;
      periods: Array<{
        id: string;
        name: string;
        order: number;
        percentageWeight: number;
        isLocked: boolean;
      }>;
    };
  };
}

export interface FeeSummary {
  summary?: {
    totalFees?: number;
    totalDue?: number;
    totalPaid?: number;
    balance?: number;
    totalBalance?: number;
    amount?: number;
  };
  feeItems?: Array<{ name: string; description?: string; amount: number }>;
  items?: Array<{ name: string; description?: string; amount: number }>;
  fees?: Array<{ name: string; description?: string; amount: number }>;
  payments?: Array<{ amount: number; date: string; method: string }>;
  paymentHistory?: Array<{ amount: number; date: string; method: string }>;
}

export interface DataQualityResult {
  issue: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}
