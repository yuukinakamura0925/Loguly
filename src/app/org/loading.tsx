import { LoaderIcon } from "@/components/icons";

export default function OrgLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3">
        <LoaderIcon className="animate-spin h-8 w-8 text-da-blue-900" />
        <span className="text-sm text-slate-500 dark:text-slate-400">読み込み中...</span>
      </div>
    </div>
  );
}
