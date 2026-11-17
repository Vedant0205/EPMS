import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { courseApi, lessonApi } from '../../api/courseApi';
import api from '../../api/axiosConfig';
import { Course, Lesson } from '../../types';
import { AccessibleVideoPlayer, parseVideoUrl } from '../../components/common/AccessibleVideoPlayer';
import {
  BookOpen,
  Plus,
  Trash2,
  PlayCircle,
  Video,
  Layers,
  Sparkles,
  ExternalLink,
  Clock,
  Tag,
  X,
  Eye,
  Upload,
  Link as LinkIcon,
  Film,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

export const CourseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Course Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80');
  const [durationHours, setDurationHours] = useState(20);

  // Lesson Creation inside course modal
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<string>('');
  const [lessonModule, setLessonModule] = useState('Module 1: Foundations');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');
  const [videoUrl, setVideoUrl] = useState('https://youtu.be/5LeZflr8Zfs');
  const [lessonDuration, setLessonDuration] = useState(600);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // View Syllabus & Lessons Modal
  const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [loadingCourseDetails, setLoadingCourseDetails] = useState(false);

  // Quick Video Preview Modal
  const [previewVideo, setPreviewVideo] = useState<{ title: string; videoUrl: string } | null>(null);

  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    try {
      const list = await courseApi.getCourses();
      setCourses(list);
    } catch (err) {
      toast.error('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setSaving(true);
    try {
      await courseApi.createCourse({
        title,
        code: code || 'CS-' + Math.floor(100 + Math.random() * 900),
        category,
        description,
        thumbnail,
        durationHours: Number(durationHours)
      });
      toast.success('Course created successfully!');
      setCreateModalOpen(false);
      setTitle('');
      setCode('');
      setDescription('');
      fetchCourses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create course.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete course "${name}" and all its lessons?`)) return;
    try {
      await courseApi.deleteCourse(id);
      toast.success('Course deleted.');
      fetchCourses();
    } catch (err) {
      toast.error('Failed to delete course.');
    }
  };

  const handleOpenSyllabus = async (courseId: string) => {
    setLoadingCourseDetails(true);
    setSyllabusModalOpen(true);
    try {
      const c = await courseApi.getCourseById(courseId);
      setViewingCourse(c);
    } catch (err) {
      toast.error('Failed to load course syllabus.');
      setSyllabusModalOpen(false);
    } finally {
      setLoadingCourseDetails(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string, lTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete lesson "${lTitle}"?`)) return;
    try {
      await lessonApi.deleteLesson(lessonId);
      toast.success('Lesson deleted successfully.');
      if (viewingCourse) {
        handleOpenSyllabus(viewingCourse._id);
      }
      fetchCourses();
    } catch (err) {
      toast.error('Failed to delete lesson.');
    }
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    setUploadingVideo(true);
    try {
      const res = await api.post('/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.url) {
        setVideoUrl(res.data.url);
        toast.success('Video uploaded successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Video upload failed.');
    } finally {
      setUploadingVideo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourseId || !lessonTitle || !videoUrl) return;

    setSaving(true);
    try {
      await lessonApi.createLesson({
        courseId: activeCourseId,
        module: lessonModule,
        title: lessonTitle,
        description: lessonDesc,
        videoUrl,
        duration: Number(lessonDuration)
      });
      toast.success('New lesson and video added to course!');
      setLessonModalOpen(false);
      setLessonTitle('');
      setLessonDesc('');
      fetchCourses();
      if (syllabusModalOpen && viewingCourse && viewingCourse._id === activeCourseId) {
        handleOpenSyllabus(activeCourseId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add lesson.');
    } finally {
      setSaving(false);
    }
  };

  const parsedActiveUrl = parseVideoUrl(videoUrl);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-purple-950 p-6 sm:p-8 text-white border border-purple-500/20 shadow-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Curriculum Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Course Catalog & Video Lessons
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Author and publish courses, stream educational video modules (YouTube, Direct MP4, Vimeo, Google Drive), and verify learning accessibility.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all shrink-0 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 text-cyan-300" />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c, index) => (
          <motion.div
            key={c._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between group hover:border-purple-500/40 transition-all"
          >
            {/* Header thumbnail */}
            <div className="h-44 relative bg-navy-900 overflow-hidden">
              <img
                src={c.thumbnail}
                alt={c.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-black/30" />
              <div className="absolute top-3 left-3 bg-navy-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-cyan-300 border border-white/10 uppercase tracking-wider font-mono">
                {c.code}
              </div>
              <div className="absolute top-3 right-3 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-purple-600 dark:text-purple-300 border border-purple-500/20">
                {c.totalLessons} Lessons
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-[11px] text-white/90">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{c.durationHours || 20} Hours Total Content</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  {c.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-navy-700/60 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenSyllabus(c._id)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-navy-700 transition-all flex items-center justify-center gap-1.5"
                    title="View all lessons and videos in this course"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    <span>View Lessons</span>
                  </button>

                  <button
                    onClick={() => navigate(`/teacher/courses/${c._id}/preview`)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    title="Launch student course video player preview"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Test Player</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-navy-800/60">
                  <button
                    onClick={() => {
                      setActiveCourseId(c._id);
                      setLessonModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Lesson</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCourse(c._id, c.title)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View Syllabus & Lessons Modal */}
      <AnimatePresence>
        {syllabusModalOpen && (
          <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-navy-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-navy-700 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-700 p-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    <span>Course Lessons & Video Stream Catalog</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {viewingCourse?.title} ({viewingCourse?.code})
                  </p>
                </div>
                <button
                  onClick={() => setSyllabusModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                {loadingCourseDetails ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Loading course curriculum...</p>
                  </div>
                ) : viewingCourse?.lessons && viewingCourse.lessons.length > 0 ? (
                  <div className="space-y-3">
                    {viewingCourse.lessons.map((les, lIdx) => {
                      const vInfo = parseVideoUrl(les.videoUrl);
                      return (
                        <div
                          key={les._id || lIdx}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/80 dark:border-navy-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider font-mono">
                                #{lIdx + 1}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                                {les.module || 'General'}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                                {vInfo.providerName}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {les.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate max-w-md font-mono">
                              {les.videoUrl}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setPreviewVideo({ title: les.title, videoUrl: les.videoUrl })}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition-all shadow-sm"
                              title="Preview video playback"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Preview Video</span>
                            </button>

                            <button
                              onClick={() => handleDeleteLesson(les._id, les.title)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Delete Lesson"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                    <Video className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
                    <p>No lessons currently added to this course.</p>
                  </div>
                )}
              </div>

                <div className="p-4 border-t border-slate-100 dark:border-navy-700 bg-slate-50/50 dark:bg-navy-900/40 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (viewingCourse) {
                      setActiveCourseId(viewingCourse._id);
                      setLessonModalOpen(true);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Lesson</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (viewingCourse) {
                        setSyllabusModalOpen(false);
                        navigate(`/teacher/courses/${viewingCourse._id}/preview`);
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-navy-700 hover:bg-slate-300 dark:hover:bg-navy-600 text-slate-800 dark:text-slate-100 transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Launch Full Player Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSyllabusModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Video Preview Modal */}
      <AnimatePresence>
        {previewVideo && (
          <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-black rounded-3xl max-w-3xl w-full border border-slate-800 shadow-2xl overflow-hidden"
            >
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-white truncate max-w-md">
                    Video Stream Preview: {previewVideo.title}
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewVideo(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4">
                <AccessibleVideoPlayer
                  videoUrl={previewVideo.videoUrl}
                  title={previewVideo.title}
                  autoPlay={true}
                />
              </div>

              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] font-mono truncate max-w-sm">
                  {previewVideo.videoUrl}
                </span>
                <button
                  onClick={() => setPreviewVideo(null)}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs"
                >
                  Done Previewing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Course Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-navy-800 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-700 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span>Create New Academic Course</span>
                </h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Distributed Systems & Microservices"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Course Code
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. CS-404"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Software Engineering"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Thumbnail Image URL
                  </label>
                  <input
                    type="url"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description & Learning Objectives
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Outline syllabus, prerequisites, and learning goals..."
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-navy-700">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-purple-500/25 disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Course'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Lesson Modal with Live Video Detection & Preview */}
      <AnimatePresence>
        {lessonModalOpen && (
          <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-navy-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-navy-700 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-700 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                    <Video className="w-4 h-4" />
                  </div>
                  <span>Add Educational Video Lesson</span>
                </h3>
                <button
                  onClick={() => setLessonModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateLesson} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Module Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonModule}
                    onChange={(e) => setLessonModule(e.target.value)}
                    placeholder="e.g. Module 1: System Design Principles"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="e.g. High Availability and Load Balancing"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                  />
                </div>

                {/* Video URL Input & Upload Option */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-purple-500" />
                      <span>Video Stream URL or Educational Link</span>
                    </label>

                    {/* Hidden file input for uploading MP4/WebM */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="video/mp4,video/webm,video/mkv,video/mov"
                      onChange={handleVideoFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={uploadingVideo}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadingVideo ? 'Uploading...' : 'Upload Video File'}</span>
                    </button>
                  </div>

                  <input
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtu.be/... or https://...mp4"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono text-[11px]"
                  />

                  {/* Sample Video Quick Presets */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold">Test Presets:</span>
                    <button
                      type="button"
                      onClick={() => setVideoUrl('https://youtu.be/5LeZflr8Zfs')}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      YouTube Lecture
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4')}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
                    >
                      Direct MP4
                    </button>
                  </div>
                </div>

                {/* Live Video Detection & Instant Preview */}
                {videoUrl && (
                  <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Live Video Stream Verification:</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[10px] uppercase font-mono">
                        {parsedActiveUrl.providerName}
                      </span>
                    </div>

                    <div className="rounded-xl overflow-hidden aspect-video border border-slate-800">
                      <AccessibleVideoPlayer
                        videoUrl={videoUrl}
                        title={lessonTitle || 'Lesson Preview'}
                        autoPlay={false}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Estimated Duration (Seconds)
                    </label>
                    <input
                      type="number"
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lesson Summary & Key Concepts
                  </label>
                  <textarea
                    rows={3}
                    value={lessonDesc}
                    onChange={(e) => setLessonDesc(e.target.value)}
                    placeholder="Key concepts discussed in this video lesson..."
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-navy-700">
                  <button
                    type="button"
                    onClick={() => setLessonModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-purple-500/25 disabled:opacity-50"
                  >
                    {saving ? 'Adding Lesson...' : 'Save Lesson'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
