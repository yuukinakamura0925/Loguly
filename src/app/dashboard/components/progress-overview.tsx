import { Progress } from "@/components/ui";
import { CrownIcon } from "@/components/icons";

interface ProgressOverviewProps {
  watchedSeconds: number;
  totalSeconds: number;
  completedVideos: number;
  totalVideos: number;
}

export function ProgressOverview({ watchedSeconds, totalSeconds, completedVideos, totalVideos }: ProgressOverviewProps) {
  const percentage = totalSeconds > 0 ? Math.round((watchedSeconds / totalSeconds) * 100) : 0;
  const isFullyCompleted = completedVideos === totalVideos && totalVideos > 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 border ${
      isFullyCompleted
        ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800/50"
        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
    }`}>
      {isFullyCompleted && (
        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.07] pointer-events-none">
          <CrownIcon className="w-full h-full text-amber-500" strokeWidth={1} />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-slate-900 dark:text-white font-semibold">学習進捗</h2>
            {isFullyCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-sm crown-badge">
                <CrownIcon className="w-3.5 h-3.5" strokeWidth={2} />
                全完了
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {isFullyCompleted
              ? "すべての動画を視聴しました！お疲れさまでした 🎉"
              : `${completedVideos} / ${totalVideos} 動画完了`
            }
          </p>
        </div>
        <div className={`text-3xl font-bold ${
          isFullyCompleted
            ? "text-amber-600 dark:text-amber-400"
            : "text-slate-900 dark:text-white"
        }`}>{percentage}%</div>
      </div>
      <Progress value={percentage} size="lg" className={isFullyCompleted ? "[&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-yellow-500" : ""} />
    </div>
  );
}
