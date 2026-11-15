import api from './axiosConfig';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  context?: {
    role?: 'student' | 'teacher';
    currentPath?: string;
    courseId?: string;
    lessonId?: string;
    studentId?: string;
    [key: string]: any;
  };
}

export interface ChatResponse {
  reply: string;
  citations?: string[];
  suggestions?: string[];
  suggestedActions?: Array<{
    label: string;
    action: string;
    payload?: any;
  }>;
  meta?: Record<string, any>;
}

export interface StudyPlanRequest {
  hoursPerDay?: number;
  daysAhead?: number;
  focusAreas?: string[];
  courseIds?: string[];
}

export interface StudyPlanItem {
  title: string;
  courseTitle?: string;
  courseId?: string;
  lessonId?: string;
  durationMinutes: number;
  type: 'video' | 'review' | 'quiz' | 'practice' | string;
  notes?: string;
  timeOfDay?: string;
}

export interface StudyPlanDay {
  day: string;
  date?: string;
  items: StudyPlanItem[];
}

export interface StudyPlanResponse {
  schedule: StudyPlanDay[];
  summary: string;
  tips: string[];
  weeklyTargetHours?: number;
}

export interface AttendanceRecoveryRequest {
  courseId?: string;
  targetPercentage?: number;
  anticipatedAbsences?: number;
}

export interface AttendanceRecoveryResponse {
  currentAttendance: number;
  targetPercentage: number;
  totalConducted: number;
  totalAttended: number;
  classesNeeded: number;
  feasible: boolean;
  maxPossiblePercentage: number;
  advice: string;
  recoverySteps: string[];
  courseTitle?: string;
}

export interface LessonSummaryRequest {
  lessonId: string;
}

export interface Flashcard {
  question: string;
  answer: string;
  concept: string;
}

