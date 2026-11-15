import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Calculator,
  Calendar,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Shuffle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Brain,
  ListTodo
} from 'lucide-react';
import { studentApi, StudentDashboardData } from '../../api/studentApi';
import { courseApi } from '../../api/courseApi';
import { Course, Lesson } from '../../types';
import aiApi, {
  StudyPlanResponse,
  StudyPlanDay,
  StudyPlanItem,
  AttendanceRecoveryResponse,
  LessonSummaryResponse,
  Flashcard,
  PracticeQuizResponse,
  QuizEvaluationResponse
} from '../../api/aiApi';

type ActiveTab = 'attendance' | 'study-plan' | 'lesson-explainer' | 'socratic-quiz';

export const StudentAIAdvisor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('attendance');
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Attendance Calculator State
  const [selectedCourseId, setSelectedCourseId] = useState<string>('overall');
  const [targetPercentage, setTargetPercentage] = useState<number>(75);
  const [anticipatedAbsences, setAnticipatedAbsences] = useState<number>(0);
  const [calculatingAttendance, setCalculatingAttendance] = useState(false);
  const [recoveryData, setRecoveryData] = useState<AttendanceRecoveryResponse | null>(null);

  // Study Plan Generator State
  const [dailyHours, setDailyHours] = useState<number>(3);
  const [daysAhead, setDaysAhead] = useState<number>(5);
  const [selectedPlanCourseIds, setSelectedPlanCourseIds] = useState<string[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>(['Pending Lessons', 'Active Recall']);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlanResponse | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('epms_study_tasks_completed');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Lesson Explainer & Flashcards State
  const [explainerCourseId, setExplainerCourseId] = useState<string>('');
  const [explainerLessonId, setExplainerLessonId] = useState<string>('');
  const [availableLessons, setAvailableLessons] = useState<Lesson[]>([]);
  const [generatingExplainer, setGeneratingExplainer] = useState(false);
  const [lessonSummary, setLessonSummary] = useState<LessonSummaryResponse | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Record<number, boolean>>({});

  // Socratic Practice Quiz State
  const [quizCourseId, setQuizCourseId] = useState<string>('');
  const [quizLessonId, setQuizLessonId] = useState<string>('');
  const [quizAvailableLessons, setQuizAvailableLessons] = useState<Lesson[]>([]);
  const [quizSocraticMode, setQuizSocraticMode] = useState(true);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<PracticeQuizResponse | null>(null);
  const [studentQuizAnswers, setStudentQuizAnswers] = useState<Record<string, number>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [evaluatingQuiz, setEvaluatingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizEvaluationResponse | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('epms_study_tasks_completed', JSON.stringify(completedTaskIds));
    } catch {
      // LocalStorage quota or access error handled quietly
    }
  }, [completedTaskIds]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [dash, coursesList] = await Promise.all([
          studentApi.getDashboard().catch(() => null),
          courseApi.getCourses().catch(() => [])
        ]);

        if (dash) {
          setDashboardData(dash);
          if (dash.enrolledCourses?.length > 0) {
            setSelectedPlanCourseIds(dash.enrolledCourses.map((c) => c.courseId));
            setExplainerCourseId(dash.enrolledCourses[0].courseId);
          }
        }
        if (coursesList?.length > 0) {
          setCourses(coursesList);
          if (!explainerCourseId && coursesList[0]?._id) {
            setExplainerCourseId(coursesList[0]._id);
          }
        }
      } catch {
        toast.error('Unable to fetch academic telemetry.');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitialData();
  }, []);

  // Update lessons when explainerCourseId changes
  useEffect(() => {
    if (!explainerCourseId) {
      setAvailableLessons([]);
      setExplainerLessonId('');
      return;
    }

    const selectedCourse = courses.find((c) => c._id === explainerCourseId);
    if (selectedCourse?.lessons && selectedCourse.lessons.length > 0) {
      setAvailableLessons(selectedCourse.lessons);
      setExplainerLessonId(selectedCourse.lessons[0]._id);
    } else {
      courseApi.getCourseById(explainerCourseId)
        .then((fullCourse) => {
          const lessons = fullCourse.lessons || [];
          setAvailableLessons(lessons);
          if (lessons.length > 0) {
            setExplainerLessonId(lessons[0]._id);
          } else {
            setExplainerLessonId('');
          }
        })
        .catch(() => {
          setAvailableLessons([]);
          setExplainerLessonId('');
        });
    }
  }, [explainerCourseId, courses]);

  // Update lessons when quizCourseId changes
  useEffect(() => {
    if (!quizCourseId) {
      if (courses.length > 0 && courses[0]._id) {
        setQuizCourseId(courses[0]._id);
      }
      return;
    }

    const selectedCourse = courses.find((c) => c._id === quizCourseId);
    if (selectedCourse?.lessons && selectedCourse.lessons.length > 0) {
      setQuizAvailableLessons(selectedCourse.lessons);
      setQuizLessonId(selectedCourse.lessons[0]._id);
    } else {
      courseApi.getCourseById(quizCourseId)
        .then((fullCourse) => {
          const lessons = fullCourse.lessons || [];
          setQuizAvailableLessons(lessons);
          if (lessons.length > 0) {
            setQuizLessonId(lessons[0]._id);
          } else {
            setQuizLessonId('');
          }
        })
        .catch(() => {
          setQuizAvailableLessons([]);
          setQuizLessonId('');
        });
    }
  }, [quizCourseId, courses]);

  const handleGenerateQuiz = async () => {
    if (!quizLessonId) {
      toast.error('Please select a lesson to generate quiz questions.');
      return;
    }

    setGeneratingQuiz(true);
    setQuizResult(null);
    setStudentQuizAnswers({});
    setRevealedHints({});
    try {
      const response = await aiApi.generatePracticeQuiz(quizLessonId, quizSocraticMode);
      setActiveQuiz(response);
      toast.success(`Practice quiz ready with ${response.questions.length} questions.`);
    } catch {
      toast.error('Failed to generate practice quiz.');
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSelectQuizAnswer = (questionId: string, optionIdx: number) => {
    setStudentQuizAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleToggleHint = (questionId: string) => {
    setRevealedHints(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !quizLessonId) return;

    const unanswered = activeQuiz.questions.filter(q => studentQuizAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      toast.error(`Please answer all ${activeQuiz.questions.length} questions before submitting.`);
      return;
    }

    setEvaluatingQuiz(true);
    try {
      const response = await aiApi.evaluateQuizSubmission(quizLessonId, studentQuizAnswers);
      setQuizResult(response);
      toast.success(`Evaluation complete: Score ${response.score}% (${response.masteryLevel})`);
    } catch {
      toast.error('Failed to evaluate quiz submission.');
    } finally {
      setEvaluatingQuiz(false);
    }
  };

  // Attendance Recovery Calculation
  const handleCalculateAttendance = async () => {
    setCalculatingAttendance(true);
    try {
      const payload = {
        courseId: selectedCourseId === 'overall' ? undefined : selectedCourseId,
        targetPercentage,
        anticipatedAbsences
      };
      const response = await aiApi.getAttendanceRecovery(payload);
      setRecoveryData(response);
      toast.success('Attendance recovery strategy calculated.');
    } catch {
      toast.error('Failed to calculate attendance recovery.');
    } finally {
      setCalculatingAttendance(false);
    }
  };

  // Study Plan Generation
  const handleGenerateStudyPlan = async () => {
    setGeneratingPlan(true);
    try {
      const response = await aiApi.getStudyPlan({
        hoursPerDay: dailyHours,
        daysAhead,
        courseIds: selectedPlanCourseIds.length > 0 ? selectedPlanCourseIds : undefined,
        focusAreas
      });
      setStudyPlan(response);
      toast.success('Personalized study plan created.');
    } catch {
      toast.error('Failed to generate study plan.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleCopyStudyPlan = () => {
    if (!studyPlan) return;
    const lines: string[] = [
      `EPMS AI Study Schedule (${studyPlan.weeklyTargetHours || dailyHours * daysAhead} Target Hours)`,
      `Summary: ${studyPlan.summary}`,
      '',
      ...studyPlan.schedule.flatMap((day) => [
        `=== ${day.day} ===`,
        ...day.items.map(
          (item) => `[${item.durationMinutes}m] ${item.title} (${item.type}) - ${item.notes || 'Core lesson focus'}`
        ),
        ''
      ])
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Study plan copied to clipboard.');
  };

  // Lesson Explainer Generation
  const handleGenerateLessonExplainer = async () => {
    if (!explainerLessonId) {
      toast.error('Please select a lesson to analyze.');
      return;
    }
    setGeneratingExplainer(true);
    setIsCardFlipped(false);
    setCurrentCardIndex(0);
    setMasteredCards({});
    try {
      const response = await aiApi.getLessonSummary({ lessonId: explainerLessonId });
      setLessonSummary(response);
      toast.success('Lesson breakdown and flashcards loaded.');
    } catch {
      toast.error('Failed to generate lesson breakdown.');
    } finally {
      setGeneratingExplainer(false);
    }
  };

  // Flashcard Helpers
  const flashcards = lessonSummary?.flashcards || [];
  const currentCard: Flashcard | undefined = flashcards[currentCardIndex];

  const handleNextCard = () => {
    if (flashcards.length === 0) return;
    setIsCardFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevCard = () => {
    if (flashcards.length === 0) return;
    setIsCardFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleShuffleCards = () => {
    if (!lessonSummary || flashcards.length <= 1) return;
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setLessonSummary({
      ...lessonSummary,
      flashcards: shuffled
    });
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    toast.success('Flashcards shuffled.');
  };

  const handleToggleMastered = (idx: number) => {
    setMasteredCards((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const currentAttendancePct = dashboardData?.overview?.attendancePercentage ?? 85;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/60 dark:border-indigo-800/60">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>AI Academic Advisor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Academic Strategy & Learning Hub
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Calculate exact attendance recovery trajectories, schedule dynamic study sprints, and master complex lesson concepts with adaptive flashcards.
            </p>
          </div>

          {/* Quick Metrics Badge Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Current Attendance</span>
              <span className={`text-lg font-bold ${
                currentAttendancePct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {currentAttendancePct}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Active Courses</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {dashboardData?.overview?.totalEnrolled ?? courses.length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 col-span-2 sm:col-span-1">
              <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">Pending Lessons</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {dashboardData?.pendingLessons?.length ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mt-8 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Attendance Recovery Calculator
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('study-plan')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'study-plan'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Smart Study Plan Generator
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lesson-explainer')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'lesson-explainer'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4" />
            Concept Explainer & Flashcards
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('socratic-quiz')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'socratic-quiz'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Socratic Practice Quiz
          </button>
        </div>
      </div>

      {/* Tab 1: Attendance Recovery Calculator */}
      {activeTab === 'attendance' && (
        <motion.div
          key="tab-attendance"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Recovery Parameters</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Model attendance scenarios to find the exact streak of consecutive classes needed to meet requirements.
                </p>
              </div>

              {/* Course Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Scope</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="overall">Overall Attendance Across All Courses</option>
                  {dashboardData?.enrolledCourses?.map((c) => (
                    <option key={c.courseId} value={c.courseId}>
                      {c.code} - {c.title}
                    </option>
                  )) || courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Percentage Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Minimum Target</label>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{targetPercentage}%</span>
                </div>
                <div className="flex gap-2">
                  {[75, 80, 85, 90].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTargetPercentage(val)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        targetPercentage === val
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/80 dark:border-indigo-400 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  step="1"
                  value={targetPercentage}
                  onChange={(e) => setTargetPercentage(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Anticipated Absences */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Anticipated Missed Sessions</label>
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">{anticipatedAbsences} session(s)</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAnticipatedAbsences((prev) => Math.max(0, prev - 1))}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={anticipatedAbsences}
                    onChange={(e) => setAnticipatedAbsences(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setAnticipatedAbsences((prev) => prev + 1)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    +
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Include medical leaves or unavoidable conflicts planned before term end.
                </p>
              </div>

              {/* Calculate Button */}
              <button
                type="button"
                onClick={handleCalculateAttendance}
                disabled={calculatingAttendance}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                {calculatingAttendance ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Trajectory...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Calculate Recovery Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7">
            {recoveryData ? (
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Recovery Strategy</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Scope: {recoveryData.courseTitle || 'All Enrolled Courses'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    recoveryData.feasible
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                  }`}>
                    {recoveryData.feasible ? 'Recovery Feasible' : 'Critical Threshold'}
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">Current Status</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {recoveryData.currentAttendance}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {recoveryData.totalAttended}/{recoveryData.totalConducted} classes
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">Target</span>
                    <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                      {recoveryData.targetPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Threshold</span>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
                    <span className="block text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">Classes Needed</span>
                    <span className="text-base font-bold text-indigo-700 dark:text-indigo-300">
                      {recoveryData.classesNeeded}
                    </span>
                    <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 block mt-0.5">
                      consecutive attendances
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">Ceiling Limit</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {recoveryData.maxPossiblePercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">max potential</span>
                  </div>
                </div>

                {/* AI Advice Callout */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Advisor Diagnostic & Recommendations</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {recoveryData.advice}
                  </p>
                </div>

                {/* Tactical Steps */}
                {recoveryData.recoverySteps && recoveryData.recoverySteps.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Execution Milestones
                    </h3>
                    <div className="space-y-2">
                      {recoveryData.recoverySteps.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-navy-950/40 text-xs"
                        >
                          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                            {idx + 1}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 pt-0.5 leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[360px] bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Ready for Simulation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Adjust target percentage or anticipated absences on the left, then click Calculate Recovery Plan to receive a verified class attendance roadmap.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 2: Smart Study Plan Generator */}
      {activeTab === 'study-plan' && (
        <motion.div
          key="tab-study-plan"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Study Sprint Planner</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Configure available hours and focal topics to balance pending modules and active retention.
                </p>
              </div>

              {/* Daily Hours Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Daily Study Capacity</label>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{dailyHours} hr/day</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDailyHours(val)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        dailyHours === val
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/80 dark:border-indigo-400 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {val}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Days Horizon */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Schedule Horizon</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '3 Days', value: 3 },
                    { label: '5 Days', value: 5 },
                    { label: '7 Days', value: 7 }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDaysAhead(option.value)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                        daysAhead === option.value
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/80 dark:border-indigo-400 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course Selection Checkboxes */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Included Courses</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(dashboardData?.enrolledCourses || courses).map((c: any) => {
                    const id = c.courseId || c._id;
                    const isSelected = selectedPlanCourseIds.includes(id);
                    return (
                      <label
                        key={id}
                        className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedPlanCourseIds((prev) =>
                              isSelected ? prev.filter((item) => item !== id) : [...prev, id]
                            );
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {c.code || 'CRS'} - {c.title}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Generate Plan Button */}
              <button
                type="button"
                onClick={handleGenerateStudyPlan}
                disabled={generatingPlan}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                {generatingPlan ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Schedule...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Generate AI Study Schedule</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Schedule Column */}
          <div className="lg:col-span-7">
            {studyPlan ? (
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Study Schedule</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Target: {studyPlan.weeklyTargetHours || dailyHours * daysAhead} hours across {studyPlan.schedule.length} days
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyStudyPlan}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Schedule</span>
                  </button>
                </div>

                {/* Plan Summary */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Weekly Executive Strategy</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {studyPlan.summary}
                  </p>
                </div>

                {/* Day by Day Schedule Accordion / List */}
                <div className="space-y-4">
                  {studyPlan.schedule.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-navy-950/40"
                    >
                      <div className="bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {day.day} {day.date && `• ${day.date}`}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {day.items.reduce((acc, i) => acc + (i.durationMinutes || 0), 0)} min allocated
                        </span>
                      </div>

                      <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800/80">
                        {day.items.map((item, iIdx) => {
                          const taskId = `${day.day}-${iIdx}-${item.title.substring(0, 10)}`;
                          const isDone = completedTaskIds[taskId];

                          return (
                            <div
                              key={iIdx}
                              className={`py-2.5 first:pt-1 last:pb-1 flex items-start gap-3 transition-opacity ${
                                isDone ? 'opacity-60' : 'opacity-100'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleTaskCompletion(taskId)}
                                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                  isDone
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                                }`}
                              >
                                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-xs font-semibold ${
                                    isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'
                                  }`}>
                                    {item.title}
                                  </span>
                                  {item.courseTitle && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                                      {item.courseTitle}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 font-mono">
                                    {item.durationMinutes}m
                                  </span>
                                </div>
                                {item.notes && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Practical Tips */}
                {studyPlan.tips && studyPlan.tips.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Targeted Learning Tips</span>
                    <ul className="space-y-1.5">
                      {studyPlan.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <span className="text-indigo-500 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[360px] bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <ListTodo className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Build Study Sprint</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Select your daily commitment and horizon to generate a day-by-day checklist synced with your current courses.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 3: Lesson Concept Explainer & Flashcards */}
      {activeTab === 'lesson-explainer' && (
        <motion.div
          key="tab-lesson-explainer"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Selector Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Concept Selector</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose a course and lesson module to extract core takeaways and generate interactive recall cards.
                </p>
              </div>

              {/* Course Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Course</label>
                <select
                  value={explainerCourseId}
                  onChange={(e) => setExplainerCourseId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lesson Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Lesson</label>
                <select
                  value={explainerLessonId}
                  onChange={(e) => setExplainerLessonId(e.target.value)}
                  disabled={availableLessons.length === 0}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {availableLessons.length === 0 ? (
                    <option value="">No lessons available for this course</option>
                  ) : (
                    availableLessons.map((l, index) => (
                      <option key={l._id} value={l._id}>
                        {index + 1}. {l.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleGenerateLessonExplainer}
                disabled={generatingExplainer || !explainerLessonId}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
              >
                {generatingExplainer ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Distilling Lesson Concepts...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>Explain Concepts & Generate Flashcards</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7">
            {lessonSummary ? (
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {lessonSummary.courseTitle || 'Curriculum Overview'}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {lessonSummary.lessonTitle || 'Lesson Conceptual Breakdown'}
                  </h2>
                </div>

                {/* Concept Summary Box */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Conceptual Summary</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {lessonSummary.summary}
                  </p>
                </div>

                {/* Key Takeaways */}
                {lessonSummary.keyTakeaways && lessonSummary.keyTakeaways.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">High-Yield Takeaways</h3>
                    <div className="space-y-1.5">
                      {lessonSummary.keyTakeaways.map((takeaway, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{takeaway}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flashcard Component */}
                {flashcards.length > 0 && (
                  <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Active Recall Flashcards</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          ({currentCardIndex + 1} of {flashcards.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleShuffleCards}
                        className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title="Shuffle flashcards"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Shuffle</span>
                      </button>
                    </div>

                    {/* Flashcard Box */}
                    {currentCard && (
                      <div
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                        className="min-h-[200px] p-6 rounded-2xl border-2 border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-b from-slate-50 to-white dark:from-navy-950 dark:to-slate-900 cursor-pointer shadow-sm hover:border-indigo-400 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                            <span className="font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                              {currentCard.concept || 'Concept'}
                            </span>
                            <span>{isCardFlipped ? 'Click to show prompt' : 'Click to reveal answer'}</span>
                          </div>

                          <div className="mt-3">
                            {!isCardFlipped ? (
                              <div className="space-y-2">
                                <span className="text-xs text-slate-400 font-medium">Question / Prompt:</span>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                                  {currentCard.question}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Answer & Explanation:</span>
                                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                  {currentCard.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMastered(currentCardIndex);
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                              masteredCards[currentCardIndex]
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{masteredCards[currentCardIndex] ? 'Mastered' : 'Mark as Mastered'}</span>
                          </button>

                          <span className="text-[11px] text-slate-400">
                            {Object.values(masteredCards).filter(Boolean).length} / {flashcards.length} Mastered
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Flashcard Steppers */}
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handlePrevCard}
                        disabled={flashcards.length <= 1}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextCard}
                        disabled={flashcards.length <= 1}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[360px] bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Select a Lesson</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Choose a course and lesson from the panel to generate a focused conceptual explainer and active recall flashcards.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 4: Socratic Practice Quiz & Diagnostic Assessment */}
      {activeTab === 'socratic-quiz' && (
        <motion.div
          key="tab-socratic-quiz"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="app-surface rounded-lg p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Practice Parameters</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Select a lesson to generate an interactive diagnostic quiz with Socratic guidance.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Course</label>
                <select
                  value={quizCourseId}
                  onChange={(e) => setQuizCourseId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Lesson Module</label>
                <select
                  value={quizLessonId}
                  onChange={(e) => setQuizLessonId(e.target.value)}
                  disabled={quizAvailableLessons.length === 0}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white disabled:opacity-50"
                >
                  {quizAvailableLessons.length === 0 ? (
                    <option value="">No lessons available</option>
                  ) : (
                    quizAvailableLessons.map((l, idx) => (
                      <option key={l._id} value={l._id}>
                        {l.order || idx + 1}. {l.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-900 dark:text-white block">Socratic Hint Guidance</span>
                  <span className="text-[11px] text-slate-500">Provide guiding hints before answering</span>
                </div>
                <input
                  type="checkbox"
                  checked={quizSocraticMode}
                  onChange={(e) => setQuizSocraticMode(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz || !quizLessonId}
                className="w-full py-2.5 rounded-md text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white disabled:opacity-50 transition-colors shadow-xs"
              >
                {generatingQuiz ? 'Generating Questions...' : 'Generate Practice Quiz'}
              </button>
            </div>
          </div>

          {/* Quiz & Results Column */}
          <div className="lg:col-span-7 space-y-4">
            {activeQuiz ? (
              <div className="space-y-4">
                {/* Result Card if evaluated */}
                {quizResult && (
                  <div className="app-surface rounded-lg p-5 space-y-3 border-l-4 border-l-blue-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-500">Assessment Score</span>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {quizResult.score}%
                        </h3>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          quizResult.masteryLevel === 'Mastered'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : quizResult.masteryLevel === 'Proficient'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {quizResult.masteryLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {quizResult.feedback}
                    </p>
                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setQuizResult(null);
                          setStudentQuizAnswers({});
                        }}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750"
                      >
                        Retake Quiz
                      </button>
                    </div>
                  </div>
                )}

                {/* Question List */}
                <div className="space-y-4">
                  {activeQuiz.questions.map((q, qIdx) => {
                    const selectedOpt = studentQuizAnswers[q.id];
                    const reviewItem = quizResult?.review.find(r => r.questionId === q.id);

                    return (
                      <div key={q.id} className="app-surface rounded-lg p-5 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-500">
                            Question {qIdx + 1} of {activeQuiz.questions.length}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                            {q.concept}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                          {q.question}
                        </p>

                        {/* Socratic Hint Box */}
                        {quizSocraticMode && q.hint && !quizResult && (
                          <div>
                            {revealedHints[q.id] ? (
                              <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                                <strong className="font-semibold">Socratic Hint: </strong>
                                {q.hint}
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleHint(q.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:underline"
                              >
                                <Lightbulb className="w-3.5 h-3.5" />
                                <span>Need a hint? (Socratic Guidance)</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Options */}
                        <div className="space-y-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = selectedOpt === optIdx;
                            let optionClass = 'border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60';

                            if (quizResult && reviewItem) {
                              if (optIdx === q.correctAnswer) {
                                optionClass = 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-medium';
                              } else if (isSelected && !reviewItem.isCorrect) {
                                optionClass = 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200';
                              }
                            } else if (isSelected) {
                              optionClass = 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium ring-1 ring-slate-900 dark:ring-white';
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={!!quizResult}
                                onClick={() => handleSelectQuizAnswer(q.id, optIdx)}
                                className={`w-full text-left p-3 rounded-md border text-xs transition-colors flex items-start gap-2.5 ${optionClass}`}
                              >
                                <span className="font-semibold uppercase tracking-wider text-[11px] shrink-0 mt-0.5">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span className="leading-relaxed">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Question Review explanation after submit */}
                        {reviewItem && (
                          <div className={`p-3 rounded-md text-xs space-y-1 ${
                            reviewItem.isCorrect
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                              : 'bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                          }`}>
                            <p className="font-semibold">
                              {reviewItem.isCorrect ? '✓ Correct' : '✕ Needs Review'}
                            </p>
                            <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                              {reviewItem.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!quizResult && (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={evaluatingQuiz}
                    className="w-full py-2.5 rounded-md text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors shadow-xs"
                  >
                    {evaluatingQuiz ? 'Evaluating Answers...' : 'Submit Quiz for Evaluation'}
                  </button>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[360px] app-surface rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-2">
                <Lightbulb className="w-8 h-8 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Diagnostic Practice Quiz</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Select a lesson from the parameters panel and launch a Socratic quiz to evaluate your retention and receive guided hints.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
