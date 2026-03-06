export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* ヘッダー */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* ロゴ */}
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div>
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="w-20 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* 進捗概要カード */}
        <div className="mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-2" />
              </div>
              <div className="h-9 w-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
          </div>
        </div>

        {/* カテゴリセクション */}
        <div className="space-y-6">
          {[...Array(2)].map((_, ci) => (
            <div
              key={ci}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"
            >
              {/* カテゴリヘッダー */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                  <div>
                    <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1.5" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse hidden sm:block" />
                  <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </div>

              {/* 動画アイテム（リスト形式） */}
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {[...Array(3)].map((_, vi) => (
                  <div key={vi} className="p-4">
                    <div className="flex gap-4">
                      {/* サムネイル */}
                      <div className="w-32 h-20 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse flex-shrink-0" />
                      {/* コンテンツ */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-2" />
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                          <div className="h-3 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        </div>
                      </div>
                      {/* 矢印 */}
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
