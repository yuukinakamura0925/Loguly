import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* 背景のぼかしアクセント */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-green-400/20 dark:bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-3xl" />

      <main className="text-center relative z-10">
        <Image
          src="/logo.webp"
          alt="Prowing"
          width={280}
          height={60}
          className="mx-auto mb-20 drop-shadow-sm"
          priority
        />

        <div className="flex flex-col gap-4 w-72">
          <Link
            href="/login"
            className="group block px-8 py-5 bg-white/70 dark:bg-white/5 backdrop-blur-lg border border-slate-200/60 dark:border-white/10 rounded-2xl hover:scale-[1.02] hover:shadow-lg hover:border-green-400/40 dark:hover:border-green-400/30 active:scale-[0.98] transition-all duration-200 text-left"
          >
            <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Loguly
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              動画研修管理
            </div>
            <div className="mt-3 text-xs text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              開く →
            </div>
          </Link>
        </div>
      </main>

      <footer className="mt-20 text-xs text-slate-400 dark:text-slate-600 relative z-10">
        <p>&copy; 2026 Prowing</p>
      </footer>
    </div>
  );
}
