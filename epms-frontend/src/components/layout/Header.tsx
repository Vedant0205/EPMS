import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { authApi } from '../../api/authApi';
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
  Bot,
  KeyRound,
  CheckCircle2,
  X,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMenuToggle?: () => void;
  onOpenAiChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, onOpenAiChat }) => {
  const { user, logout, isTeacher } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdStep, setPwdStep] = useState<'request' | 'complete'>('request');
  const [pwdReason, setPwdReason] = useState('Routine Security Credential Update');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreatePasswordRequest = async () => {
    if (!user?.email) return;
    setPwdLoading(true);
    try {
      const res = await authApi.submitPasswordRequest({ email: user.email, reason: pwdReason });
      if (res.success && res.requestId) {
        setTicketId(res.requestId);
        toast.success(`Request #${res.requestId} submitted for Department authorization.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not submit password request.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleAuthorizeTicketDemo = async () => {
    if (!ticketId) return;
    setPwdLoading(true);
    try {
      const res = await authApi.approvePasswordRequest(ticketId);
      if (res.success && res.authorizationCode) {
        setAuthCode(res.authorizationCode);
        toast.success(`Department Head authorized! Code: ${res.authorizationCode}`);
        setPwdStep('complete');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Authorization failed.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleFinalizePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !authCode || !newPwd) {
      toast.error('All fields are required.');
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error('New passwords do not match.');
      return;
    }
    if (newPwd.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await authApi.completePasswordChange({
        requestId: ticketId,
        authorizationCode: authCode.trim().toUpperCase(),
        newPassword: newPwd,
        confirmPassword: confirmPwd
      });
      if (res.success) {
        toast.success('Password updated successfully!');
        setShowPasswordModal(false);
        setTicketId(null);
        setAuthCode('');
        setNewPwd('');
        setConfirmPwd('');
        setPwdStep('request');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to finalize password update.');
    } finally {
      setPwdLoading(false);
    }
  };

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
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">
              EPMS
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500">|</span>
            <span className="hidden sm:inline text-xs font-normal text-slate-600 dark:text-slate-400">
              Educational Progress Monitoring
            </span>
          </div>

          <span
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
              isTeacher
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
            }`}
          >
            {isTeacher ? (
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            ) : (
              <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            )}
            <span>{isTeacher ? 'Faculty' : 'Student'}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {onOpenAiChat && (
          <button
            onClick={onOpenAiChat}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
            title="Open विद्या Helper Assistant"
          >
            <Bot className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Ask विद्या Helper</span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          aria-label="Toggle Color Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative focus:outline-none focus:ring-2 focus:ring-slate-400"
            title="Notifications"
            aria-label="View Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-slate-900 rounded-lg shadow-lg p-3 z-50 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No unread notifications.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`pt-2 first:pt-0 p-2 rounded-md text-xs cursor-pointer transition-colors ${
                          n.isRead
                            ? 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            : 'bg-blue-50/60 dark:bg-blue-950/30 text-slate-900 dark:text-white font-medium hover:bg-blue-50 dark:hover:bg-blue-950/50'
                        }`}
                      >
                        <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
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

        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
            aria-expanded={showProfileMenu}
          >
            <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-700 text-white font-medium flex items-center justify-center text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[120px] truncate">
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-lg shadow-lg p-1.5 z-50 border border-slate-200 dark:border-slate-800 space-y-0.5"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate(isTeacher ? '/teacher/profile' : '/student/profile');
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Account Profile</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowPasswordModal(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Request Password Change</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Password Change Modal (Institutional Request Workflow) */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Password Change by Request
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {user?.name} • {isTeacher ? 'Faculty' : 'Student Scholar'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* 2-Step Pill Header */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setPwdStep('request')}
                    className={`py-1.5 rounded-md font-medium transition-colors ${
                      pwdStep === 'request'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    1. Log Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setPwdStep('complete')}
                    className={`py-1.5 rounded-md font-medium transition-colors ${
                      pwdStep === 'complete'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    2. Authorize & Finalize
                  </button>
                </div>

                {pwdStep === 'request' ? (
                  <div className="space-y-3.5">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Under institutional governance, all credential changes require formal sign-off from the Department Head or Academic Administrator.
                    </p>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Reason for Password Change
                      </label>
                      <select
                        value={pwdReason}
                        onChange={(e) => setPwdReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="Routine Security Credential Update">Routine Security Credential Update</option>
                        <option value="Device Replacement / Secondary Terminal Access">Device Replacement / Secondary Terminal Access</option>
                        <option value="Suspected Credential Compromise">Suspected Credential Compromise</option>
                        <option value="Forgotten Password / Reset Required">Forgotten Password / Reset Required</option>
                      </select>
                    </div>

                    {ticketId ? (
                      <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Request Ticket: {ticketId}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          Status: <strong className="text-amber-600 dark:text-amber-400">Pending Department Approval</strong>
                        </p>
                        <button
                          type="button"
                          onClick={handleAuthorizeTicketDemo}
                          disabled={pwdLoading}
                          className="px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-[11px] flex items-center gap-1.5 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Faculty Sign-off (Authorize Ticket)</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCreatePasswordRequest}
                        disabled={pwdLoading}
                        className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-semibold transition-colors"
                      >
                        {pwdLoading ? 'Submitting...' : 'Submit Request to Academic Office'}
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleFinalizePassword} className="space-y-3">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Request Ticket ID
                      </label>
                      <input
                        type="text"
                        value={ticketId || ''}
                        onChange={(e) => setTicketId(e.target.value)}
                        placeholder="e.g. REQ-PWD-123456"
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Department Authorization Code
                      </label>
                      <input
                        type="text"
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value)}
                        placeholder="e.g. AUTH-654321"
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 uppercase"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">New Password</label>
                        <input
                          type="password"
                          value={newPwd}
                          onChange={(e) => setNewPwd(e.target.value)}
                          placeholder="Min 6 chars"
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          required
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Confirm Password</label>
                        <input
                          type="password"
                          value={confirmPwd}
                          onChange={(e) => setConfirmPwd(e.target.value)}
                          placeholder="Repeat"
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setPwdStep('request')}
                        className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={pwdLoading}
                        className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                      >
                        {pwdLoading ? 'Finalizing...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
