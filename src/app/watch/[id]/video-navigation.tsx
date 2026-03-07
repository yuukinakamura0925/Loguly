import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

type VideoLink = {
  id: number;
  title: string;
} | null;

type Props = {
  categoryName: string;
  prevVideo: VideoLink;
  nextVideo: VideoLink;
};

export default function VideoNavigation({ categoryName, prevVideo, nextVideo }: Props) {
  return (
    <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-transparent">
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        {categoryName}の動画
      </div>
      <div className="flex justify-between items-center gap-4">
        {/* 前の動画 */}
        <div className="flex-1">
          {prevVideo ? (
            <Link
              href={`/watch/${prevVideo.id}`}
              className="group flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 active:scale-[0.98] transition-all"
            >
              <ChevronLeftIcon className="w-5 h-5 text-slate-400 group-hover:text-da-blue-900 transition-colors flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-slate-500 dark:text-slate-400">前の動画</div>
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-da-blue-900 dark:group-hover:text-da-blue-300 transition-colors">
                  {prevVideo.title}
                </div>
              </div>
            </Link>
          ) : (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 opacity-50">
              <div className="text-xs text-slate-400">前の動画</div>
              <div className="text-sm text-slate-400">なし</div>
            </div>
          )}
        </div>

        {/* 次の動画 */}
        <div className="flex-1">
          {nextVideo ? (
            <Link
              href={`/watch/${nextVideo.id}`}
              className="group flex items-center justify-end gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 active:scale-[0.98] transition-all text-right"
            >
              <div className="min-w-0">
                <div className="text-xs text-slate-500 dark:text-slate-400">次の動画</div>
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-da-blue-900 dark:group-hover:text-da-blue-300 transition-colors">
                  {nextVideo.title}
                </div>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-slate-400 group-hover:text-da-blue-900 transition-colors flex-shrink-0" />
            </Link>
          ) : (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 opacity-50 text-right">
              <div className="text-xs text-slate-400">次の動画</div>
              <div className="text-sm text-slate-400">なし</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
