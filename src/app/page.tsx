import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">
      <main className="text-center">
        <h1 className="text-4xl font-bold mb-12 text-slate-900 dark:text-white">Loguly</h1>
        <Link
          href="/login"
          className="px-6 py-3 bg-da-blue-900 text-white rounded-lg hover:bg-da-blue-1000 hover:underline transition-colors"
        >
          ログイン
        </Link>
      </main>

      <footer className="mt-16 text-sm text-slate-400">
        <div className="flex gap-4 justify-center mb-2">
          <Link href="/terms" className="hover:text-slate-200 transition-colors">
            利用規約
          </Link>
          <span className="text-slate-600">|</span>
          <Link href="/privacy" className="hover:text-slate-200 transition-colors">
            プライバシーポリシー
          </Link>
        </div>
        <p>&copy; 2026 Loguly</p>
      </footer>
    </div>
  );
}
