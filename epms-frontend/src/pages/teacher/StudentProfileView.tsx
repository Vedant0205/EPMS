import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { teacherApi } from '../../api/teacherApi';
import { warningApi } from '../../api/attendanceApi';
import { Warning } from '../../types';
import {
  ArrowLeft,
  User,
  CalendarCheck,
  TrendingUp,
  Clock,
  AlertTriangle,
  BookOpen,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';
import toast from 'react-hot-toast';

export const StudentProfileView: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Warning state
  const [warningCategory, setWarningCategory] = useState('Low Attendance');
  const [warningPriority, setWarningPriority] = useState('High');
  const [warningMessage, setWarningMessage] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);

  const navigate = useNavigate();

  const fetchProfile = async () => {
    if (!studentId) return;
    try {
      const res = await teacherApi.getStudentProfile(studentId);
      setProfile(res);
      setWarningMessage(`Academic Notice regarding progress in ${res.student.name}'s enrolled coursework.`);
    } catch (err) {
      toast.error('Failed to load student profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [studentId]);

  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !warningMessage) return;

    setSendingWarning(true);
    try {
      await warningApi.createWarning({
        studentId,
        category: warningCategory,
        priority: warningPriority,
        message: warningMessage
      });
      toast.success('Warning successfully issued to student.');
      setWarningMessage('');
      fetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to issue warning.');
    } finally {
      setSendingWarning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const student = profile?.student;
  const metrics = profile?.metrics;
  const benchmark = profile?.benchmarkComparison;
  const courses = profile?.courses || [];
  const attendanceLogs = profile?.recentAttendance || [];
  const warnings = profile?.warnings || [];

  const benchmarkChartData = [
    {
      metric: 'Attendance Rate',
      Student: benchmark?.studentAttendance || 0,
      'Cohort Average': benchmark?.cohortAvgAttendance || 0
    },
    {
      metric: 'Course Completion',
      Student: benchmark?.studentCompletion || 0,
      'Cohort Average': benchmark?.cohortAvgCompletion || 0
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Back Button & Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/teacher/students')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Roster</span>
        </button>

        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
          metrics?.risk?.status === 'At Risk'
            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
            : metrics?.risk?.status === 'Needs Attention'
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
        }`}>
          Status: {metrics?.risk?.status}
        </span>
      </div>

      {/* Student Identity Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {student?.avatar ? (
            <img
              src={student.avatar.startsWith('/uploads') ? `http://localhost:5000${student.avatar}` : student.avatar}
              alt={student.name}
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-slate-800 dark:bg-slate-700 text-white font-bold flex items-center justify-center text-xl shrink-0">
              {student?.name?.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {student?.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ID: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{student?.identifier}</span> • {student?.department || 'Computer Science'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{student?.email}</p>
          </div>
        </div>

        {/* Quick telemetry pills */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto text-center">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <p className="text-lg font-bold text-slate-900 dark:text-white">{metrics?.attendancePercentage}%</p>
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5">Attendance</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <p className="text-lg font-bold text-slate-900 dark:text-white">{metrics?.averageCompletion}%</p>
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5">Completion</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <p className="text-lg font-bold text-slate-900 dark:text-white">{metrics?.totalWatchedMinutes}m</p>
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5">Watch Time</p>
          </div>
        </div>
      </div>

      {/* Risk Reasons Callout if not on track */}
      {metrics?.risk?.status !== 'On Track' && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-semibold text-xs uppercase tracking-wider mb-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Risk Indicators Triggered:</span>
          </div>
          <ul className="list-disc list-inside text-xs text-rose-700 dark:text-rose-300 space-y-0.5 font-medium">
            {metrics?.risk?.reasons?.map((r: string, idx: number) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Comparison against Cohort Benchmarks & Direct Warning Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Benchmark Bar Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Cohort Benchmark Comparison</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Comparison between this student's metrics and the class cohort average.
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarkChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Student" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cohort Average" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Warning Direct Form (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Send className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Issue Academic Intervention Notice</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Dispatches an immediate alert to student dashboard and notifications.
            </p>

            <form onSubmit={handleSendWarning} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Warning Category
                  </label>
                  <select
                    value={warningCategory}
                    onChange={(e) => setWarningCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors font-medium"
                  >
                    <option value="Low Attendance">Low Attendance</option>
                    <option value="Low Course Completion">Low Course Completion</option>
                    <option value="Inactive Student">Inactive Student</option>
                    <option value="Missing Lessons">Missing Lessons</option>
                    <option value="General Warning">General Warning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={warningPriority}
                    onChange={(e) => setWarningPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold transition-colors"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Content & Guidance
                </label>
                <textarea
                  rows={3}
                  required
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={sendingWarning}
                className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {sendingWarning ? 'Dispatching...' : 'Dispatch Warning to Student'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Course-Wise Progress Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-500" />
          <span>Enrolled Course Progress Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((c: any) => (
            <div key={c.courseId} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">{c.code}</span>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">{c.title}</h3>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{c.completionPercentage}%</span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${c.completionPercentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">{c.completedLessons}</p>
                  <p className="text-[10px] text-slate-400">Completed</p>
                </div>
                <div className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-500 dark:text-slate-400">{c.pendingLessons}</p>
                  <p className="text-[10px] text-slate-400">Pending</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance History Log for Student */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-slate-500" />
            <span>Recent Attendance Session Logs</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-3">Course</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendanceLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No attendance records found for this student.
                  </td>
                </tr>
              ) : (
                attendanceLogs.map((log: any) => (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{log.date}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{log.courseName || 'Course'}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border ${
                        log.status === 'present'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                          : log.status === 'absent'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{log.remarks || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};