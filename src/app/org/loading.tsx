export default function OrgLoading() {
  return (
    <div className="space-y-6">
      {/* タイトル行 */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>

      {/* テーブルカード */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* テーブルヘッダー */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-transparent border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-8">
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse hidden sm:block" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-auto" />
          </div>
        </div>
        {/* テーブル行 */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
          >
            <div className="flex items-center gap-8">
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse hidden sm:block" />
              <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
