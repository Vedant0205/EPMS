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
      <div className="rounded-xl bg-slate-900 p-6 text-white border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Cohort Management</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Student Directory & Intervention
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Inspect student progression, filter attendance benchmarks, track module completion rates, and trigger direct interventions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-center">
              <p className="text-[11px] text-slate-400 font-medium">Total Enrolled</p>
              <p className="text-lg font-bold text-white">{students.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search by Name/ID/Email */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student by name, ID, or email..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            />
          </div>

          {/* Filter by Course */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium transition-colors"
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
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium transition-colors"
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
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium transition-colors"
            >
              <option value="">All Academic Statuses</option>
              <option value="On Track">On Track</option>
              <option value="Needs Attention">Needs Attention</option>
              <option value="At Risk">At Risk</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{students.length}</span> students matching filters
          </span>
          {(search || selectedCourse || attendanceFilter || progressFilter || riskFilter) && (
            <button
              onClick={clearFilters}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-3">Identifier</th>
                <th className="py-3 px-3">Courses</th>
                <th className="py-3 px-3">Attendance</th>
                <th className="py-3 px-3">Course Progress</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="font-medium text-xs">Loading student roster...</p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
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
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {student.avatar ? (
                            <img
                              src={student.avatar.startsWith('/uploads') ? `http://localhost:5000${student.avatar}` : student.avatar}
                              alt={student.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-semibold flex items-center justify-center text-xs shrink-0">
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {student.identifier}
                      </td>

                      {/* Enrolled Courses */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          {student.enrolledCount} {student.enrolledCount === 1 ? 'Course' : 'Courses'}
                        </span>
                      </td>

                      {/* Attendance % */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold ${
                            student.attendancePercentage < 75 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {student.attendancePercentage}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({student.presentDays}/{student.totalAttendanceDays}d)
                          </span>
                        </div>
                      </td>

                      {/* Course Completion % */}
                      <td className="py-3 px-3">
                        <div className="w-28">
                          <div className="flex justify-between items-center text-[10px] mb-1 font-semibold">
                            <span className={student.courseCompletionPercentage < 40 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}>
                              {student.courseCompletionPercentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                student.courseCompletionPercentage < 40
                                  ? 'bg-rose-500'
                                  : student.courseCompletionPercentage < 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${student.courseCompletionPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Overall Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                          isRisk
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
                            : isAttention
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isRisk ? 'bg-rose-600' : isAttention ? 'bg-amber-600' : 'bg-emerald-600'}`}></span>
                          {student.risk.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openWarningModal(student)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition-colors flex items-center gap-1"
                            title="Dispatch Early Academic Warning"
                          >
                            <Send className="w-3 h-3" />
                            <span>Warn</span>
                          </button>
                          <button
                            onClick={() => navigate(`/teacher/students/${student._id}`)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1"
                            title="Examine Student Details"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Profile</span>
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Dispatch Warning: {selectedStudent.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{selectedStudent.identifier} • {selectedStudent.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setWarningModalOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendWarning} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['High', 'Medium', 'Low'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setWarningPriority(p)}
                        className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          warningPriority === p
                            ? p === 'High'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : p === 'Medium'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Intervention Instructions & Academic Feedback
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    placeholder="Provide actionable guidance for the student..."
                    className="w-full p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setWarningModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingWarning}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
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