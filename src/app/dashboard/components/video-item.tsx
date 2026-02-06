import Link from "next/link";
import { Badge } from "@/components/ui";

interface VideoItemProps {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  status: "pending" | "in-progress" | "completed";
  progress: number;
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

const statusConfig = {
  pending: {
    text: "未視聴",
    variant: "default" as const,
    iconBg: "bg-slate-200 dark:bg-slate-800",
    icon: (
      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  "in-progress": {
    text: "",
    variant: "warning" as const,
    iconBg: "bg-amber-500/20",
    icon: (
      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      </svg>
    ),
  },
  completed: {
    text: "完了",
    variant: "success" as const,
    iconBg: "bg-emerald-500/20",
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
};

export function VideoItem({ id, title, description, duration, status, progress }: VideoItemProps) {
  const config = statusConfig[status];
  const displayText = status === "in-progress" ? `${progress}%` : config.text;

  return (
    <Link
      href={`/watch/${id}`}
      className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
    >
      {/* Status Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
        {config.icon}
      </div>

      {/* Video Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-slate-900 dark:text-white font-medium group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-slate-500 text-sm mt-0.5 truncate">
            {description}
          </p>
        )}
      </div>

      {/* Duration & Status */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="text-slate-500 text-sm">
          {formatDuration(duration)}
        </span>
        <Badge variant={config.variant}>
          {displayText}
        </Badge>
      </div>

      {/* Arrow */}
      <svg className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
