const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const LessonProgress = require('../models/LessonProgress');
const Warning = require('../models/Warning');
const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');
const SystemSettings = require('../models/SystemSettings');

// Sample educational video URLs that are publicly hosted and stream cleanly in HTML5 video player
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4'
];

async function seedDemoData(force = false) {
  try {
    const existingUsersCount = await User.countDocuments();
    if (existingUsersCount > 0 && !force) {
      console.log('📦 [Seed] Database already contains records. Skipping seed.');
      return;
    }

    console.log('🌱 [Seed] Seeding comprehensive demo data for EPMS...');

    // Clear existing
    if (force) {
      await User.deleteMany({});
      await Course.deleteMany({});
      await Lesson.deleteMany({});
      await Enrollment.deleteMany({});
      await Attendance.deleteMany({});
      await LessonProgress.deleteMany({});
      await Warning.deleteMany({});
      await Notification.deleteMany({});
      await Announcement.deleteMany({});
      await SystemSettings.deleteMany({});
    }

    // Default System Settings
    await SystemSettings.create({
      attendanceThreshold: 75,
      completionThreshold: 40,
      inactivityDaysThreshold: 7,
      institutionName: 'Apex Institute of Technology & Computing'
    });

    const defaultPassword = await bcrypt.hash('Password123!', 10);

    // 1. Create Teacher
    const teacher = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'teacher@epms.edu',
      identifier: 'TCH-1001',
      password: defaultPassword,
      role: 'teacher',
      department: 'Computer Science & Engineering',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      phone: '+1 (555) 349-2810',
      lastActive: new Date().toISOString()
    });

    // 2. Create 10 Students
    const studentProfiles = [
      { name: 'Alex Rivera', email: 'student1@epms.edu', id: 'STU-2001', dept: 'Computer Science', inactiveDays: 0, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
      { name: 'Priya Sharma', email: 'student2@epms.edu', id: 'STU-2002', dept: 'Software Engineering', inactiveDays: 0, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80' },
      { name: 'Liam Chen', email: 'student3@epms.edu', id: 'STU-2003', dept: 'Data Science', inactiveDays: 1, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
      { name: 'Emma Watson', email: 'student4@epms.edu', id: 'STU-2004', dept: 'Computer Science', inactiveDays: 2, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80' },
      { name: 'Marcus Johnson', email: 'student5@epms.edu', id: 'STU-2005', dept: 'Information Technology', inactiveDays: 4, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
      { name: 'Sophia Taylor', email: 'student6@epms.edu', id: 'STU-2006', dept: 'Software Engineering', inactiveDays: 5, avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80' },
      { name: 'Daniel Martinez', email: 'student7@epms.edu', id: 'STU-2007', dept: 'Computer Science', inactiveDays: 9, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80' },
      { name: 'Olivia Brown', email: 'student8@epms.edu', id: 'STU-2008', dept: 'Data Science', inactiveDays: 12, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80' },
      { name: 'Noah Wilson', email: 'student9@epms.edu', id: 'STU-2009', dept: 'Information Technology', inactiveDays: 8, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80' },
      { name: 'Ava Davis', email: 'student10@epms.edu', id: 'STU-2010', dept: 'Computer Science', inactiveDays: 3, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80' },
    ];

    const studentUsers = [];
    const now = Date.now();

    for (const p of studentProfiles) {
      const lastActiveTime = new Date(now - (p.inactiveDays * 24 * 60 * 60 * 1000)).toISOString();
      const student = await User.create({
        name: p.name,
        email: p.email,
        identifier: p.id,
        password: defaultPassword,
        role: 'student',
        department: p.dept,
        avatar: p.avatar,
        phone: '+1 (555) ' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000),
        lastActive: lastActiveTime
      });
      studentUsers.push({ doc: student, profile: p });
    }

    // 3. Create 3 Courses
    const courseData = [
      {
        title: 'Introduction to Computer Science & Python',
        code: 'CS-101',
        category: 'Programming & Foundations',
        description: 'Comprehensive introduction to algorithmic thinking, computational problem solving, Python syntax, modular programming, and data structures.',
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        durationHours: 24,
        modules: [
          {
            module: 'Module 1: Foundations & Python Syntax',
            lessons: [
              { title: '1. Welcome & Computational Thinking', desc: 'Understanding algorithms, problem decomposition, and environment setup.', duration: 540 },
              { title: '2. Variables, Expressions & Data Types', desc: 'Mastering numbers, strings, booleans, and dynamic type inference.', duration: 620 },
              { title: '3. Conditional Logic & Branching', desc: 'If, else-if structures, nested conditions, and logical operators.', duration: 710 }
            ]
          },
          {
            module: 'Module 2: Iteration & Functions',
            lessons: [
              { title: '4. While & For Loops in Python', desc: 'Loop invariants, break/continue statements, and range generators.', duration: 680 },
              { title: '5. Writing Modular Functions', desc: 'Parameters, default arguments, return values, and scope.', duration: 750 },
              { title: '6. Lists, Tuples & Dictionaries', desc: 'Complex collections, key-value lookups, and iteration patterns.', duration: 840 }
            ]
          }
        ]
      },
      {
        title: 'Full-Stack Web Development with React & Node.js',
        code: 'CS-202',
        category: 'Web Engineering',
        description: 'Build production-ready modern web applications using React, Vite, Tailwind CSS, Express REST APIs, JWT authentication, and MongoDB.',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
        durationHours: 32,
        modules: [
          {
            module: 'Module 1: Modern Frontend with React',
            lessons: [
              { title: '1. Modern Web Architecture & Vite', desc: 'Client-server model, Single Page Applications, and bundle tooling.', duration: 600 },
              { title: '2. React Components, Props & JSX', desc: 'Component composition, props validation, and virtual DOM diffing.', duration: 780 },
              { title: '3. State Management & Hooks (useState, useEffect)', desc: 'Managing reactive local state, lifecycle side-effects, and dependencies.', duration: 890 }
            ]
          },
          {
            module: 'Module 2: Backend REST APIs & Persistence',
            lessons: [
              { title: '4. Express.js Routing & Middleware', desc: 'Building clean RESTful endpoints, request parsing, and error middleware.', duration: 720 },
              { title: '5. JWT Authentication & Password Hashing', desc: 'Implementing stateless security tokens, bcrypt, and role guards.', duration: 920 },
              { title: '6. MongoDB Schemas & Aggregations', desc: 'Modeling relational document data with Mongoose, indexes, and queries.', duration: 810 }
            ]
          }
        ]
      },
      {
        title: 'Data Structures, Algorithms & Problem Solving',
        code: 'CS-303',
        category: 'Computer Science Core',
        description: 'In-depth study of abstract data types, asymptotic analysis (Big O), trees, graphs, dynamic programming, and greedy algorithms.',
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
        durationHours: 28,
        modules: [
          {
            module: 'Module 1: Analysis & Linear Structures',
            lessons: [
              { title: '1. Asymptotic Notation & Big-O Complexity', desc: 'Time and space complexity proofs, best/worst/average case bounds.', duration: 650 },
              { title: '2. Linked Lists & Doubly Linked Chains', desc: 'Pointer manipulation, node deletion, insertion, and reversal.', duration: 740 },
              { title: '3. Stacks, Queues & Deques', desc: 'LIFO and FIFO implementations with array and linked buffers.', duration: 680 }
            ]
          },
          {
            module: 'Module 2: Trees, Graphs & Dynamic Programming',
            lessons: [
              { title: '4. Binary Search Trees & Balanced Trees', desc: 'In-order traversal, tree rotations, AVL balance properties.', duration: 820 },
              { title: '5. Graph Traversals: BFS and DFS', desc: 'Adjacency lists, shortest paths in unweighted graphs, cycle detection.', duration: 900 },
              { title: '6. Dynamic Programming Fundamentals', desc: 'Optimal substructure, overlapping subproblems, memoization vs tabulation.', duration: 960 }
            ]
          }
        ]
      }
    ];

    const createdCourses = [];
    let videoIndex = 0;

    for (const c of courseData) {
      const course = await Course.create({
        title: c.title,
        code: c.code,
        category: c.category,
        description: c.description,
        thumbnail: c.thumbnail,
        durationHours: c.durationHours,
        teacher: teacher._id,
        teacherName: teacher.name,
        enrolledStudents: studentUsers.map(s => s.doc._id)
      });

      const courseLessons = [];
      let order = 1;

      for (const mod of c.modules) {
        for (const les of mod.lessons) {
          const videoUrl = SAMPLE_VIDEOS[videoIndex % SAMPLE_VIDEOS.length];
          videoIndex++;

          const createdLesson = await Lesson.create({
            course: course._id,
            module: mod.module,
            title: les.title,
            description: les.desc,
            videoUrl,
            duration: les.duration,
            order: order++,
            resources: [
              { title: 'Lecture Notes (PDF)', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
              { title: 'Code Starter Repository', url: 'https://github.com' }
            ]
          });
          courseLessons.push(createdLesson);
        }
      }

      createdCourses.push({ doc: course, lessons: courseLessons });
    }

    // 4. Enroll all students and generate differentiated lesson progress
    // Target completion rates:
    // Students 1-4: 75% - 100% (High Achievers)
    // Students 5-6, 10: 45% - 60% (Moderate)
    // Students 7-9: 15% - 35% (At Risk!)
    const completionProfiles = [
      0.90, // STU-2001 (Alex) - 90%
      1.00, // STU-2002 (Priya) - 100%
      0.80, // STU-2003 (Liam) - 80%
      0.75, // STU-2004 (Emma) - 75%
      0.55, // STU-2005 (Marcus) - 55%
      0.45, // STU-2006 (Sophia) - 45%
      0.20, // STU-2007 (Daniel) - 20% (At Risk)
      0.25, // STU-2008 (Olivia) - 25% (At Risk)
      0.30, // STU-2009 (Noah) - 30% (At Risk)
      0.50  // STU-2010 (Ava) - 50%
    ];

    for (let sIdx = 0; sIdx < studentUsers.length; sIdx++) {
      const student = studentUsers[sIdx].doc;
      const targetRate = completionProfiles[sIdx];

      for (const courseObj of createdCourses) {
        const lessons = courseObj.lessons;
        const totalLessons = lessons.length;
        const completedCount = Math.round(totalLessons * targetRate);
        const actualPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        await Enrollment.create({
          student: student._id,
          course: courseObj.doc._id,
          status: actualPercentage >= 100 ? 'completed' : 'active',
          completionPercentage: actualPercentage,
          completedLessonsCount: completedCount,
          totalLessonsCount: totalLessons,
          lastAccessed: student.lastActive
        });

        // Create individual LessonProgress records
        for (let lIdx = 0; lIdx < totalLessons; lIdx++) {
          const lesson = lessons[lIdx];
          const isCompleted = lIdx < completedCount;

          await LessonProgress.create({
            student: student._id,
            course: courseObj.doc._id,
            lesson: lesson._id,
            completed: isCompleted,
            completedAt: isCompleted ? new Date(now - ((totalLessons - lIdx) * 2 * 24 * 60 * 60 * 1000)).toISOString() : null,
            watchedSeconds: isCompleted ? lesson.duration : (lIdx === completedCount ? Math.floor(lesson.duration * 0.4) : 0),
            lastPositionSeconds: isCompleted ? lesson.duration : (lIdx === completedCount ? Math.floor(lesson.duration * 0.4) : 0),
            watchPercentage: isCompleted ? 100 : (lIdx === completedCount ? 40 : 0)
          });
        }
      }
    }

    // 5. Generate Attendance Records across past 20 business days
    // Differentiate attendance rates:
    // Students 1-4: ~95% Present
    // Students 5,6,10: ~78-82% Present
    // Students 7-9: ~50-65% Present (At Risk!)
    const attendanceProbabilities = [
      0.95, // STU-2001
      1.00, // STU-2002
      0.90, // STU-2003
      0.90, // STU-2004
      0.78, // STU-2005
      0.76, // STU-2006
      0.55, // STU-2007 (At Risk)
      0.60, // STU-2008 (At Risk)
      0.50, // STU-2009 (At Risk)
      0.80  // STU-2010
    ];

    const dates = [];
    const today = new Date();
    let daysBack = 1;
    while (dates.length < 20) {
      const d = new Date(today);
      d.setDate(today.getDate() - daysBack);
      daysBack++;
      // Skip weekends
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        dates.push(d.toISOString().split('T')[0]);
      }
    }
    dates.reverse(); // chronological order

    for (const courseObj of createdCourses) {
      for (const dateStr of dates) {
        for (let sIdx = 0; sIdx < studentUsers.length; sIdx++) {
          const student = studentUsers[sIdx].doc;
          const prob = attendanceProbabilities[sIdx];
          const rand = Math.random();

          let status = 'present';
          let remarks = '';

          if (rand > prob) {
            if (rand > prob + 0.05) {
              status = 'absent';
              remarks = 'Unexcused absence';
            } else {
              status = 'leave';
              remarks = 'Approved medical leave';
            }
          }

          await Attendance.create({
            course: courseObj.doc._id,
            student: student._id,
            date: dateStr,
            status,
            remarks,
            markedBy: teacher._id
          });
        }
      }
    }

    // 6. Warnings for At-Risk and Needs-Attention Students
    const atRiskStudents = [
      { student: studentUsers[6].doc, category: 'Low Attendance', priority: 'High', msg: 'Your attendance is currently 55%, which is well below the mandatory 75% threshold. Please schedule an office hour meeting immediately.' },
      { student: studentUsers[7].doc, category: 'Low Course Completion', priority: 'High', msg: 'You have only completed 25% of coursework for CS-101 and CS-202. Immediate catch-up is required to maintain passing standing.' },
      { student: studentUsers[8].doc, category: 'Inactive Student', priority: 'High', msg: 'No learning activity has been logged on your account for over 8 consecutive days. Please resume your video lectures.' },
      { student: studentUsers[4].doc, category: 'Missing Lessons', priority: 'Medium', msg: 'You missed completing Module 2 lessons in React & Node.js. Review the recorded videos before the next quiz.' },
      { student: studentUsers[5].doc, category: 'Low Attendance', priority: 'Medium', msg: 'Your attendance has dropped to 76%. One additional absence will place you in academic probation status.' }
    ];

    for (const w of atRiskStudents) {
      const warning = await Warning.create({
        student: w.student._id,
        teacher: teacher._id,
        course: createdCourses[0].doc._id,
        category: w.category,
        priority: w.priority,
        message: w.msg,
        status: 'active'
      });

      await Notification.create({
        recipient: w.student._id,
        sender: teacher._id,
        title: `⚠️ Academic Warning: ${w.category}`,
        message: `Instructor ${teacher.name} issued a ${w.priority} priority alert: "${w.msg}"`,
        type: 'warning',
        link: '/student/notifications',
        metadata: { warningId: warning._id, priority: w.priority, category: w.category }
      });
    }

    // 7. General Notifications & Announcements
    await Announcement.create({
      title: 'Midterm Examination Schedule & Format',
      content: 'The Midterm Practical Evaluation for CS-101 and CS-202 will take place on November 20th. Ensure all video lessons through Module 2 are completed before the exam.',
      teacher: teacher._id,
      priority: 'important'
    });

    await Announcement.create({
      title: 'Weekly Office Hours with Dr. Sarah Jenkins',
      content: 'Office hours are conducted every Tuesday & Thursday from 3:00 PM to 5:00 PM in CS Building Hall B or via virtual link.',
      teacher: teacher._id,
      priority: 'normal'
    });

    for (const s of studentUsers) {
      await Notification.create({
        recipient: s.doc._id,
        sender: teacher._id,
        title: '📢 New Course Announcement',
        message: 'Midterm Examination Schedule & Format has been published. Please review the syllabus.',
        type: 'announcement',
        link: '/student/dashboard'
      });

      await Notification.create({
        recipient: s.doc._id,
        title: '🎓 Welcome to EPMS Portal',
        message: 'Your courses have been assigned. Track your video lessons, attendance, and progress in real time.',
        type: 'system',
        link: '/student/dashboard'
      });
    }

    console.log('✅ [Seed] Demo data seeding completed successfully!');
    console.log('📋 Demo Accounts Created:');
    console.log('  👨‍🏫 Teacher: teacher@epms.edu / Password123! (ID: TCH-1001)');
    console.log('  👨‍🎓 Students: student1@epms.edu to student10@epms.edu / Password123!');
  } catch (err) {
    console.error('❌ [Seed] Error seeding data:', err);
  }
}

if (require.main === module) {
  seedDemoData(true).then(() => process.exit(0));
}

module.exports = seedDemoData;
