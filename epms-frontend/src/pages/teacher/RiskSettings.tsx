import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { teacherApi } from '../../api/teacherApi';
import { SystemSettings } from '../../types';
import {
  Sliders,
  ShieldAlert,
  Save,
  CheckCircle2,
  HelpCircle,
  Building2,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

export const RiskSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    attendanceThreshold: 75,
    completionThreshold: 40,
    inactivityDaysThreshold: 7,
    institutionName: 'Apex Institute of Technology & Computing'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await teacherApi.getSettings();
        if (res.settings) {
          setSettings(res.settings);
        }
      } catch (err) {
        toast.error('Failed to load system settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await teacherApi.updateSettings(settings);
      toast.success('Monitoring risk thresholds saved successfully!');
      if (res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      toast.error('Failed to update thresholds.');
    } finally {
      setSaving(false);
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
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-purple-950 p-6 sm:p-8 text-white border border-purple-500/20 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Algorithmic Parameters</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Risk Identification Thresholds
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Configure automated rules and thresholds that classify students as needing attention or categorized at academic risk.
          </p>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Institution Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              <span>Institution / Faculty Organization</span>
            </label>
            <input
              type="text"
              required
              value={settings.institutionName}
              onChange={(e) => setSettings({ ...settings, institutionName: e.target.value })}
              className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white/70 dark:bg-navy-900/70 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          <div className="border-t border-slate-100 dark:border-navy-700/60 pt-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Automated Detection Conditions</span>
            </h2>

            {/* Attendance Threshold Slider */}
            <div className="p-5 rounded-2xl bg-white/50 dark:bg-navy-900/50 border border-slate-100 dark:border-navy-700/60 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Attendance Percentage Threshold
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Students with attendance below this percentage are automatically flagged as <strong>At Risk</strong>.
                  </p>
                </div>
                <span className="text-sm font-black text-rose-500 px-3.5 py-1.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  {settings.attendanceThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={90}
                step={1}
                value={settings.attendanceThreshold}
                onChange={(e) => setSettings({ ...settings, attendanceThreshold: Number(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>50% (Lenient)</span>
                <span className="text-purple-500 font-bold">Standard Baseline: 75%</span>
                <span>90% (Strict)</span>
              </div>
            </div>

            {/* Course Completion Threshold */}
            <div className="p-5 rounded-2xl bg-white/50 dark:bg-navy-900/50 border border-slate-100 dark:border-navy-700/60 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Course Completion Minimum Milestone
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Students whose lesson completion falls under this threshold are placed in <strong>At Risk</strong> status.
                  </p>
                </div>
                <span className="text-sm font-black text-amber-500 px-3.5 py-1.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  {settings.completionThreshold}%
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={70}
                step={1}
                value={settings.completionThreshold}
                onChange={(e) => setSettings({ ...settings, completionThreshold: Number(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>20% (Lenient)</span>
                <span className="text-purple-500 font-bold">Standard Baseline: 40%</span>
                <span>70% (Accelerated)</span>
              </div>
            </div>

            {/* Inactivity Threshold */}
            <div className="p-5 rounded-2xl bg-white/50 dark:bg-navy-900/50 border border-slate-100 dark:border-navy-700/60 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Maximum Consecutive Inactive Days
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Absence of video watching, session login, or lesson progress for this duration triggers inactivity intervention.
                  </p>
                </div>
                <span className="text-sm font-black text-purple-500 px-3.5 py-1.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  {settings.inactivityDaysThreshold} Days
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={21}
                step={1}
                value={settings.inactivityDaysThreshold}
                onChange={(e) => setSettings({ ...settings, inactivityDaysThreshold: Number(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>3 Days (Prompt)</span>
                <span className="text-purple-500 font-bold">Standard Baseline: 7 Days</span>
                <span>21 Days (Relaxed)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-navy-900 hover:from-purple-500 hover:to-navy-800 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <Save className="w-4 h-4 text-cyan-400" />
              <span>{saving ? 'Updating Parameters...' : 'Save Monitoring Rules'}</span>
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};