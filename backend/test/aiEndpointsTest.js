require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');

const JWT_SECRET = process.env.JWT_SECRET || 'epms_super_secure_jwt_secret_key_2026_educational_monitoring';

async function runTestSuite() {
  console.log('--- Starting EPMS AI Endpoints Test Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`PASS: ${message}`);
      passed++;
    } else {
      console.error(`FAIL: ${message}`);
      failed++;
    }
  }

  // Retrieve test users and data
  const users = await User.find();
  const student = users.find(u => u.role === 'student');
  const teacher = users.find(u => u.role === 'teacher');
  const lessons = await Lesson.find();
  const sampleLesson = lessons[0];
  const courses = await Course.find();
  const sampleCourse = courses[0];

  assert(student, `Found student user: ${student?.name}`);
  assert(teacher, `Found teacher user: ${teacher?.name}`);
  assert(sampleLesson, `Found sample lesson: ${sampleLesson?.title}`);

  const studentToken = jwt.sign({ id: String(student._id), role: student.role }, JWT_SECRET, { expiresIn: '1h' });
  const teacherToken = jwt.sign({ id: String(teacher._id), role: teacher.role }, JWT_SECRET, { expiresIn: '1h' });

  // Helper to execute requests directly against express app in-memory
  async function makeRequest(path, { method = 'POST', headers = {}, body } = {}) {
    return new Promise((resolve) => {
      const { EventEmitter } = require('events');
      const req = new EventEmitter();
      req.method = method;
      req.url = path;
      req.originalUrl = path;
      req.headers = {
        'content-type': 'application/json',
        ...Object.keys(headers).reduce((acc, k) => {
          acc[k.toLowerCase()] = headers[k];
          return acc;
        }, {})
      };
      req.body = body || {};
      req.ip = '127.0.0.1';
      req.connection = { remoteAddress: '127.0.0.1' };

      let statusCode = 200;
      let resHeaders = {};

      const res = {
        setHeader(k, v) { resHeaders[k] = v; },
        getHeader(k) { return resHeaders[k]; },
        status(code) { statusCode = code; return res; },
        json(data) { resolve({ status: statusCode, data }); },
        send(data) { resolve({ status: statusCode, data }); },
        end(data) { resolve({ status: statusCode, data }); }
      };

      app.handle(req, res);
    });
  }

  // 1. POST /api/ai/chat (Student)
  const chatStudentRes = await makeRequest('/api/ai/chat', {
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { message: 'How is my attendance doing?' }
  });
  assert(chatStudentRes.status === 200 && chatStudentRes.data?.success === true, 'Student chat returns 200 with success');
  assert(typeof chatStudentRes.data?.reply === 'string' && chatStudentRes.data.reply.length > 20, 'Student chat provides substantive grounded reply');

  // 2. POST /api/ai/chat (Teacher)
  const chatTeacherRes = await makeRequest('/api/ai/chat', {
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: { message: 'Which students are currently at risk?' }
  });
  assert(chatTeacherRes.status === 200 && chatTeacherRes.data?.success === true, 'Teacher chat returns 200 with success');
  assert(typeof chatTeacherRes.data?.reply === 'string', 'Teacher chat provides cohort diagnostic reply');

  // 3. POST /api/ai/study-plan
  const studyPlanRes = await makeRequest('/api/ai/study-plan', {
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { timeframe: 'weekly', dailyHours: 2 }
  });
  assert(studyPlanRes.status === 200 && studyPlanRes.data?.success === true, 'Study plan returns 200 with success');
  assert(Array.isArray(studyPlanRes.data?.schedule) && studyPlanRes.data.schedule.length > 0, 'Study plan contains schedule blocks');

  // 4. POST /api/ai/attendance-recovery
  const recoveryRes = await makeRequest('/api/ai/attendance-recovery', {
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { targetPercentage: 80 }
  });
  assert(recoveryRes.status === 200 && recoveryRes.data?.success === true, 'Attendance recovery returns 200 with success');
  assert(typeof recoveryRes.data?.classesNeeded === 'number', 'Attendance recovery calculates classes needed');
  assert(Array.isArray(recoveryRes.data?.perCourseBreakdown), 'Attendance recovery provides per-course breakdown');

  // 5. POST /api/ai/lesson-summary
  const lessonSummaryRes = await makeRequest('/api/ai/lesson-summary', {
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { lessonId: String(sampleLesson._id) }
  });
  assert(lessonSummaryRes.status === 200 && lessonSummaryRes.data?.success === true, 'Lesson summary returns 200 with success');
  assert(Array.isArray(lessonSummaryRes.data?.flashcards), 'Lesson summary generates flashcards');
  assert(Array.isArray(lessonSummaryRes.data?.quiz), 'Lesson summary generates quiz questions');

  // 6. POST /api/ai/teacher/student-insight (Teacher)
  const insightRes = await makeRequest('/api/ai/teacher/student-insight', {
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: { studentId: String(student._id) }
  });
  assert(insightRes.status === 200 && insightRes.data?.success === true, 'Student insight returns 200 with success');
  assert(typeof insightRes.data?.draftedInterventionNote === 'string', 'Student insight contains drafted intervention note');
  assert(insightRes.data?.riskAssessment?.level, 'Student insight contains risk assessment level');

  // 7. POST /api/ai/teacher/cohort-analysis (Teacher)
  const cohortRes = await makeRequest('/api/ai/teacher/cohort-analysis', {
    headers: { Authorization: `Bearer ${teacherToken}` },
    body: { courseId: String(sampleCourse._id) }
  });
  assert(cohortRes.status === 200 && cohortRes.data?.success === true, 'Cohort analysis returns 200 with success');
  assert(typeof cohortRes.data?.executiveSummary === 'string', 'Cohort analysis contains executive summary');
  assert(Array.isArray(cohortRes.data?.highPriorityInterventions), 'Cohort analysis contains intervention actions');

  // 8. Auth & Validation edge cases
  const noTokenRes = await makeRequest('/api/ai/chat', {
    body: { message: 'hello' }
  });
  assert(noTokenRes.status === 401, 'Request without token returns 401 Unauthorized');

  const studentForbiddenRes = await makeRequest('/api/ai/teacher/student-insight', {
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { studentId: String(student._id) }
  });
  assert(studentForbiddenRes.status === 403, 'Student calling teacher-only endpoint returns 403 Forbidden');

  const emptyMsgRes = await makeRequest('/api/ai/chat', {
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { message: '   ' }
  });
  assert(emptyMsgRes.status === 400, 'Empty chat message returns 400 Bad Request');

  const emptyLessonRes = await makeRequest('/api/ai/lesson-summary', {
    headers: { Authorization: `Bearer ${studentToken}` },
    body: {}
  });
  assert(emptyLessonRes.status === 400, 'Missing lessonId returns 400 Bad Request');

  console.log(`--- Test Suite Finished: ${passed} passed, ${failed} failed ---`);
  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch(err => {
  console.error('Test Suite crashed:', err);
  process.exit(1);
});
