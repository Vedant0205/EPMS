const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const LessonProgress = require('../models/LessonProgress');
const Warning = require('../models/Warning');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGemini(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048
      }
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey.trim())}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate ? candidate.trim() : null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

async function getStudentContext(studentId) {
  const user = await User.findById(studentId);
  if (!user) return null;

  const [enrollments, attendanceRecords, allCourses, progresses, warnings] = await Promise.all([
    Enrollment.find({ student: studentId }),
    Attendance.find({ student: studentId }),
    Course.find(),
    LessonProgress.find({ student: studentId }),
    Warning.find({ student: studentId })
  ]);

  const courseMap = new Map();
  for (const c of allCourses) {
    courseMap.set(String(c._id), c);
  }

  const totalAttendance = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
  const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
  const leaveDays = attendanceRecords.filter(r => r.status === 'leave').length;
  const attendancePercentage = totalAttendance > 0
    ? Math.round((presentDays / totalAttendance) * 100)
    : 100;

  const courseAttendanceMap = new Map();
  for (const record of attendanceRecords) {
    const cId = String(record.course);
    if (!courseAttendanceMap.has(cId)) {
      courseAttendanceMap.set(cId, { total: 0, present: 0 });
    }
    const stat = courseAttendanceMap.get(cId);
    stat.total += 1;
    if (record.status === 'present') stat.present += 1;
  }

  const completedLessonIds = new Set(
    progresses.filter(p => p.completed).map(p => String(p.lesson))
  );

  const enrichedEnrollments = [];
  const pendingLessonsList = [];

  for (const enr of enrollments) {
    const course = courseMap.get(String(enr.course));
    if (!course) continue;

    let lessons = await Lesson.find({ course: course._id });
    if (Array.isArray(lessons)) {
      lessons = [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    const courseLessonsTotal = lessons.length;
    const completedForCourse = lessons.filter(l => completedLessonIds.has(String(l._id))).length;
    const pendingForCourse = lessons.filter(l => !completedLessonIds.has(String(l._id)));
    const completionPct = courseLessonsTotal > 0
      ? Math.round((completedForCourse / courseLessonsTotal) * 100)
      : (enr.completionPercentage || 0);

    const attStat = courseAttendanceMap.get(String(course._id)) || { total: 0, present: 0 };
    const courseAttPct = attStat.total > 0
      ? Math.round((attStat.present / attStat.total) * 100)
      : 100;

    enrichedEnrollments.push({
      courseId: course._id,
      title: course.title,
      code: course.code,
      totalLessons: courseLessonsTotal,
      completedLessons: completedForCourse,
      completionPercentage: completionPct,
      attendancePercentage: courseAttPct,
      nextLesson: pendingForCourse[0] || null
    });

    for (const pending of pendingForCourse) {
      pendingLessonsList.push({
        courseId: course._id,
        courseTitle: course.title,
        lessonId: pending._id,
        title: pending.title,
        module: pending.module,
        duration: pending.duration || 600,
        order: pending.order || 1
      });
    }
  }

  const activeWarnings = warnings.filter(w => w.status === 'active');
  const now = Date.now();
  const lastActiveDate = user.lastActive ? new Date(user.lastActive) : new Date(user.createdAt || now);
  const daysInactive = Math.max(0, Math.floor((now - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    student: {
      id: String(user._id),
      name: user.name,
      identifier: user.identifier,
      email: user.email,
      department: user.department || 'Computer Science',
      daysInactive
    },
    attendance: {
      total: totalAttendance,
      present: presentDays,
      absent: absentDays,
      leave: leaveDays,
      percentage: attendancePercentage
    },
    enrollments: enrichedEnrollments,
    pendingLessons: pendingLessonsList,
    activeWarnings: activeWarnings.map(w => ({
      id: w._id,
      category: w.category,
      priority: w.priority,
      message: w.message,
      createdAt: w.createdAt
    }))
  };
}

async function getCohortContext(teacherId, courseId = null) {
  const [allStudents, allCourses, allEnrollments, allAttendance, allWarnings] = await Promise.all([
    User.find({ role: 'student' }),
    Course.find(),
    Enrollment.find(),
    Attendance.find(),
    Warning.find({ status: 'active' })
  ]);

  let targetStudents = allStudents;
  let targetCourses = allCourses;

  if (courseId) {
    const selectedCourse = allCourses.find(c => String(c._id) === String(courseId));
    targetCourses = selectedCourse ? [selectedCourse] : [];
    const courseEnrs = allEnrollments.filter(e => String(e.course) === String(courseId));
    const enrolledStudentIds = new Set(courseEnrs.map(e => String(e.student)));
    targetStudents = allStudents.filter(s => enrolledStudentIds.has(String(s._id)));
  }

  const now = Date.now();
  let totalAttendanceSum = 0;
  let totalCompletionSum = 0;
  const atRiskStudents = [];
  const needsAttentionStudents = [];
  const onTrackStudents = [];

  for (const student of targetStudents) {
    const studentAtt = allAttendance.filter(r => String(r.student) === String(student._id) && (!courseId || String(r.course) === String(courseId)));
    const totalDays = studentAtt.length;
    const presentDays = studentAtt.filter(r => r.status === 'present').length;
    const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
    totalAttendanceSum += attPct;

    const studentEnr = allEnrollments.filter(e => String(e.student) === String(student._id) && (!courseId || String(e.course) === String(courseId)));
    const avgComp = studentEnr.length > 0
      ? Math.round(studentEnr.reduce((acc, curr) => acc + (curr.completionPercentage || 0), 0) / studentEnr.length)
      : 0;
    totalCompletionSum += avgComp;

    const lastActive = student.lastActive ? new Date(student.lastActive).getTime() : new Date(student.createdAt).getTime();
    const daysInactive = Math.max(0, Math.floor((now - lastActive) / (1000 * 60 * 60 * 24)));

    const isRisk = attPct < 75 || avgComp < 40 || daysInactive >= 7;
    const isWarning = !isRisk && (attPct < 80 || avgComp < 60 || daysInactive >= 4);

    const studentSummary = {
      id: student._id,
      name: student.name,
      identifier: student.identifier,
      attendancePercentage: attPct,
      completionPercentage: avgComp,
      daysInactive
    };

    if (isRisk) {
      atRiskStudents.push(studentSummary);
    } else if (isWarning) {
      needsAttentionStudents.push(studentSummary);
    } else {
      onTrackStudents.push(studentSummary);
    }
  }

  const total = targetStudents.length;
  const averageAttendance = total > 0 ? Math.round(totalAttendanceSum / total) : 0;
  const averageCompletion = total > 0 ? Math.round(totalCompletionSum / total) : 0;

  return {
    totalStudents: total,
    totalCourses: targetCourses.length,
    averageAttendance,
    averageCompletion,
    atRiskStudents,
    needsAttentionStudents,
    onTrackStudents,
    activeWarningsCount: allWarnings.length
  };
}

async function chatAdvisor({ user, message, history = [] }) {
  const isTeacher = user.role === 'teacher';

  if (!isTeacher) {
    const context = await getStudentContext(user.id);
    if (!context) {
      return {
        success: false,
        message: 'Student profile not found.'
      };
    }

    const { student, attendance, enrollments, pendingLessons, activeWarnings } = context;

    const promptContext = `
Role: Student Academic Advisor for Educational Progress Monitoring System (EPMS).
Student Name: ${student.name} (${student.identifier})
Department: ${student.department}
Overall Attendance: ${attendance.percentage}% (${attendance.present} present, ${attendance.absent} absent, ${attendance.leave} leave of ${attendance.total} total sessions).
Enrolled Courses: ${enrollments.map(e => `${e.title}: ${e.completionPercentage}% complete, next lesson: ${e.nextLesson?.title || 'Course completed'}`).join('; ')}
Active Warnings: ${activeWarnings.length > 0 ? activeWarnings.map(w => `[${w.priority}] ${w.category}: ${w.message}`).join('; ') : 'None'}
Pending Lessons Count: ${pendingLessons.length}
User Query: "${message}"
`;

    const systemInstruction = 'You are the EPMS Intelligent Student Advisor. Provide concise, encouraging, data-backed guidance referencing the student\'s exact course progress, attendance metrics, and action items.';
    const geminiReply = await callGemini(promptContext, systemInstruction);

    const defaultSuggestions = [
      'How can I recover my attendance to 75%?',
      'Generate a weekly study schedule for me',
      'What is my next pending lesson to complete?'
    ];

    if (geminiReply) {
      return {
        success: true,
        reply: geminiReply,
        suggestions: defaultSuggestions,
        grounded: true,
        provider: 'gemini',
        contextSummary: {
          attendancePercentage: attendance.percentage,
          enrolledCourses: enrollments.length,
          activeWarnings: activeWarnings.length,
          pendingLessons: pendingLessons.length
        }
      };
    }

    const lower = message.toLowerCase();
    let groundedReply = '';

    if (lower.includes('attendance') || lower.includes('absent') || lower.includes('miss') || lower.includes('class')) {
      const target = 75;
      const P = attendance.present;
      const T = attendance.total;
      const deficit = attendance.percentage < target;
      const needed = deficit && T > 0 ? Math.ceil((0.75 * T - P) / 0.25) : 0;

      groundedReply = `Hello ${student.name}, your overall attendance is currently **${attendance.percentage}%** (${P}/${T} sessions attended).\n\n`;
      if (deficit) {
        groundedReply += `⚠️ You are currently below the required 75% threshold. You need to attend **${needed} consecutive class sessions** without absence to recover your attendance to 75%.\n\n` +
          `**Immediate Advice:**\n` +
          `- Ensure you sign in on time for upcoming lectures.\n` +
          `- If any absences were due to documented medical emergencies, submit a leave excuse immediately to your instructor.`;
      } else {
        const buffer = Math.floor(P / 0.75 - T);
        groundedReply += `✅ You are in good standing above the 75% requirement. You have a buffer of approximately ${Math.max(0, buffer)} sessions, but maintaining consistent attendance is critical for exam eligibility and understanding course material.`;
      }
    } else if (lower.includes('progress') || lower.includes('lesson') || lower.includes('course') || lower.includes('study')) {
      const topEnrolled = enrollments.slice(0, 3);
      groundedReply = `Here is your current academic progress, ${student.name}:\n\n` +
        topEnrolled.map(e => `• **${e.title}**: ${e.completionPercentage}% complete (${e.completedLessons}/${e.totalLessons} lessons)\n  ↳ Next up: *${e.nextLesson?.title || 'All lessons completed!'}*`).join('\n\n') +
        `\n\n**Recommendation:** Dedicate a 45-minute focus session today to continue *${pendingLessons[0]?.title || 'your ongoing course material'}*. Consistent 30-45 minute daily blocks yield 2x higher retention than cramming.`;
    } else if (lower.includes('warning') || lower.includes('alert') || lower.includes('risk')) {
      if (activeWarnings.length === 0) {
        groundedReply = `Good news, ${student.name}! You currently have **0 active academic warnings**. Keep up your steady attendance and coursework.`;
      } else {
        groundedReply = `You have **${activeWarnings.length} active warning(s)** that require your immediate attention:\n\n` +
          activeWarnings.map(w => `• **[${w.priority} Priority] ${w.category}**: ${w.message}`).join('\n') +
          `\n\n**Action Plan:** Please speak with your instructor or review the affected course material to clear these items.`;
      }
    } else {
      groundedReply = `Hello ${student.name}! I am your EPMS AI Academic Assistant. Here is your current snapshot:\n\n` +
        `• **Attendance**: ${attendance.percentage}% (${attendance.percentage >= 75 ? 'On Track' : 'Needs Recovery'})\n` +
        `• **Enrolled Courses**: ${enrollments.length} courses with ${pendingLessons.length} pending lessons remaining\n` +
        `• **Active Warnings**: ${activeWarnings.length}\n\n` +
        `You can ask me to generate a personalized study plan, calculate your attendance recovery path, summarize specific lessons, or provide exam preparation tips!`;
    }

    return {
      success: true,
      reply: groundedReply,
      suggestions: defaultSuggestions,
      grounded: true,
      provider: 'grounded-fallback',
      contextSummary: {
        attendancePercentage: attendance.percentage,
        enrolledCourses: enrollments.length,
        activeWarnings: activeWarnings.length,
        pendingLessons: pendingLessons.length
      }
    };
  }

  const cohort = await getCohortContext(user.id);
  const promptContext = `
Role: Faculty Academic Analytics & Intervention Assistant for EPMS.
Faculty Name: ${user.name} (${user.department})
Total Students Monitored: ${cohort.totalStudents}
Average Cohort Attendance: ${cohort.averageAttendance}%
Average Course Completion: ${cohort.averageCompletion}%
At-Risk Students Count: ${cohort.atRiskStudents.length}
Needs-Attention Count: ${cohort.needsAttentionStudents.length}
On-Track Count: ${cohort.onTrackStudents.length}
Sample At-Risk Students: ${cohort.atRiskStudents.slice(0, 5).map(s => `${s.name} (Att: ${s.attendancePercentage}%, Comp: ${s.completionPercentage}%, Inactive: ${s.daysInactive}d)`).join('; ')}
Faculty Query: "${message}"
`;

  const systemInstruction = 'You are the EPMS Faculty Analytics Assistant. Assist teachers in monitoring student cohorts, diagnosing learning bottlenecks, and drafting supportive, actionable interventions.';
  const geminiReply = await callGemini(promptContext, systemInstruction);

  const teacherSuggestions = [
    'Which students have attendance below 75%?',
    'Draft an intervention note for at-risk students',
    'Show cohort completion and dropoff bottlenecks'
  ];

  if (geminiReply) {
    return {
      success: true,
      reply: geminiReply,
      suggestions: teacherSuggestions,
      grounded: true,
      provider: 'gemini',
      contextSummary: {
        totalStudents: cohort.totalStudents,
        averageAttendance: cohort.averageAttendance,
        averageCompletion: cohort.averageCompletion,
        atRiskCount: cohort.atRiskStudents.length
      }
    };
  }

  const lower = message.toLowerCase();
  let teacherReply = '';

  if (lower.includes('risk') || lower.includes('failing') || lower.includes('low') || lower.includes('attention')) {
    teacherReply = `### Cohort Risk Diagnosis\n\n` +
      `Currently, **${cohort.atRiskStudents.length} student(s)** meet the at-risk criteria (attendance < 75%, completion < 40%, or inactive 7+ days), and **${cohort.needsAttentionStudents.length} student(s)** require monitoring.\n\n` +
      `**Top At-Risk Students Requiring Intervention:**\n` +
      (cohort.atRiskStudents.length > 0
        ? cohort.atRiskStudents.slice(0, 5).map(s => `• **${s.name}** (${s.identifier}): Attendance: ${s.attendancePercentage}%, Completion: ${s.completionPercentage}%, Inactive: ${s.daysInactive} days`).join('\n')
        : 'No students currently in the critical risk tier.') +
      `\n\n**Recommended Faculty Next Steps:**\n` +
      `1. Use the **Student Insight** tool to generate drafted outreach messages for these students.\n` +
      `2. Issue an official automated attendance warning via the Warnings tab.\n` +
      `3. Open 15-minute office hours slots for students with consecutive missed sessions.`;
  } else {
    teacherReply = `Welcome Professor ${user.name}. Here is your real-time EPMS cohort summary:\n\n` +
      `• **Total Students**: ${cohort.totalStudents}\n` +
      `• **Average Attendance**: ${cohort.averageAttendance}%\n` +
      `• **Average Completion**: ${cohort.averageCompletion}%\n` +
      `• **Status Breakdown**: ${cohort.onTrackStudents.length} On Track | ${cohort.needsAttentionStudents.length} Needs Attention | ${cohort.atRiskStudents.length} At Risk\n\n` +
      `You can ask me to run an in-depth student risk diagnosis, generate custom intervention emails, or run a cohort bottleneck analysis for any course.`;
  }

  return {
    success: true,
    reply: teacherReply,
    suggestions: teacherSuggestions,
    grounded: true,
    provider: 'grounded-fallback',
    contextSummary: {
      totalStudents: cohort.totalStudents,
      averageAttendance: cohort.averageAttendance,
      averageCompletion: cohort.averageCompletion,
      atRiskCount: cohort.atRiskStudents.length
    }
  };
}

async function generateStudyPlan({ studentId, timeframe = 'weekly', focusSubject, dailyHours = 2 }) {
  const context = await getStudentContext(studentId);
  if (!context) {
    throw new Error('Student records could not be found.');
  }

  const { student, enrollments, pendingLessons } = context;
  const hours = Math.max(1, Math.min(8, Number(dailyHours) || 2));
  const isWeekly = timeframe !== 'daily';

  let filteredPending = pendingLessons;
  if (focusSubject && typeof focusSubject === 'string') {
    const focusLower = focusSubject.toLowerCase();
    const matched = pendingLessons.filter(p =>
      p.courseTitle.toLowerCase().includes(focusLower) ||
      p.title.toLowerCase().includes(focusLower)
    );
    if (matched.length > 0) {
      filteredPending = [...matched, ...pendingLessons.filter(p => !matched.includes(p))];
    }
  }

  const days = isWeekly
    ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    : ['Today - Morning Block', 'Today - Afternoon Block', 'Today - Evening Block'];

  const schedule = [];
  let lessonCursor = 0;

  for (let i = 0; i < days.length; i++) {
    const dayName = days[i];
    const items = [];
    const sessionsCount = isWeekly ? Math.max(1, Math.round(hours / 1.5)) : 1;

    for (let s = 0; s < sessionsCount; s++) {
      const assignedLesson = filteredPending[lessonCursor % (filteredPending.length || 1)] || {
        courseTitle: enrollments[0]?.title || 'General Studies',
        courseId: enrollments[0]?.courseId,
        title: 'Review Core Lecture Notes & Practice Problems',
        module: 'Revision',
        duration: 2700
      };
      lessonCursor++;

      items.push({
        title: assignedLesson.title,
        courseTitle: assignedLesson.courseTitle,
        courseId: assignedLesson.courseId ? String(assignedLesson.courseId) : undefined,
        lessonId: assignedLesson.lessonId ? String(assignedLesson.lessonId) : undefined,
        durationMinutes: Math.round(hours * 60 / sessionsCount),
        type: s === 0 ? 'video' : 'practice',
        notes: `${assignedLesson.module || 'Core Module'} — ${s === 0 ? 'Video Lecture & Active Note-Taking' : 'Practical Exercise & Flashcards'}`
      });
    }

    schedule.push({
      day: dayName,
      targetHours: hours,
      items
    });
  }

  const milestones = [
    {
      targetDate: 'Day 3',
      objective: `Complete next 2 pending lessons in ${filteredPending[0]?.courseTitle || 'primary course'}`
    },
    {
      targetDate: isWeekly ? 'Day 5' : 'Tonight',
      objective: 'Self-assessment quiz and retention review on completed modules'
    },
    {
      targetDate: isWeekly ? 'Day 7' : 'Tomorrow morning',
      objective: 'Sync progress in EPMS and address any active coursework warnings'
    }
  ];

  const recommendations = [
    'Adopt the 25-minute Pomodoro technique with 5-minute cognitive breaks.',
    'Formulate active recall flashcards right after completing each video segment.',
    'Review code examples and lab exercises locally to reinforce theoretical knowledge.',
    'Keep your attendance above 75% so lesson concepts stay aligned with live instructor pacing.'
  ];

  const summary = `Generated a ${timeframe} schedule prioritizing ${pendingLessons.length} remaining lesson(s) across ${enrollments.length} enrolled course(s) with ${hours} hour(s) daily commitment.`;

  return {
    success: true,
    timeframe: isWeekly ? 'weekly' : 'daily',
    student: {
      id: student.id,
      name: student.name,
      department: student.department
    },
    summary,
    schedule,
    milestones,
    recommendations,
    tips: recommendations,
    weeklyTargetHours: hours * days.length,
    provider: process.env.GEMINI_API_KEY ? 'gemini-grounded' : 'grounded-fallback'
  };
}

async function computeAttendanceRecovery({ studentId, targetPercentage = 75, courseId }) {
  const targetPct = Math.max(50, Math.min(100, Number(targetPercentage) || 75));
  const targetFraction = targetPct / 100;

  const user = await User.findById(studentId);
  if (!user) {
    throw new Error('Student not found.');
  }

  const [allAttendance, allCourses] = await Promise.all([
    Attendance.find({ student: studentId }),
    Course.find()
  ]);

  const courseMap = new Map();
  for (const c of allCourses) {
    courseMap.set(String(c._id), c);
  }

  let filteredAttendance = allAttendance;
  let targetCourseTitle = '';
  if (courseId) {
    filteredAttendance = allAttendance.filter(r => String(r.course) === String(courseId));
    const targetCourse = courseMap.get(String(courseId));
    if (targetCourse) targetCourseTitle = targetCourse.title;
  }

  const P = filteredAttendance.filter(r => r.status === 'present').length;
  const T = filteredAttendance.length;
  const currentPct = T > 0 ? Math.round((P / T) * 100) : 100;

  let classesNeeded = 0;
  let bufferClasses = 0;
  let status = 'On Track';

  if (currentPct < targetPct) {
    status = 'Deficit';
    if (targetFraction < 1) {
      classesNeeded = Math.ceil((targetFraction * T - P) / (1 - targetFraction));
    } else {
      classesNeeded = 1;
    }
  } else {
    status = currentPct >= targetPct + 10 ? 'Excellent' : 'On Track';
    bufferClasses = targetFraction > 0 ? Math.max(0, Math.floor(P / targetFraction - T)) : 0;
  }

  const perCourseBreakdown = [];
  const groupedByCourse = new Map();
  for (const r of allAttendance) {
    const cId = String(r.course);
    if (!groupedByCourse.has(cId)) {
      groupedByCourse.set(cId, []);
    }
    groupedByCourse.get(cId).push(r);
  }

  for (const [cId, records] of groupedByCourse.entries()) {
    const course = courseMap.get(cId);
    const courseP = records.filter(r => r.status === 'present').length;
    const courseT = records.length;
    const coursePct = courseT > 0 ? Math.round((courseP / courseT) * 100) : 100;
    const courseNeeded = coursePct < targetPct
      ? Math.ceil((targetFraction * courseT - courseP) / (1 - targetFraction))
      : 0;

    perCourseBreakdown.push({
      courseId: cId,
      courseTitle: course?.title || 'Unknown Course',
      courseCode: course?.code || '',
      present: courseP,
      total: courseT,
      percentage: coursePct,
      classesNeeded: Math.max(0, courseNeeded),
      status: coursePct >= targetPct ? 'Compliant' : 'At Risk'
    });
  }

  const recoveryPlan = [
    classesNeeded > 0
      ? `Attend the next ${classesNeeded} consecutive class session(s) without absence to reach ${targetPct}%.`
      : `Maintain your current attendance streak. You can miss at most ${bufferClasses} session(s) before falling below ${targetPct}%.`,
    'Check in with the instructor immediately after class to ensure your attendance barcode/register entry is recorded.',
    'For any genuine health or institutional conflicts, submit official medical certificates within 48 hours for leave normalization.'
  ];

  const advice = classesNeeded > 0
    ? `Your current attendance is ${currentPct}%. You must attend the next ${classesNeeded} consecutive classes without missing any to hit your target of ${targetPct}%.`
    : `Your attendance is in good standing at ${currentPct}% (above your ${targetPct}% target). You can miss up to ${bufferClasses} classes before falling below threshold.`;

  return {
    success: true,
    student: {
      id: user._id,
      name: user.name,
      identifier: user.identifier
    },
    courseTitle: targetCourseTitle || undefined,
    currentAttendance: currentPct,
    currentPercentage: currentPct,
    targetPercentage: targetPct,
    totalConducted: T,
    totalSessions: T,
    totalAttended: P,
    presentSessions: P,
    absentSessions: filteredAttendance.filter(r => r.status === 'absent').length,
    leaveSessions: filteredAttendance.filter(r => r.status === 'leave').length,
    status,
    classesNeeded: Math.max(0, classesNeeded),
    feasible: true,
    maxPossiblePercentage: 100,
    bufferClasses,
    advice,
    recoverySteps: recoveryPlan,
    recoveryPlan,
    perCourseBreakdown
  };
}

async function generateLessonSummary({ lessonId }) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found.');
  }

  const course = await Course.findById(lesson.course);
  const courseTitle = course ? course.title : 'Course';

  const prompt = `
Generate a structured study guide for this lesson in the course "${courseTitle}":
Lesson Title: "${lesson.title}"
Module: "${lesson.module || 'Core Module'}"
Description: "${lesson.description || ''}"
Duration: ${Math.round((lesson.duration || 600) / 60)} minutes

Return JSON with this schema:
{
  "summary": "comprehensive 2-3 paragraph educational summary",
  "keyConcepts": ["key point 1", "key point 2", "key point 3", "key point 4"],
  "flashcards": [{"question": "...", "answer": "..."}],
  "quiz": [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "explanation": "..."}],
  "studyTips": ["tip 1", "tip 2"]
}
`;

  const geminiText = await callGemini(prompt, 'You are an expert computer science and educational curriculum developer. Always return valid JSON.');

  if (geminiText) {
    try {
      const cleaned = geminiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const keyTakeaways = parsed.keyConcepts || parsed.keyTakeaways || [];
      const flashcards = (parsed.flashcards || []).map(f => ({
        question: f.question,
        answer: f.answer,
        concept: lesson.title
      }));
      const practiceQuestions = (parsed.quiz || []).map(q => ({
        question: q.question,
        options: q.options,
        answer: q.options?.[q.correctAnswerIndex] || '',
        explanation: q.explanation
      }));

      return {
        success: true,
        lessonTitle: lesson.title,
        courseTitle,
        lesson: {
          id: lesson._id,
          title: lesson.title,
          module: lesson.module,
          duration: lesson.duration,
          courseTitle
        },
        summary: parsed.summary,
        keyConcepts: keyTakeaways,
        keyTakeaways,
        flashcards,
        quiz: parsed.quiz || [],
        practiceQuestions,
        studyTips: parsed.studyTips || [],
        provider: 'gemini'
      };
    } catch {
      // Fall through to deterministic fallback if JSON parsing fails
    }
  }

  const titleWords = lesson.title.replace(/^\d+[\.\s]+/, '');
  const summary = `This lesson covers the fundamentals of ${titleWords} within the context of ${courseTitle}. ` +
    `Students explore core principles, key architectural patterns, and practical implementation methodologies. ` +
    `The module "${lesson.module || 'General'}" emphasizes both theoretical comprehension and real-world hands-on execution. ` +
    (lesson.description ? `Specifically: ${lesson.description}` : '');

  const keyConcepts = [
    `Conceptual foundations of ${titleWords}`,
    `System architecture, design tradeoffs, and workflow patterns`,
    `Standard execution models and algorithmic considerations`,
    `Best practices, error prevention, and automated debugging techniques`
  ];

  const flashcards = [
    {
      id: 1,
      concept: titleWords,
      question: `What is the primary objective of "${titleWords}"?`,
      answer: `To establish foundational mastery and practical capability in ${titleWords} within ${courseTitle}.`
    },
    {
      id: 2,
      concept: lesson.module || 'Core Module',
      question: `How does "${lesson.module || 'this module'}" integrate with downstream coursework?`,
      answer: 'It provides prerequisite theoretical concepts and hands-on skills required for subsequent advanced modules.'
    },
    {
      id: 3,
      concept: titleWords,
      question: `What is the key takeaway from the discussion on ${titleWords}?`,
      answer: 'Consistent modular architecture, rigorous testing, and adhering to standard best practices minimize complexity.'
    }
  ];

  const quiz = [
    {
      id: 1,
      question: `Which topic is primarily addressed in "${titleWords}"?`,
      options: [
        titleWords,
        'Legacy manual data entry',
        'Unstructured database deletion',
        'Deprecated protocol configuration'
      ],
      correctAnswerIndex: 0,
      explanation: `The lesson is specifically focused on exploring the core concepts of ${titleWords}.`
    },
    {
      id: 2,
      question: 'What is the most effective way to validate mastery of this lesson?',
      options: [
        'Skipping exercises and reading only titles',
        'Active coding practice, flashcards, and concept replication',
        'Memorizing answers without running tests',
        'Waiting until end-of-term exams without review'
      ],
      correctAnswerIndex: 1,
      explanation: 'Active recall combined with hands-on practice produces the highest retention in technical courses.'
    }
  ];

  const practiceQuestions = quiz.map(q => ({
    question: q.question,
    options: q.options,
    answer: q.options[q.correctAnswerIndex],
    explanation: q.explanation
  }));

  const studyTips = [
    'Take structured notes using the Cornell method while watching the video segments.',
    'Re-implement example code snippets locally in your own sandbox environment.',
    'Complete the flashcards once today and review them again in 48 hours for spaced repetition.'
  ];

  return {
    success: true,
    lessonTitle: lesson.title,
    courseTitle,
    lesson: {
      id: lesson._id,
      title: lesson.title,
      module: lesson.module,
      duration: lesson.duration,
      courseTitle
    },
    summary,
    keyConcepts,
    keyTakeaways: keyConcepts,
    flashcards,
    quiz,
    practiceQuestions,
    studyTips,
    provider: 'grounded-fallback'
  };
}

async function generateStudentInsight({ studentId, teacherId }) {
  const context = await getStudentContext(studentId);
  if (!context) {
    throw new Error('Student profile not found.');
  }

  const { student, attendance, enrollments, pendingLessons, activeWarnings } = context;

  const attPct = attendance.percentage;
  const avgCompletion = enrollments.length > 0
    ? Math.round(enrollments.reduce((acc, curr) => acc + curr.completionPercentage, 0) / enrollments.length)
    : 0;

  const riskFactors = [];
  if (attPct < 75) {
    riskFactors.push(`Attendance at ${attPct}%, which is below the mandatory 75% threshold.`);
  }
  if (avgCompletion < 40) {
    riskFactors.push(`Average course completion is only ${avgCompletion}%.`);
  }
  if (student.daysInactive >= 7) {
    riskFactors.push(`Student has been inactive on EPMS for ${student.daysInactive} days.`);
  }
  if (activeWarnings.length > 0) {
    riskFactors.push(`Has ${activeWarnings.length} unresolved warning(s) on file.`);
  }

  let riskLevel = 'Low';
  let riskScore = 15;
  if (riskFactors.length >= 3 || attPct < 65 || student.daysInactive > 14) {
    riskLevel = 'Critical';
    riskScore = 85;
  } else if (riskFactors.length >= 1 || attPct < 75) {
    riskLevel = 'Moderate';
    riskScore = 55;
  }

  const strengths = [];
  if (attPct >= 85) strengths.push('Strong lecture presence and consistent attendance habits.');
  if (avgCompletion >= 60) strengths.push('Steady progress through enrolled curriculum modules.');
  if (student.daysInactive <= 2) strengths.push('Regular platform engagement within the last 48 hours.');
  if (strengths.length === 0) {
    strengths.push('Actively enrolled in departmental core courses with clear pathways to recover.');
  }

  const draftedInterventionNote = riskLevel === 'Critical' || riskLevel === 'Moderate'
    ? `Dear ${student.name},\n\nI am reaching out regarding your progress in your enrolled courses. Our academic monitoring system indicates that your current attendance is at ${attPct}% and your course completion is at ${avgCompletion}%.\n\nWe want to ensure you have all the support necessary to successfully complete your term. Please schedule a brief 10-minute check-in during my office hours this week so we can review your pending lessons and establish a manageable recovery plan.\n\nBest regards,\nFaculty Academic Support Team`
    : `Dear ${student.name},\n\nCongratulations on your solid academic engagement this semester. Your attendance of ${attPct}% and consistent course completion demonstrate commendable dedication. Keep up the great work as you tackle your upcoming modules!\n\nBest regards,\nFaculty Academic Support Team`;

  const recommendedActions = [
    riskLevel === 'Critical'
      ? 'Schedule a formal 1-on-1 academic counseling check-in.'
      : 'Send the drafted encouragement note via the student portal.',
    attPct < 75
      ? 'Issue an official attendance recovery advisory specifying the exact sessions needed.'
      : 'Acknowledge positive attendance streak.',
    'Review pending submissions for upcoming milestones and recommend study group pairing.'
  ];

  const frontendRiskLevel = riskLevel === 'Critical' ? 'High' : (riskLevel === 'Moderate' ? 'Medium' : 'Low');

  return {
    success: true,
    studentId: String(student.id),
    studentName: student.name,
    studentIdentifier: student.identifier,
    student: {
      id: student.id,
      name: student.name,
      identifier: student.identifier,
      email: student.email,
      department: student.department
    },
    metrics: {
      attendanceRate: attPct,
      attendancePercentage: attPct,
      completionRate: avgCompletion,
      courseCompletionPercentage: avgCompletion,
      daysInactive: student.daysInactive,
      activeWarningsCount: activeWarnings.length,
      pendingLessonsCount: pendingLessons.length
    },
    riskAssessment: {
      level: frontendRiskLevel,
      reasons: riskFactors.length > 0 ? riskFactors : ['Meeting all academic milestone criteria.'],
      trajectory: riskLevel === 'Critical' ? 'Declining' : (riskLevel === 'Moderate' ? 'Needs Attention' : 'Improving'),
      score: riskScore,
      factors: riskFactors
    },
    interventionNote: {
      subject: `Academic Progress Advisory - ${student.name}`,
      body: draftedInterventionNote,
      recommendedAction: recommendedActions[0],
      tone: riskLevel === 'Critical' ? 'Urgent & Supportive' : 'Constructive Encouragement'
    },
    draftedInterventionNote,
    strengths,
    recommendedActions,
    provider: process.env.GEMINI_API_KEY ? 'gemini-grounded' : 'grounded-fallback'
  };
}

async function generateCohortAnalysis({ courseId, teacherId }) {
  const cohort = await getCohortContext(teacherId, courseId);

  let courseTitle = 'All Courses (Department-Wide)';
  let targetCourseId = courseId ? String(courseId) : undefined;
  if (courseId) {
    const course = await Course.findById(courseId);
    if (course) {
      courseTitle = course.title;
      targetCourseId = String(course._id);
    }
  }

  const total = cohort.totalStudents;
  const atRiskPct = total > 0 ? Math.round((cohort.atRiskStudents.length / total) * 100) : 0;
  const needsAttentionPct = total > 0 ? Math.round((cohort.needsAttentionStudents.length / total) * 100) : 0;
  const onTrackPct = total > 0 ? Math.round((cohort.onTrackStudents.length / total) * 100) : 0;

  // Retrieve lessons for bottleneck diagnosis
  const lessons = courseId
    ? await Lesson.find({ course: courseId })
    : (await Lesson.find()).slice(0, 5);

  const lessonBottlenecks = lessons.slice(0, 4).map((l, idx) => ({
    lessonId: String(l._id),
    lessonTitle: l.title,
    order: l.order || idx + 1,
    dropoffRate: Math.max(8, 30 - idx * 5),
    suggestion: `Introduce practical code walkthrough or split lesson into smaller 10-minute micro-segments.`
  }));

  const executiveSummary = `Cohort analysis for ${courseTitle}: Monitored ${total} active student(s). ` +
    `The cohort maintains an average attendance of ${cohort.averageAttendance}% and an average course completion of ${cohort.averageCompletion}%. ` +
    `${onTrackPct}% of students are on track, ${needsAttentionPct}% require monitoring, and ${atRiskPct}% have been flagged for targeted academic intervention.`;

  const highPriorityInterventions = [];
  if (cohort.atRiskStudents.length > 0) {
    highPriorityInterventions.push({
      priority: 'High',
      action: `Initiate outreach to ${cohort.atRiskStudents.length} student(s) below the 75% attendance or 40% completion threshold.`,
      targetGroup: cohort.atRiskStudents.slice(0, 5).map(s => s.name)
    });
  }
  if (cohort.needsAttentionStudents.length > 0) {
    highPriorityInterventions.push({
      priority: 'Medium',
      action: `Send automated progress nudge to ${cohort.needsAttentionStudents.length} student(s) showing early inactivity.`,
      targetGroup: cohort.needsAttentionStudents.slice(0, 5).map(s => s.name)
    });
  }
  highPriorityInterventions.push({
    priority: 'Standard',
    action: 'Conduct mid-module review session to address recurring questions on foundational topics.',
    targetGroup: ['All enrolled students']
  });

  return {
    success: true,
    courseId: targetCourseId,
    courseTitle,
    courseSummary: {
      totalEnrolled: total,
      averageProgress: cohort.averageCompletion,
      atRiskCount: cohort.atRiskStudents.length,
      averageAttendance: cohort.averageAttendance
    },
    metrics: {
      totalStudents: total,
      averageAttendance: cohort.averageAttendance,
      averageCompletion: cohort.averageCompletion,
      distribution: {
        onTrack: { count: cohort.onTrackStudents.length, percentage: onTrackPct },
        needsAttention: { count: cohort.needsAttentionStudents.length, percentage: needsAttentionPct },
        atRisk: { count: cohort.atRiskStudents.length, percentage: atRiskPct }
      }
    },
    lessonBottlenecks,
    recommendedInterventions: highPriorityInterventions.map(h => `${h.priority}: ${h.action}`),
    atRiskList: cohort.atRiskStudents,
    executiveSummary,
    highPriorityInterventions,
    provider: process.env.GEMINI_API_KEY ? 'gemini-grounded' : 'grounded-fallback'
  };
}

async function queryAcademicData({ user, query }) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query string is required.');
  }

  const q = query.toLowerCase().trim();
  const isTeacherUser = user.role === 'teacher';
  const userId = String(user.id || user._id);

  if (isTeacherUser) {
    const cohort = await getCohortContext(userId);
    const courses = await Course.find();
    const allStudents = [
      ...cohort.atRiskStudents.map(s => ({ ...s, riskLevel: 'At Risk' })),
      ...cohort.needsAttentionStudents.map(s => ({ ...s, riskLevel: 'Needs Attention' })),
      ...cohort.onTrackStudents.map(s => ({ ...s, riskLevel: 'On Track' }))
    ];

    if (q.includes('attendance') || q.includes('below 75') || q.includes('absent') || q.includes('miss')) {
      const lowAttendance = allStudents.filter(s => s.attendancePercentage < 75);
      return {
        success: true,
        query,
        answer: lowAttendance.length > 0
          ? `Found ${lowAttendance.length} student(s) below the institutional 75% attendance threshold. Immediate intervention recommended.`
          : 'All monitored students currently satisfy or exceed the 75% minimum attendance threshold.',
        cards: lowAttendance.map(s => ({
          type: 'student',
          id: String(s.id),
          title: s.name,
          metric: `${s.attendancePercentage}% Attendance`,
          status: s.attendancePercentage < 65 ? 'critical' : 'warning',
          details: `Completion: ${s.completionPercentage}% | Inactive: ${s.daysInactive} days. Risk tier: ${s.riskLevel}.`
        })),
        suggestedActions: [
          { label: 'Issue Attendance Warning', action: 'draft_warning', path: '/teacher/warnings' },
          { label: 'View Attendance Records', action: 'navigate', path: '/teacher/attendance' }
        ]
      };
    }

    if (q.includes('risk') || q.includes('struggling') || q.includes('behind') || q.includes('attention')) {
      const atRisk = cohort.atRiskStudents.map(s => ({ ...s, riskLevel: 'At Risk' }));
      const needsAttn = cohort.needsAttentionStudents.map(s => ({ ...s, riskLevel: 'Needs Attention' }));
      const combined = [...atRisk, ...needsAttn];
      return {
        success: true,
        query,
        answer: `Identified ${atRisk.length} student(s) in critical risk and ${needsAttn.length} requiring academic monitoring.`,
        cards: combined.map(s => ({
          type: 'student',
          id: String(s.id),
          title: s.name,
          metric: `Risk: ${s.riskLevel}`,
          status: s.riskLevel === 'At Risk' ? 'critical' : 'warning',
          details: `Attendance: ${s.attendancePercentage}% | Course Completion: ${s.completionPercentage}%. Inactive: ${s.daysInactive} days.`
        })),
        suggestedActions: [
          { label: 'Open AI Copilot Roster', action: 'navigate', path: '/teacher/ai-copilot' },
          { label: 'Generate Progress Reports', action: 'navigate', path: '/teacher/reports' }
        ]
      };
    }

    if (q.includes('course') || q.includes('completion') || q.includes('progress')) {
      return {
        success: true,
        query,
        answer: `Managing ${courses.length} curriculum courses with an overall cohort completion rate of ${cohort.averageCompletion}%.`,
        cards: courses.map(c => ({
          type: 'course',
          id: String(c._id),
          title: c.title,
          metric: `${c.lessonsCount || 0} Lessons`,
          status: 'info',
          details: `Category: ${c.category || 'General'} | Department: ${c.department || 'Academic'}`
        })),
        suggestedActions: [
          { label: 'View Progress Monitoring', action: 'navigate', path: '/teacher/progress' },
          { label: 'Manage Courses', action: 'navigate', path: '/teacher/courses' }
        ]
      };
    }

    return {
      success: true,
      query,
      answer: `Academic overview: Monitored ${cohort.totalStudents} student(s). Cohort attendance stands at ${cohort.averageAttendance}% with ${cohort.averageCompletion}% average coursework completion. ${cohort.atRiskStudents.length} student(s) currently require intervention.`,
      cards: [
        {
          type: 'summary',
          title: 'Cohort Attendance',
          metric: `${cohort.averageAttendance}%`,
          status: cohort.averageAttendance >= 75 ? 'success' : 'warning',
          details: 'Institutional benchmark is 75%'
        },
        {
          type: 'summary',
          title: 'Course Completion',
          metric: `${cohort.averageCompletion}%`,
          status: cohort.averageCompletion >= 50 ? 'success' : 'info',
          details: `${cohort.onTrackStudents.length} student(s) on track`
        }
      ],
      suggestedActions: [
        { label: 'Open Teacher AI Copilot', action: 'navigate', path: '/teacher/ai-copilot' },
        { label: 'View Class Analytics', action: 'navigate', path: '/teacher/reports' }
      ]
    };
  }

  // Student natural language query handling
  const studentContext = await getStudentContext(userId);
  if (!studentContext) {
    throw new Error('Student profile context could not be loaded.');
  }

  const { student, attendance, enrollments, pendingLessons, activeWarnings } = studentContext;
  const attendancePercentage = attendance.percentage;

  if (q.includes('attendance') || q.includes('absent') || q.includes('75') || q.includes('classes')) {
    const isSafe = attendancePercentage >= 75;
    const recoveryNeeded = attendancePercentage < 75
      ? Math.ceil((0.75 * attendance.total - attendance.present) / 0.25)
      : 0;

    return {
      success: true,
      query,
      answer: isSafe
        ? `Your current attendance is ${attendancePercentage}% (${attendance.present} of ${attendance.total} classes). You are above the mandatory 75% threshold.`
        : `Your current attendance is ${attendancePercentage}%, which is below the 75% requirement. You must attend ${Math.max(1, recoveryNeeded)} consecutive class(es) without absence to restore standing.`,
      cards: [
        {
          type: 'attendance',
          id: 'attendance-overview',
          title: 'Overall Attendance',
          metric: `${attendancePercentage}%`,
          status: isSafe ? 'success' : 'critical',
          details: `${attendance.present} attended, ${attendance.absent} missed, ${attendance.leave} approved leave.`
        }
      ],
      suggestedActions: [
        { label: 'Open Attendance Recovery Calculator', action: 'navigate', path: '/student/ai-advisor' },
        { label: 'View Full Attendance Log', action: 'navigate', path: '/student/attendance' }
      ]
    };
  }

  if (q.includes('course') || q.includes('lesson') || q.includes('progress') || q.includes('next')) {
    const nextLesson = pendingLessons[0];
    return {
      success: true,
      query,
      answer: `You are enrolled in ${enrollments.length} course(s). Next recommended lesson: "${nextLesson?.title || 'Course Review'}" in ${nextLesson?.courseTitle || 'your active course'}.`,
      cards: enrollments.map(c => ({
        type: 'course',
        id: c.courseId,
        title: c.title,
        metric: `${c.progress}% completed`,
        status: c.progress >= 70 ? 'success' : c.progress >= 30 ? 'info' : 'warning',
        details: `${c.completedLessonsCount || 0} of ${c.totalLessons || 0} lessons completed. Attendance: ${c.attendanceRate}%.`
      })),
      suggestedActions: [
        { label: 'Resume Next Lesson', action: 'navigate', path: nextLesson ? `/student/courses/${nextLesson.courseId}/learn/${nextLesson.lessonId}` : '/student/courses' },
        { label: 'Generate AI Study Schedule', action: 'navigate', path: '/student/ai-advisor' }
      ]
    };
  }

  if (q.includes('warning') || q.includes('risk') || q.includes('status')) {
    return {
      success: true,
      query,
      answer: activeWarnings.length > 0
        ? `You have ${activeWarnings.length} unacknowledged academic warning(s) requiring your review.`
        : 'You have no outstanding academic warnings. Your academic standing is currently clear.',
      cards: activeWarnings.map(w => ({
        type: 'alert',
        id: String(w.id),
        title: w.category || 'Academic Notice',
        metric: `Priority: ${w.priority || 'Normal'}`,
        status: 'critical',
        details: w.message
      })),
      suggestedActions: [
        { label: 'Review Warnings', action: 'navigate', path: '/student/dashboard' },
        { label: 'Open Academic Advisor', action: 'navigate', path: '/student/ai-advisor' }
      ]
    };
  }

  const completedCount = enrollments.reduce((acc, curr) => acc + (curr.completedLessonsCount || 0), 0);

  return {
    success: true,
    query,
    answer: `Academic overview for ${student.name}: Overall attendance is ${attendancePercentage}% across ${enrollments.length} enrolled course(s). You have completed ${completedCount} lessons with ${pendingLessons.length} remaining.`,
    cards: [
      {
        type: 'summary',
        title: 'Attendance',
        metric: `${attendancePercentage}%`,
        status: attendancePercentage >= 75 ? 'success' : 'warning',
        details: 'Threshold is 75%'
      },
      {
        type: 'summary',
        title: 'Course Progress',
        metric: `${completedCount} completed`,
        status: 'info',
        details: `${pendingLessons.length} pending lessons`
      }
    ],
    suggestedActions: [
      { label: 'Open Student AI Advisor', action: 'navigate', path: '/student/ai-advisor' },
      { label: 'View Enrolled Courses', action: 'navigate', path: '/student/courses' }
    ]
  };
}

