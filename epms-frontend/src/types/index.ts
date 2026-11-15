// User types
export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  identifier: string; // Student ID or Teacher ID
  role: 'student' | 'teacher';
  department?: string;
  avatar?: string;
  phone?: string;
  lastActive?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

// Course and Lesson types
export interface Lesson {
  _id: string;
  course: string;
  module: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number; // in seconds
  order: number;
  isCompleted?: boolean;
  watchedSeconds?: number;
  lastPositionSeconds?: number;
  resources?: { title: string; url: string }[];
}

export interface CourseModule {
  title: string;
  lessons: Lesson[];
}

export interface Course {
  _id: string;
  title: string;
  code: string;
  description: string;
  category: string;
  thumbnail: string;
  teacher?: string;
  teacherName?: string;
  durationHours: number;
  totalLessons: number;
  completedLessons?: number;
  completionPercentage?: number;
  isEnrolled?: boolean;
  modules?: CourseModule[];
  lessons?: Lesson[];
}

// Attendance types
export type AttendanceStatus = 'present' | 'absent' | 'leave';

export interface AttendanceRecord {
  _id: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  courseId: string;
  courseName?: string;
  courseCode?: string;
  course?: { _id?: string; title?: string; code?: string };
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePercentage: number;
}

export interface RosterStudent {
  studentId: string;
  identifier: string;
  name: string;
  email: string;
  status: AttendanceStatus;
  remarks: string;
  isSaved: boolean;
  recordId?: string;
}

// Warning types
export type WarningCategory =
  | 'Low Attendance'
  | 'Low Course Completion'
  | 'Inactive Student'
  | 'Missing Lessons'
  | 'General Warning';

export type WarningPriority = 'High' | 'Medium' | 'Low';
export type WarningStatus = 'active' | 'acknowledged' | 'resolved';

export interface Warning {
  _id: string;
  student: string;
  studentName?: string;
  studentIdentifier?: string;
  teacher: string;
  teacherName?: string;
  course?: string;
  courseTitle?: string;
  category: WarningCategory;
  priority: WarningPriority;
  message: string;
  status: WarningStatus;
  studentNote?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

// Notification types
export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'warning' | 'attendance' | 'course' | 'announcement' | 'system';
  link?: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

// Risk & Monitoring types
export interface RiskStatus {
  status: 'On Track' | 'Needs Attention' | 'At Risk';
  color: string;
  reasons: string[];
  badgeClass: string;
}

export interface StudentSummary {
  _id: string;
  name: string;
  identifier: string;
  email: string;
  department: string;
  avatar?: string;
  lastActive?: string;
  daysInactive: number;
  enrolledCourses: string[];
  enrolledCount: number;
  attendancePercentage: number;
  totalAttendanceDays: number;
  presentDays: number;
  absentDays: number;
  courseCompletionPercentage: number;
  averageProgress?: number;
  completedCourses?: number;
  risk: RiskStatus;
}

export interface SystemSettings {
  attendanceThreshold: number;
  completionThreshold: number;
  inactivityDaysThreshold: number;
  institutionName: string;
}
