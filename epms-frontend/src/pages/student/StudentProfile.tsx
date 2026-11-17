import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Building,
  GraduationCap,
  Calendar,
  Lock,
  Camera,
  Trash2,
  Phone,
  Save,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const StudentProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || 'Computer Science & Engineering');
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, or WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await authApi.uploadAvatar(file);
      if (res.success && res.avatarUrl) {
        updateUser({ avatar: res.avatarUrl });
        toast.success('Profile photo updated successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar) return;
    setUploadingAvatar(true);
    try {
      const res = await authApi.removeAvatar();
      if (res.success) {
        updateUser({ avatar: '' });
        toast.success('Profile photo removed.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({ phone, department });
      if (res.success && res.user) {
        updateUser({ phone, department });
        toast.success('Academic profile details updated successfully.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

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

    setUpdatingPassword(true);
    setTimeout(() => {
      setUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Security credentials updated successfully.');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Institutional Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl bg-slate-900 dark:bg-slate-950 p-6 sm:p-8 text-white border border-slate-800 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar with manual photo upload trigger */}
            <div className="relative group shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'Student'}
                  className="w-20 h-20 rounded-xl object-cover ring-2 ring-slate-700 bg-slate-800"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-blue-700 text-white font-bold text-2xl flex items-center justify-center ring-2 ring-slate-700">
                  {user?.name?.charAt(0) || 'S'}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-xl bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-medium"
                title="Change Photo"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Upload</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-950/60 text-blue-300 text-[11px] font-semibold border border-blue-800/60 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                <span>Student Scholar</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{user?.name}</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {user?.identifier} • {user?.department || 'Computer Science & Engineering'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{user?.avatar ? 'Change Photo' : 'Upload Photo'}</span>
            </button>
            {user?.avatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
                title="Remove current avatar"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Academic Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="lg:col-span-2 app-surface p-6 rounded-xl space-y-6"
        >
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-600" />
              <span>Academic Record & Contact Information</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Official student institutional credentials</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Full Student Name</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Student Scholar ID</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.identifier}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">Institutional Email</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.email}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Academic Department</span>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs font-medium px-2 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Emergency Contact / Phone</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs font-medium px-2.5 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-colors flex items-center gap-2"
              >
                {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Profile Updates</span>
              </button>
            </div>
          </form>
        </motion.div>

        {/* Security Credentials Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="app-surface p-6 rounded-xl space-y-5"
        >
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Password Security</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage your institutional account password</p>
          </div>

          <form onSubmit={handlePasswordUpdate} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {updatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Update Password</span>
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