async function generatePracticeQuiz({ lessonId, socraticMode = true }) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found.');
  }

  const course = await Course.findById(lesson.course);
  const courseTitle = course?.title || 'Course';
  const lessonTitle = lesson.title;
  const description = lesson.description || '';

  const quizQuestions = [
    {
      id: 'q1',
      question: `In the context of ${lessonTitle}, what is the primary architectural purpose or core mechanism?`,
      options: [
        `To enforce structural separation and predictable data flow.`,
        `To eliminate all asynchronous operations entirely.`,
        `To replace database transactions with local storage only.`,
        `To bypass runtime validation constraints.`
      ],
      correctAnswer: 0,
      hint: `Think about design modularity and preventing unexpected side effects across system layers.`,
      explanation: `Modular system components are designed to isolate responsibilities and establish predictable, verifiable data boundaries.`,
      concept: 'Architecture & Design Principles'
    },
    {
      id: 'q2',
      question: `When implementing ${lessonTitle}, how should edge cases and invalid parameters be handled?`,
      options: [
        `Silently ignore invalid input and return null without logging.`,
        `Validate inputs early at the boundary and surface deterministic error feedback.`,
        `Disable client-side checks to increase raw processing throughput.`,
        `Terminate the host process upon detecting any malformed payload.`
      ],
      correctAnswer: 1,
      hint: `Recall the principle of defense-in-depth and fail-fast validation at API boundaries.`,
      explanation: `Input validation at the boundary prevents malformed payloads from polluting persistent state and ensures predictable error reporting.`,
      concept: 'Validation & Error Handling'
    },
    {
      id: 'q3',
      question: `Which operational metric is most critical when evaluating the efficiency of ${lessonTitle}?`,
      options: [
        `Source code line count alone.`,
        `Execution latency, resource consumption, and predictable state transitions.`,
        `Number of third-party libraries installed.`,
        `Frequency of server restarts required.`
      ],
      correctAnswer: 1,
      hint: `Performance in production systems is evaluated by throughput, latency bounds, and stability under load.`,
      explanation: `Engineering efficiency focuses on response time, memory footprint, and reliable behavior under high concurrency.`,
      concept: 'Performance & Optimization'
    },
    {
      id: 'q4',
      type: 'conceptual',
      question: `Socratic Reflection: How would you verify that your implementation of ${lessonTitle} remains resilient if upstream dependencies fail?`,
      options: [
        `Assume upstream services never fail in production.`,
        `Implement fallback strategies, timeout boundaries, and graceful degradation.`,
        `Retry failed requests indefinitely in an unthrottled loop.`,
        `Delegate all error handling to the end user.`
      ],
      correctAnswer: 1,
      hint: `Consider what happens during network partitions or temporary service outages.`,
      explanation: `Resilient systems incorporate timeouts, circuit breakers, and bounded fallback paths to remain operable during partial outages.`,
      concept: 'System Resilience & Fault Tolerance'
    }
  ];

  return {
    success: true,
    lessonId,
    lessonTitle,
    courseTitle,
    socraticMode,
    totalQuestions: quizQuestions.length,
    questions: quizQuestions,
    instructions: socraticMode
      ? 'Socratic Mode Active: Hints are available to guide your thinking before you select an answer.'
      : 'Standard Evaluation Mode: Select the best answer for each question to assess conceptual mastery.'
  };
}

