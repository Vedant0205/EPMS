const express = require('express');
const router = express.Router();
const { verifyToken, isTeacher } = require('../middleware/auth');
const aiService = require('../services/aiService');

router.use(verifyToken);

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A message prompt is required.'
      });
    }

    const result = await aiService.chatAdvisor({
      user: req.user,
      message: message.trim(),
      history: Array.isArray(history) ? history : []
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error processing AI chat request.'
    });
  }
});

router.post('/study-plan', async (req, res) => {
  try {
    const studentId = req.user.role === 'teacher' && req.body.studentId
      ? req.body.studentId
      : req.user.id;

    const { timeframe, focusSubject, dailyHours } = req.body;

    const result = await aiService.generateStudyPlan({
      studentId,
      timeframe: timeframe || 'weekly',
      focusSubject,
      dailyHours: Number(dailyHours) || 2
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error generating study schedule.'
    });
  }
});

router.post('/attendance-recovery', async (req, res) => {
  try {
    const studentId = req.user.role === 'teacher' && req.body.studentId
      ? req.body.studentId
      : req.user.id;

    const { targetPercentage, courseId } = req.body;

    const result = await aiService.computeAttendanceRecovery({
      studentId,
      targetPercentage: targetPercentage ? Number(targetPercentage) : 75,
      courseId
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error computing attendance recovery.'
    });
  }
});

router.post('/lesson-summary', async (req, res) => {
  try {
    const { lessonId } = req.body;
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'lessonId is required.'
      });
    }

    const result = await aiService.generateLessonSummary({ lessonId });
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error generating lesson summary.'
    });
  }
});

router.post('/teacher/student-insight', isTeacher, async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required for teacher student insight.'
      });
    }

    const result = await aiService.generateStudentInsight({
      studentId,
      teacherId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error analyzing student insight.'
    });
  }
});

router.post('/teacher/cohort-analysis', isTeacher, async (req, res) => {
  try {
    const { courseId } = req.body;

    const result = await aiService.generateCohortAnalysis({
      courseId,
      teacherId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error generating cohort analysis.'
    });
  }
});

router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A natural language query is required.'
      });
    }

    const result = await aiService.queryAcademicData({
      user: req.user,
      query: query.trim()
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error executing academic data query.'
    });
  }
});

router.post('/quiz/generate', async (req, res) => {
  try {
    const { lessonId, socraticMode } = req.body;
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'lessonId is required to generate a practice quiz.'
      });
    }

    const result = await aiService.generatePracticeQuiz({
      lessonId,
      socraticMode: socraticMode !== false
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error generating practice quiz.'
    });
  }
});

router.post('/quiz/evaluate', async (req, res) => {
  try {
    const { lessonId, answers } = req.body;
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'lessonId is required to evaluate a quiz submission.'
      });
    }

    const result = await aiService.evaluateQuizSubmission({
      lessonId,
      answers: answers || {},
      studentId: req.user.id
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error evaluating quiz submission.'
    });
  }
});

router.post('/guardian-digest', isTeacher, async (req, res) => {
  try {
    const { studentId, tone } = req.body;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required to generate a guardian digest.'
      });
    }

    const result = await aiService.generateGuardianDigest({
      studentId,
      tone: tone || 'supportive'
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error generating guardian digest.'
    });
  }
});

router.post('/predictive-health', async (req, res) => {
  try {
    const studentId = req.user.role === 'teacher' && req.body.studentId
      ? req.body.studentId
      : req.user.id;

    const result = await aiService.calculatePredictiveHealth({ studentId });
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error calculating predictive health score.'
    });
  }
});

module.exports = router;
