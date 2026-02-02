import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">Loguly</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          動画視聴ログ管理システム
        </p>
        <p className="text-gray-500 dark:text-gray-500 mb-12">
          スキップ不可の動画プレイヤーで確実な視聴完了を保証
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ログイン
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            管理者ログイン
          </Link>
        </div>
      </main>

      <footer className="mt-16 text-sm text-gray-400">
        &copy; 2026 Loguly
      </footer>
    </div>
  );
}
