"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/org/members", label: "メンバー管理" },
  { href: "/org/progress", label: "視聴進捗" },
  { href: "/org/settings", label: "設定" },
];

export default function OrgSidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-gray-800 border-r border-gray-700 min-h-screen">
      <div className="p-4 border-b border-gray-700">
        <div className="text-lg font-bold text-white">{orgName}</div>
        <div className="text-xs text-gray-400 mt-1">組織管理</div>
      </div>
      <nav className="p-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg text-sm mb-1 transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
