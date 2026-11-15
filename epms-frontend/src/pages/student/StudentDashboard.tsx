import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi, StudentDashboardData } from '../../api/studentApi';
import { aiApi, AcademicQueryResponse } from '../../api/aiApi';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  CheckCircle,
  Clock,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  PlayCircle,
  ChevronRight,
  Search,
  Bot,
  Sparkles,
  ArrowRight,
  Bell,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Natural Language Data Query State
  const [queryInput, setQueryInput] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<AcademicQueryResponse | null>(null);

  const fetchDashboard = async () => {
    try {
      const res = await studentApi.getDashboard();
      setData(res);
    } catch {
      toast.error('Unable to load student dashboard telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAcknowledgeWarning = async (warningId: string) => {
    try {
      await studentApi.acknowledgeWarning(warningId, 'Acknowledged by student');
      toast.success('Academic warning acknowledged.');
      fetchDashboard();
    } catch {
      toast.error('Failed to acknowledge warning.');
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
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading dashboard telemetry...</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview;
  const courses = data?.enrolledCourses || [];
  const warnings = data?.warnings || [];
  const announcements = data?.announcements || [];
  const attendanceRate = overview?.attendancePercentage || 0;
  const isAttendanceSafe = attendanceRate >= 75;

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
            <span>Academic Term 2025–26</span>
            <span>•</span>
            <span>{todayFormatted}</span>
            <span>•</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">ID: {user?.identifier || 'EPMS-STU'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Student Overview: {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track your semester attendance compliance, curriculum pacing, and active milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/student/courses')}
            className="px-3.5 py-2 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            All Courses ({courses.length})
          </button>
          <button
            onClick={() => navigate('/student/ai-advisor')}
            className="px-3.5 py-2 rounded-md text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Bot className="w-4 h-4 text-sky-400 dark:text-sky-600" />
            <span>AI Academic Advisor</span>
          </button>
        </div>
      </div>

      {/* 2. Natural Language Query Engine ("Ask Your Academic Data") */}
      <div className="app-surface rounded-lg p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
            <Search className="w-4 h-4 text-slate-500" />
            <span>Ask Your Academic Data</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Natural language telemetry query</span>
        </div>

        <form onSubmit={handleExecuteQuery} className="flex gap-2">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder='Ask: "Am I safe in attendance?", "What lesson should I do next?", or "Check my warnings"'
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
              <span className="font-semibold text-slate-900 dark:text-white">Answer: </span>
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
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
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

      {/* 3. Academic Warnings Banner */}
      {warnings.length > 0 && (
        <div className="space-y-2.5">
          {warnings.map((w) => (
            <div
              key={w._id}
              className="p-4 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="flex items-center gap-2 font-semibold">
                    <span>{w.category || 'Academic Notice'}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-100">
                      {w.priority} Priority
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{w.message}</p>
                </div>
              </div>

              <button
                onClick={() => handleAcknowledgeWarning(w._id)}
                className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Acknowledge</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4. Top Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => navigate('/student/attendance')}
          className="app-surface-interactive rounded-lg p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Attendance Compliance</span>
            <CalendarCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${isAttendanceSafe ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
              {attendanceRate}%
            </span>
            <span className={`text-[11px] font-medium ${isAttendanceSafe ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isAttendanceSafe ? 'Satisfactory' : 'Below 75%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {overview?.presentDays || 0} of {overview?.totalAttendanceDays || 0} sessions attended
          </p>
        </div>

        <div
          onClick={() => navigate('/student/courses')}
          className="app-surface-interactive rounded-lg p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Curriculum</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{overview?.totalEnrolled || 0}</span>
            <span className="text-[11px] text-slate-500 font-medium">Courses</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {overview?.inProgressCoursesCount || 0} active, {overview?.completedCoursesCount || 0} finished
          </p>
        </div>

        <div
          onClick={() => navigate('/student/progress')}
          className="app-surface-interactive rounded-lg p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Coursework Completed</span>
            <CheckCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{overview?.overallProgress || 0}%</span>
            <span className="text-[11px] text-emerald-600 font-medium">Curriculum Avg</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Across all registered subjects</p>
        </div>

        <div
          onClick={() => navigate('/student/ai-advisor')}
          className="app-surface-interactive rounded-lg p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Academic Trajectory</span>
            <Bot className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${isAttendanceSafe ? 'text-slate-900 dark:text-white' : 'text-amber-600 dark:text-amber-400'}`}>
              {isAttendanceSafe ? 'On Track' : 'Needs Action'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {warnings.length} active warning(s)
          </p>
        </div>
      </div>

      {/* 5. Main Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Course Progress & Next Lessons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Current Course Progression</span>
            </h2>
            <button
              onClick={() => navigate('/student/courses')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="app-surface rounded-lg p-8 text-center">
              <p className="text-xs text-slate-500">No active course enrollments found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 4).map((c) => {
                const progressPct = c.completionPercentage || 0;
                const isComplete = progressPct >= 100 || c.status === 'completed';

                return (
                  <div
                    key={c.courseId}
                    className="app-surface-interactive rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                          {c.code}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          Instructor: {c.instructorName}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                        {c.title}
                      </h3>

                      <div className="mt-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{c.completedLessons || 0} of {c.totalLessons || 0} Lessons Completed</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{progressPct}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-900 dark:bg-slate-100 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 sm:self-center">
                      <button
                        onClick={() => navigate(`/student/courses/${c.courseId}/learn${c.continueLessonId ? `/${c.continueLessonId}` : ''}`)}
                        className={`w-full sm:w-auto px-3.5 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                          isComplete
                            ? 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750'
                            : 'text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white'
                        }`}
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{isComplete ? 'Review Course' : 'Resume Lesson'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Attendance Matrix & AI Quick Tools */}
        <div className="space-y-5">
          {/* Attendance Compliance Block */}
          <div className="app-surface rounded-lg p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Attendance Standing</span>
              </span>
              <button
                onClick={() => navigate('/student/attendance')}
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Log
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1 text-center">
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{overview?.presentDays || 0}</p>
                <p className="text-[10px] text-slate-500 font-medium">Attended</p>
              </div>
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{overview?.absentDays || 0}</p>
                <p className="text-[10px] text-slate-500 font-medium">Absent</p>
              </div>
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{overview?.leaveDays || 0}</p>
                <p className="text-[10px] text-slate-500 font-medium">Leave</p>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-600 dark:text-slate-400 text-center">
              Current rate is <strong className="text-slate-900 dark:text-white">{attendanceRate}%</strong>. Minimum threshold required for examination eligibility is 75%.
            </div>
          </div>

          {/* AI Academic Tools Quick Launch */}
          <div className="app-surface rounded-lg p-4 sm:p-5 space-y-3">
            <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-sky-500" />
              <span>AI Learning Tools</span>
            </span>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/student/ai-advisor')}
                className="w-full text-left p-2.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Attendance Recovery Math</p>
                  <p className="text-[10px] text-slate-500">Calculate required classes to reach 75% or 80%</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/student/ai-advisor')}
                className="w-full text-left p-2.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Smart Study Planner</p>
                  <p className="text-[10px] text-slate-500">Generate personalized daily study routines</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              <button
                onClick={() => navigate('/student/ai-advisor')}
                className="w-full text-left p-2.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Socratic Quiz & Flashcards</p>
                  <p className="text-[10px] text-slate-500">Test conceptual retention with guided hints</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Institutional Announcements */}
          <div className="app-surface rounded-lg p-4 sm:p-5 space-y-3">
            <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Campus Notices</span>
            </span>

            {announcements.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No active notices.</p>
            ) : (
              <div className="space-y-2">
                {announcements.slice(0, 3).map((a) => (
                  <div
                    key={a._id}
                    className="p-2.5 rounded border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white text-[11px]">{a.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{a.content}</p>
                    <span className="text-[9px] text-slate-400 mt-1 block">
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
