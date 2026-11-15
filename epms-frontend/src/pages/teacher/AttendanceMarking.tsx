import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { courseApi } from '../../api/courseApi';
import { attendanceApi } from '../../api/attendanceApi';
import { Course, RosterStudent, AttendanceStatus } from '../../types';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  CheckCheck,
  Calendar,
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AttendanceMarking: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadyMarkedCount, setAlreadyMarkedCount] = useState<number>(0);

  // Load courses
  useEffect(() => {
    courseApi.getCourses().then((list) => {
      setCourses(list);
      if (list.length > 0) {
        setSelectedCourseId(list[0]._id);
      }
    });
  }, []);

  // Fetch roster when course or date changes
  const fetchRoster = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const res = await attendanceApi.getCourseRoster(selectedCourseId, date);
      setRoster(res.roster || []);
      setAlreadyMarkedCount(res.summary?.alreadyMarked || 0);
    } catch (err) {
      toast.error('Failed to load course attendance roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedCourseId, date]);

  // Update single student status
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRoster(prev =>
      prev.map(s => s.studentId === studentId ? { ...s, status } : s)
    );
  };

  // Update remarks
  const handleRemarksChange = (studentId: string, remarks: string) => {
    setRoster(prev =>
      prev.map(s => s.studentId === studentId ? { ...s, remarks } : s)
    );
  };

  // Quick Action: Mark All Present
  const markAllPresent = () => {
    setRoster(prev => prev.map(s => ({ ...s, status: 'present' })));
    toast.success('Marked all students as Present.');
  };

  // Save Attendance
  const handleSaveAttendance = async () => {
    if (!selectedCourseId || roster.length === 0) return;
    setSaving(true);
    try {
      const records = roster.map(s => ({
        studentId: s.studentId,
        status: s.status,
        remarks: s.remarks
      }));

      await attendanceApi.saveAttendance({
        courseId: selectedCourseId,
        date,
        records
      });

      toast.success(`✅ Attendance for ${roster.length} students recorded!`);
      fetchRoster();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = roster.filter(s => s.status === 'present').length;
  const absentCount = roster.filter(s => s.status === 'absent').length;
  const leaveCount = roster.filter(s => s.status === 'leave').length;

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
              <CalendarCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Attendance Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Course Attendance Marking
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Record daily presence, prevent duplicate submissions, and maintain compliance records.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={markAllPresent}
              disabled={roster.length === 0}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 backdrop-blur-md transition-all flex items-center gap-1.5 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Mark All Present</span>
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={saving || roster.length === 0}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-purple-600 to-navy-900 hover:from-purple-500 hover:to-navy-800 text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <Save className="w-4 h-4 text-cyan-400" />
              <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Toolbar: Course Selector & Date Picker */}
      <div className="glass-panel p-5 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Course select */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-500" />
              Target Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white/70 dark:bg-navy-900/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold w-full sm:w-80 transition-all"
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-500" />
              Session Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white/70 dark:bg-navy-900/70 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold transition-all"
              />
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <span>Present:</span>
            <span>{presentCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
            <span>Absent:</span>
            <span>{absentCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
            <span>Leave:</span>
            <span>{leaveCount}</span>
          </div>
        </div>
      </div>

      {alreadyMarkedCount > 0 && (
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-cyan-400" />
          <span>Attendance records for this date have previously been saved. You can adjust statuses and click <strong>Save Attendance</strong> to overwrite changes.</span>
        </div>
      )}

      {/* Roster Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-navy-900/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-navy-700/60">
              <tr>
                <th className="py-4 px-5">Student</th>
                <th className="py-4 px-4">Identifier</th>
                <th className="py-4 px-4">Email</th>
                <th className="py-4 px-4 text-center">Status Selection</th>
                <th className="py-4 px-5">Session Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-700/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="font-medium">Loading roster for {date}...</p>
                  </td>
                </tr>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <CalendarCheck className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    No students currently enrolled in this course.
                  </td>
                </tr>
              ) : (
                roster.map((student) => (
                  <tr key={student.studentId} className="hover:bg-purple-500/5 dark:hover:bg-purple-500/10 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                      {student.name}
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-slate-600 dark:text-slate-400">
                      {student.identifier}
                    </td>
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                      {student.email}
                    </td>
                    <td className="py-4 px-4">
                      {/* Interactive Radio Group */}
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'present')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                            student.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                              : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Present</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'absent')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                            student.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                              : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Absent</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'leave')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                            student.status === 'leave'
                              ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                              : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Leave</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <input
                        type="text"
                        value={student.remarks || ''}
                        onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                        placeholder="Optional remarks..."
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};