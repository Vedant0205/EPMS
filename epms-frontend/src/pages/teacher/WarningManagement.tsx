import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { warningApi } from '../../api/attendanceApi';
import { teacherApi } from '../../api/teacherApi';
import { courseApi } from '../../api/courseApi';
import { Warning, StudentSummary, Course } from '../../types';
import {
  AlertTriangle,
  Send,
  CheckCircle,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  Sparkles,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export const WarningManagement: React.FC = () => {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // New Warning Form
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [category, setCategory] = useState<string>('Low Attendance');
  const [priority, setPriority] = useState<string>('High');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    try {
      const [wList, sRes, cList] = await Promise.all([
        warningApi.getTeacherWarnings(),
        teacherApi.getStudents(),
        courseApi.getCourses()
      ]);
      setWarnings(wList || []);
      setStudents(sRes.students || []);
      setCourses(cList || []);
      if (sRes.students && sRes.students.length > 0 && !selectedStudentId) {
        setSelectedStudentId(sRes.students[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load warning system data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !message) {
      toast.error('Please select a student and provide a message.');
      return;
    }

    setSubmitting(true);
    try {
      await warningApi.createWarning({
        studentId: selectedStudentId,
        courseId: selectedCourseId || undefined,
        category,
        priority,
        message
      });

      toast.success('⚠️ Academic warning successfully issued and dispatched!');
      setMessage('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch warning.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveWarning = async (warningId: string) => {
    try {
      await warningApi.resolveWarning(warningId);
      toast.success('Warning marked as resolved.');
      fetchData();
    } catch (err) {
      toast.error('Failed to resolve warning.');
    }
  };

  const filteredWarnings = warnings.filter(w => {
    if (statusFilter === 'all') return true;
    return w.status === statusFilter;
  });

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
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-purple-950 p-6 sm:p-8 text-white border border-purple-500/20 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>Intervention System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Academic Warning & Action Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Issue formal academic advisories, track student acknowledgment feedback, and resolve at-risk cases.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="px-4 py-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-center">
              <p className="text-xs text-slate-400">Total Warnings</p>
              <p className="text-xl font-black text-rose-400">{warnings.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Issue Warning Form (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-navy-700 pb-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Dispatch Formal Notice
              </h2>
              <p className="text-[11px] text-slate-400">Directly notifies student dashboard and alerts</p>
            </div>
          </div>

          <form onSubmit={handleCreateWarning} className="space-y-4">
            {/* Select Student */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Student
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold transition-all"
              >
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.identifier}) • {s.risk.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Course (optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Associated Course (Optional)
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
              >
                <option value="">General Academic Intervention</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Warning Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Warning Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold transition-all"
              >
                <option value="Low Attendance">Low Attendance (&lt; 75%)</option>
                <option value="Low Course Completion">Low Course Completion</option>
                <option value="Inactive Student">Extended Inactivity</option>
                <option value="Missing Lessons">Incomplete Video Modules</option>
                <option value="General Warning">General Academic Notice</option>
              </select>
            </div>

            {/* Warning Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['High', 'Medium', 'Low'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      priority === p
                        ? p === 'High'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                          : p === 'Medium'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20'
                          : 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                        : 'bg-slate-50 dark:bg-navy-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-navy-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Warning Directives & Remediating Plan
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Specify the attendance deficit, lesson milestone, or expected remediating action..."
                className="w-full p-3.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-navy-900 hover:from-purple-500 hover:to-navy-800 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <Send className="w-4 h-4 text-cyan-400" />
              <span>{submitting ? 'Dispatching...' : 'Dispatch Intervention'}</span>
            </button>
          </form>
        </div>

        {/* Previously Sent Warnings List (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-navy-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Dispatched Warnings Registry ({warnings.length})
              </h2>
              <p className="text-xs text-slate-400">Track student status and acknowledgment responses</p>
            </div>

            {/* Filter */}
            <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-navy-900 rounded-xl">
              {['all', 'active', 'acknowledged', 'resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-700/50 p-4 space-y-3 max-h-[650px]">
            {filteredWarnings.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                No warnings found under this filter.
              </div>
            ) : (
              filteredWarnings.map((w) => {
                const isHigh = w.priority === 'High';
                const isResolved = w.status === 'resolved';
                const isAck = w.status === 'acknowledged';

                return (
                  <div
                    key={w._id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isResolved
                        ? 'bg-slate-50/60 dark:bg-navy-900/30 border-slate-200 dark:border-navy-800 opacity-75'
                        : isHigh
                        ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/20'
                        : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {w.studentName} ({w.studentIdentifier})
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isHigh ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {w.priority}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          • {w.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                          isResolved
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : isAck
                            ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                          {w.status}
                        </span>

                        {!isResolved && (
                          <button
                            onClick={() => handleResolveWarning(w._id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-navy-800 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed font-medium">
                      "{w.message}"
                    </p>

                    {w.studentNote && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-purple-500/10 text-[11px] text-purple-700 dark:text-purple-300 border border-purple-500/20 flex items-start gap-2">
                        <UserCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 dark:text-white">Student Acknowledgment:</strong> {w.studentNote}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-navy-700/60">
                      <span>Course: {w.courseTitle}</span>
                      <span>Dispatched {new Date(w.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};