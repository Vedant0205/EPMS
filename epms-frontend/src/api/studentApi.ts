import api from './axiosConfig';
import { AttendanceStats, AttendanceRecord, Warning } from '../types';

export interface StudentDashboardData {
  overview: {
    totalEnrolled: number;
    completedCoursesCount: number;
    inProgressCoursesCount: number;
    attendancePercentage: number;
    overallProgress: number;
    totalAttendanceDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    activeWarningsCount: number;
    unreadNotificationsCount: number;
  };
  enrolledCourses: {
    enrollmentId: string;
    courseId: string;
    title: string;
    code: string;
    thumbnail: string;
    instructorName: string;
    totalLessons: number;
    completedLessons: number;
    completionPercentage: number;
    status: string;
    continueLessonId?: string;
  }[];
  recentActivities: {
    _id: string;
    lessonId: string;
    lessonTitle: string;
    courseTitle: string;
    courseId: string;
    completed: boolean;
    watchedSeconds: number;
    updatedAt: string;
  }[];
  pendingLessons: {
    lessonId: string;
    title: string;
    courseTitle: string;
    courseId: string;
    duration: number;
  }[];
  warnings: Warning[];
  notifications: any[];
  announcements: any[];
}

export const studentApi = {
  getDashboard: async (): Promise<StudentDashboardData> => {
    const response = await api.get<{ success: boolean } & StudentDashboardData>('/student/dashboard');
    return response.data;
  },

  getMyAttendance: async (params?: { courseId?: string; month?: number; year?: number }) => {
    const response = await api.get<{
      success: boolean;
      stats: AttendanceStats;
      history: AttendanceRecord[];
    }>('/attendance/my-attendance', { params });
    return response.data;
  },

  getMyWarnings: async () => {
    const response = await api.get<{ success: boolean; warnings: Warning[] }>('/warnings/my-warnings');
    return response.data;
  },

  acknowledgeWarning: async (warningId: string, note?: string) => {
    const response = await api.put<{ success: boolean; warning: Warning }>(`/warnings/${warningId}/acknowledge`, { note });
    return response.data;
  }
};
