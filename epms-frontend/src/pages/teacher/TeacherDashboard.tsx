import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teacherApi, TeacherDashboardData } from '../../api/teacherApi';
import { warningApi } from '../../api/attendanceApi';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Send,
  CheckCircle2,
  Sliders,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  Download,
  BarChart2,
  PieChart as PieIcon,
  ShieldAlert
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      toast.error('Failed to load teacher dashboard data.');
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
      toast.success(`Warning successfully dispatched to ${selectedStudent.name}.`);
      setWarningModalOpen(false);
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch warning.');
    } finally {
      setSendingWarning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Synthesizing Institutional Telemetry...</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview;
  const atRiskStudents = data?.atRiskStudentsList || [];

  // Distribution chart data
  const riskPieData = [
    { name: 'On Track', value: overview?.studentsOnTrack || 4, color: '#10B981' },
    { name: 'Needs Attention', value: overview?.studentsNeedsAttention || 2, color: '#F59E0B' },
    { name: 'At Risk', value: overview?.studentsAtRisk || 4, color: '#EF4444' },
  ];

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* A. Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl bg-gradient-to-r from-navy-900 via-purple-900 to-navy-950 p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20 relative overflow-hidden border border-purple-500/20"
      >
        <div className="relative z-10 max-w-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-cyan-300 mb-3 border border-cyan-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Faculty Academic Console</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">{todayFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Instructor Dashboard: {user?.name}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time academic monitoring, attendance audits, risk detection algorithms, and student telemetry for {user?.department || 'Information Technology'}.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/teacher/attendance')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow-purple transition-all flex items-center gap-2"
              data-cursor="pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Mark Attendance</span>
            </button>
            <button
              onClick={() => navigate('/teacher/reports')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-colors flex items-center gap-2"
              data-cursor="pointer"
            >
              <Download className="w-4 h-4 text-cyan-300" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* B. Overview Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          {
            title: 'Total Students',
            value: overview?.totalStudents || 0,
            unit: 'Registered Scholars',
            icon: Users,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-950/50',
            link: '/teacher/students'
          },
          {
            title: 'Active Courses',
            value: overview?.totalCourses || 0,
            unit: 'Curriculums',
            icon: BookOpen,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-50 dark:bg-indigo-950/50',
            link: '/teacher/courses'
          },
          {
            title: 'Average Attendance',
            value: `${overview?.averageAttendance || 0}%`,
            unit: 'Cohort Compliance',
            icon: CalendarCheck,
            color: (overview?.averageAttendance || 0) >= 75 ? 'text-emerald-600' : 'text-rose-600',
            bg: 'bg-emerald-50 dark:bg-emerald-950/50',
            link: '/teacher/attendance'
          },
          {
            title: 'Average Progress',
            value: `${overview?.averageCourseCompletion || 0}%`,
            unit: 'Video & Module Completion',
            icon: TrendingUp,
            color: 'text-cyan-600 dark:text-cyan-400',
            bg: 'bg-cyan-50 dark:bg-cyan-950/50',
            link: '/teacher/progress'
          },
          {
            title: 'Students At Risk',
            value: overview?.studentsAtRisk || 0,
            unit: 'Requires Intervention',
            icon: AlertOctagon,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-950/50',
            link: '/teacher/warnings'
          },
        ].map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.06 }}
            onClick={() => navigate(card.link)}
            className="glass-card p-4 rounded-2xl cursor-pointer hover:border-purple-500/40 transition-all flex flex-col justify-between"
            data-cursor="card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">{card.title}</span>
              <div className={`p-1.5 rounded-lg ${card.bg} ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white tracking-tight">{card.value}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{card.unit}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: At-Risk Action Roster & Risk Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Critical At-Risk Student Action Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Priority Interventions: At-Risk Scholars ({atRiskStudents.length})</span>
            </h2>
            <button
              onClick={() => navigate('/teacher/students')}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Full Roster</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {atRiskStudents.length === 0 ? (
            <div className="glass-card p-8 text-center rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">All Students On Track!</p>
              <p className="text-xs text-slate-500 mt-1">No students currently breach institutional attendance or completion thresholds.</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {atRiskStudents.slice(0, 5).map((s: any) => (
                <div
                  key={s._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold flex items-center justify-center shrink-0 text-xs">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-navy-900 dark:text-white truncate">{s.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {s.identifier}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>Attendance: <strong className="text-rose-600 font-mono">{s.attendancePercentage}%</strong></span>
                        <span>•</span>
                        <span>Progress: <strong className="text-purple-600 font-mono">{s.averageProgress}%</strong></span>
                      </div>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                        ⚠️ Reason: {s.risk?.reasons?.[0] || 'Breached academic threshold'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => navigate(`/teacher/students/${s._id}`)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => openWarningModal(s)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm flex items-center gap-1.5"
                      data-cursor="pointer"
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

        {/* Right Column (1 Col): Risk Distribution Donut & Fast Action Hub */}
        <div className="space-y-6">
          {/* Cohort Health Donut Chart */}
          <div className="glass-card p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-purple-600" />
              <span>Cohort Academic Health</span>
            </h3>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
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
                <p className="text-[10px] text-slate-400">On Track</p>
              </div>
              <div>
                <p className="font-bold text-amber-600">{overview?.studentsNeedsAttention || 2}</p>
                <p className="text-[10px] text-slate-400">Attention</p>
              </div>
              <div>
                <p className="font-bold text-rose-600">{overview?.studentsAtRisk || 4}</p>
                <p className="text-[10px] text-slate-400">At Risk</p>
              </div>
            </div>
          </div>

          {/* Quick Faculty Navigation Shortcuts */}
          <div className="glass-card p-5 rounded-2xl space-y-2.5">
            <h3 className="text-xs font-bold text-navy-900 dark:text-white">Quick Faculty Actions</h3>
            <div className="space-y-1.5">
              <button
                onClick={() => navigate('/teacher/courses')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>Curriculum Management</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/teacher/progress')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-600" />
                  <span>Progress Monitoring Matrix</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => navigate('/teacher/settings')}
                className="w-full text-left p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Configure Early Warning Thresholds</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Dispatch Modal */}
      <AnimatePresence>
        {warningModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass-card p-6 rounded-3xl space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Issue Formal Academic Warning</span>
                </h3>
                <button
                  onClick={() => setWarningModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                Recipient: <strong className="text-navy-900 dark:text-white">{selectedStudent.name}</strong> ({selectedStudent.identifier})
              </div>

              <form onSubmit={handleSendWarning} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Warning Category</label>
                    <select
                      value={warningCategory}
                      onChange={(e) => setWarningCategory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                    >
                      <option value="Low Attendance">Low Attendance Compliance</option>
                      <option value="Low Course Completion">Low Course Completion</option>
                      <option value="Inactivity Alert">Excessive Inactivity</option>
                      <option value="Academic Performance">Academic Performance</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Priority Level</label>
                    <select
                      value={warningPriority}
                      onChange={(e) => setWarningPriority(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                    >
                      <option value="High">High (Immediate Action)</option>
                      <option value="Medium">Medium (Attention Required)</option>
                      <option value="Low">Low (Informational)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Warning Guidance Message</label>
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
                    onClick={() => setWarningModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingWarning}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 shadow-md shadow-rose-600/20"
                  >
                    {sendingWarning ? 'Dispatching...' : 'Confirm & Dispatch Notice'}
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
