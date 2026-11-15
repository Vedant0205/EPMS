import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { teacherApi } from '../../api/teacherApi';
import { courseApi } from '../../api/courseApi';
import { warningApi } from '../../api/attendanceApi';
import { StudentSummary, Course } from '../../types';
import {
  Users,
  Search,
  Filter,
  Send,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  CalendarCheck,
  TrendingDown,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const initialRisk = searchParams.get('riskStatus') || '';

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('');
  const [progressFilter, setProgressFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState(initialRisk);

  // Warning Modal State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [warningCategory, setWarningCategory] = useState('Low Attendance');
  const [warningPriority, setWarningPriority] = useState('High');
  const [warningMessage, setWarningMessage] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);

  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      const list = await courseApi.getCourses();
      setCourses(list);
    } catch {}
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await teacherApi.getStudents({
        search: search || undefined,
        courseId: selectedCourse || undefined,
        attendanceFilter: attendanceFilter || undefined,
        progressFilter: progressFilter || undefined,
        riskStatus: riskFilter || undefined
      });
      setStudents(res.students || []);
    } catch (err) {
      toast.error('Failed to load student management roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedCourse, attendanceFilter, progressFilter, riskFilter]);

  const openWarningModal = (student: StudentSummary) => {
    setSelectedStudent(student);
    setWarningCategory(student.risk?.status === 'At Risk' ? 'Low Attendance' : 'Missing Lessons');
    setWarningMessage(`Please address your current academic standing in ${student.risk?.reasons?.[0] || 'your coursework'}.`);
    setWarningPriority('High');
    setWarningModalOpen(true);
  };

  const handleSendWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !warningMessage) return;

    setSendingWarning(true);
    try {
      await warningApi.createWarning({
        studentId: selectedStudent._id,
        category: warningCategory,
        priority: warningPriority,
        message: warningMessage
      });
      toast.success(`Warning dispatched to ${selectedStudent.name}.`);
      setWarningModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to issue warning.');
    } finally {
      setSendingWarning(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCourse('');
    setAttendanceFilter('');
    setProgressFilter('');
    setRiskFilter('');
  };

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
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cohort Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Student Directory & Intervention
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Inspect student progression, filter attendance benchmarks, track module completion rates, and trigger direct interventions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-center">
              <p className="text-xs text-slate-400">Total Enrolled</p>
              <p className="text-xl font-black text-cyan-400">{students.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-5 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search by Name/ID/Email */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, ID, or email..."
              className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white/70 dark:bg-navy-900/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Filter by Course */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white/70 dark:bg-navy-900/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium transition-all"
            >
              <option value="">All Enrolled Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Attendance */}
          <div>
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white/70 dark:bg-navy-900/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium transition-all"
            >
              <option value="">All Attendance Rates</option>
              <option value="low">Low (&lt; 75%)</option>
              <option value="good">Good (75% - 89%)</option>
              <option value="excellent">Excellent (≥ 90%)</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white/70 dark:bg-navy-900/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold transition-all"
            >
              <option value="">All Academic Statuses</option>
              <option value="On Track">🟢 On Track</option>
              <option value="Needs Attention">🟡 Needs Attention</option>
              <option value="At Risk">🔴 At Risk</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-navy-700/60 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Showing <span className="font-bold text-purple-600 dark:text-purple-400">{students.length}</span> students matching filters
          </span>
          {(search || selectedCourse || attendanceFilter || progressFilter || riskFilter) && (
            <button
              onClick={clearFilters}
              className="text-purple-600 dark:text-purple-400 hover:text-cyan-500 font-semibold transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Students Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-navy-900/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-navy-700/60">
              <tr>
                <th className="py-4 px-5">Student</th>
                <th className="py-4 px-4">Identifier</th>
                <th className="py-4 px-4">Courses</th>
                <th className="py-4 px-4">Attendance</th>
                <th className="py-4 px-4">Course Progress</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="font-medium">Loading student roster...</p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isRisk = student.risk.status === 'At Risk';
                  const isAttention = student.risk.status === 'Needs Attention';

                  return (
                    <tr
                      key={student._id}
                      className="hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          {student.avatar ? (
                            <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-purple-500/20" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-navy-900 to-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-4 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {student.identifier}
                      </td>

                      {/* Enrolled Courses */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                          {student.enrolledCount} {student.enrolledCount === 1 ? 'Course' : 'Courses'}
                        </span>
                      </td>

                      {/* Attendance % */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            student.attendancePercentage < 75 ? 'text-rose-500 font-extrabold' : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {student.attendancePercentage}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({student.presentDays}/{student.totalAttendanceDays}d)
                          </span>
                        </div>
                      </td>

                      {/* Course Completion % */}
                      <td className="py-4 px-4">
                        <div className="w-32">
                          <div className="flex justify-between items-center text-[10px] mb-1 font-bold">
                            <span className={student.courseCompletionPercentage < 40 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}>
                              {student.courseCompletionPercentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-navy-900 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                student.courseCompletionPercentage < 40
                                  ? 'bg-rose-500'
                                  : student.courseCompletionPercentage < 70
                                  ? 'bg-amber-500'
                                  : 'bg-gradient-to-r from-purple-500 to-cyan-500'
                              }`}
                              style={{ width: `${student.courseCompletionPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Overall Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isRisk
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                            : isAttention
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isRisk ? 'bg-rose-500' : isAttention ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                          {student.risk.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openWarningModal(student)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                            title="Dispatch Early Academic Warning"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Warn</span>
                          </button>
                          <button
                            onClick={() => navigate(`/teacher/students/${student._id}`)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                            title="Examine Student Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Profile</span>
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
      <AnimatePresence>
        {warningModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-navy-800 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-700 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Dispatch Warning: {selectedStudent.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">{selectedStudent.identifier} • {selectedStudent.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setWarningModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendWarning} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Warning Category
                  </label>
                  <select
                    value={warningCategory}
                    onChange={(e) => setWarningCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                  >
                    <option value="Low Attendance">Low Attendance</option>
                    <option value="Low Course Completion">Low Course Completion</option>
                    <option value="Inactive Student">Inactive Student</option>
                    <option value="Missing Lessons">Missing Lessons</option>
                    <option value="General Warning">General Warning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['High', 'Medium', 'Low'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setWarningPriority(p)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          warningPriority === p
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Intervention Instructions & Academic Feedback
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    placeholder="Provide actionable guidance for the student..."
                    className="w-full p-3.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-navy-700">
                  <button
                    type="button"
                    onClick={() => setWarningModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingWarning}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-navy-900 hover:from-purple-500 hover:to-navy-800 text-white transition-all shadow-md shadow-purple-500/25 disabled:opacity-50"
                  >
                    {sendingWarning ? 'Sending...' : 'Dispatch Intervention'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};