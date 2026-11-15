const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const Notification = require('../models/Notification');

// @desc    Get single lesson details with student watch progress
// @route   GET /api/lessons/:id
exports.getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    let progress = null;
    if (req.user && req.user.role === 'student') {
      progress = await LessonProgress.findOne({
        student: req.user.id,
        lesson: lesson._id
      });
    }

    // Get adjacent lessons in the same course
    let allCourseLessons = await Lesson.find({ course: lesson.course });
    if (Array.isArray(allCourseLessons)) {
      allCourseLessons = [...allCourseLessons].sort((a, b) => (a.order || 0) - (b.order || 0));
    } else if (allCourseLessons && typeof allCourseLessons.sort === 'function') {
      allCourseLessons = await allCourseLessons.sort({ order: 1 });
    }

    const currentIndex = allCourseLessons.findIndex(l => String(l._id) === String(lesson._id));
    const previousLesson = currentIndex > 0 ? allCourseLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allCourseLessons.length - 1 ? allCourseLessons[currentIndex + 1] : null;

    res.json({
      success: true,
      lesson,
      progress: progress || {
        completed: false,
        watchedSeconds: 0,
        lastPositionSeconds: 0
      },
      navigation: {
        currentIndex: currentIndex + 1,
        totalLessons: allCourseLessons.length,
        previousLessonId: previousLesson ? previousLesson._id : null,
        nextLessonId: nextLesson ? nextLesson._id : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch lesson', error: err.message });
  }
};

// @desc    Update watch time & last position for student (without completing)
// @route   POST /api/lessons/:id/heartbeat
exports.updateWatchProgress = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const studentId = req.user.id;
    const { watchedSeconds, lastPositionSeconds } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const safeWatched = Math.max(0, Number(watchedSeconds) || 0);
    const safeLastPos = Math.max(0, Number(lastPositionSeconds) || 0);

    let progress = await LessonProgress.findOne({ student: studentId, lesson: lessonId });
    if (!progress) {
      progress = await LessonProgress.create({
        student: studentId,
        course: lesson.course,
        lesson: lessonId,
        completed: false,
        watchedSeconds: safeWatched,
        lastPositionSeconds: safeLastPos,
        watchPercentage: lesson.duration > 0 ? Math.min(100, Math.round((safeWatched / lesson.duration) * 100)) : 0
      });
    } else {
      const updatedWatched = Math.max(progress.watchedSeconds || 0, safeWatched);
      progress = await LessonProgress.findByIdAndUpdate(
        progress._id,
        {
          watchedSeconds: updatedWatched,
          lastPositionSeconds: safeLastPos,
          watchPercentage: lesson.duration > 0 ? Math.min(100, Math.round((updatedWatched / lesson.duration) * 100)) : 0
        },
        { new: true }
      );
    }

    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update watch progress', error: err.message });
  }
};

