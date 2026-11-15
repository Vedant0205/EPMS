import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi, StudentDashboardData } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  CheckCircle,
  Clock,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  PlayCircle,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertCircle,
  Award,
  Bell,
  Activity,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await studentApi.getDashboard();
      setData(res);
    } catch (err: any) {
      toast.error('Failed to load student dashboard telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAcknowledgeWarning = async (warningId: string) => {
    try {
      await studentApi.acknowledgeWarning(warningId, 'Acknowledged by student scholar');
      toast.success('Academic warning acknowledged and logged.');
      fetchDashboard();
    } catch (err) {
      toast.error('Failed to acknowledge warning.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Synchronizing Academic Analytics...</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview;
  const courses = data?.enrolledCourses || [];
  const warnings = data?.warnings || [];
  const announcements = data?.announcements || [];
  const recentActivities = data?.recentActivities || [];

  // Formatted date
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* A. Welcome Banner Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl bg-gradient-to-r from-navy-900 via-purple-900 to-navy-950 p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20 relative overflow-hidden border border-purple-500/20"
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-purple-500 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-cyan-300 mb-3 border border-cyan-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Academic Term 2025–26</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">{todayFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              "Consistency is the foundation of excellence." Keep your attendance above 75% and stay on top of your video lessons.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/student/courses')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow-purple transition-all flex items-center gap-2"
              data-cursor="pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>My Courses</span>
            </button>
            <button
              onClick={() => navigate('/student/progress')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition-colors flex items-center gap-2"
              data-cursor="pointer"
            >
              <TrendingUp className="w-4 h-4 text-cyan-300" />
              <span>Full Analytics</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Critical Warnings Notice Banner */}
      {warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-3"
        >
          {warnings.map((w) => (
            <div
              key={w._id}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                w.priority === 'High'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-100 shadow-sm'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white/60 dark:bg-rose-900/40 text-rose-600 mt-0.5 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider">
                      {w.category || 'Academic Notice'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      w.priority === 'High' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {w.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">{w.message}</p>
                </div>
              </div>

              <button
                onClick={() => handleAcknowledgeWarning(w._id)}
                className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors flex items-center justify-center gap-1.5"
                data-cursor="pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Acknowledge Warning</span>
              </button>
            </div>
          ))}
        </motion.div>
      )}

      {/* B. Overview Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          {
            title: 'Enrolled Courses',
            value: overview?.totalEnrolled || 0,
            unit: 'Courses',
            icon: BookOpen,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-950/50',
            link: '/student/courses'
          },
          {
            title: 'Completed',
            value: overview?.completedCoursesCount || 0,
            unit: 'Finished',
            icon: CheckCircle,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/50',
            link: '/student/progress'
          },
          {
            title: 'In Progress',
            value: overview?.inProgressCoursesCount || 0,
            unit: 'Active',
            icon: Clock,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-50 dark:bg-indigo-950/50',
            link: '/student/courses'
          },
          {
            title: 'Attendance',
            value: `${overview?.attendancePercentage || 0}%`,
            unit: `${overview?.presentDays || 0}/${overview?.totalAttendanceDays || 0} Days`,
            icon: CalendarCheck,
            color: (overview?.attendancePercentage || 0) >= 75 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600',
            bg: 'bg-cyan-50 dark:bg-cyan-950/50',
            link: '/student/attendance'
          },
          {
            title: 'Overall Progress',
            value: `${overview?.overallProgress || 0}%`,
            unit: 'Curriculum',
            icon: TrendingUp,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-950/50',
            link: '/student/progress'
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

      {/* Main Split Grid: Left Course Progress, Right Attendance & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Enrolled Course Progress */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Current Course Progression</span>
            </h2>
            <button
              onClick={() => navigate('/student/courses')}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="glass-card p-8 text-center rounded-2xl">
              <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No courses currently enrolled.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 4).map((c, idx) => {
                const progressPct = c.completionPercentage || 0;
                const isComplete = progressPct >= 100 || c.status === 'completed';

                return (
                  <motion.div
                    key={c.courseId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    data-cursor="card"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 font-black text-sm">
                        {c.code?.slice(0, 3) || 'CRS'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono">
                            {c.code}
                          </span>
                          <span className="text-xs text-slate-400">Instructor: {c.instructorName}</span>
                        </div>
                        <h3 className="text-sm font-bold text-navy-900 dark:text-white mt-1 truncate">
                          {c.title}
                        </h3>

                        {/* Animated Progress Bar */}
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">{c.completedLessons || 0} of {c.totalLessons || 0} Lessons</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">{progressPct}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sm:self-center shrink-0">
                      <button
                        onClick={() => navigate(`/student/courses/${c.courseId}/learn${c.continueLessonId ? `/${c.continueLessonId}` : ''}`)}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          isComplete
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20'
                        }`}
                        data-cursor="pointer"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{isComplete ? 'Review Course' : 'Continue Video'}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Attendance & Announcements */}
        <div className="space-y-6">
          {/* Attendance Summary Mini Card */}
          <div className="glass-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-cyan-600" />
                <span>Attendance Matrix</span>
              </h3>
              <button
                onClick={() => navigate('/student/attendance')}
                className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                Calendar
              </button>
            </div>

            <div className="flex items-center justify-around py-2">
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-600">{overview?.presentDays || 0}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Present</p>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
              <div className="text-center">
                <p className="text-2xl font-black text-rose-600">{overview?.absentDays || 0}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Absent</p>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
              <div className="text-center">
                <p className="text-2xl font-black text-amber-600">{overview?.leaveDays || 0}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Leave</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-lavender-50 dark:bg-slate-800/60 border border-purple-100 dark:border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Compliance Rate:</span>
              <span className="ml-1 text-xs font-black text-purple-600 dark:text-purple-400">
                {overview?.attendancePercentage || 0}%
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">Threshold minimum is 75% for exam eligibility</p>
            </div>
          </div>

          {/* Institutional Announcements */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-purple-600" />
              <span>Campus Announcements</span>
            </h3>

            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No new notices posted.</p>
            ) : (
              <div className="space-y-2.5">
                {announcements.slice(0, 3).map((a) => (
                  <div
                    key={a._id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                  >
                    <p className="text-xs font-bold text-navy-900 dark:text-white">{a.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{a.content}</p>
                    <span className="text-[9px] text-purple-600 dark:text-purple-400 font-mono mt-1 block">
                      {new Date(a.postedAt || a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
