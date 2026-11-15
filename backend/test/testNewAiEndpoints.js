const { connectDB } = require('../config/db');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const aiService = require('../services/aiService');

async function runTests() {
  console.log('Testing newly added AI features...');
  await connectDB();

  const studentUser = await User.findOne({ role: 'student' });
  const teacherUser = await User.findOne({ role: 'teacher' });
  const sampleLesson = await Lesson.findOne();

  if (!studentUser || !teacherUser || !sampleLesson) {
    throw new Error('Required test fixtures (student, teacher, lesson) not found in database.');
  }

  // 1. Test Natural Language Query for Student
  console.log('1. Testing Student Query ("what is my attendance?")...');
  const studentQueryRes = await aiService.queryAcademicData({
    user: studentUser,
    query: 'what is my attendance and am I above 75?'
  });
  if (!studentQueryRes.success || !Array.isArray(studentQueryRes.cards)) {
    throw new Error('Student query failed.');
  }
  console.log('   ✓ Student query passed with response:', studentQueryRes.answer);

  // 2. Test Natural Language Query for Teacher
  console.log('2. Testing Teacher Query ("which students have low attendance?")...');
  const teacherQueryRes = await aiService.queryAcademicData({
    user: teacherUser,
    query: 'which students are below 75 attendance?'
  });
  if (!teacherQueryRes.success || !Array.isArray(teacherQueryRes.cards)) {
    throw new Error('Teacher query failed.');
  }
  console.log('   ✓ Teacher query passed with response:', teacherQueryRes.answer);

  // 3. Test Practice Quiz Generation
  console.log('3. Testing Practice Quiz Generation for lesson:', sampleLesson.title);
  const quizRes = await aiService.generatePracticeQuiz({
    lessonId: String(sampleLesson._id),
    socraticMode: true
  });
  if (!quizRes.success || quizRes.questions.length < 3) {
    throw new Error('Quiz generation failed.');
  }
  console.log(`   ✓ Quiz generated with ${quizRes.questions.length} questions and Socratic hints.`);

  // 4. Test Quiz Submission Evaluation
  console.log('4. Testing Quiz Evaluation...');
  const answers = { q1: 0, q2: 1, q3: 0, q4: 1 };
  const evalRes = await aiService.evaluateQuizSubmission({
    lessonId: String(sampleLesson._id),
    answers
  });
  if (!evalRes.success || typeof evalRes.score !== 'number' || !evalRes.masteryLevel) {
    throw new Error('Quiz evaluation failed.');
  }
  console.log(`   ✓ Quiz evaluated: Score ${evalRes.score}%, Mastery: ${evalRes.masteryLevel}`);

  // 5. Test Guardian Progress Digest
  console.log('5. Testing Guardian Progress Digest generation...');
  const digestRes = await aiService.generateGuardianDigest({
    studentId: String(studentUser._id),
    tone: 'supportive'
  });
  if (!digestRes.success || !digestRes.digest.body.includes(studentUser.name)) {
    throw new Error('Guardian digest generation failed.');
  }
  console.log('   ✓ Guardian digest generated successfully.');

  // 6. Test Predictive Academic Health
  console.log('6. Testing Predictive Academic Health calculation...');
  const healthRes = await aiService.calculatePredictiveHealth({
    studentId: String(studentUser._id)
  });
  if (!healthRes.success || typeof healthRes.compositeScore !== 'number' || !healthRes.trajectory) {
    throw new Error('Predictive health calculation failed.');
  }
  console.log(`   ✓ Predictive health: Composite Score ${healthRes.compositeScore}/100, Trajectory: ${healthRes.trajectory}`);

  console.log('\nAll 6 new AI capabilities passed verification perfectly!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
