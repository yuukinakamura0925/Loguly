"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CirclePlayIcon, UsersIcon, BarChartIcon, SettingsIcon, BuildingIcon } from "@/components/icons";

export const orgNavItems = [
  { href: "/org/videos", label: "動画プレビュー", id: "nav-videos", icon: <CirclePlayIcon className="w-5 h-5" strokeWidth={1.5} /> },
  { href: "/org/members", label: "メンバー管理", id: "nav-members", icon: <UsersIcon className="w-5 h-5" strokeWidth={1.5} /> },
  { href: "/org/progress", label: "視聴進捗", id: "nav-progress", icon: <BarChartIcon className="w-5 h-5" strokeWidth={1.5} /> },
  { href: "/org/settings", label: "設定", id: "nav-settings", icon: <SettingsIcon className="w-5 h-5" strokeWidth={1.5} /> },
];

export default function OrgSidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/60 min-h-screen">
      <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
            <BuildingIcon className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[160px]">{orgName}</div>
            <div className="text-xs text-slate-500">組織管理</div>
          </div>
        </div>
      </div>
      <nav id="sidebar-nav" className="p-3 space-y-1">
        {orgNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              id={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-da-blue-50 dark:bg-da-blue-900/20 text-da-blue-900 dark:text-da-blue-200 font-semibold"
                  : "text-da-gray-600 dark:text-slate-400 hover:bg-da-blue-50 dark:hover:bg-slate-800/50 hover:text-da-blue-900 dark:hover:text-white active:bg-slate-100 dark:active:bg-slate-700/50"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