// @desc    Mark lesson as completed and recalculate course progress
// @route   POST /api/lessons/:id/complete
exports.markLessonCompleted = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const studentId = req.user.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const courseId = lesson.course;

    // 1. Update or create LessonProgress
    let progress = await LessonProgress.findOne({ student: studentId, lesson: lessonId });
    if (!progress) {
      progress = await LessonProgress.create({
        student: studentId,
        course: courseId,
        lesson: lessonId,
        completed: true,
        completedAt: new Date().toISOString(),
        watchedSeconds: lesson.duration || 600,
        lastPositionSeconds: lesson.duration || 600,
        watchPercentage: 100
      });
    } else {
      progress = await LessonProgress.findByIdAndUpdate(
        progress._id,
        {
          completed: true,
          completedAt: new Date().toISOString(),
          watchPercentage: 100
        },
        { new: true }
      );
    }

    // 2. Count total lessons in course
    const totalLessons = await Lesson.countDocuments({ course: courseId });

    // 3. Count completed lessons for this student in this course
    const allProgresses = await LessonProgress.find({
      student: studentId,
      course: courseId,
      completed: true
    });
    const completedLessonsCount = allProgresses.length;

    // 4. Formula: (Completed Lessons / Total Lessons) * 100
    const completionPercentage = totalLessons > 0
      ? Math.min(100, Math.round((completedLessonsCount / totalLessons) * 100))
      : 0;

    // 5. Update Enrollment
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (enrollment) {
      const isNowCompleted = completionPercentage >= 100;
      await Enrollment.findByIdAndUpdate(enrollment._id, {
        completionPercentage,
        completedLessonsCount,
        totalLessonsCount: totalLessons,
        status: isNowCompleted ? 'completed' : 'active',
        lastAccessed: new Date().toISOString()
      });

      // Send a congratulatory notification if course just reached 100%
      if (isNowCompleted && enrollment.status !== 'completed') {
        const course = await Course.findById(courseId);
        await Notification.create({
          recipient: studentId,
          title: '🎉 Course Completed!',
          message: `Congratulations! You have completed 100% of the lessons in ${course ? course.title : 'the course'}.`,
          type: 'course',
          link: `/student/courses/${courseId}`
        });
      }
    }

    res.json({
      success: true,
      message: 'Lesson marked as completed.',
      progress,
      stats: {
        completedLessonsCount,
        totalLessons,
        completionPercentage
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark lesson completed', error: err.message });
  }
};

// @desc    Create a lesson (Teacher)
// @route   POST /api/lessons
exports.createLesson = async (req, res) => {
  try {
    const { courseId, module, title, description, videoUrl, duration, order, resources } = req.body;
    if (!courseId || !title || !videoUrl) {
      return res.status(400).json({ success: false, message: 'Course ID, title, and video URL are required.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const existingLessons = await Lesson.find({ course: courseId });
    const lessonOrder = order || existingLessons.length + 1;

    const newLesson = await Lesson.create({
      course: courseId,
      module: module || 'General',
      title: title.trim(),
      description: description || '',
      videoUrl: videoUrl.trim(),
      duration: Number(duration) || 600,
      order: lessonOrder,
      resources: resources || []
    });

    // Notify enrolled students about the new lesson
    const enrollments = await Enrollment.find({ course: courseId });
    for (const enr of enrollments) {
      await Notification.create({
        recipient: enr.student,
        title: '📖 New Lesson Added',
        message: `A new lesson "${title}" has been added to ${course.title}.`,
        type: 'course',
        link: `/student/courses/${courseId}/learn/${newLesson._id}`
      });
      // update total lesson count in enrollment
      await Enrollment.findByIdAndUpdate(enr._id, {
        totalLessonsCount: existingLessons.length + 1
      });
    }

    res.status(201).json({ success: true, message: 'Lesson created successfully', lesson: newLesson });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create lesson', error: err.message });
  }
};

// @desc    Update lesson
// @route   PUT /api/lessons/:id
exports.updateLesson = async (req, res) => {
  try {
    const updated = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }
    res.json({ success: true, message: 'Lesson updated successfully', lesson: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update lesson', error: err.message });
  }
};

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
exports.deleteLesson = async (req, res) => {
  try {
    const lessonId = req.params.id;
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    await Lesson.findByIdAndDelete(lessonId);
    await LessonProgress.deleteMany({ lesson: lessonId });

    // Recalculate course enrollments
    const remainingLessonsCount = await Lesson.countDocuments({ course: lesson.course });
    const enrollments = await Enrollment.find({ course: lesson.course });

    for (const enr of enrollments) {
      const studentCompleted = await LessonProgress.countDocuments({
        student: enr.student,
        course: lesson.course,
        completed: true
      });
      const pct = remainingLessonsCount > 0 ? Math.round((studentCompleted / remainingLessonsCount) * 100) : 0;
      await Enrollment.findByIdAndUpdate(enr._id, {
        totalLessonsCount: remainingLessonsCount,
        completedLessonsCount: studentCompleted,
        completionPercentage: pct
      });
    }

    res.json({ success: true, message: 'Lesson deleted and course progress updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete lesson', error: err.message });
  }
};
