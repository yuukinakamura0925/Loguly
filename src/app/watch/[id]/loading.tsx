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

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {/* 動画プレイヤー枠 */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
          <svg className="animate-spin h-10 w-10 text-white/60" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>

        {/* プログレスバースケルトン */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-transparent">
          <div className="flex justify-between mb-2">
            <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
        </div>

        {/* 動画情報スケルトン */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-transparent space-y-3">
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      </main>
    </div>
  );
}
