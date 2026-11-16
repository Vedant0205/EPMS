import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherApi, TeacherDashboardData } from '../../api/teacherApi';
import { warningApi } from '../../api/attendanceApi';
import { aiApi, AcademicQueryResponse } from '../../api/aiApi';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  Send,
  Sliders,
  Search,
  ChevronRight,
  Download,
  ShieldAlert,
  Bot,
  Mail,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Natural Language Class Data Query State
  const [queryInput, setQueryInput] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<AcademicQueryResponse | null>(null);

  // Warning Modal State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [warningCategory, setWarningCategory] = useState('Low Attendance');
  const [warningPriority, setWarningPriority] = useState('High');
  const [warningMessage, setWarningMessage] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);

  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await teacherApi.getDashboard();
      setData(res);
    } catch {
      toast.error('Unable to load teacher dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const openWarningModal = (student: any) => {
    setSelectedStudent(student);
    setWarningCategory(student.risk?.reasons?.[0]?.includes('Attendance') ? 'Low Attendance' : 'Low Course Completion');
    setWarningMessage(`Academic Notice for ${student.name}: Your performance in ${student.risk?.reasons?.[0] || 'coursework'} requires immediate attention.`);
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
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch warning.');
    } finally {
      setSendingWarning(false);
    }
  };

  const handleExecuteQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryInput.trim()) return;

    setQueryLoading(true);
    try {
      const res = await aiApi.queryAcademicData(queryInput.trim());
      setQueryResult(res);
    } catch {
      toast.error('Could not process query. Please try again.');
    } finally {
      setQueryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading faculty analytics...</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview;
  const atRiskStudents = data?.atRiskStudentsList || [];

  const riskPieData = [
    { name: 'On Track', value: overview?.studentsOnTrack || 4, color: '#059669' },
    { name: 'Needs Attention', value: overview?.studentsNeedsAttention || 2, color: '#D97706' },
    { name: 'At Risk', value: overview?.studentsAtRisk || 4, color: '#DC2626' },
  ];

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Surface */}
      <div className="app-surface rounded-lg p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Faculty Console</span>
            <span>•</span>
            <span>{todayFormatted}</span>
            <span>•</span>
            <span className="text-slate-600 dark:text-slate-300">{user?.department || 'Information Technology'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Instructor Dashboard: {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time cohort monitoring, attendance compliance audits, and early risk intervention telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="px-3.5 py-2 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center gap-1.5"
          >
            <CalendarCheck className="w-4 h-4 text-slate-500" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => navigate('/teacher/ai-copilot')}
            className="px-3.5 py-2 rounded-md text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Bot className="w-4 h-4 text-sky-400 dark:text-sky-600" />
            <span>विद्या Helper Copilot</span>
          </button>
        </div>
      </div>

      {/* 2. Natural Language Query Engine ("Ask Class Data") */}
      <div className="app-surface rounded-lg p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
            <Search className="w-4 h-4 text-slate-500" />
            <span>Ask Class Telemetry Data</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Natural language institutional query</span>
        </div>

        <form onSubmit={handleExecuteQuery} className="flex gap-2">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder='Ask: "Which students are below 75% attendance?", "Show students at risk", or "Course completion stats"'
            className="flex-1 px-3.5 py-2 rounded-md text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-colors"
          />
          <button
            type="submit"
            disabled={queryLoading || !queryInput.trim()}
            className="px-4 py-2 rounded-md text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 transition-colors shrink-0"
          >
            {queryLoading ? 'Querying...' : 'Query'}
          </button>
        </form>

        {queryResult && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-800 dark:text-slate-200">
              <span className="font-semibold text-slate-900 dark:text-white">Cohort Insight: </span>
              {queryResult.answer}
            </div>

            {queryResult.cards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {queryResult.cards.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white truncate">{c.title}</span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          c.status === 'success'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : c.status === 'critical'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {c.metric}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{c.details}</p>
                  </div>
                ))}
              </div>
            )}

            {queryResult.suggestedActions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500 font-medium">Suggested Actions:</span>
                {queryResult.suggestedActions.map((a, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(a.path)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>{a.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Core Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => navigate('/teacher/students')}
          className="app-surface-interactive rounded-lg p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Enrolled</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{overview?.totalStudents || 0}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Students</p>
        </div>

        <div
          onClick={() => navigate('/teacher/courses')}
          className="app-surface-interactive rounded-lg p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Courses</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{overview?.totalCourses || 0}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Curriculum modules</p>
        </div>

        <div
          onClick={() => navigate('/teacher/attendance')}
          className="app-surface-interactive rounded-lg p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Attendance</span>
            <CalendarCheck className="w-4 h-4 text-slate-400" />
          </div>
          <p className={`text-2xl font-bold mt-1.5 ${(overview?.averageAttendance || 0) >= 75 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
            {overview?.averageAttendance || 0}%
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Cohort Compliance</p>
        </div>

        <div
          onClick={() => navigate('/teacher/progress')}
          className="app-surface-interactive rounded-lg p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Course Completion</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{overview?.averageCourseCompletion || 0}%</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Average Progress</p>
        </div>

        <div
          onClick={() => navigate('/teacher/warnings')}
          className="app-surface-interactive rounded-lg p-4 cursor-pointer col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Students At Risk</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1.5">{overview?.studentsAtRisk || 0}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Requires intervention</p>
        </div>
      </div>

      {/* 4. Priority Intervention Roster & Cohort Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: At-Risk Action Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Priority Interventions: At-Risk Students ({atRiskStudents.length})</span>
            </h2>
            <button
              onClick={() => navigate('/teacher/students')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Full Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {atRiskStudents.length === 0 ? (
            <div className="app-surface rounded-lg p-8 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-900 dark:text-white">All Students Currently On Track</p>
              <p className="text-[11px] text-slate-500">No active students have breached institutional risk thresholds.</p>
            </div>
          ) : (
            <div className="app-surface rounded-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {atRiskStudents.slice(0, 5).map((s: any) => (
                <div
                  key={s._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-center shrink-0 text-xs">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{s.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {s.identifier}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>Attendance: <strong className="text-rose-600 font-mono">{s.attendancePercentage}%</strong></span>
                        <span>•</span>
                        <span>Completion: <strong className="text-slate-700 dark:text-slate-300 font-mono">{s.averageProgress}%</strong></span>
                      </div>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                        Flag: {s.risk?.reasons?.[0] || 'Breached academic performance threshold'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => navigate(`/teacher/students/${s._id}`)}
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => openWarningModal(s)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Issue Notice</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Risk Distribution & Shortcuts */}
        <div className="space-y-5">
          <div className="app-surface rounded-lg p-4 sm:p-5 space-y-3">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              Cohort Risk Distribution
            </span>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <div>
                <p className="font-bold text-emerald-600">{overview?.studentsOnTrack || 4}</p>
                <p className="text-[10px] text-slate-500">On Track</p>
              </div>
              <div>
                <p className="font-bold text-amber-600">{overview?.studentsNeedsAttention || 2}</p>
                <p className="text-[10px] text-slate-500">Attention</p>
              </div>
              <div>
                <p className="font-bold text-rose-600">{overview?.studentsAtRisk || 4}</p>
                <p className="text-[10px] text-slate-500">At Risk</p>
              </div>
            </div>
          </div>

          <div className="app-surface rounded-lg p-4 sm:p-5 space-y-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">Quick Management</span>
            <div className="space-y-1">
              <button
                onClick={() => navigate('/teacher/courses')}
                className="w-full text-left p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span>Curriculum & Lessons</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/teacher/progress')}
                className="w-full text-left p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span>Progress Auditing Matrix</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/teacher/settings')}
                className="w-full text-left p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span>Configure Risk Thresholds</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Dispatch Modal */}
      <AnimatePresence>
        {warningModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Issue Academic Warning</span>
                </h3>
                <button
                  onClick={() => setWarningModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                Recipient: <strong className="text-slate-900 dark:text-white">{selectedStudent.name}</strong> ({selectedStudent.identifier})
              </div>

              <form onSubmit={handleSendWarning} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Warning Category
                    </label>
                    <select
                      value={warningCategory}
                      onChange={(e) => setWarningCategory(e.target.value)}
                      className="w-full text-xs p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                    >
                      <option value="Low Attendance">Low Attendance</option>
                      <option value="Low Course Completion">Low Course Completion</option>
                      <option value="Inactivity Alert">Excessive Inactivity</option>
                      <option value="Academic Performance">Academic Performance</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      Priority Level
                    </label>
                    <select
                      value={warningPriority}
                      onChange={(e) => setWarningPriority(e.target.value)}
                      className="w-full text-xs p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                    >
                      <option value="High">High (Immediate Action)</option>
                      <option value="Medium">Medium (Attention Required)</option>
                      <option value="Low">Low (Informational)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Guidance & Remedial Message
                  </label>
                  <textarea
                    rows={4}
                    value={warningMessage}
                    onChange={(e) => setWarningMessage(e.target.value)}
                    className="w-full p-2.5 rounded-md text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWarningModalOpen(false)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingWarning}
                    className="px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {sendingWarning ? 'Dispatching...' : 'Dispatch Notice'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
