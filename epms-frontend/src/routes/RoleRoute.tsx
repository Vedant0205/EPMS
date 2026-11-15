import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RoleRoute: React.FC<{ roles: ('student' | 'teacher')[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = roles.includes(user.role);

  if (!hasAccess) {
    // Redirect to explicit RBAC Unauthorized page showing access restriction
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
