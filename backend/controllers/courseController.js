const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const User = require('../models/User');

// @desc    Get all courses
// @route   GET /api/courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    const enriched = [];

    for (const course of courses) {
      const lessons = await Lesson.find({ course: course._id });
      let isEnrolled = false;
      let progress = 0;

      if (req.user && req.user.role === 'student') {
        const enrollment = await Enrollment.findOne({
          student: req.user.id,
          course: course._id
        });
        if (enrollment) {
          isEnrolled = true;
          progress = enrollment.completionPercentage || 0;
        }
      }

      enriched.push({
        ...course,
        totalLessons: lessons.length,
        isEnrolled,
        completionPercentage: progress
      });
    }

    res.json({ success: true, courses: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch courses', error: err.message });
  }
};

// @desc    Get single course by ID with modules, lessons, and student progress
// @route   GET /api/courses/:id
exports.getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Get lessons sorted by order
    let lessons = await Lesson.find({ course: courseId });
    if (Array.isArray(lessons)) {
      lessons = [...lessons].sort((a, b) => (a.order || 0) - (b.order || 0));
    } else if (lessons && typeof lessons.sort === 'function') {
      lessons = await lessons.sort({ order: 1 });
    }

    // Get student progress if requested by a student
    let progressMap = {};
    let enrollment = null;

    if (req.user && req.user.role === 'student') {
      enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId });
      const progresses = await LessonProgress.find({ student: req.user.id, course: courseId });
      progresses.forEach(p => {
        progressMap[String(p.lesson)] = {
          completed: p.completed,
          watchedSeconds: p.watchedSeconds || 0,
          lastPositionSeconds: p.lastPositionSeconds || 0
        };
      });
    }

    // Group lessons by module
    const modulesMap = {};
    lessons.forEach(lesson => {
      const modName = lesson.module || 'Module 1: Getting Started';
      if (!modulesMap[modName]) {
        modulesMap[modName] = [];
      }
      const p = progressMap[String(lesson._id)] || { completed: false, watchedSeconds: 0, lastPositionSeconds: 0 };
      modulesMap[modName].push({
        ...lesson,
        isCompleted: !!p.completed,
        watchedSeconds: p.watchedSeconds,
        lastPositionSeconds: p.lastPositionSeconds
      });
    });

    const modules = Object.keys(modulesMap).map(title => ({
      title,
      lessons: modulesMap[title]
    }));

    const totalLessons = lessons.length;
    const completedLessons = Object.values(progressMap).filter(p => p.completed).length;
    const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    res.json({
      success: true,
      course: {
        ...course,
        totalLessons,
        completedLessons,
        completionPercentage: enrollment ? enrollment.completionPercentage : completionPercentage,
        modules,
        lessons: lessons.map(l => ({
          ...l,
          isCompleted: !!(progressMap[String(l._id)] && progressMap[String(l._id)].completed),
          watchedSeconds: (progressMap[String(l._id)] && progressMap[String(l._id)].watchedSeconds) || 0,
          lastPositionSeconds: (progressMap[String(l._id)] && progressMap[String(l._id)].lastPositionSeconds) || 0
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch course details', error: err.message });
  }
};

// @desc    Create course
// @route   POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    const { title, code, description, category, thumbnail, durationHours, lessons } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Course title is required' });
    }

    const newCourse = await Course.create({
      title: title.trim(),
      code: code ? code.trim() : 'CS-' + Math.floor(100 + Math.random() * 900),
      description: description || '',
      category: category || 'General Computer Science',
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
      durationHours: durationHours || 15,
      teacher: req.user.id,
      teacherName: req.user.name,
      enrolledStudents: []
    });

    // If initial lessons provided, create them
    if (Array.isArray(lessons) && lessons.length > 0) {
      for (let i = 0; i < lessons.length; i++) {
        const item = lessons[i];
        await Lesson.create({
          course: newCourse._id,
          module: item.module || 'Module 1: Introduction',
          title: item.title || `Lesson ${i + 1}`,
          description: item.description || '',
          videoUrl: item.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          duration: item.duration || 600,
          order: i + 1
        });
      }
    }

    res.status(201).json({ success: true, message: 'Course created successfully', course: newCourse });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create course', error: err.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Course updated successfully', course: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update course', error: err.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    await Course.findByIdAndDelete(courseId);
    await Lesson.deleteMany({ course: courseId });
    await Enrollment.deleteMany({ course: courseId });
    await LessonProgress.deleteMany({ course: courseId });

    res.json({ success: true, message: 'Course and related records deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete course', error: err.message });
  }
};

// @desc    Assign or enroll student to course
// @route   POST /api/courses/:id/enroll
exports.enrollStudent = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.body.studentId || req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    let existing = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!existing) {
      const lessons = await Lesson.find({ course: courseId });
      existing = await Enrollment.create({
        student: studentId,
        course: courseId,
        completionPercentage: 0,
        completedLessonsCount: 0,
        totalLessonsCount: lessons.length,
        status: 'active'
      });

      // Update enrolled students array in Course
      const enrolled = Array.isArray(course.enrolledStudents) ? course.enrolledStudents.map(String) : [];
      if (!enrolled.includes(String(studentId))) {
        enrolled.push(String(studentId));
        await Course.findByIdAndUpdate(courseId, { enrolledStudents: enrolled });
      }
    }

    res.json({ success: true, message: 'Student enrolled successfully', enrollment: existing });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to enroll student', error: err.message });
  }
};
