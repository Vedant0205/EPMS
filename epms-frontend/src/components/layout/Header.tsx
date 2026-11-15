import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import {
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Menu,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout, isTeacher } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
    setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully.');
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-navy-950/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Left: Mobile Toggle & System Badge */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* System Title Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-xs font-bold text-purple-700 dark:text-purple-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="hidden sm:inline">Educational Progress Monitoring System</span>
            <span className="sm:hidden">EPMS</span>
          </div>

          {/* RBAC Role Indicator Badge */}
          <div
            title={`Role-Based Access Control: Verified ${user?.role?.toUpperCase()} permissions`}
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider border ${
              isTeacher
                ? 'bg-navy-900 text-white dark:bg-purple-950/80 dark:text-purple-200 border-purple-500/30'
                : 'bg-lavender-50 text-purple-700 dark:bg-navy-900 dark:text-cyan-300 border-cyan-500/30'
            }`}
          >
            {isTeacher ? (
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>RBAC: {isTeacher ? 'Faculty Instructor' : 'Student Scholar'}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Theme Toggle, Notifications, Profile Dropdown, Direct Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark/Light Mode Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-cyan-300 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-purple-200 dark:hover:border-slate-700"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          data-cursor="pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 rotate-0 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-purple-600 rotate-0 transition-transform" />
          )}
        </motion.button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2.5 rounded-xl text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-cyan-300 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-purple-200 dark:hover:border-slate-700 relative"
            title="Notifications"
            data-cursor="pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>

          {/* Notifications Flyout */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 glass-card rounded-2xl shadow-2xl p-4 z-50 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-purple-600" />
                    <span>Notification Feed</span>
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-bold"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No notifications right now.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                          n.isRead
                            ? 'bg-slate-50/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                            : 'bg-purple-50/80 dark:bg-purple-950/50 text-navy-900 dark:text-white border border-purple-200/60 dark:border-purple-800/40'
                        }`}
                      >
                        <p className="font-bold text-[11px]">{n.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block font-mono">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/60 dark:border-slate-800"
            data-cursor="pointer"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-bold text-navy-900 dark:text-white hidden sm:inline max-w-[110px] truncate">
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-52 glass-card rounded-2xl shadow-2xl p-2 z-50 border border-slate-200 dark:border-slate-700 space-y-1"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-bold text-navy-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate(isTeacher ? '/teacher/profile' : '/student/profile');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-purple-600" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Navbar Logout Button */}
        <button
          onClick={handleLogout}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/60 transition-colors"
          title="Sign Out"
          data-cursor="pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
