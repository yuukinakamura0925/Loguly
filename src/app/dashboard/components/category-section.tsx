"use client";

import { useState } from "react";
import { Card, CardHeader, Progress } from "@/components/ui";
import { VideoItem } from "./video-item";
import { ChevronDownIcon, LayersIcon } from "@/components/icons";

interface Video {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  label?: string | null;
  labelColor?: string | null;
}

interface ViewLog {
  video_id: number;
  max_watched_seconds: number;
  completed: boolean;
}

interface CategorySectionProps {
  name: string;
  videos: Video[];
  viewLogs: ViewLog[];
  progress: number;
  defaultOpen?: boolean;
}

function getVideoStatus(video: Video, viewLog?: ViewLog) {
  if (!viewLog) {
    return { status: "pending" as const, progress: 0 };
  }
  if (viewLog.completed) {
    return { status: "completed" as const, progress: 100 };
  }
  const progress = Math.round((viewLog.max_watched_seconds / video.duration) * 100);
  return { status: "in-progress" as const, progress };
}

export function CategorySection({ name, videos, viewLogs, progress, defaultOpen = false, id }: CategorySectionProps & { id?: string }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const completedCount = videos.filter(v => viewLogs.find(log => log.video_id === v.id && log.completed)).length;

  return (
    <Card id={id}>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-700/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center">
            <LayersIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {completedCount}/{videos.length} 完了
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progress} className="w-24 hidden sm:block" size="sm" variant={progress === 100 ? "success" : "default"} />
          <span className={`text-sm font-medium ${progress === 100 ? 'text-da-success dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {progress}%
          </span>
          <ChevronDownIcon
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </CardHeader>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {videos.map((video) => {
            const viewLog = viewLogs.find((log) => log.video_id === video.id);
            const { status, progress: videoProgress } = getVideoStatus(video, viewLog);

            return (
              <VideoItem
                key={video.id}
                id={video.id}
                title={video.title}
                description={video.description}
                duration={video.duration}
                status={status}
                progress={videoProgress}
                label={video.label}
                labelColor={video.labelColor}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}
