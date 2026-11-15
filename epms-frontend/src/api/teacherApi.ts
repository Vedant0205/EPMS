import api from './axiosConfig';
import { StudentSummary, SystemSettings, Warning } from '../types';

export interface TeacherDashboardData {
  overview: {
    totalStudents: number;
    totalCourses: number;
    averageAttendance: number;
    averageCourseCompletion: number;
    studentsAtRisk: number;
    studentsNeedsAttention: number;
    studentsOnTrack: number;
  };
  statusDistribution: { name: string; count: number; fill: string }[];
  atRiskStudentsList: StudentSummary[];
  recentWarnings: Warning[];
  settings: SystemSettings;
}

export const teacherApi = {
  getDashboard: async (): Promise<TeacherDashboardData> => {
    const response = await api.get<{ success: boolean } & TeacherDashboardData>('/teacher/dashboard');
    return response.data;
  },

  getStudents: async (params?: {
    search?: string;
    courseId?: string;
    attendanceFilter?: string;
    progressFilter?: string;
    riskStatus?: string;
  }) => {
    const response = await api.get<{
      success: boolean;
      totalCount: number;
      students: StudentSummary[];
    }>('/teacher/students', { params });
    return response.data;
  },

  getStudentProfile: async (studentId: string) => {
    const response = await api.get<{
      success: boolean;
      student: any;
      metrics: any;
      benchmarkComparison: any;
      courses: any[];
      recentAttendance: any[];
      warnings: Warning[];
    }>(`/teacher/students/${studentId}`);
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get<{ success: boolean; settings: SystemSettings }>('/teacher/settings');
    return response.data;
  },

  updateSettings: async (settings: Partial<SystemSettings>) => {
    const response = await api.put<{ success: boolean; message: string; settings: SystemSettings }>('/teacher/settings', settings);
    return response.data;
  }
};
