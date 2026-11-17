import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { useAuth } from '../context/AuthContext';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { UnauthorizedPage } from '../pages/auth/UnauthorizedPage';

// Student Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentCourses } from '../pages/student/StudentCourses';
import { CoursePlayer } from '../pages/student/CoursePlayer';
import { StudentAttendance } from '../pages/student/StudentAttendance';
import { StudentNotifications } from '../pages/student/StudentNotifications';
import { StudentProgress } from '../pages/student/StudentProgress';
import { StudentProfile } from '../pages/student/StudentProfile';
import { StudentAIAdvisor } from '../pages/student/StudentAIAdvisor';

// Teacher Pages
import { TeacherDashboard } from '../pages/teacher/TeacherDashboard';
import { StudentManagement } from '../pages/teacher/StudentManagement';
import { StudentProfileView } from '../pages/teacher/StudentProfileView';
import { AttendanceMarking } from '../pages/teacher/AttendanceMarking';
import { WarningManagement } from '../pages/teacher/WarningManagement';
import { CourseManagement } from '../pages/teacher/CourseManagement';
import { ReportsAnalytics } from '../pages/teacher/ReportsAnalytics';
import { RiskSettings } from '../pages/teacher/RiskSettings';
import { TeacherProgressMonitoring } from '../pages/teacher/TeacherProgressMonitoring';
import { TeacherProfile } from '../pages/teacher/TeacherProfile';
import { TeacherAICopilot } from '../pages/teacher/TeacherAICopilot';

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  const getDefaultRedirect = () => {
    if (!user) return '/login';
    if (user.role === 'teacher') return '/teacher/dashboard';
    if (user.role === 'student') return '/student/dashboard';
    return '/login';
  };

  return (
    <Routes>
      {/* Public Login & Register */}
      <Route
        path="/login"
        element={user ? <Navigate to={getDefaultRedirect()} replace /> : <LoginPage />}
      />

      {/* RBAC Access Denied Page */}
      <Route
        path="/unauthorized"
        element={user ? <UnauthorizedPage /> : <Navigate to="/login" replace />}
      />

      {/* Student Portal Routes (Protected by RBAC: student) */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['student']}>
              <Routes>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="courses" element={<StudentCourses />} />
                <Route path="courses/:courseId/learn" element={<CoursePlayer />} />
                <Route path="courses/:courseId/learn/:lessonId" element={<CoursePlayer />} />
                <Route path="progress" element={<StudentProgress />} />
                <Route path="attendance" element={<StudentAttendance />} />
                <Route path="ai-advisor" element={<StudentAIAdvisor />} />
                <Route path="notifications" element={<StudentNotifications />} />
                <Route path="profile" element={<StudentProfile />} />
                <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
              </Routes>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Teacher Portal Routes (Protected by RBAC: teacher) */}
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute>
            <RoleRoute roles={['teacher']}>
              <Routes>
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="students" element={<StudentManagement />} />
                <Route path="students/:studentId" element={<StudentProfileView />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="courses/:courseId/preview" element={<CoursePlayer isPreview />} />
                <Route path="courses/:courseId/preview/:lessonId" element={<CoursePlayer isPreview />} />
                <Route path="progress" element={<TeacherProgressMonitoring />} />
                <Route path="attendance" element={<AttendanceMarking />} />
                <Route path="ai-copilot" element={<TeacherAICopilot />} />
                <Route path="warnings" element={<WarningManagement />} />
                <Route path="reports" element={<ReportsAnalytics />} />
                <Route path="settings" element={<RiskSettings />} />
                <Route path="profile" element={<TeacherProfile />} />
                <Route path="*" element={<Navigate to="/teacher/dashboard" replace />} />
              </Routes>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Root Redirection */}
      <Route path="/" element={<Navigate to={getDefaultRedirect()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
    </Routes>
  );
};
