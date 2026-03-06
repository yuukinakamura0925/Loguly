export default function MembersLoading() {
  return (
    <div>
      {/* タイトル + 招待ボタン */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>

      {/* 検索バー */}
      <div className="mb-4">
        <div className="h-10 w-full max-w-sm bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>

      {/* メンバーテーブル */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-transparent">
              <th className="text-left px-4 py-3"><div className="h-3 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></th>
              <th className="hidden sm:table-cell text-left px-4 py-3"><div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></th>
              <th className="text-left px-4 py-3"><div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></th>
              <th className="hidden md:table-cell text-left px-4 py-3"><div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></th>
              <th className="text-right px-4 py-3"><div className="h-3 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-auto" /></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(4)].map((_, i) => (
              <tr key={i} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                <td className="hidden sm:table-cell px-4 py-3"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                <td className="px-4 py-3"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                <td className="hidden md:table-cell px-4 py-3"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                <td className="px-4 py-3 text-right"><div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-auto" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
