export default function VideosLoading() {
  return (
    <div>
      {/* PageHeader */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-52 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* カテゴリ + 動画リスト */}
      <div className="space-y-4">
        {[...Array(2)].map((_, ci) => (
          <div
            key={ci}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"
          >
            {/* カテゴリヘッダー */}
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-5 w-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
              </div>
              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>

            {/* 動画アイテム */}
            <div className="border-t border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
              {[...Array(3)].map((_, vi) => (
                <div key={vi} className="px-6 py-3 flex items-center gap-4">
                  <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                  <div className="flex gap-1">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