export interface PracticeQuestion {
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface LessonSummaryResponse {
  lessonTitle?: string;
  courseTitle?: string;
  summary: string;
  keyTakeaways: string[];
  flashcards: Flashcard[];
  practiceQuestions?: PracticeQuestion[];
}

export interface TeacherStudentInsightRequest {
  studentId: string;
  focusCourseId?: string;
}

export interface TeacherStudentInsightResponse {
  studentId: string;
  studentName: string;
  studentIdentifier?: string;
  riskAssessment: {
    level: 'Low' | 'Medium' | 'High';
    reasons: string[];
    trajectory: string;
  };
  interventionNote: {
    subject: string;
    body: string;
    recommendedAction: string;
    tone: string;
  };
  metrics: {
    attendanceRate: number;
    completionRate: number;
    daysInactive: number;
    activeWarningsCount?: number;
  };
}

export interface LessonBottleneck {
  lessonId: string;
  lessonTitle: string;
  dropoffRate: number;
  suggestion: string;
  order?: number;
}

export interface TeacherCohortAnalysisRequest {
  courseId?: string;
}

export interface TeacherCohortAnalysisResponse {
  courseId?: string;
  courseTitle?: string;
  courseSummary: {
    totalEnrolled: number;
    averageProgress: number;
    atRiskCount: number;
    averageAttendance?: number;
  };
  lessonBottlenecks: LessonBottleneck[];
  recommendedInterventions: string[];
}

export interface AcademicQueryCard {
  type: 'student' | 'course' | 'attendance' | 'alert' | 'summary';
  id?: string;
  title: string;
  metric: string;
  status: 'success' | 'warning' | 'critical' | 'info';
  details: string;
}

export interface AcademicQueryResponse {
  success: boolean;
  query: string;
  answer: string;
  cards: AcademicQueryCard[];
  suggestedActions: Array<{
    label: string;
    action: string;
    path: string;
  }>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  hint?: string;
  explanation: string;
  concept: string;
}

export interface PracticeQuizResponse {
  success: boolean;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  socraticMode: boolean;
  totalQuestions: number;
  questions: QuizQuestion[];
  instructions: string;
}

export interface QuizEvaluationResponse {
  success: boolean;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  masteryLevel: 'Mastered' | 'Proficient' | 'Needs Review';
  feedback: string;
  review: Array<{
    questionId: string;
    question: string;
    selectedAnswer: number | null;
    correctAnswer: number;
    isCorrect: boolean;
    explanation: string;
    hint?: string;
    concept: string;
  }>;
}

export interface GuardianDigestResponse {
  success: boolean;
  studentId: string;
  studentName: string;
  studentEmail: string;
  generatedDate: string;
  tone: string;
  digest: {
    subject: string;
    body: string;
    metrics: {
      attendancePercentage: number;
      completedLessons: number;
      pendingLessons: number;
      activeWarnings: number;
    };
    strengths: string[];
    actionItems: string[];
  };
}

export interface PredictiveHealthResponse {
  success: boolean;
  studentId: string;
  studentName: string;
  compositeScore: number;
  trajectory: 'High Performer' | 'On Track' | 'Satisfactory' | 'Needs Attention' | 'At Risk';
  projectedAttendance: number;
  metrics: {
    attendancePercentage: number;
    completionScore: number;
    activeWarnings: number;
  };
  riskFactors: string[];
  recommendedNextStep: string;
}

// Normalizes backend payloads whether wrapped in { success, data: { ... } } or returned at the root
const unwrapData = <T>(resData: any): T => {
  if (resData && typeof resData === 'object' && 'data' in resData && resData.data !== null && typeof resData.data === 'object') {
    return resData.data as T;
  }
  return resData as T;
};

export const aiApi = {
  chat: async (payload: ChatRequest): Promise<ChatResponse> => {
    const res = await api.post('/ai/chat', payload);
    return unwrapData<ChatResponse>(res.data);
  },

  getStudyPlan: async (payload?: StudyPlanRequest): Promise<StudyPlanResponse> => {
    const res = await api.post('/ai/study-plan', payload || {});
    return unwrapData<StudyPlanResponse>(res.data);
  },

  getAttendanceRecovery: async (payload?: AttendanceRecoveryRequest): Promise<AttendanceRecoveryResponse> => {
    const res = await api.post('/ai/attendance-recovery', payload || {});
    return unwrapData<AttendanceRecoveryResponse>(res.data);
  },

  getLessonSummary: async (payload: LessonSummaryRequest): Promise<LessonSummaryResponse> => {
    const res = await api.post('/ai/lesson-summary', payload);
    return unwrapData<LessonSummaryResponse>(res.data);
  },

  getTeacherStudentInsight: async (payload: TeacherStudentInsightRequest): Promise<TeacherStudentInsightResponse> => {
    const res = await api.post('/ai/teacher/student-insight', payload);
    return unwrapData<TeacherStudentInsightResponse>(res.data);
  },

  getTeacherCohortAnalysis: async (payload?: TeacherCohortAnalysisRequest): Promise<TeacherCohortAnalysisResponse> => {
    const res = await api.post('/ai/teacher/cohort-analysis', payload || {});
    return unwrapData<TeacherCohortAnalysisResponse>(res.data);
  },

  queryAcademicData: async (query: string): Promise<AcademicQueryResponse> => {
    const res = await api.post('/ai/query', { query });
    return unwrapData<AcademicQueryResponse>(res.data);
  },

  generatePracticeQuiz: async (lessonId: string, socraticMode: boolean = true): Promise<PracticeQuizResponse> => {
    const res = await api.post('/ai/quiz/generate', { lessonId, socraticMode });
    return unwrapData<PracticeQuizResponse>(res.data);
  },

  evaluateQuizSubmission: async (lessonId: string, answers: Record<string, number>): Promise<QuizEvaluationResponse> => {
    const res = await api.post('/ai/quiz/evaluate', { lessonId, answers });
    return unwrapData<QuizEvaluationResponse>(res.data);
  },

  generateGuardianDigest: async (studentId: string, tone: string = 'supportive'): Promise<GuardianDigestResponse> => {
    const res = await api.post('/ai/guardian-digest', { studentId, tone });
    return unwrapData<GuardianDigestResponse>(res.data);
  },

  getPredictiveHealth: async (studentId?: string): Promise<PredictiveHealthResponse> => {
    const res = await api.post('/ai/predictive-health', { studentId });
    return unwrapData<PredictiveHealthResponse>(res.data);
  },
};

export default aiApi;