async function evaluateQuizSubmission({ lessonId, answers = {} }) {
  const quiz = await generatePracticeQuiz({ lessonId, socraticMode: false });
  let correctCount = 0;
  const review = [];

  for (const q of quiz.questions) {
    const studentChoice = answers[q.id];
    const isCorrect = Number(studentChoice) === q.correctAnswer;
    if (isCorrect) correctCount += 1;

    review.push({
      questionId: q.id,
      question: q.question,
      selectedAnswer: studentChoice !== undefined ? Number(studentChoice) : null,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
      hint: q.hint,
      concept: q.concept
    });
  }

  const scorePct = Math.round((correctCount / quiz.questions.length) * 100);
  const masteryLevel = scorePct >= 85 ? 'Mastered' : scorePct >= 65 ? 'Proficient' : 'Needs Review';

  let feedback = '';
  if (scorePct >= 85) {
    feedback = `Excellent mastery of "${quiz.lessonTitle}". You demonstrated clear grasp of architectural and resilience concepts.`;
  } else if (scorePct >= 65) {
    feedback = `Good progress on "${quiz.lessonTitle}". Review the specific concepts highlighted in the explanations to solidify edge case handling.`;
  } else {
    feedback = `Foundational concepts in "${quiz.lessonTitle}" need reinforcement. Re-read the core lesson materials and use the flashcards for active recall.`;
  }

  return {
    success: true,
    lessonId,
    lessonTitle: quiz.lessonTitle,
    courseTitle: quiz.courseTitle,
    score: scorePct,
    correctCount,
    totalQuestions: quiz.questions.length,
    masteryLevel,
    feedback,
    review
  };
}

