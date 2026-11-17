import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Film,
  CheckCircle2,
  Sparkles,
  Info,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export type VideoSourceType = 'youtube' | 'vimeo' | 'drive' | 'dailymotion' | 'direct' | 'empty' | 'unknown';

export interface VideoSourceInfo {
  type: VideoSourceType;
  resolvedUrl: string;
  embedUrl?: string;
  directUrl?: string;
  originalUrl: string;
  providerName: string;
  videoId?: string;
}

/**
 * Robust parser that normalizes any incoming video URL into a playable format.
 * Supports YouTube, Vimeo, Google Drive, Dailymotion, relative uploads, and direct MP4/WebM streams.
 */
export function parseVideoUrl(rawUrl: string): VideoSourceInfo {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return {
      type: 'empty',
      resolvedUrl: '',
      originalUrl: '',
      providerName: 'None'
    };
  }

  const trimmed = rawUrl.trim();

  // Resolve relative backend upload paths (e.g., /uploads/videos/video-123.mp4)
  let resolvedUrl = trimmed;
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
    const serverHost = apiBase.replace(/\/api\/?$/, '');
    resolvedUrl = `${serverHost}/${trimmed.replace(/^\//, '')}`;
  }

  // 1. YouTube detection (standard, shortened youtu.be, shorts, embeds)
  // Matches:
  // https://youtu.be/5LeZflr8Zfs?si=...
  // https://www.youtube.com/watch?v=5LeZflr8Zfs
  // https://youtube.com/shorts/5LeZflr8Zfs
  // https://www.youtube.com/embed/5LeZflr8Zfs
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = resolvedUrl.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      resolvedUrl,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&playsinline=1`,
      originalUrl: resolvedUrl,
      providerName: 'YouTube Stream',
      videoId
    };
  }

  // 2. Vimeo detection
  const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i;
  const vimeoMatch = resolvedUrl.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[3]) {
    const videoId = vimeoMatch[3];
    return {
      type: 'vimeo',
      resolvedUrl,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&title=0&byline=0&portrait=0`,
      originalUrl: resolvedUrl,
      providerName: 'Vimeo Video',
      videoId
    };
  }

  // 3. Google Drive video preview
  const driveRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
  const driveMatch = resolvedUrl.match(driveRegex);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      type: 'drive',
      resolvedUrl,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      originalUrl: resolvedUrl,
      providerName: 'Google Drive Video',
      videoId: fileId
    };
  }

  // 4. Dailymotion detection
  const dmRegex = /dailymotion\.com\/video\/([a-zA-Z0-9]+)/i;
  const dmMatch = resolvedUrl.match(dmRegex);
  if (dmMatch && dmMatch[1]) {
    const videoId = dmMatch[1];
    return {
      type: 'dailymotion',
      resolvedUrl,
      embedUrl: `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`,
      originalUrl: resolvedUrl,
      providerName: 'Dailymotion',
      videoId
    };
  }

  // 5. Direct MP4, WebM, OGG, or generic video stream
  return {
    type: 'direct',
    resolvedUrl,
    directUrl: resolvedUrl,
    originalUrl: resolvedUrl,
    providerName: 'Direct HTML5 Stream'
  };
}

export interface AccessibleVideoPlayerProps {
  videoUrl: string;
  title?: string;
  onEnded?: () => void;
  onProgress?: (currentSeconds: number, duration: number) => void;
  initialPosition?: number;
  autoPlay?: boolean;
  className?: string;
  onVideoRef?: (ref: HTMLVideoElement | null) => void;
}

