export default function ProgressLoading() {
  return (
    <div>
      <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-6" />

      {/* 統計カード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="h-7 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
          </div>
        ))}
      </div>

      {/* 検索バー */}
      <div className="mb-4">
        <div className="h-10 w-full max-w-sm bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>

      {/* メンバーリスト */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4">
              {/* アバター */}
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
              {/* 名前・メール */}
              <div className="flex-1 min-w-0">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
              </div>
              {/* 進捗 */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="h-5 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
                </div>
                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse hidden sm:block" />
                <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
