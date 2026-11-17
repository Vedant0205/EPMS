import { describe, it, expect } from 'vitest';
import { parseVideoUrl } from './AccessibleVideoPlayer';

describe('AccessibleVideoPlayer - parseVideoUrl', () => {
  it('correctly parses shortened youtu.be links (e.g. from user catalogue)', () => {
    const raw = 'https://youtu.be/5LeZflr8Zfs?si=yVigiCfpaIH_itSi';
    const result = parseVideoUrl(raw);
    expect(result.type).toBe('youtube');
    expect(result.videoId).toBe('5LeZflr8Zfs');
    expect(result.providerName).toBe('YouTube Stream');
    expect(result.embedUrl).toContain('youtube-nocookie.com/embed/5LeZflr8Zfs');
    expect(result.embedUrl).toContain('autoplay=1');
  });

  it('correctly parses standard youtube.com/watch?v= links', () => {
    const raw = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = parseVideoUrl(raw);
    expect(result.type).toBe('youtube');
    expect(result.videoId).toBe('dQw4w9WgXcQ');
    expect(result.embedUrl).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('correctly parses YouTube shorts links', () => {
    const raw = 'https://youtube.com/shorts/dQw4w9WgXcQ?feature=share';
    const result = parseVideoUrl(raw);
    expect(result.type).toBe('youtube');
    expect(result.videoId).toBe('dQw4w9WgXcQ');
  });

  it('correctly parses Vimeo links', () => {
    const raw = 'https://vimeo.com/76979871';
    const result = parseVideoUrl(raw);
    expect(result.type).toBe('vimeo');
    expect(result.videoId).toBe('76979871');
    expect(result.embedUrl).toContain('player.vimeo.com/video/76979871');
  });

  it('correctly parses Google Drive video preview links', () => {
    const raw = 'https://drive.google.com/file/d/1XyZABC1234567/view?usp=sharing';
    const result = parseVideoUrl(raw);
    expect(result.type).toBe('drive');
    expect(result.videoId).toBe('1XyZABC1234567');
    expect(result.embedUrl).toBe('https://drive.google.com/file/d/1XyZABC1234567/preview');
  });

  it('correctly parses direct MP4 video URLs', () => {
    const raw = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    const result = parseVideoUrl(raw);
    expect(result.type).toBe('direct');
    expect(result.providerName).toBe('Direct HTML5 Stream');
    expect(result.resolvedUrl).toBe(raw);
  });

  it('correctly resolves relative upload paths against server host', () => {
    const raw = '/uploads/videos/video-123456.mp4';
    const result = parseVideoUrl(raw);
    expect(result.type).toBe('direct');
    expect(result.resolvedUrl).toMatch(/^http:\/\/localhost:5000\/uploads\/videos\/video-123456\.mp4/);
  });

  it('handles empty or blank input gracefully', () => {
    const empty1 = parseVideoUrl('');
    const empty2 = parseVideoUrl('   ');
    expect(empty1.type).toBe('empty');
    expect(empty2.type).toBe('empty');
  });
});