export const AccessibleVideoPlayer: React.FC<AccessibleVideoPlayerProps> = ({
  videoUrl,
  title = 'Course Lesson Video',
  onEnded,
  onProgress,
  initialPosition = 0,
  autoPlay = false,
  className = '',
  onVideoRef
}) => {
  const [videoInfo, setVideoInfo] = useState<VideoSourceInfo>(() => parseVideoUrl(videoUrl));
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Update parsed info when videoUrl prop changes
  useEffect(() => {
    const info = parseVideoUrl(videoUrl);
    setVideoInfo(info);
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
  }, [videoUrl]);

  // Expose video ref to parent if requested
  useEffect(() => {
    if (onVideoRef) {
      onVideoRef(videoRef.current);
    }
  }, [onVideoRef, videoInfo.type]);

  // Set playback speed when changed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleCopyLink = () => {
    if (!videoInfo.resolvedUrl) return;
    navigator.clipboard.writeText(videoInfo.resolvedUrl).then(() => {
      setCopied(true);
      toast.success('Video link copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // If no URL provided
  if (videoInfo.type === 'empty') {
    return (
      <div
        className={`bg-slate-900 border border-slate-800 rounded-3xl aspect-video flex flex-col items-center justify-center p-6 text-center text-slate-400 ${className}`}
        role="region"
        aria-label="No video attached"
      >
        <Film className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-sm font-bold text-slate-200">No Video Stream Linked</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          This lesson does not have a streamable video URL attached yet. Please consult the course syllabus or reach out to the course instructor.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col group ${className}`}
      role="region"
      aria-label={`${title} Player - ${videoInfo.providerName}`}
    >
      {/* Top Accessible Provider Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-2.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-600/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
            <Film className="w-3 h-3" />
            {videoInfo.providerName}
          </span>
          <span className="text-xs font-semibold text-white/90 truncate max-w-xs hidden sm:inline" title={title}>
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Video Link */}
          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors backdrop-blur-md"
            title="Copy video URL to clipboard"
            aria-label="Copy video URL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Open in New Tab for Universal Accessibility */}
          <a
            href={videoInfo.resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors backdrop-blur-md"
            title="Open original video source in a new tab"
            aria-label="Open original video source in a new tab"
          >
            <span className="hidden sm:inline text-[11px]">External Stream</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Player Display */}
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {/* Error Fallback State */}
        {hasError ? (
          <div
            className="absolute inset-0 bg-navy-950/95 flex flex-col items-center justify-center p-6 text-center z-30"
            role="alert"
            aria-live="polite"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Video Playback Stream Interrupted</h3>
            <p className="text-xs text-slate-300 mt-1.5 max-w-md leading-relaxed">
              {errorMessage || 'The browser was unable to decode or stream this video file directly. This may occur due to content-security restrictions, network policies, or unsupported video codecs.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Playback</span>
              </button>

              <a
                href={videoInfo.resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Dedicated Video Tab</span>
              </a>
            </div>

            <div className="mt-4 text-[10px] text-slate-500 font-mono break-all max-w-sm">
              Source: {videoInfo.resolvedUrl}
            </div>
          </div>
        ) : videoInfo.type === 'youtube' ||
            videoInfo.type === 'vimeo' ||
            videoInfo.type === 'drive' ||
            videoInfo.type === 'dailymotion' ? (
          /* Iframe Embed Player for Streaming Services */
          <div className="w-full h-full relative">
            <iframe
              src={videoInfo.embedUrl}
              title={`${title} - ${videoInfo.providerName}`}
              className="w-full h-full border-0 absolute inset-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
            />
          </div>
        ) : (
          /* HTML5 Video Player for Direct MP4 / WebM Streams */
          <div className="w-full h-full relative flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 pointer-events-none">
                <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <video
              ref={videoRef}
              src={videoInfo.resolvedUrl}
              controls
              controlsList="nodownload"
              playsInline
              autoPlay={autoPlay}
              className="w-full h-full object-contain"
              onCanPlay={() => setIsLoading(false)}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => setIsLoading(false)}
              onEnded={onEnded}
              onLoadedMetadata={(e) => {
                setIsLoading(false);
                if (initialPosition > 0) {
                  e.currentTarget.currentTime = initialPosition;
                }
              }}
              onTimeUpdate={(e) => {
                if (onProgress) {
                  const current = Math.floor(e.currentTarget.currentTime);
                  const dur = Math.floor(e.currentTarget.duration || 0);
                  onProgress(current, dur);
                }
              }}
              onError={(e) => {
                setIsLoading(false);
                setHasError(true);
                const mediaError = (e.currentTarget as HTMLVideoElement).error;
                let msg = 'Direct stream error.';
                if (mediaError) {
                  if (mediaError.code === 1) msg = 'Video playback aborted by browser.';
                  if (mediaError.code === 2) msg = 'Network connection failed while downloading video stream.';
                  if (mediaError.code === 3) msg = 'Video decoding failed or codec is not supported by your browser.';
                  if (mediaError.code === 4) msg = 'Video file not found or format is not supported.';
                }
                setErrorMessage(msg);
              }}
            >
              <source src={videoInfo.resolvedUrl} type="video/mp4" />
              <source src={videoInfo.resolvedUrl} type="video/webm" />
              Your browser does not support the HTML5 video element.
            </video>
          </div>
        )}
      </div>

      {/* Bottom Accessible Toolbar (Speed selector + Fullscreen + Fallback note) */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              {videoInfo.type === 'youtube'
                ? 'Streaming via YouTube Player. Video telemetry is active.'
                : videoInfo.type === 'direct'
                ? 'High-Definition HTML5 Stream'
                : 'Educational Embedded Stream'}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Playback speed selector for direct HTML5 video */}
          {videoInfo.type === 'direct' && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Speed:</span>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                aria-label="Playback speed"
                className="bg-slate-900 text-slate-200 text-xs px-2 py-0.5 rounded border border-slate-700 focus:outline-none focus:border-purple-500"
              >
                <option value={0.75}>0.75x</option>
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2.0x</option>
              </select>
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
