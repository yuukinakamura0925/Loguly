export default function AdminLoading() {
  return (
    <div className="space-y-8">
      {/* タイトル */}
      <div>
        <div className="h-7 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-2" />
      </div>

      {/* 統計カード 4つ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
            <div className="h-10 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* 最近の組織 / 最近の動画 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
                  </div>
                  <div className="h-6 w-10 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* クイックアクション */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
        <div className="flex flex-wrap gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
