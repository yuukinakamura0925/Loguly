"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body className="bg-slate-950">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-7xl font-bold text-slate-600">500</p>
            <h1 className="text-xl font-semibold text-white mt-4">エラーが発生しました</h1>
            <p className="text-sm text-slate-400 mt-2">
              予期しないエラーが発生しました。もう一度お試しください。
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={reset}
                className="px-6 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                再試行
              </button>
              <a
                href="/"
                className="px-6 py-2.5 border border-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                トップに戻る
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
