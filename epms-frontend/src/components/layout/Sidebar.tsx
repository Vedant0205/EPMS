import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  Bell,
  Users,
  AlertTriangle,
  BarChart3,
  Sliders,
  LogOut,
  GraduationCap,
  TrendingUp,
  User,
  ChevronLeft,
  ChevronRight,
  Bot,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onMobileClose }) => {
  const { user, logout, isTeacher } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleConfirmLogout = () => {
    logout();
    toast.success('Signed out securely.');
    navigate('/login');
  };

  const studentNavGroups = [
    {
      heading: 'Core',
      links: [
        { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/student/courses', label: 'My Courses', icon: BookOpen },
        { to: '/student/progress', label: 'Progress Tracking', icon: TrendingUp },
        { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck }
      ]
    },
    {
      heading: 'Intelligence',
      links: [
        { to: '/student/ai-advisor', label: 'विद्या Helper (Advisor)', icon: Bot }
      ]
    },
    {
      heading: 'Account',
      links: [
        { to: '/student/notifications', label: 'Notifications', icon: Bell },
        { to: '/student/profile', label: 'Profile', icon: User }
      ]
    }
  ];

  const teacherNavGroups = [
    {
      heading: 'Instruction',
      links: [
        { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/teacher/students', label: 'Student Directory', icon: Users },
        { to: '/teacher/courses', label: 'Course Catalog', icon: BookOpen },
        { to: '/teacher/progress', label: 'Progress Audits', icon: TrendingUp },
        { to: '/teacher/attendance', label: 'Attendance Log', icon: CalendarCheck }
      ]
    },
    {
      heading: 'Intervention & Analytics',
      links: [
        { to: '/teacher/ai-copilot', label: 'विद्या Helper (Copilot)', icon: Bot },
        { to: '/teacher/warnings', label: 'Academic Warnings', icon: AlertTriangle },
        { to: '/teacher/reports', label: 'Reports & Export', icon: BarChart3 },
        { to: '/teacher/settings', label: 'Risk Thresholds', icon: Sliders }
      ]
    },
    {
      heading: 'Account',
      links: [
        { to: '/teacher/profile', label: 'Profile', icon: User }
      ]
    }
  ];

  const navGroups = isTeacher ? teacherNavGroups : studentNavGroups;

  const sidebarContent = (
    <div className={`h-full flex flex-col justify-between transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div>
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                  EPMS
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none font-medium">
                  {isTeacher ? 'Faculty Portal' : 'Student Portal'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="p-2 space-y-4 overflow-y-auto max-h-[calc(100vh-8.5rem)]">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!collapsed && (
                <p className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {group.heading}
                </p>
              )}
              {group.links.map((link) => {
                const isActive = location.pathname === link.to;
                const Icon = link.icon;

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onMobileClose}
                    className={
                      `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                      } ${collapsed ? 'justify-center' : ''}`
                    }
                    title={collapsed ? link.label : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{link.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className="p-2 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setShowLogoutModal(true)}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 p-5 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Sign Out Confirmation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you wish to sign out of your EPMS account?
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 min-h-screen sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-slate-950/40"
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-0 bottom-0 left-0 w-60 bg-white dark:bg-slate-900 shadow-xl z-50"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
