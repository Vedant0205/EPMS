import React, { useState, useEffect } from 'react';
import { teacherApi } from '../../api/teacherApi';
import { warningApi } from '../../api/attendanceApi';
import {
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Send,
  Eye,
  Sliders,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const TeacherProgressMonitoring: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'progress' | 'attendance' | 'name'>('progress');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Quick Warning Modal
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);

  const navigate = useNavigate();

  const fetchStudents = async () => {
    try {
      const res = await teacherApi.getStudents();
      setStudents(res.students || []);
    } catch (err) {
      toast.error('Failed to load student progress monitoring data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !warningMessage) return;

    setSendingWarning(true);
    try {
      await warningApi.createWarning({
        studentId: selectedStudent._id,
        category: 'Low Course Completion',
        priority: 'High',
        message: warningMessage
      });
      toast.success(`Warning issued to ${selectedStudent.name}.`);
      setSelectedStudent(null);
      setWarningMessage('');
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch warning.');
    } finally {
      setSendingWarning(false);
    }
  };

  // Filter & Sort
  const filteredStudents = students
    .filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.identifier.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'at_risk' && s.risk?.status === 'At Risk') ||
        (statusFilter === 'needs_attention' && s.risk?.status === 'Needs Attention') ||
        (statusFilter === 'on_track' && (!s.risk || s.risk.status === 'On Track'));
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'progress') {
        valA = a.courseCompletionPercentage ?? a.averageProgress ?? 0;
        valB = b.courseCompletionPercentage ?? b.averageProgress ?? 0;
      } else if (sortBy === 'attendance') {
        valA = a.attendancePercentage || 0;
        valB = b.attendancePercentage || 0;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Aggregating Cohort Progress Telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl bg-gradient-to-r from-navy-900 via-purple-900 to-navy-950 p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20 relative overflow-hidden border border-purple-500/20"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3 border border-cyan-400/30">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Academic Telemetry & Completion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Student Progress Monitoring
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Monitor real-time course completions, track module masteries, identify learners falling behind milestones, and issue timely academic interventions.
          </p>
        </div>
      </motion.div>

      {/* Filters & Search Toolbar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name or Student ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-600"
          >
            <option value="all">All Cohort Statuses</option>
            <option value="at_risk">Flagged: At Risk Only</option>
            <option value="needs_attention">Needs Attention</option>
            <option value="on_track">On Track</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-600"
          >
            <option value="progress">Sort by Progress</option>
            <option value="attendance">Sort by Attendance</option>
            <option value="name">Sort by Name</option>
          </select>

          {/* Sort Direction Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            title={`Toggle order: current is ${sortOrder.toUpperCase()}`}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Student Progress Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course Progress</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Risk Status</th>
                <th className="py-3 px-4 text-right">Intervention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No students matching filter parameters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const progressPct = s.courseCompletionPercentage ?? s.averageProgress ?? 0;
                  const attendancePct = s.attendancePercentage || 0;
                  const isAtRisk = s.risk?.status === 'At Risk';
                  const isNeedsAttention = s.risk?.status === 'Needs Attention';
                  const finishedCount = s.completedCourses !== undefined
                    ? s.completedCourses
                    : (progressPct >= 100 ? s.enrolledCount || 1 : Math.floor((progressPct / 100) * (s.enrolledCount || 1)));

                  return (
                    <tr
                      key={s._id}
                      className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold flex items-center justify-center text-xs">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-navy-900 dark:text-white">{s.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{s.identifier}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 min-w-[180px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">{progressPct}% Complete</span>
                            <span className="text-slate-400 font-mono text-[10px]">{finishedCount} finished</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${progressPct}%` }}
                              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                                progressPct >= 75
                                  ? 'from-emerald-500 to-teal-500'
                                  : progressPct >= 40
                                  ? 'from-purple-600 to-indigo-500'
                                  : 'from-rose-500 to-orange-500'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`font-bold font-mono ${
                          attendancePct >= 75 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {attendancePct}%
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                          isAtRisk
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200'
                            : isNeedsAttention
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200'
                        }`}>
                          {s.risk?.status || 'On Track'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/teacher/students/${s._id}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="View Student Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setWarningMessage(`Notice for ${s.name}: Your progress (${progressPct}%) requires improvement to satisfy course requirements.`);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center gap-1.5 shadow-sm"
                          >
                            <Send className="w-3 h-3" />
                            <span>Warn</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning Dispatch Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md glass-card p-6 rounded-3xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-purple-600" />
                <span>Issue Academic Warning</span>
              </h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Student: <strong className="text-purple-600">{selectedStudent.name}</strong> ({selectedStudent.identifier})
            </p>

            <form onSubmit={handleSendWarning} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Warning Message</label>
                <textarea
                  rows={4}
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingWarning}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/20"
                >
                  {sendingWarning ? 'Sending...' : 'Dispatch Warning'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
