export default function LicensesLoading() {
  return (
    <div>
      {/* PageHeader */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-7 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-56 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
        </div>
      </div>

      {/* 組織カードグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                <div>
                  <div className="h-5 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
                </div>
              </div>
              <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
