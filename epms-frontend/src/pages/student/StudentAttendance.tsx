import React, { useState, useEffect } from 'react';
import { studentApi } from '../../api/studentApi';
import { courseApi } from '../../api/courseApi';
import { AttendanceStats, AttendanceRecord, Course } from '../../types';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const StudentAttendance: React.FC = () => {
  const [stats, setStats] = useState<AttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0,
    attendancePercentage: 100
  });
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Load courses for filter dropdown
  useEffect(() => {
    courseApi.getCourses().then(setCourses).catch(() => {});
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const res = await studentApi.getMyAttendance({
        courseId: selectedCourse || undefined,
        month,
        year
      });
      setStats(res.stats);
      setHistory(res.history);
    } catch (err) {
      toast.error('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedCourse, currentDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar generation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map history date string (YYYY-MM-DD) to status
  const dateMap: { [date: string]: AttendanceRecord } = {};
  history.forEach(r => {
    dateMap[r.date] = r;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl bg-gradient-to-r from-navy-900 via-purple-900 to-navy-950 p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20 relative overflow-hidden border border-purple-500/20"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3 border border-cyan-400/30">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Institutional Attendance Compliance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Personal Attendance Matrix
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time attendance logs, compliance percentage metrics, and visual monthly session tracking.
            </p>
          </div>

          {/* Course Filter */}
          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
            <Filter className="w-4 h-4 text-cyan-300" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-navy-900 text-white border border-white/20 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Academic Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-5 rounded-2xl"
        >
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Attendance Percentage</span>
          <p className={`text-2xl sm:text-3xl font-black mt-1 ${
            stats.attendancePercentage < 75 ? 'text-rose-600' : 'text-purple-600 dark:text-purple-400'
          }`}>
            {stats.attendancePercentage}%
          </p>
          <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            stats.attendancePercentage >= 75
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          }`}>
            {stats.attendancePercentage >= 75 ? 'Meets Minimum (≥75%)' : 'Below 75% Threshold'}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="glass-card p-5 rounded-2xl"
        >
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Present Sessions</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
            {stats.presentDays}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Attended and verified</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-card p-5 rounded-2xl"
        >
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Absent Sessions</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
            {stats.absentDays}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Unexcused missed sessions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="glass-card p-5 rounded-2xl"
        >
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Excused Leaves</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
            {stats.leaveDays}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Approved medical/academic</p>
        </motion.div>
      </div>

      {/* Main Grid: Interactive Calendar & Attendance History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Calendar View (5 cols) */}
        <div className="lg:col-span-5 glass-card p-6 rounded-3xl space-y-4">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-purple-600" />
              <span>{monthName} {year}</span>
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="font-bold text-slate-400 py-1 text-[11px]">
                {d}
              </span>
            ))}

            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const record = dateMap[dateStr];

              let tileClass = 'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300';
              if (record) {
                if (record.status === 'present') {
                  tileClass = 'bg-emerald-500 text-white font-bold shadow-sm';
                } else if (record.status === 'absent') {
                  tileClass = 'bg-rose-500 text-white font-bold shadow-sm';
                } else if (record.status === 'leave') {
                  tileClass = 'bg-amber-500 text-white font-bold shadow-sm';
                } else if (record.status === 'late') {
                  tileClass = 'bg-cyan-500 text-white font-bold shadow-sm';
                }
              }

              return (
                <div
                  key={dayNum}
                  className={`h-9 flex items-center justify-center rounded-xl text-xs transition-transform hover:scale-105 cursor-default ${tileClass}`}
                  title={record ? `${record.date}: ${record.status.toUpperCase()}` : dateStr}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Present</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>Absent</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>Late</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Leave</span>
          </div>
        </div>

        {/* Attendance Ledger Table (7 cols) */}
        <div className="lg:col-span-7 glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white">
              Session Attendance Ledger
            </h3>
            <span className="text-xs text-slate-400 font-mono">{history.length} records</span>
          </div>

          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Course</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No attendance records for this period.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h._id} className="hover:bg-purple-50/30 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-navy-900 dark:text-white">
                        {h.date}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {h.course?.title || h.courseCode || 'Core Lecture'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          h.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : h.status === 'absent'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-[140px]">
                        {h.remarks || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
