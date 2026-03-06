export default function MemberProgressLoading() {
  return (
    <div>
      {/* 戻るリンク */}
      <div className="mb-6">
        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>

      {/* プロフィールカード */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <div className="h-7 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
          </div>
        </div>

        {/* 進捗サマリー */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-9 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto" />
              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mx-auto mt-1" />
            </div>
          ))}
        </div>

        {/* プログレスバー */}
        <div className="mt-4">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1 ml-auto" />
        </div>
      </div>

      {/* カテゴリアコーディオン */}
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
              </div>
              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
