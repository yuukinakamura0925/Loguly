export default function OrgLoading() {
  return (
    <div>
      {/* タイトル + ボタン */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-7 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>

      {/* 検索バー */}
      <div className="mb-4">
        <div className="h-10 w-full max-w-sm bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>

      {/* テーブルカード */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* セクションヘッダー */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        {/* テーブルヘッダー */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-transparent">
          <div className="flex items-center px-4 py-3">
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-8 hidden sm:block" />
            <div className="h-4 w-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-8" />
            <div className="h-4 w-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-auto hidden md:block" />
            <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-8" />
          </div>
        </div>
        {/* テーブル行 */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
          >
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-8 hidden sm:block" />
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-8" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-auto hidden md:block" />
            <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
