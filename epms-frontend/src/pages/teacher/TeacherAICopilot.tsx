import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Bot,
  AlertTriangle,
  Users,
  Send,
  Copy,
  RotateCw,
  Search,
  Filter,
  CheckCircle2,
  TrendingDown,
  Layers,
  Sparkles,
  BookOpen,
  MessageSquare,
  FileText,
  Sliders,
  Check,
  CalendarCheck,
  ShieldAlert,
  Mail
} from 'lucide-react';
import { teacherApi, TeacherDashboardData } from '../../api/teacherApi';
import { courseApi } from '../../api/courseApi';
import api from '../../api/axiosConfig';
import { StudentSummary, Course } from '../../types';
import aiApi, {
  TeacherStudentInsightResponse,
  TeacherCohortAnalysisResponse,
  LessonBottleneck,
  GuardianDigestResponse
} from '../../api/aiApi';

type ActiveTab = 'interventions' | 'cohort-diagnostics' | 'announcement-assistant' | 'guardian-digest';
type RiskFilter = 'all' | 'At Risk' | 'Needs Attention' | 'On Track';

export const TeacherAICopilot: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('interventions');
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Intervention State
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [interventionTone, setInterventionTone] = useState<'supportive' | 'formal' | 'balanced'>('balanced');
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [insightData, setInsightData] = useState<TeacherStudentInsightResponse | null>(null);
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [sendingWarning, setSendingWarning] = useState(false);

  // Cohort Diagnostics State
  const [selectedDiagnosticCourseId, setSelectedDiagnosticCourseId] = useState<string>('all');
  const [loadingCohort, setLoadingCohort] = useState(false);
  const [cohortData, setCohortData] = useState<TeacherCohortAnalysisResponse | null>(null);
  const [completedInterventions, setCompletedInterventions] = useState<Record<string, boolean>>({});

  // Announcement Assistant State
  const [announcementAudience, setAnnouncementAudience] = useState<'all' | 'at-risk' | 'course'>('all');
  const [announcementCourseId, setAnnouncementCourseId] = useState<string>('');
  const [announcementCategory, setAnnouncementCategory] = useState<string>('Exam Preparation & Academic Expectations');
  const [announcementTone, setAnnouncementTone] = useState<'formal' | 'supportive' | 'firm'>('supportive');
  const [customKeyPoints, setCustomKeyPoints] = useState<string>('');
  const [draftingAnnouncement, setDraftingAnnouncement] = useState(false);
  const [announcementSubject, setAnnouncementSubject] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');

  // Guardian Digest Generator State
  const [digestStudentId, setDigestStudentId] = useState<string>('');
  const [digestTone, setDigestTone] = useState<'supportive' | 'formal' | 'urgent'>('supportive');
  const [generatingDigest, setGeneratingDigest] = useState(false);
  const [guardianDigest, setGuardianDigest] = useState<GuardianDigestResponse | null>(null);
  const [digestSubject, setDigestSubject] = useState('');
  const [digestBody, setDigestBody] = useState('');

  // Initial Data Fetching
  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashRes, courseList, studentsRes] = await Promise.all([
          teacherApi.getDashboard().catch(() => null),
          courseApi.getCourses().catch(() => []),
          teacherApi.getStudents().catch(() => ({ success: false, students: [], totalCount: 0 }))
        ]);

        if (dashRes) setDashboardData(dashRes);
        if (courseList) {
          setCourses(courseList);
          if (courseList.length > 0) {
            setAnnouncementCourseId(courseList[0]._id);
          }
        }
        if (studentsRes?.students) {
          setStudents(studentsRes.students);
          // Auto-select first at-risk or first student
          const atRiskFirst = studentsRes.students.find((s) => s.risk?.status === 'At Risk') ||
            studentsRes.students.find((s) => s.risk?.status === 'Needs Attention') ||
            studentsRes.students[0];
          if (atRiskFirst) {
            setSelectedStudentId(atRiskFirst._id);
          }
        }
      } catch {
        toast.error('Unable to fetch faculty analytics.');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, []);

  // Filtered Student List for At-Risk Selector
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesFilter = riskFilter === 'all' || s.risk?.status === riskFilter;
      const matchesQuery = !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.identifier.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [students, riskFilter, searchQuery]);

  // Selected Student Object
  const selectedStudent = useMemo(() => {
    return students.find((s) => s._id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Generate Intervention Note
  const handleGenerateIntervention = async () => {
    if (!selectedStudentId) {
      toast.error('Please select a student first.');
      return;
    }
    setGeneratingInsight(true);
    try {
      const response = await aiApi.getTeacherStudentInsight({
        studentId: selectedStudentId
      });
      setInsightData(response);
      setDraftSubject(response.interventionNote.subject);
      setDraftBody(response.interventionNote.body);
      toast.success('AI intervention draft generated.');
    } catch {
      toast.error('Failed to generate student insight.');
    } finally {
      setGeneratingInsight(false);
    }
  };

  // Dispatch Official Warning to Student
  const handleSendOfficialWarning = async () => {
    if (!selectedStudentId || !draftBody.trim()) {
      toast.error('Subject and body cannot be empty.');
      return;
    }

    setSendingWarning(true);
    try {
      const category = (insightData?.riskAssessment.reasons[0]?.includes('Attendance')
        ? 'Low Attendance'
        : 'Low Course Completion') as any;

      const priority = (insightData?.riskAssessment.level === 'High' ? 'High' : 'Medium') as any;

      await api.post('/warnings', {
        studentId: selectedStudentId,
        category: category || 'General Warning',
        priority: priority || 'Medium',
        message: `${draftSubject}: ${draftBody}`
      });

      toast.success(`Official warning sent to ${selectedStudent?.name || 'student'}.`);
    } catch {
      toast.error('Failed to issue official academic warning.');
    } finally {
      setSendingWarning(false);
    }
  };

  const handleCopyIntervention = () => {
    if (!draftBody) return;
    const content = `Subject: ${draftSubject}\n\n${draftBody}`;
    navigator.clipboard.writeText(content);
    toast.success('Intervention note copied to clipboard.');
  };

  // Fetch Cohort Analysis
  const handleFetchCohortDiagnostics = async () => {
    setLoadingCohort(true);
    try {
      const courseId = selectedDiagnosticCourseId === 'all' ? undefined : selectedDiagnosticCourseId;
      const res = await aiApi.getTeacherCohortAnalysis({ courseId });
      setCohortData(res);
      toast.success('Cohort diagnostic data updated.');
    } catch {
      toast.error('Failed to load cohort diagnostics.');
    } finally {
      setLoadingCohort(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'cohort-diagnostics' && !cohortData) {
      handleFetchCohortDiagnostics();
    }
  }, [activeTab]);

  const toggleInterventionItem = (id: string) => {
    setCompletedInterventions((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // AI Announcement Drafting
  const handleDraftAnnouncement = async () => {
    setDraftingAnnouncement(true);
    try {
      let prompt = `Draft a high-impact course announcement for students with tone: ${announcementTone}.\n`;
      prompt += `Topic: ${announcementCategory}.\n`;
      if (announcementAudience === 'course') {
        const found = courses.find((c) => c._id === announcementCourseId);
        prompt += `Target Course: ${found?.title || 'Selected Course'}.\n`;
      } else if (announcementAudience === 'at-risk') {
        prompt += `Target Audience: Students currently flagged as Needs Attention or At Risk.\n`;
      } else {
        prompt += `Target Audience: Entire student cohort.\n`;
      }
      if (customKeyPoints.trim()) {
        prompt += `Specific requirements to include:\n${customKeyPoints}\n`;
      }
      prompt += `Provide a concise subject line on line 1 starting with "Subject: " followed by the formatted body with polite greeting, clear instructions, and deadline notice.`;

      const response = await aiApi.chat({
        message: prompt,
        context: {
          role: 'teacher',
          courseId: announcementAudience === 'course' ? announcementCourseId : undefined
        }
      });

      const reply = response.reply || '';
      const subjectMatch = reply.match(/^Subject:\s*(.*)/im);
      if (subjectMatch) {
        setAnnouncementSubject(subjectMatch[1].trim());
        setAnnouncementBody(reply.replace(/^Subject:.*$/im, '').trim());
      } else {
        setAnnouncementSubject(`Notice: ${announcementCategory}`);
        setAnnouncementBody(reply.trim());
      }
      toast.success('Announcement drafted.');
    } catch {
      toast.error('Failed to draft announcement.');
    } finally {
      setDraftingAnnouncement(false);
    }
  };

  const handleCopyAnnouncement = () => {
    if (!announcementBody) return;
    const fullText = `Subject: ${announcementSubject}\n\n${announcementBody}`;
    navigator.clipboard.writeText(fullText);
    toast.success('Announcement copied to clipboard.');
  };

  const handleGenerateGuardianDigest = async () => {
    const studentId = digestStudentId || selectedStudentId;
    if (!studentId) {
      toast.error('Please select a student to generate guardian digest.');
      return;
    }

    setGeneratingDigest(true);
    try {
      const response = await aiApi.generateGuardianDigest(studentId, digestTone);
      setGuardianDigest(response);
      setDigestSubject(response.digest.subject);
      setDigestBody(response.digest.body);
      toast.success('Guardian progress digest generated.');
    } catch {
      toast.error('Failed to generate guardian digest.');
    } finally {
      setGeneratingDigest(false);
    }
  };

  const handleCopyGuardianDigest = () => {
    if (!digestBody) return;
    const fullText = `Subject: ${digestSubject}\n\n${digestBody}`;
    navigator.clipboard.writeText(fullText);
    toast.success('Guardian digest copied to clipboard.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/60 dark:border-indigo-800/60">
              <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Teacher AI Copilot</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Faculty Intelligence & Cohort Copilot
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Proactively identify student attrition risks, generate calibrated academic intervention letters, analyze lesson bottlenecks, and draft cohort notices.
            </p>
          </div>

          {/* Telemetry Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Scholars</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {dashboardData?.overview?.totalStudents ?? students.length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60">
              <span className="block text-[11px] font-medium text-rose-700 dark:text-rose-300">At-Risk Count</span>
              <span className="text-lg font-bold text-rose-700 dark:text-rose-400">
                {dashboardData?.overview?.studentsAtRisk ?? students.filter((s) => s.risk?.status === 'At Risk').length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60">
              <span className="block text-[11px] font-medium text-amber-700 dark:text-amber-300">Needs Attention</span>
              <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {dashboardData?.overview?.studentsNeedsAttention ?? students.filter((s) => s.risk?.status === 'Needs Attention').length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Avg Attendance</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {dashboardData?.overview?.averageAttendance ? `${dashboardData.overview.averageAttendance}%` : '82%'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mt-8 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('interventions')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'interventions'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            At-Risk Early Detection & Intervention
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cohort-diagnostics')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'cohort-diagnostics'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Course Drop-Off & Cohort Diagnostics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcement-assistant')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'announcement-assistant'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Announcement & Notice Assistant
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guardian-digest')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'guardian-digest'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            Parent & Guardian Digest
          </button>
        </div>
      </div>

      {/* Tab 1: Early Intervention Generator */}
      {activeTab === 'interventions' && (
        <motion.div
          key="tab-interventions"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Student Roster Selector Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Scholar Roster & Telemetry</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Filter by risk tier and select a student to synthesize intervention notes.
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {(['all', 'At Risk', 'Needs Attention', 'On Track'] as RiskFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setRiskFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors ${
                      riskFilter === filter
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-400 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {filter === 'all' ? 'All Scholars' : filter}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Student Cards List */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
                    No scholars found matching filter criteria.
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const isSelected = student._id === selectedStudentId;
                    const status = student.risk?.status || 'On Track';

                    return (
                      <div
                        key={student._id}
                        onClick={() => setSelectedStudentId(student._id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-950 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {student.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {student.identifier}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {student.department || 'General Science'}
                            </span>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            status === 'At Risk'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : status === 'Needs Attention'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {status}
                          </span>
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Attendance</span>
                            <span className={`font-bold ${
                              student.attendancePercentage < 75 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {student.attendancePercentage}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Completion</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {student.courseCompletionPercentage}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Inactive</span>
                            <span className={`font-bold ${
                              student.daysInactive > 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {student.daysInactive}d
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Intervention Composer Column */}
          <div className="lg:col-span-7 space-y-6">
            {selectedStudent ? (
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                {/* Header & Generate Trigger */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Diagnostic & Intervention Dossier
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Scholar: <strong className="text-slate-800 dark:text-slate-200">{selectedStudent.name}</strong> ({selectedStudent.identifier})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateIntervention}
                    disabled={generatingInsight}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {generatingInsight ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Diagnosing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Intervention Note</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Risk Drivers Callout */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Observed Risk Drivers</span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      selectedStudent.risk?.status === 'At Risk' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {insightData?.riskAssessment.level || selectedStudent.risk?.status} Priority
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {(insightData?.riskAssessment.reasons || selectedStudent.risk?.reasons || ['Low attendance rate', 'Inactive sessions']).map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                  {insightData?.riskAssessment.trajectory && (
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <strong>Trajectory:</strong> {insightData.riskAssessment.trajectory}
                    </p>
                  )}
                </div>

                {/* Formatted Letter Editor */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={draftSubject}
                      onChange={(e) => setDraftSubject(e.target.value)}
                      placeholder="e.g. Academic Attendance & Progress Advisory"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Intervention Message Body
                      </label>
                      <span className="text-[11px] text-slate-400">Editable prior to dispatch</span>
                    </div>
                    <textarea
                      rows={7}
                      value={draftBody}
                      onChange={(e) => setDraftBody(e.target.value)}
                      placeholder="Click 'Generate Intervention Note' above or compose your tailored message here..."
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCopyIntervention}
                      disabled={!draftBody.trim()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy to Clipboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendOfficialWarning}
                      disabled={sendingWarning || !draftBody.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {sendingWarning ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Issue as Official Academic Warning</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[380px] bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Select a Scholar</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Choose an at-risk student from the left panel to synthesize personalized intervention letters and log official academic notices.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 2: Course Drop-Off & Cohort Diagnostics */}
      {activeTab === 'cohort-diagnostics' && (
        <motion.div
          key="tab-cohort"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Controls Bar */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Cohort Scope:
              </label>
              <select
                value={selectedDiagnosticCourseId}
                onChange={(e) => setSelectedDiagnosticCourseId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Enrolled Courses (Aggregated)</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleFetchCohortDiagnostics}
              disabled={loadingCohort}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {loadingCohort ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Cohort...</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Refresh Diagnostics</span>
                </>
              )}
            </button>
          </div>

          {/* Metrics Grid */}
          {cohortData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Active Enrollment</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
                  {cohortData.courseSummary?.totalEnrolled ?? 0}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">enrolled students</span>
              </div>

              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Mean Progress</span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 block">
                  {cohortData.courseSummary?.averageProgress ?? 0}%
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">curriculum completion</span>
              </div>

              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Scholars At-Risk</span>
                <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">
                  {cohortData.courseSummary?.atRiskCount ?? 0}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">requiring attention</span>
              </div>

              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Mean Attendance</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {cohortData.courseSummary?.averageAttendance ? `${cohortData.courseSummary.averageAttendance}%` : '84%'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">cohort average</span>
              </div>
            </div>
          )}

          {/* Diagnostic Bottlenecks List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Identified Lesson Bottlenecks</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Modules where student completion significantly decelerates or ceases.
                </p>
              </div>

              {cohortData?.lessonBottlenecks && cohortData.lessonBottlenecks.length > 0 ? (
                <div className="space-y-3">
                  {cohortData.lessonBottlenecks.map((item, idx) => (
                    <div
                      key={item.lessonId || idx}
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {item.lessonTitle}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Lesson ID: {item.lessonId}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-xs font-bold font-mono">
                          {item.dropoffRate}% Drop-Off
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-navy-950 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700/60 leading-relaxed">
                        <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">AI Recommendation: </strong>
                        {item.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  {loadingCohort ? 'Analyzing lesson progression rates...' : 'No critical bottlenecks detected in this cohort.'}
                </div>
              )}
            </div>

            {/* Pedagogical Interventions Checklist */}
            <div className="lg:col-span-5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recommended Cohort Interventions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Action items suggested by AI analysis for faculty implementation.
                </p>
              </div>

              {cohortData?.recommendedInterventions && cohortData.recommendedInterventions.length > 0 ? (
                <div className="space-y-2">
                  {cohortData.recommendedInterventions.map((action, idx) => {
                    const id = `action-${idx}`;
                    const isDone = completedInterventions[id];

                    return (
                      <div
                        key={id}
                        onClick={() => toggleInterventionItem(id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isDone
                            ? 'border-emerald-300 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20 opacity-70'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-950 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isDone
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`text-xs leading-relaxed ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300 font-medium'
                        }`}>
                          {action}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  Select a cohort scope to generate instructional recommendations.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 4: Parent & Guardian Progress Digest */}
      {activeTab === 'guardian-digest' && (
        <motion.div
          key="tab-guardian-digest"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="app-surface rounded-lg p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Digest Parameters</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Generate an audit-ready, tailored academic progress update for a student's parent or guardian.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Student</label>
                <select
                  value={digestStudentId || selectedStudentId}
                  onChange={(e) => setDigestStudentId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                >
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.identifier}) — {s.risk?.status || 'Active'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Communication Tone</label>
                <div className="space-y-2">
                  {[
                    { value: 'supportive', title: 'Supportive & Encouraging', desc: 'Positive framing highlighting progress and constructive home habits.' },
                    { value: 'formal', title: 'Objective & Formal', desc: 'Standard institutional summary of attendance records and pacing.' },
                    { value: 'urgent', title: 'Direct & Action-Oriented', desc: 'Prioritizes attendance recovery and remediation deadlines.' }
                  ].map((t) => (
                    <label
                      key={t.value}
                      className={`flex items-start gap-2.5 p-2.5 rounded-md border text-xs cursor-pointer transition-colors ${
                        digestTone === t.value
                          ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800/80'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="digestTone"
                        value={t.value}
                        checked={digestTone === t.value}
                        onChange={() => setDigestTone(t.value as any)}
                        className="mt-0.5 text-slate-900 focus:ring-slate-900"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">{t.title}</span>
                        <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">{t.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateGuardianDigest}
                disabled={generatingDigest}
                className="w-full py-2.5 rounded-md text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-50 transition-colors shadow-xs"
              >
                {generatingDigest ? 'Synthesizing Digest...' : 'Generate Progress Digest'}
              </button>
            </div>
          </div>

          {/* Letter Preview & Editor Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="app-surface rounded-lg p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Guardian Letter Draft</h3>
                  <p className="text-[11px] text-slate-500">
                    Review and personalize before sending or exporting.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyGuardianDigest}
                  disabled={!digestBody.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Letter</span>
                </button>
              </div>

              {guardianDigest && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-500 block">Attendance</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {guardianDigest.digest.metrics.attendancePercentage}%
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-500 block">Completed</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {guardianDigest.digest.metrics.completedLessons} Lessons
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-500 block">Pending</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {guardianDigest.digest.metrics.pendingLessons} Lessons
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-500 block">Active Notices</span>
                    <strong className="text-rose-600 font-semibold">
                      {guardianDigest.digest.metrics.activeWarnings}
                    </strong>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Subject</label>
                  <input
                    type="text"
                    value={digestSubject}
                    onChange={(e) => setDigestSubject(e.target.value)}
                    placeholder="Subject line will populate here..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Letter Body</label>
                  <textarea
                    rows={13}
                    value={digestBody}
                    onChange={(e) => setDigestBody(e.target.value)}
                    placeholder="Select a student on the left and click 'Generate Progress Digest' to draft a personalized letter..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-md p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white leading-relaxed font-sans"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 3: Announcement & Notice Assistant */}
      {activeTab === 'announcement-assistant' && (
        <motion.div
          key="tab-announcement"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Notice Parameters</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure audience and category to draft clear, structured student announcements.
                </p>
              </div>

              {/* Audience Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Audience</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'All Students', value: 'all' },
                    { label: 'At-Risk Only', value: 'at-risk' },
                    { label: 'Specific Course', value: 'course' }
                  ].map((aud) => (
                    <button
                      key={aud.value}
                      type="button"
                      onClick={() => setAnnouncementAudience(aud.value as any)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        announcementAudience === aud.value
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-400 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course Dropdown (if course selected) */}
              {announcementAudience === 'course' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Course</label>
                  <select
                    value={announcementCourseId}
                    onChange={(e) => setAnnouncementCourseId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.code} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Purpose / Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notice Category</label>
                <select
                  value={announcementCategory}
                  onChange={(e) => setAnnouncementCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Exam Preparation & Academic Expectations">Upcoming Exam / Assessment Preparation</option>
                  <option value="Attendance Policy & Minimum Percentage Warning">Attendance Threshold / Policy Reminder</option>
                  <option value="Project Submission Deadline Notice">Project / Assignment Milestone Due Date</option>
                  <option value="Mid-Term Progress Review & Office Hours">Mid-Term Progress & Help Office Hours</option>
                  <option value="Course Wrap-Up & Remedial Sessions">Remedial Sessions & Course Wrap-Up</option>
                </select>
              </div>

              {/* Tone Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Voice & Tone</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Supportive', value: 'supportive' },
                    { label: 'Formal', value: 'formal' },
                    { label: 'Firm & Urgent', value: 'firm' }
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setAnnouncementTone(t.value as any)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        announcementTone === t.value
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-400 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Custom Bullets */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Key Points to Include (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customKeyPoints}
                  onChange={(e) => setCustomKeyPoints(e.target.value)}
                  placeholder="e.g. Due Friday 5:00 PM; late submissions penalized 10%; library lab open until 8 PM."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleDraftAnnouncement}
                disabled={draftingAnnouncement}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                {draftingAnnouncement ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Notice...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Draft Announcement with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Editor / Preview Column */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Announcement Draft</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Review and finalize notice before copying or publishing to course feeds.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAnnouncement}
                  disabled={!announcementBody.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Notice</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject</label>
                  <input
                    type="text"
                    value={announcementSubject}
                    onChange={(e) => setAnnouncementSubject(e.target.value)}
                    placeholder="Announcement subject line..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Message Content</label>
                  <textarea
                    rows={12}
                    value={announcementBody}
                    onChange={(e) => setAnnouncementBody(e.target.value)}
                    placeholder="Configure notice parameters on the left and click 'Draft Announcement with AI' to generate a structured message..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 4: Parent & Guardian Progress Digest */}
      {activeTab === 'guardian-digest' && (
        <motion.div
          key="tab-guardian-digest"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="app-surface rounded-lg p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Digest Parameters</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Generate an audit-ready, tailored academic progress update for a student's parent or guardian.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Student</label>
                <select
                  value={digestStudentId || selectedStudentId}
                  onChange={(e) => setDigestStudentId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                >
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.identifier}) — {s.risk?.status || 'Active'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Communication Tone</label>
                <div className="space-y-2">
                  {[
                    { value: 'supportive', title: 'Supportive & Encouraging', desc: 'Positive framing highlighting progress and constructive home habits.' },
                    { value: 'formal', title: 'Objective & Formal', desc: 'Standard institutional summary of attendance records and pacing.' },
                    { value: 'urgent', title: 'Direct & Action-Oriented', desc: 'Prioritizes attendance recovery and remediation deadlines.' }
                  ].map((t) => (
                    <label
                      key={t.value}
                      className={`flex items-start gap-2.5 p-2.5 rounded-md border text-xs cursor-pointer transition-colors ${
                        digestTone === t.value
                          ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800/80'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="digestTone"
                        value={t.value}
                        checked={digestTone === t.value}
                        onChange={() => setDigestTone(t.value as any)}
                        className="mt-0.5 text-slate-900 focus:ring-slate-900"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">{t.title}</span>
                        <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">{t.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateGuardianDigest}
                disabled={generatingDigest}
                className="w-full py-2.5 rounded-md text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-50 transition-colors shadow-xs"
              >
                {generatingDigest ? 'Synthesizing Digest...' : 'Generate Progress Digest'}
              </button>
            </div>
          </div>

          {/* Letter Preview & Editor Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="app-surface rounded-lg p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Guardian Letter Draft</h3>
                  <p className="text-[11px] text-slate-500">
                    Review and personalize before sending or exporting.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyGuardianDigest}
                  disabled={!digestBody.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Letter</span>
                </button>
              </div>

              {guardianDigest && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-500 block">Attendance</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {guardianDigest.digest.metrics.attendancePercentage}%
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-500 block">Completed</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {guardianDigest.digest.metrics.completedLessons} Lessons
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-500 block">Pending</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {guardianDigest.digest.metrics.pendingLessons} Lessons
                    </strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-500 block">Active Notices</span>
                    <strong className="text-rose-600 font-semibold">
                      {guardianDigest.digest.metrics.activeWarnings}
                    </strong>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Subject</label>
                  <input
                    type="text"
                    value={digestSubject}
                    onChange={(e) => setDigestSubject(e.target.value)}
                    placeholder="Subject line will populate here..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Letter Body</label>
                  <textarea
                    rows={13}
                    value={digestBody}
                    onChange={(e) => setDigestBody(e.target.value)}
                    placeholder="Select a student on the left and click 'Generate Progress Digest' to draft a personalized letter..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-md p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white leading-relaxed font-sans"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
