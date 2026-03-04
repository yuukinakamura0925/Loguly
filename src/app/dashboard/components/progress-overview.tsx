import { Progress } from "@/components/ui";

interface ProgressOverviewProps {
  watchedSeconds: number;
  totalSeconds: number;
  completedVideos: number;
  totalVideos: number;
}

export function ProgressOverview({ watchedSeconds, totalSeconds, completedVideos, totalVideos }: ProgressOverviewProps) {
  const percentage = totalSeconds > 0 ? Math.round((watchedSeconds / totalSeconds) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-slate-900 dark:text-white font-semibold">学習進捗</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{completedVideos} / {totalVideos} 動画完了</p>
        </div>
        <div className="text-3xl font-bold text-slate-900 dark:text-white">{percentage}%</div>
      </div>
      <Progress value={percentage} size="lg" />
    </div>
  );
}
