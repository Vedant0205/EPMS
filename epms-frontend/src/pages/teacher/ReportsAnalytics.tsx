import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { reportApi } from '../../api/attendanceApi';
import { courseApi } from '../../api/courseApi';
import { Course } from '../../types';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  Printer,
  Sparkles,
  Layers,
  PieChart as PieIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import toast from 'react-hot-toast';

export const ReportsAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    courseApi.getCourses().then(setCourses).catch(() => {});
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await reportApi.getAnalytics({
        courseId: selectedCourse || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      setAnalytics(data);
    } catch (err) {
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedCourse, startDate, endDate]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await reportApi.exportCSV();
      toast.success('Performance report downloaded as CSV.');
    } catch (err) {
      toast.error('Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const courseStats = analytics?.courseStats || [];
  const monthlyTrends = analytics?.monthlyTrends || [];
  const progressDist = analytics?.progressDistribution || [];
  const atRiskList = analytics?.atRiskList || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto print:p-0"
    >
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-purple-950 p-6 sm:p-8 text-white border border-purple-500/20 shadow-xl print:hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Institutional Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Analytics & Executive Reports
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Inspect longitudinal attendance trends, syllabi completion metrics, and cohort risk evaluations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 backdrop-blur-md transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print View</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-purple-600 to-navy-900 hover:from-purple-500 hover:to-navy-800 text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>{exporting ? 'Generating...' : 'Export CSV Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          {/* Course filter */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white/70 dark:bg-navy-900/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold transition-all"
            >
              <option value="">All Academic Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Start date */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white/70 dark:bg-navy-900/70 text-slate-900 dark:text-white"
            />
          </div>

          {/* End date */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white/70 dark:bg-navy-900/70 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {(selectedCourse || startDate || endDate) && (
          <button
            onClick={() => { setSelectedCourse(''); setStartDate(''); setEndDate(''); }}
            className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:text-cyan-500 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Row 1: Course Completion Comparison & Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Course Completion and Attendance Rates */}
        <div className="glass-panel p-6 rounded-3xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            Course-Wise Completion vs Attendance
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Comparison of syllabus completion vs attendance per subject.
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '14px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="avgCompletion" name="Avg. Completion" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                <Bar dataKey="avgAttendance" name="Avg. Attendance" fill="#06B6D4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Attendance Trends */}
        <div className="glass-panel p-6 rounded-3xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Longitudinal Attendance Trajectory
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Institutional presence rate progression over historical intervals.
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attRateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '14px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="attendanceRate" name="Attendance Rate" stroke="#7C3AED" fillOpacity={1} fill="url(#attRateGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Progress Distribution & At-Risk Summary Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Bracket Distribution (4 cols) */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-3xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <span>Progress Bracket Distribution</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Count of students across progress tiers.
          </p>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '14px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Student Count" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* At-Risk Students Summary Table (8 cols) */}
        <div className="lg:col-span-8 glass-panel rounded-3xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-navy-700/60 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                At-Risk Student Audit Registry ({atRiskList.length})
              </h2>
            </div>
            <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 uppercase tracking-wider">
              Immediate Action
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-navy-900/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-navy-700/60">
                <tr>
                  <th className="py-3.5 px-5">Student Name</th>
                  <th className="py-3.5 px-4">Identifier</th>
                  <th className="py-3.5 px-4">Attendance</th>
                  <th className="py-3.5 px-4">Completion</th>
                  <th className="py-3.5 px-5">Inactivity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-700/50">
                {atRiskList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No students are currently classified as at risk.
                    </td>
                  </tr>
                ) : (
                  atRiskList.map((s: any) => (
                    <tr key={s.studentId} className="hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white">{s.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">{s.identifier}</td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${s.attendancePercentage < 75 ? 'text-rose-500 font-extrabold' : 'text-slate-700 dark:text-slate-300'}`}>
                          {s.attendancePercentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${s.courseCompletionPercentage < 40 ? 'text-rose-500 font-extrabold' : 'text-slate-700 dark:text-slate-300'}`}>
                          {s.courseCompletionPercentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400">
                        {s.daysInactive > 0 ? `${s.daysInactive} days` : 'Active'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};