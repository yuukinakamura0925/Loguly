import { Progress } from "@/components/ui";

interface ProgressOverviewProps {
  completedVideos: number;
  totalVideos: number;
}

export function ProgressOverview({ completedVideos, totalVideos }: ProgressOverviewProps) {
  const percentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-semibold">学習進捗</h2>
          <p className="text-slate-400 text-sm mt-1">{completedVideos} / {totalVideos} 動画完了</p>
        </div>
        <div className="text-3xl font-bold text-white">{percentage}%</div>
      </div>
      <Progress value={percentage} size="lg" />
    </div>
  );
}
