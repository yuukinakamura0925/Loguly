import Link from "next/link";

interface VideoItemProps {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  status: "pending" | "in-progress" | "completed";
  progress: number;
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function VideoItem({ id, title, description, duration, status, progress }: VideoItemProps) {
  const isCompleted = status === "completed";
  const isInProgress = status === "in-progress";

  return (
    <Link
      href={`/watch/${id}`}
      className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
    >
      <div className="flex gap-4">
        {/* サムネイルプレースホルダー */}
        <div className={`relative w-32 h-20 rounded-lg flex-shrink-0 overflow-hidden ${
          isCompleted
            ? "bg-slate-200 dark:bg-slate-700"
            : "bg-slate-200 dark:bg-slate-800"
        }`}>
          {/* 再生アイコン */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isCompleted ? (
              <div className="w-10 h-10 rounded-full bg-slate-900/90 dark:bg-slate-100/90 flex items-center justify-center">
                <svg className="w-5 h-5 text-white dark:text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-slate-700 dark:text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>
          {/* 時間バッジ */}
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
            {formatDuration(duration)}
          </div>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium leading-snug group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors ${
              isCompleted ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white"
            }`}>
              {title}
            </h3>
            {/* ステータスバッジ */}
            {isCompleted && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded">
                完了
              </span>
            )}
          </div>

          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
              {description}
            </p>
          )}

          {/* プログレスバー */}
          {!isCompleted && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isInProgress ? "bg-slate-500 dark:bg-slate-400" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={`text-xs font-medium flex-shrink-0 ${
                isInProgress ? "text-slate-700 dark:text-slate-300" : "text-slate-400"
              }`}>
                {isInProgress ? `${progress}%` : "未視聴"}
              </span>
            </div>
          )}
        </div>

        {/* 矢印 */}
        <div className="flex items-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-1 transition-all"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
