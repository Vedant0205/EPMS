import api from './axiosConfig';
import { Course, Lesson } from '../types';

export const courseApi = {
  getCourses: async (): Promise<Course[]> => {
    const response = await api.get<{ success: boolean; courses: Course[] }>('/courses');
    return response.data.courses;
  },

  getCourseById: async (id: string): Promise<Course> => {
    const response = await api.get<{ success: boolean; course: Course }>(`/courses/${id}`);
    return response.data.course;
  },

  createCourse: async (courseData: Partial<Course> & { lessons?: any[] }): Promise<Course> => {
    const response = await api.post<{ success: boolean; course: Course }>('/courses', courseData);
    return response.data.course;
  },

  updateCourse: async (id: string, courseData: Partial<Course>): Promise<Course> => {
    const response = await api.put<{ success: boolean; course: Course }>(`/courses/${id}`, courseData);
    return response.data.course;
  },

  deleteCourse: async (id: string) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  enrollStudent: async (courseId: string, studentId?: string) => {
    const response = await api.post(`/courses/${courseId}/enroll`, { studentId });
    return response.data;
  }
};

export const lessonApi = {
  getLesson: async (id: string): Promise<{
    lesson: Lesson;
    progress: { completed: boolean; watchedSeconds: number; lastPositionSeconds: number };
    navigation: { currentIndex: number; totalLessons: number; previousLessonId: string | null; nextLessonId: string | null };
  }> => {
    const response = await api.get<{
      success: boolean;
      lesson: Lesson;
      progress: { completed: boolean; watchedSeconds: number; lastPositionSeconds: number };
      navigation: { currentIndex: number; totalLessons: number; previousLessonId: string | null; nextLessonId: string | null };
    }>(`/lessons/${id}`);
    return response.data;
  },

  sendHeartbeat: async (id: string, data: { watchedSeconds: number; lastPositionSeconds: number }) => {
    const response = await api.post(`/lessons/${id}/heartbeat`, data);
    return response.data;
  },

  markCompleted: async (id: string): Promise<{
    success: boolean;
    progress: any;
    stats: { completedLessonsCount: number; totalLessons: number; completionPercentage: number };
  }> => {
    const response = await api.post(`/lessons/${id}/complete`);
    return response.data;
  },

  createLesson: async (lessonData: Partial<Lesson> & { courseId: string }) => {
    const response = await api.post('/lessons', lessonData);
    return response.data;
  },

  updateLesson: async (id: string, lessonData: Partial<Lesson>) => {
    const response = await api.put(`/lessons/${id}`, lessonData);
    return response.data;
  },

  deleteLesson: async (id: string) => {
    const response = await api.delete(`/lessons/${id}`);
    return response.data;
  }
};
