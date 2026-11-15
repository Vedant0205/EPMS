import api from './axiosConfig';
import { RosterStudent, Warning, NotificationItem } from '../types';

export const attendanceApi = {
  getCourseRoster: async (courseId: string, date?: string) => {
    const response = await api.get<{
      success: boolean;
      course: { _id: string; title: string; code: string };
      date: string;
      roster: RosterStudent[];
      summary: { totalEnrolled: number; alreadyMarked: number };
    }>(`/attendance/course/${courseId}`, { params: { date } });
    return response.data;
  },

  saveAttendance: async (data: {
    courseId: string;
    date: string;
    records: { studentId: string; status: 'present' | 'absent' | 'leave'; remarks?: string }[];
  }) => {
    const response = await api.post('/attendance/mark', data);
    return response.data;
  },

  getStudentAttendance: async (studentId: string) => {
    const response = await api.get(`/attendance/student/${studentId}`);
    return response.data;
  }
};

export const warningApi = {
  createWarning: async (warningData: {
    studentId: string;
    courseId?: string;
    category: string;
    priority: string;
    message: string;
  }) => {
    const response = await api.post<{ success: boolean; message: string; warning: Warning }>('/warnings', warningData);
    return response.data;
  },

  getTeacherWarnings: async () => {
    const response = await api.get<{ success: boolean; warnings: Warning[] }>('/warnings/teacher');
    return response.data.warnings;
  },

  resolveWarning: async (warningId: string) => {
    const response = await api.put<{ success: boolean; message: string; warning: Warning }>(`/warnings/${warningId}/resolve`);
    return response.data;
  }
};

export const notificationApi = {
  getNotifications: async () => {
    const response = await api.get<{
      success: boolean;
      unreadCount: number;
      notifications: NotificationItem[];
    }>('/notifications');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};

export const reportApi = {
  getAnalytics: async (params?: { courseId?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get<{
      success: boolean;
      courseStats: any[];
      monthlyTrends: any[];
      progressDistribution: any[];
      atRiskCount: number;
      atRiskList: any[];
      totalStudents: number;
      totalCourses: number;
    }>('/reports/analytics', { params });
    return response.data;
  },

  exportCSV: async () => {
    const response = await api.get('/reports/export/csv', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EPMS_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
