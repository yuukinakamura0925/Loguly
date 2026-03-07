export default function SettingsLoading() {
  return (
    <div>
      <div className="h-7 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-6" />

      {/* 設定フォーム */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6 max-w-lg">
        <div className="space-y-4">
          {/* 組織名 */}
          <div>
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
          {/* スラッグ */}
          <div>
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
          {/* ボタン */}
          <div className="h-10 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* 利用可能な動画 */}
      <div className="h-6 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0 flex items-center justify-between">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
