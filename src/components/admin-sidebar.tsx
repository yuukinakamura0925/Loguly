"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, BuildingIcon, TagIcon, VideoIcon, KeyIcon, CirclePlayIcon } from "@/components/icons";

export const adminNavItems = [
  { href: "/admin", label: "ダッシュボード", icon: <HomeIcon className="w-5 h-5" strokeWidth={1.5} /> },
  { href: "/admin/organizations", label: "組織管理", icon: <BuildingIcon className="w-5 h-5" strokeWidth={1.5} /> },
  { href: "/admin/categories", label: "カテゴリ管理", icon: <TagIcon className="w-5 h-5" strokeWidth={1.5} /> },
  { href: "/admin/videos", label: "動画管理", icon: <VideoIcon className="w-5 h-5" strokeWidth={1.5} /> },
  { href: "/admin/licenses", label: "動画割り当て", icon: <KeyIcon className="w-5 h-5" strokeWidth={1.5} /> },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-800/60 h-full flex-shrink-0 overflow-y-auto">
      <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
            <CirclePlayIcon className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">Loguly</div>
            <div className="text-xs text-slate-500">Admin Panel</div>
          </div>
        </Link>
      </div>
      <nav className="p-3 space-y-1">
        {adminNavItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-da-blue-50 dark:bg-da-blue-900/20 text-da-blue-900 dark:text-da-blue-200 font-semibold"
                  : "text-da-gray-600 dark:text-slate-400 hover:bg-da-blue-50 dark:hover:bg-slate-800/50 hover:text-da-blue-900 dark:hover:text-white"
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
