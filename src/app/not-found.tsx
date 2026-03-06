import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-da-gray-900 p-4">
      <div className="text-center">
        <p className="text-7xl font-bold text-slate-600">404</p>
        <h1 className="text-xl font-semibold text-white mt-4">ページが見つかりません</h1>
        <p className="text-sm text-slate-400 mt-2">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-2.5 bg-da-blue-900 text-white text-sm font-medium rounded-lg hover:bg-da-blue-800 transition-colors"
        >
          トップに戻る
        </Link>
      </div>
    </div>
  );
}