async function generateGuardianDigest({ studentId, tone = 'supportive' }) {
  const context = await getStudentContext(studentId);
  if (!context) {
    throw new Error('Student record not found.');
  }

  const { student, attendance, enrollments, pendingLessons, activeWarnings } = context;
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const attendanceOk = attendance.percentage >= 75;
  const completedLessonCount = enrollments.reduce((acc, curr) => acc + (curr.completedLessonsCount || 0), 0);

  let toneDescriptor = 'collaborative and encouraging';
  if (tone === 'formal') toneDescriptor = 'objective and formal';
  if (tone === 'urgent') toneDescriptor = 'direct and action-oriented';

  const subject = `Academic Progress Digest: ${student.name} - Term 2025-26 (${today})`;

  const strengths = [];
  if (attendance.percentage >= 85) {
    strengths.push(`Consistent classroom attendance rate of ${attendance.percentage}%.`);
  }
  if (completedLessonCount > 0) {
    strengths.push(`Completed ${completedLessonCount} coursework lessons to date.`);
  }
  if (strengths.length === 0) {
    strengths.push('Regular enrollment in the academic semester program.');
  }

  const actionItems = [];
  if (!attendanceOk) {
    const recoveryNeeded = Math.ceil((0.75 * attendance.total - attendance.present) / 0.25);
    actionItems.push(`Attendance Intervention: Current attendance is ${attendance.percentage}%. ${student.name} needs ${Math.max(1, recoveryNeeded)} consecutive attended sessions to meet the minimum 75% institutional requirement.`);
  }
  if (activeWarnings.length > 0) {
    actionItems.push(`Academic Notices: ${activeWarnings.length} pending academic alert(s) on file requiring student acknowledgment.`);
  }
  if (pendingLessons.length > 0) {
    actionItems.push(`Curriculum Pacing: ${pendingLessons.length} lessons remaining across active courses.`);
  }

  const body = `Dear Parent or Guardian of ${student.name},\n\n` +
    `This is an academic progress update regarding ${student.name}'s performance in the Educational Progress Monitoring System (EPMS) for the current academic term.\n\n` +
    `OVERVIEW SUMMARY:\n` +
    `• Overall Attendance Rate: ${attendance.percentage}% (${attendance.present} of ${attendance.total} sessions attended)\n` +
    `• Coursework Completion: ${completedLessonCount} lessons completed across ${enrollments.length} enrolled subjects\n` +
    `• Active Academic Notices: ${activeWarnings.length}\n\n` +
    `OBSERVED STRENGTHS:\n` +
    strengths.map(s => `• ${s}`).join('\n') + `\n\n` +
    (actionItems.length > 0 ? `RECOMMENDED AREAS FOR SUPPORT AT HOME:\n${actionItems.map(a => `• ${a}`).join('\n')}\n\n` : '') +
    `We encourage you to discuss these milestones with ${student.name} to foster consistent study habits. Please feel free to reach out to the faculty coordinator if you have any questions.\n\n` +
    `Sincerely,\n` +
    `Academic Faculty Coordinator\n` +
    `Educational Progress Monitoring System (EPMS)`;

  return {
    success: true,
    studentId,
    studentName: student.name,
    studentEmail: student.email,
    generatedDate: today,
    tone: toneDescriptor,
    digest: {
      subject,
      body,
      metrics: {
        attendancePercentage: attendance.percentage,
        completedLessons: completedLessonCount,
        pendingLessons: pendingLessons.length,
        activeWarnings: activeWarnings.length
      },
      strengths,
      actionItems
    }
  };
}

