"use client";

import { useRef, useEffect, useMemo } from "react";
import type { SubtitleClip } from "../page";

type VideoPreviewProps = {
  videoId: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onSeek: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  subtitles: SubtitleClip[];
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function VideoPreview({
  videoId,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onPlayPause,
  onSeek,
  onDurationChange,
  subtitles,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // 動画メタデータ読み込み時に実際のdurationを通知
  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (video && onDurationChange && video.duration && isFinite(video.duration)) {
      onDurationChange(video.duration * 1000);
    }
  }

  // loadeddataでも試行（loadedmetadataが発火しない場合のフォールバック）
  function handleLoadedData() {
    const video = videoRef.current;
    if (video && onDurationChange && video.duration && isFinite(video.duration)) {
      onDurationChange(video.duration * 1000);
    }
  }

  // Find active subtitle at current time
  const activeSubtitle = useMemo(() => {
    return subtitles.find(
      (s) => currentTime >= s.startTime && currentTime <= s.endTime
    );
  }, [subtitles, currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Sync video time with editor currentTime
    const diff = Math.abs(video.currentTime * 1000 - currentTime);
    if (diff > 500) {
      video.currentTime = currentTime / 1000;
    }
  }, [currentTime]);

  // 動画要素のdurationを定期的にチェック（メタデータイベントが発火しない場合の対策）
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const checkDuration = () => {
      if (video.duration && isFinite(video.duration) && onDurationChange) {
        onDurationChange(video.duration * 1000);
      }
    };

    // 初回チェック（すでにメタデータがロード済みの場合）
    if (video.readyState >= 1) {
      checkDuration();
    }

    // 500ms後に再チェック
    const timeout = setTimeout(checkDuration, 500);
    return () => clearTimeout(timeout);
  }, [onDurationChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play();
    } else {
      video.pause();
    }
  }, [isPlaying]);

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (video) {
      const videoTimeMs = video.currentTime * 1000;
      // 再生中、またはシーク後の位置更新
      if (isPlaying || Math.abs(videoTimeMs - currentTime) > 100) {
        onTimeUpdate(videoTimeMs);
      }
    }
  }

  // シーク完了時にも時間を更新
  function handleSeeked() {
    const video = videoRef.current;
    if (video) {
      onTimeUpdate(video.currentTime * 1000);
    }
  }

  function handleSeekBar(e: React.ChangeEvent<HTMLInputElement>) {
    const time = parseFloat(e.target.value);
    onSeek(time);
  }

  // Use sample video for development if CF video ID is dummy
  const isDummy = videoId.startsWith("dummy-");
  const videoUrl = isDummy
    ? "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    : `https://customer-domain.cloudflarestream.com/${videoId}/manifest/video.m3u8`;

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center relative p-2 min-h-0">
        <div className="relative max-w-full max-h-full aspect-video bg-black rounded overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full"
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onLoadedData={handleLoadedData}
            onTimeUpdate={handleTimeUpdate}
            onSeeked={handleSeeked}
            onPlay={() => onPlayPause(true)}
            onPause={() => onPlayPause(false)}
          >
            {isDummy ? (
              <source src={videoUrl} type="video/mp4" />
            ) : (
              <>
                <source src={videoUrl} type="application/x-mpegURL" />
                <source
                  src={`https://customer-domain.cloudflarestream.com/${videoId}/downloads/default.mp4`}
                  type="video/mp4"
                />
              </>
            )}
          </video>

          {/* Subtitle Overlay */}
          {activeSubtitle && (
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <span className="inline-block px-4 py-2 bg-black/80 text-white text-lg rounded">
                {activeSubtitle.text}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800 px-4 py-2 flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={() => onPlayPause(!isPlaying)}
          className="w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
        >
          {isPlaying ? (
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-white ml-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Time */}
        <div className="text-white text-sm font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Seek Bar */}
        <div className="flex-1 flex items-center">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeekBar}
            className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>
    </div>
  );
}
