import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { studentApi } from '../../api/studentApi';
import { notificationApi } from '../../api/attendanceApi';
import { Warning, NotificationItem } from '../../types';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen,
  CalendarCheck,
  CheckCheck,
  Sparkles,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentNotifications: React.FC = () => {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [wRes, nRes] = await Promise.all([
        studentApi.getMyWarnings(),
        notificationApi.getNotifications()
      ]);
      setWarnings(wRes.warnings || []);
      setNotifications(nRes.notifications || []);
    } catch (err) {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcknowledge = async (warningId: string) => {
    try {
      await studentApi.acknowledgeWarning(warningId, 'Acknowledged by student');
      toast.success('Warning marked as acknowledged.');
      fetchData();
    } catch (err) {
      toast.error('Failed to acknowledge warning.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      toast.success('All notifications marked as read.');
      fetchData();
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-purple-950 p-6 sm:p-8 text-white border border-purple-500/20 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Bell className="w-3.5 h-3.5 text-cyan-400" />
              <span>Campus Communications</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Notifications & Advisories
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Inspect faculty-issued academic warnings, attendance alerts, and institutional milestone updates.
            </p>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 backdrop-blur-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95 shrink-0"
          >
            <CheckCheck className="w-4 h-4 text-cyan-400" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Official Faculty Warnings Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Faculty Issued Warnings ({warnings.length})</span>
        </h2>

        {warnings.length === 0 ? (
          <div className="p-8 glass-panel rounded-3xl text-center text-xs text-slate-400">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
            No active academic warnings. Your academic standing is in good standing!
          </div>
        ) : (
          warnings.map((w) => {
            const isHigh = w.priority === 'High';
            return (
              <div
                key={w._id}
                className={`p-5 rounded-3xl border transition-all ${
                  isHigh
                    ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/20'
                    : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {w.category}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                        isHigh
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {w.priority} Priority
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        • {w.courseTitle || 'General Academics'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 dark:text-slate-200 mt-2 font-medium leading-relaxed">
                      "{w.message}"
                    </p>

                    <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-2.5">
                      <span>Issued by: <strong className="text-slate-700 dark:text-slate-300">{w.teacherName || 'Faculty Instructor'}</strong></span>
                      <span>•</span>
                      <span>{new Date(w.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {w.status === 'active' ? (
                      <button
                        onClick={() => handleAcknowledge(w._id)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-navy-900 hover:from-purple-500 hover:to-navy-800 text-white shadow-md shadow-purple-600/20 transition-all hover:scale-105 active:scale-95"
                      >
                        Acknowledge Notice
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Acknowledged
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* General Notifications Feed */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-500" />
          <span>Notification Activity</span>
        </h2>

        <div className="glass-panel rounded-3xl divide-y divide-slate-100 dark:divide-navy-700/50 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n._id} className="p-4 flex items-start gap-3 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors">
                <div className="mt-0.5 shrink-0">
                  {n.type === 'warning' ? (
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : n.type === 'course' ? (
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  ) : n.type === 'attendance' ? (
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                      <CalendarCheck className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                      <Clock className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {n.title}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};