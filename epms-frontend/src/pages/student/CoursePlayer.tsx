import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseApi, lessonApi } from '../../api/courseApi';
import { Course, Lesson } from '../../types';
import {
  PlayCircle,
  CheckCircle2,
  Circle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Check,
  FileText,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CoursePlayer: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonProgress, setLessonProgress] = useState<{
    completed: boolean;
    watchedSeconds: number;
    lastPositionSeconds: number;
  }>({ completed: false, watchedSeconds: 0, lastPositionSeconds: 0 });
  const [navigation, setNavigation] = useState<{
    previousLessonId: string | null;
    nextLessonId: string | null;
    currentIndex: number;
    totalLessons: number;
  }>({ previousLessonId: null, nextLessonId: null, currentIndex: 1, totalLessons: 1 });

  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const navigate = useNavigate();

  // Load course details
  const loadCourse = async () => {
    if (!courseId) return;
    try {
      const c = await courseApi.getCourseById(courseId);
      setCourse(c);
      return c;
    } catch (err) {
      toast.error('Failed to load course details.');
      return null;
    }
  };

  // Load active lesson
  const loadLesson = async (lId: string) => {
    try {
      const res = await lessonApi.getLesson(lId);
      setCurrentLesson(res.lesson);
      setLessonProgress(res.progress);
      setNavigation(res.navigation);

      // Resume position if available
      if (videoRef.current && res.progress.lastPositionSeconds > 0 && !res.progress.completed) {
        videoRef.current.currentTime = res.progress.lastPositionSeconds;
      }
    } catch (err) {
      toast.error('Failed to load lesson.');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const c = await loadCourse();
      if (c && c.lessons && c.lessons.length > 0) {
        const targetLessonId = lessonId || c.lessons[0]._id;
        await loadLesson(targetLessonId);
      }
      setLoading(false);
    };
    init();
  }, [courseId, lessonId]);

  // Video heartbeat tracker: updates watch time periodically
  useEffect(() => {
    if (!currentLesson) return;

    const interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const currentSeconds = Math.floor(videoRef.current.currentTime);
        lessonApi.sendHeartbeat(currentLesson._id, {
          watchedSeconds: currentSeconds,
          lastPositionSeconds: currentSeconds
        }).catch(() => {});
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentLesson]);

  // Handle Mark as Completed
  const handleMarkCompleted = async () => {
    if (!currentLesson) return;
    setCompleting(true);
    try {
      const res = await lessonApi.markCompleted(currentLesson._id);
      toast.success('🎉 Lesson marked as completed!');
      setLessonProgress(prev => ({ ...prev, completed: true }));

      // Reload course to update completion % and checkmarks
      await loadCourse();

      // If there's a next lesson, prompt or navigate
      if (navigation.nextLessonId) {
        navigate(`/student/courses/${courseId}/learn/${navigation.nextLessonId}`);
      }
    } catch (err) {
      toast.error('Failed to update lesson completion status.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Launching Educational Player...</p>
        </div>
      </div>
    );
  }

  const completedLessonsCount = course?.completedLessons || 0;
  const totalLessonsCount = course?.totalLessons || 1;
  const completionPct = course?.completionPercentage || 0;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
        <button
          onClick={() => navigate('/student/courses')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </button>

        <div className="flex items-center gap-4">
          {/* Progress Pill */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:inline">Course Progress:</span>
            <div className="w-24 sm:w-32 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              ></div>
            </div>
            <span className="text-blue-600 dark:text-blue-400 font-bold">{completionPct}%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Video + Controls on Left (8 cols), Playlist on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Video Player Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative aspect-video flex items-center justify-center border border-slate-800">
            {currentLesson?.videoUrl ? (
              <video
                key={currentLesson._id}
                ref={videoRef}
                controls
                controlsList="nodownload"
                className="w-full h-full object-contain"
                src={currentLesson.videoUrl}
                onEnded={handleMarkCompleted}
                onLoadedMetadata={(e) => {
                  if (lessonProgress.lastPositionSeconds > 0 && !lessonProgress.completed) {
                    e.currentTarget.currentTime = lessonProgress.lastPositionSeconds;
                  }
                }}
              >
                Your browser does not support HTML5 video streaming.
              </video>
            ) : (
              <p className="text-xs text-slate-400">No video stream linked to this lesson.</p>
            )}
          </div>

          {/* Lesson Action Header */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {currentLesson?.module || 'Module Lesson'} • Lesson {navigation.currentIndex} of {navigation.totalLessons}
                </span>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {currentLesson?.title}
                </h1>
              </div>

              {/* Mark Complete Button */}
              <div>
                {lessonProgress.completed ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Lesson Completed</span>
                  </span>
                ) : (
                  <button
                    onClick={handleMarkCompleted}
                    disabled={completing}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-glow-purple transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{completing ? 'Updating...' : 'Mark as Completed'}</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentLesson?.description || 'No additional lesson notes provided.'}
            </p>

            {/* Previous and Next Lesson Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={!navigation.previousLessonId}
                onClick={() => navigation.previousLessonId && navigate(`/student/courses/${courseId}/learn/${navigation.previousLessonId}`)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-slate-200 dark:border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Lesson</span>
              </button>

              <button
                disabled={!navigation.nextLessonId}
                onClick={() => navigation.nextLessonId && navigate(`/student/courses/${courseId}/learn/${navigation.nextLessonId}`)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
              >
                <span>Next Lesson</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Playlist & Modules Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Course Playlist
                </h2>
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 font-mono">
                  {completedLessonsCount}/{totalLessonsCount} Completed
                </span>
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {course?.modules && course.modules.length > 0 ? (
                course.modules.map((mod, mIdx) => (
                  <div key={mIdx} className="py-2">
                    <p className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
                      {mod.title}
                    </p>
                    <div className="space-y-0.5 mt-1">
                      {mod.lessons.map((les) => {
                        const isCurrent = currentLesson?._id === les._id;
                        return (
                          <div
                            key={les._id}
                            onClick={() => navigate(`/student/courses/${courseId}/learn/${les._id}`)}
                            className={`px-4 py-3 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                              isCurrent
                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold border-l-4 border-purple-600'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              {les.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                              )}
                              <span className="truncate">{les.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {Math.round((les.duration || 600) / 60)}m
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No lessons found in this course.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
