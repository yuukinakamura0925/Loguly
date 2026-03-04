"use client";

import { useState } from "react";
import { CheckCircleIcon, ClockIcon, VideoIcon, ChevronDownIcon } from "@/components/icons";

type VideoProgress = {
  id: number;
  title: string;
  duration: number;
  max_watched_seconds: number;
  completed: boolean;
  percent: number;
};

type Props = {
  name: string;
  videos: VideoProgress[];
  defaultOpen?: boolean;
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function CategoryAccordion({ name, videos, defaultOpen = false }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const completedCount = videos.filter((v) => v.completed).length;
  // 視聴時間ベースの進捗率
  const totalDuration = videos.reduce((acc, v) => acc + v.duration, 0);
  const watchedSeconds = videos.reduce((acc, v) => acc + Math.min(v.max_watched_seconds, v.duration), 0);
  const progress = totalDuration > 0 ? Math.round((watchedSeconds / totalDuration) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* ヘッダー */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-da-blue-900" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{name}</h2>
          <span className="text-sm text-slate-500">
            ({completedCount}/{videos.length} 完了)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
            <div
              className={`h-full rounded-full ${
                progress === 100 ? "bg-da-success" : "bg-da-blue-900"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={`text-sm font-medium ${
            progress === 100 ? "text-da-success dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"
          }`}>
            {progress}%
          </span>
          <ChevronDownIcon
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* 動画リスト */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 border-t border-slate-200 dark:border-slate-700">
          {videos.map((video) => (
            <div
              key={video.id}
              className={`rounded-lg border p-4 transition-colors ${
                video.completed
                  ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* ステータスアイコン */}
                <div className={`mt-0.5 ${
                  video.completed
                    ? "text-da-success"
                    : video.percent > 0
                      ? "text-amber-500"
                      : "text-slate-400"
                }`}>
                  {video.completed ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <VideoIcon className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-slate-900 dark:text-white font-medium truncate">
                    {video.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <ClockIcon className="w-3 h-3" />
                    {formatDuration(video.duration)}
                  </div>

                  {/* 進捗バー */}
                  {!video.completed && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            video.percent > 0 ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"
                          }`}
                          style={{ width: `${video.percent}%` }}
                        />
                      </div>
                      <div className="text-right text-xs text-slate-500 mt-1">
                        {video.percent > 0 ? (
                          <>
                            {formatDuration(video.max_watched_seconds)} / {formatDuration(video.duration)}
                            <span className="ml-1">({video.percent}%)</span>
                          </>
                        ) : (
                          "未視聴"
                        )}
                      </div>
                    </div>
                  )}

                  {video.completed && (
                    <div className="mt-2 text-xs text-da-success dark:text-emerald-400 font-medium">
                      視聴完了
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
