import React, { useState, useEffect } from 'react';
import { studentApi, StudentDashboardData } from '../../api/studentApi';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Sparkles,
  Target,
  BarChart2,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const StudentProgress: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await studentApi.getDashboard();
        setData(res);
      } catch (err) {
        toast.error('Failed to load academic progress metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading course progress & learning analytics...</p>
        </div>
      </div>
    );
  }

  const overview = data?.overview;
  const courses = data?.enrolledCourses || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl bg-gradient-to-r from-navy-900 via-purple-900 to-navy-950 p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20 relative overflow-hidden border border-purple-500/20"
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-purple-500 to-transparent pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-cyan-300 mb-3 border border-cyan-400/20">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Learning Milestones & Progress</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Academic Progress & Completion
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Track your course milestone completion, watch times, completed modules, and eligibility for academic certifications.
          </p>
        </div>
      </motion.div>

      {/* Progress Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Overall Completion',
            value: `${overview?.overallProgress || 0}%`,
            subtitle: 'Average course progress',
            icon: Target,
            color: 'from-purple-600 to-purple-800',
            textColor: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-950/40',
          },
          {
            title: 'Completed Courses',
            value: `${overview?.completedCoursesCount || 0}`,
            subtitle: `Out of ${overview?.totalEnrolled || 0} enrolled`,
            icon: CheckCircle,
            color: 'from-emerald-500 to-teal-700',
            textColor: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
          },
          {
            title: 'In-Progress Courses',
            value: `${overview?.inProgressCoursesCount || 0}`,
            subtitle: 'Active learning modules',
            icon: BookOpen,
            color: 'from-cyan-500 to-blue-700',
            textColor: 'text-cyan-600 dark:text-cyan-400',
            bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
          },
          {
            title: 'Attendance Record',
            value: `${overview?.attendancePercentage || 0}%`,
            subtitle: `${overview?.presentDays || 0} of ${overview?.totalAttendanceDays || 0} days present`,
            icon: Calendar,
            color: 'from-indigo-500 to-purple-700',
            textColor: 'text-indigo-600 dark:text-indigo-400',
            bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
          },
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.08 }}
            className="glass-card p-5 rounded-2xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{stat.title}</span>
              <div className={`p-2 rounded-xl ${stat.bgColor} ${stat.textColor}`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">{stat.value}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{stat.subtitle}</p>
          </motion.div>
        ))}
      </div>

      {/* Detailed Course Progress Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>Course Progress Breakdown ({courses.length})</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Synchronized with watch telemetry</span>
        </div>

        {courses.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No courses enrolled yet</p>
            <p className="text-xs text-slate-500 mt-1">Enroll in courses to start tracking your academic milestones.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c, index) => {
              const progressPct = c.completionPercentage || 0;
              const isCompleted = progressPct >= 100 || c.status === 'completed';

              return (
                <motion.div
                  key={c.courseId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="glass-card p-5 rounded-2xl flex flex-col justify-between space-y-4 border hover:border-purple-500/40 transition-all"
                  data-cursor="card"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 uppercase tracking-wider">
                          {c.code || 'COURSE'}
                        </span>
                        <h3 className="text-sm font-bold text-navy-900 dark:text-white mt-1.5 line-clamp-1">
                          {c.title}
                        </h3>
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                      }`}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                      Instructor: {c.instructorName || 'Faculty Instructor'}
                    </p>

                    {/* Progress Bar & Percentage */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">
                          {c.completedLessons || 0} of {c.totalLessons || 0} Lessons Completed
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold">{progressPct}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${
                            isCompleted
                              ? 'from-emerald-500 to-teal-500'
                              : 'from-purple-600 via-indigo-600 to-cyan-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {isCompleted ? '🎉 Milestone reached' : 'Keep learning to reach 100%'}
                    </span>
                    <button
                      onClick={() => navigate(`/student/courses/${c.courseId}/learn${c.continueLessonId ? `/${c.continueLessonId}` : ''}`)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                      <span>{isCompleted ? 'Review Modules' : 'Resume Lesson'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
