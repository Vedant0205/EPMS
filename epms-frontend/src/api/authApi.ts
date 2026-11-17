import api from './axiosConfig';
import { AuthResponse, User } from '../types';

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: {
    name: string;
    email: string;
    identifier: string;
    password: string;
    confirmPassword: string;
    role: 'student' | 'teacher';
    department?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<{ success: boolean; user: User }> => {
    const response = await api.get<{ success: boolean; user: User }>('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data: { token: string; newPassword: string; confirmPassword: string }) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  submitPasswordRequest: async (data: { email?: string; identifier?: string; reason?: string }) => {
    const response = await api.post('/auth/password-request', data);
    return response.data;
  },

  getPasswordRequestStatus: async (requestId: string) => {
    const response = await api.get(`/auth/password-requests?requestId=${encodeURIComponent(requestId)}`);
    return response.data;
  },

  approvePasswordRequest: async (requestId: string) => {
    const response = await api.post(`/auth/password-requests/${encodeURIComponent(requestId)}/approve`);
    return response.data;
  },

  completePasswordChange: async (data: {
    requestId: string;
    authorizationCode: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const response = await api.post('/auth/password-requests/complete', data);
    return response.data;
  },

  updateProfile: async (data: { name?: string; phone?: string; department?: string; avatar?: string }) => {
    const response = await api.put<{ success: boolean; message: string; user: User }>('/auth/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<{ success: boolean; message: string; avatarUrl: string; user: User }>('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  removeAvatar: async () => {
    const response = await api.delete<{ success: boolean; message: string; user: User }>('/auth/avatar');
    return response.data;
  }
};
