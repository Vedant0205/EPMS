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
  ShieldCheck,
  TrendingUp,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  HelpCircle,
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
    toast.success('Signed out of EPMS securely.');
    navigate('/login');
  };

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/courses', label: 'My Courses', icon: BookOpen },
    { to: '/student/progress', label: 'My Progress', icon: TrendingUp },
    { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/student/notifications', label: 'Notifications', icon: Bell },
    { to: '/student/profile', label: 'My Profile', icon: User },
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/students', label: 'Students', icon: Users },
    { to: '/teacher/courses', label: 'Courses', icon: BookOpen },
    { to: '/teacher/progress', label: 'Progress Monitoring', icon: TrendingUp },
    { to: '/teacher/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/teacher/warnings', label: 'Warnings', icon: AlertTriangle },
    { to: '/teacher/reports', label: 'Reports', icon: BarChart3 },
    { to: '/teacher/settings', label: 'Risk Thresholds', icon: Sliders },
    { to: '/teacher/profile', label: 'My Profile', icon: User },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  const sidebarContent = (
    <div className={`h-full flex flex-col justify-between transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Top Header & Brand */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-navy-950/70 backdrop-blur-md">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-tr from-navy-900 via-purple-700 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="min-w-0"
              >
                <h1 className="text-sm font-black text-navy-900 dark:text-white tracking-tight leading-tight">
                  EPMS Platform
                </h1>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">
                  {isTeacher ? 'Faculty Portal' : 'Scholar Hub'}
                </p>
              </motion.div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            data-cursor="pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Mini Card */}
        <div className="p-3">
          <div className="p-3 rounded-2xl bg-lavender-50 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-navy-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{user?.identifier}</p>
                </div>
              )}
            </div>

            {!collapsed && (
              <div className="pt-2 border-t border-purple-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 uppercase font-semibold">Tier:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isTeacher
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
                }`}>
                  {user?.role}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="px-3 py-2 space-y-1">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              {isTeacher ? 'Faculty Administration' : 'Learning Navigation'}
            </p>
          )}

          {links.map((link) => {
            const isActive = location.pathname === link.to;
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50/80 dark:hover:bg-slate-800/60 hover:text-purple-700 dark:hover:text-purple-300'
                  }`
                }
                title={collapsed ? link.label : undefined}
                data-cursor="pointer"
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-purple-600'
                }`} />
                {!collapsed && (
                  <span className="truncate">{link.label}</span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activePill"
                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-cyan-300"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Logout Button */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-white/50 dark:bg-navy-950/50">
        <button
          onClick={() => setShowLogoutModal(true)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Sign out of EPMS"
          data-cursor="pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm glass-card p-6 rounded-3xl space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-navy-900 dark:text-white">Confirm Sign Out</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to log out of your EPMS account session?
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-colors"
                >
                  Log Out
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
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block bg-white dark:bg-navy-950 border-r border-slate-200/80 dark:border-slate-800/80 shrink-0 min-h-screen sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-navy-950 shadow-2xl z-50"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
