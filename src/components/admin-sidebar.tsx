"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/organizations", label: "組織管理" },
  { href: "/admin/categories", label: "カテゴリ管理" },
  { href: "/admin/videos", label: "動画管理" },
  { href: "/admin/licenses", label: "ライセンス管理" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-gray-800 border-r border-gray-700 min-h-screen">
      <div className="p-4 border-b border-gray-700">
        <Link href="/admin" className="text-lg font-bold text-white">
          Loguly Admin
        </Link>
      </div>
      <nav className="p-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
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
