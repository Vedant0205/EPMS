import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  ShieldCheck,
  Building,
  KeyRound,
  GraduationCap,
  Award,
  BookOpen,
  Lock,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const TeacherProfile: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setUpdating(true);
    setTimeout(() => {
      setUpdating(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Faculty security credentials updated successfully.');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl bg-gradient-to-r from-navy-900 via-purple-900 to-navy-950 p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20 relative overflow-hidden border border-purple-500/20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-purple-500/30 border border-white/20">
              {user?.name?.charAt(0) || 'T'}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-1 border border-purple-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Faculty Instructor</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{user?.name}</h1>
              <p className="text-xs sm:text-sm text-slate-300">{user?.identifier} • {user?.department || 'Computer Technology'}</p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-right self-start sm:self-auto">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Privilege Tier</span>
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Faculty Administrator</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Faculty Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-6"
        >
          <div>
            <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              <span>Faculty Credentials & Affiliations</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Official instructor details</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Faculty Name</span>
              <p className="text-sm font-bold text-navy-900 dark:text-white">{user?.name}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Faculty ID</span>
              <p className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono">{user?.identifier}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Institutional Email</span>
              <p className="text-sm font-bold text-navy-900 dark:text-white truncate">{user?.email}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Department</span>
              <p className="text-sm font-bold text-navy-900 dark:text-white">{user?.department || 'Information Technology & Computer Technology'}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Instructor Management Scope</p>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                You are authorized to manage courses, add instructional video lessons, record course attendance, evaluate at-risk students, dispatch formal warnings, and configure institutional risk thresholds.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security / Password Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="glass-card p-6 rounded-2xl space-y-4"
        >
          <div>
            <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-600" />
              <span>Security Settings</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage faculty credentials</p>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Credentials</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
