export default function CategoriesLoading() {
  return (
    <div>
      {/* PageHeader */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-44 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left hidden sm:table-cell w-24"><div className="h-3 w-14 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></th>
              <th className="px-4 py-3 text-left"><div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></th>
              <th className="px-4 py-3 text-right w-32"><div className="h-3 w-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-auto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {[...Array(4)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-4 hidden sm:table-cell"><div className="h-4 w-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                <td className="px-4 py-4"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