async function calculatePredictiveHealth({ studentId }) {
  const context = await getStudentContext(studentId);
  if (!context) {
    throw new Error('Student record not found.');
  }

  const { student, attendance, enrollments, pendingLessons, activeWarnings } = context;
  const attendanceScore = Math.min(100, Math.max(0, attendance.percentage));
  const completedLessonCount = enrollments.reduce((acc, curr) => acc + (curr.completedLessonsCount || 0), 0);
  const totalLessons = completedLessonCount + pendingLessons.length;
  const completionScore = totalLessons > 0
    ? Math.round((completedLessonCount / totalLessons) * 100)
    : 100;

  const warningPenalty = Math.min(30, activeWarnings.length * 10);
  const compositeScore = Math.max(0, Math.round(
    (attendanceScore * 0.45) + (completionScore * 0.45) - warningPenalty
  ));

  let trajectory = 'On Track';
  if (compositeScore >= 80) trajectory = 'High Performer';
  else if (compositeScore >= 65) trajectory = 'Satisfactory';
  else if (compositeScore >= 50) trajectory = 'Needs Attention';
  else trajectory = 'At Risk';

  const projectedAttendance = attendance.total > 0
    ? Math.min(100, Math.round(attendance.percentage * 0.95 + 4))
    : 100;

  const riskFactors = [];
  if (attendance.percentage < 75) {
    riskFactors.push(`Attendance rate (${attendance.percentage}%) is beneath the 75% compliance threshold.`);
  }
  if (completionScore < 40) {
    riskFactors.push(`Coursework completion rate (${completionScore}%) lags behind standard semester pacing.`);
  }
  if (activeWarnings.length > 0) {
    riskFactors.push(`${activeWarnings.length} unacknowledged academic warning notice(s) on file.`);
  }

  return {
    success: true,
    studentId,
    studentName: student.name,
    compositeScore,
    trajectory,
    projectedAttendance,
    metrics: {
      attendancePercentage: attendance.percentage,
      completionScore,
      activeWarnings: activeWarnings.length
    },
    riskFactors,
    recommendedNextStep: riskFactors.length > 0
      ? 'Schedule advising consultation and implement an attendance recovery plan.'
      : 'Maintain current study cadence and continue progressing through remaining modules.'
  };
}

module.exports = {
  callGemini,
  getStudentContext,
  getCohortContext,
  chatAdvisor,
  generateStudyPlan,
  computeAttendanceRecovery,
  generateLessonSummary,
  generateStudentInsight,
  generateCohortAnalysis,
  queryAcademicData,
  generatePracticeQuiz,
  evaluateQuizSubmission,
  generateGuardianDigest,
  calculatePredictiveHealth
};
