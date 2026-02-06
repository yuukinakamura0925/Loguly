import { Card, CardHeader, Progress } from "@/components/ui";
import { VideoItem } from "./video-item";

interface Video {
  id: number;
  title: string;
  description: string | null;
  duration: number;
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

export function CategorySection({ name, videos, viewLogs, progress }: CategorySectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">{name}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progress} className="w-24" size="sm" variant={progress === 100 ? "success" : "default"} />
          <span className={`text-sm font-medium ${progress === 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
            {progress}%
          </span>
        </div>
      </CardHeader>

      <div className="divide-y divide-slate-800">
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
            />
          );
        })}
      </div>
    </Card>
  );
}
