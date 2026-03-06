"use client";

import { useRef, useState } from "react";

type Props = {
  videoUrl: string;
  title: string;
  duration: number;
};

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function PreviewPlayer({ videoUrl, title, duration }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div>
      <div className="relative bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video"
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
          playsInline
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>{title}</span>
        <span>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-da-blue-900 dark:bg-da-blue-300 rounded-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
