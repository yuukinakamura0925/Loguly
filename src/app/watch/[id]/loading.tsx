import Link from "next/link";

export default function WatchLoading() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link
            href="/dashboard"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            &larr; 動画一覧に戻る
          </Link>
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse hidden sm:block" />
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {/* 動画プレイヤー枠 */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-white/60" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>

          {/* カスタムプログレスバー */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-transparent">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="flex items-center justify-between mt-2">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>

          {/* 動画情報 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-transparent">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-2" />
              </div>
              <div className="text-right ml-4">
                <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
              </div>
            </div>
          </div>
        </div>

        {/* 前後ナビゲーション */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-transparent">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3" />
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div className="h-3 w-12 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded animate-pulse mt-1" />
            </div>
            <div className="flex-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <div className="h-3 w-12 bg-slate-200 dark:bg-slate-600 rounded animate-pulse ml-auto" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded animate-pulse mt-1 ml-auto" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
